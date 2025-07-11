// lib/redux/slices/levelsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchLevels = createAsyncThunk(
  'levels/fetchLevels',
  async ({ page = 1, limit = 50, tier = null } = {}) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (tier) params.append('tier', tier);
    
    const response = await axios.get(`/api/levels?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
);

export const fetchLevelProgression = createAsyncThunk(
  'levels/fetchProgression',
  async ({ userId = null } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const params = userId ? `?userId=${userId}` : '';
      
      const response = await axios.get(`/api/levels/progression${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Level progression error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const gainXP = createAsyncThunk(
  'levels/gainXP',
  async ({ xpGained, reason = 'activity' }) => {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/levels/progression', {
      xpGained,
      reason
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
);

export const fetchSpecificLevel = createAsyncThunk(
  'levels/fetchSpecific',
  async ({ level }) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/levels?level=${level}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
);

export const seedLevels = createAsyncThunk(
  'levels/seed',
  async ({ action = 'seed' }) => {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/levels', {
      action
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
);

const initialState = {
  levels: [],
  levelsByTier: {},
  currentProgression: null,
  userProgression: null,
  recentLevelUps: [],
  upcomingRewards: [],
  tierInfo: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalLevels: 0,
    hasMore: false
  },
  loading: false,
  progressionLoading: false,
  xpGainLoading: false,
  error: null,
  lastLevelUp: null,
  showLevelUpModal: false,
  pendingXPGains: [],
  dailyXPProgress: {
    current: 0,
    goal: 1000,
    percentage: 0
  }
};

const levelsSlice = createSlice({
  name: 'levels',
  initialState,
  reducers: {
    setShowLevelUpModal: (state, action) => {
      state.showLevelUpModal = action.payload;
    },
    addPendingXPGain: (state, action) => {
      state.pendingXPGains.push(action.payload);
    },
    processPendingXP: (state) => {
      const totalPendingXP = state.pendingXPGains.reduce((sum, gain) => sum + gain.amount, 0);
      if (totalPendingXP > 0) {
        // This will trigger a gainXP action
        state.pendingXPGains = [];
      }
    },
    updateDailyXP: (state, action) => {
      const { dailyXP, goal = 1000 } = action.payload;
      state.dailyXPProgress = {
        current: dailyXP,
        goal,
        percentage: Math.min((dailyXP / goal) * 100, 100)
      };
    },
    resetDailyXP: (state) => {
      state.dailyXPProgress = {
        current: 0,
        goal: 1000,
        percentage: 0
      };
    },
    addRecentLevelUp: (state, action) => {
      state.recentLevelUps.unshift(action.payload);
      // Keep only last 5 level ups
      if (state.recentLevelUps.length > 5) {
        state.recentLevelUps = state.recentLevelUps.slice(0, 5);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    // Real-time updates
    handleLevelUp: (state, action) => {
      const { oldLevel, newLevel, newXP, progression, unlockedRewards, levelData } = action.payload;
      
      state.lastLevelUp = {
        oldLevel,
        newLevel,
        newXP,
        progression,
        unlockedRewards,
        levelData,
        timestamp: Date.now()
      };
      
      state.showLevelUpModal = true;
      state.userProgression = progression;
      
      // Add to recent level ups
      state.recentLevelUps.unshift({
        level: newLevel,
        achievedAt: new Date().toISOString(),
        unlockedRewards
      });
      
      if (state.recentLevelUps.length > 5) {
        state.recentLevelUps = state.recentLevelUps.slice(0, 5);
      }
    },
    handleFriendLevelUp: (state, action) => {
      // Handle friend level up notifications
      const { userId, username, avatar, newLevel, levelData } = action.payload;
      
      // Add to recent activities or notifications
      // This could trigger a toast notification
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch levels
      .addCase(fetchLevels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLevels.fulfilled, (state, action) => {
        state.loading = false;
        const { data } = action.payload;
        state.levels = data.levels;
        state.levelsByTier = data.levelsByTier;
        state.pagination = data.pagination;
      })
      .addCase(fetchLevels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Fetch progression
      .addCase(fetchLevelProgression.pending, (state) => {
        state.progressionLoading = true;
        state.error = null;
      })
      .addCase(fetchLevelProgression.fulfilled, (state, action) => {
        state.progressionLoading = false;
        const { data } = action.payload;
        state.userProgression = data.progression;
        state.tierInfo = data.tierInfo;
        state.recentLevelUps = data.recentLevels || [];
        state.upcomingRewards = data.upcomingRewards || [];
        
        // Update daily XP progress
        if (data.user && data.user.stats) {
          state.dailyXPProgress = {
            current: data.user.stats.dailyXP || 0,
            goal: 1000,
            percentage: Math.min(((data.user.stats.dailyXP || 0) / 1000) * 100, 100)
          };
        }
      })
      .addCase(fetchLevelProgression.rejected, (state, action) => {
        state.progressionLoading = false;
        state.error = action.error.message;
      })
      
      // Gain XP
      .addCase(gainXP.pending, (state) => {
        state.xpGainLoading = true;
        state.error = null;
      })
      .addCase(gainXP.fulfilled, (state, action) => {
        state.xpGainLoading = false;
        const { data } = action.payload;
        
        if (data.leveledUp) {
          // Handle level up
          state.lastLevelUp = {
            oldLevel: data.oldLevel,
            newLevel: data.newLevel,
            newXP: data.newXP,
            progression: data.progression,
            unlockedRewards: data.unlockedRewards,
            timestamp: Date.now()
          };
          
          state.showLevelUpModal = true;
          
          // Add to recent level ups
          state.recentLevelUps.unshift({
            level: data.newLevel,
            achievedAt: new Date().toISOString(),
            unlockedRewards: data.unlockedRewards
          });
          
          if (state.recentLevelUps.length > 5) {
            state.recentLevelUps = state.recentLevelUps.slice(0, 5);
          }
        }
        
        // Update progression
        state.userProgression = data.progression;
        
        // Update daily XP
        state.dailyXPProgress.current += data.xpGained;
        state.dailyXPProgress.percentage = Math.min((state.dailyXPProgress.current / state.dailyXPProgress.goal) * 100, 100);
      })
      .addCase(gainXP.rejected, (state, action) => {
        state.xpGainLoading = false;
        state.error = action.error.message;
      })
      
      // Fetch specific level
      .addCase(fetchSpecificLevel.fulfilled, (state, action) => {
        const { data } = action.payload;
        // Update or add the specific level to the levels array
        const existingIndex = state.levels.findIndex(l => l.level === data.level.level);
        if (existingIndex !== -1) {
          state.levels[existingIndex] = data.level;
        } else {
          state.levels.push(data.level);
          state.levels.sort((a, b) => a.level - b.level);
        }
      })
      
      // Seed levels
      .addCase(seedLevels.fulfilled, (state, action) => {
        // Levels have been seeded, might want to refetch
        state.levels = [];
        state.levelsByTier = {};
      });
  }
});

export const {
  setShowLevelUpModal,
  addPendingXPGain,
  processPendingXP,
  updateDailyXP,
  resetDailyXP,
  addRecentLevelUp,
  clearError,
  handleLevelUp,
  handleFriendLevelUp
} = levelsSlice.actions;

export default levelsSlice.reducer;