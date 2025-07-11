// lib/redux/slices/gameSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { REGIONS } from '../../constants';

// Async thunks
export const visitRegion = createAsyncThunk(
  'game/visitRegion',
  async (regionId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/game/visit-region', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ regionId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const unlockAchievement = createAsyncThunk(
  'game/unlockAchievement',
  async (achievementId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/game/unlock-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ achievementId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentRegion: 'humor_valley',
  visitedRegions: ['humor_valley'],
  unlockedRegions: ['humor_valley'],
  achievements: [],
  notifications: [],
  isLoading: false,
  error: null,
  gameStats: {
    totalPlayTime: 0,
    regionsExplored: 1,
    achievementsUnlocked: 0,
    friendsMade: 0,
  },
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentRegion: (state, action) => {
      state.currentRegion = action.payload;
      if (!state.visitedRegions.includes(action.payload)) {
        state.visitedRegions.push(action.payload);
        state.gameStats.regionsExplored += 1;
      }
    },
    unlockRegion: (state, action) => {
      if (!state.unlockedRegions.includes(action.payload)) {
        state.unlockedRegions.push(action.payload);
      }
    },
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString(),
        read: false,
      });
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    updateGameStats: (state, action) => {
      state.gameStats = { ...state.gameStats, ...action.payload };
    },
    addPlayTime: (state, action) => {
      state.gameStats.totalPlayTime += action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Visit Region
      .addCase(visitRegion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(visitRegion.fulfilled, (state, action) => {
        state.isLoading = false;
        const { regionId, xpGained, firstVisit } = action.payload;
        
        if (firstVisit) {
          state.visitedRegions.push(regionId);
          state.gameStats.regionsExplored += 1;
          state.notifications.unshift({
            id: Date.now(),
            type: 'region_discovered',
            title: 'Yeni Bölge Keşfedildi!',
            message: `${REGIONS.find(r => r.id === regionId)?.name} bölgesini keşfettin ve ${xpGained} XP kazandın!`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      })
      .addCase(visitRegion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Unlock Achievement
      .addCase(unlockAchievement.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unlockAchievement.fulfilled, (state, action) => {
        state.isLoading = false;
        const achievement = action.payload;
        state.achievements.push(achievement);
        state.gameStats.achievementsUnlocked += 1;
        
        state.notifications.unshift({
          id: Date.now(),
          type: 'achievement_unlocked',
          title: 'Başarım Kilidi Açıldı!',
          message: `"${achievement.name}" başarımını kazandın!`,
          timestamp: new Date().toISOString(),
          read: false,
        });
      })
      .addCase(unlockAchievement.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentRegion,
  unlockRegion,
  addNotification,
  markNotificationRead,
  clearNotifications,
  updateGameStats,
  addPlayTime,
  clearError,
} = gameSlice.actions;

export default gameSlice.reducer;