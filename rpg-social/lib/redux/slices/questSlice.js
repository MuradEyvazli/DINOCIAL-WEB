// lib/redux/slices/questSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch all quests for user
export const fetchQuests = createAsyncThunk(
  'quests/fetchQuests',
  async ({ type = 'all' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const url = new URL('/api/quests', window.location.origin);
      if (type !== 'all') url.searchParams.append('type', type);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Start a new quest
export const startQuest = createAsyncThunk(
  'quests/startQuest',
  async ({ questId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questId })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update quest progress
export const updateQuestProgress = createAsyncThunk(
  'quests/updateProgress',
  async ({ questId, action, value = 1 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quests/${questId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, value })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return { questId, ...data.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Abandon quest
export const abandonQuest = createAsyncThunk(
  'quests/abandonQuest',
  async ({ questId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quests/${questId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return { questId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Reset daily quests
export const resetDailyQuests = createAsyncThunk(
  'quests/resetDaily',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quests/daily-reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Check if daily reset is needed
export const checkDailyReset = createAsyncThunk(
  'quests/checkDailyReset',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quests/daily-reset', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Load user quests (alias for fetchQuests for compatibility)
export const loadUserQuests = createAsyncThunk(
  'quests/loadUserQuests',
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const url = new URL('/api/quests', window.location.origin);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const questSlice = createSlice({
  name: 'quests',
  initialState: {
    // Quest data
    activeQuests: [],
    availableQuests: [],
    completedQuests: [],
    
    // Loading states
    loading: false,
    startLoading: false,
    progressLoading: {},
    resetLoading: false,
    
    // Error states
    error: null,
    startError: null,
    progressError: null,
    
    // User stats
    userLevel: 1,
    totalXP: 0,
    stats: {
      totalQuests: 0,
      activeCount: 0,
      completedCount: 0,
      dailyQuests: 0
    },
    
    // Daily reset info
    needsDailyReset: false,
    lastReset: null,
    timeUntilReset: 0,
    nextResetAt: null,
    
    // UI state
    selectedQuest: null,
    filter: 'all', // 'all', 'daily', 'weekly', 'achievement'
    questNotification: null // For completed quest notifications
  },

  reducers: {
    clearError: (state) => {
      state.error = null;
      state.startError = null;
      state.progressError = null;
    },
    
    setSelectedQuest: (state, action) => {
      state.selectedQuest = action.payload;
    },
    
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    
    clearQuestNotification: (state) => {
      state.questNotification = null;
    },
    
    // Real-time quest progress updates
    addQuestProgress: (state, action) => {
      const { questId, action: progressAction, value = 1 } = action.payload;
      const quest = state.activeQuests.find(q => q._id === questId);
      
      if (quest && quest.userProgress) {
        const progress = quest.userProgress.progress || {};
        progress[progressAction] = (progress[progressAction] || 0) + value;
        quest.userProgress.progress = progress;
        
        // Calculate if quest is completed
        const requirements = quest.requirements || [];
        let completedRequirements = 0;
        
        requirements.forEach(req => {
          const currentProgress = progress[req.type] || 0;
          if (currentProgress >= req.target) {
            completedRequirements++;
          }
        });
        
        const progressPercent = (completedRequirements / requirements.length) * 100;
        quest.userProgress.progressPercent = progressPercent;
        
        // If quest is completed
        if (progressPercent === 100) {
          quest.userProgress.status = 'completed';
          quest.userProgress.completedAt = new Date().toISOString();
          quest.isCompleted = true;
          
          // Move to completed quests
          state.completedQuests.unshift(quest);
          state.activeQuests = state.activeQuests.filter(q => q._id !== questId);
          
          // Update stats
          state.stats.activeCount -= 1;
          state.stats.completedCount += 1;
        }
      }
    },
    
    // Socket.IO quest completion notification
    questCompleted: (state, action) => {
      const { questId, quest, rewards } = action.payload;
      state.questNotification = {
        type: 'completed',
        quest,
        rewards,
        timestamp: new Date().toISOString()
      };
      
      // Update XP and level
      if (rewards) {
        state.totalXP = rewards.totalXP;
        if (rewards.levelUp) {
          state.userLevel = rewards.newLevel;
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch Quests
    builder
      .addCase(fetchQuests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuests.fulfilled, (state, action) => {
        state.loading = false;
        const { 
          activeQuests, 
          availableQuests, 
          completedQuests, 
          userLevel, 
          totalXP, 
          stats 
        } = action.payload;
        
        state.activeQuests = activeQuests;
        state.availableQuests = availableQuests;
        state.completedQuests = completedQuests;
        state.userLevel = userLevel;
        state.totalXP = totalXP;
        state.stats = stats;
      })
      .addCase(fetchQuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Start Quest
    builder
      .addCase(startQuest.pending, (state) => {
        state.startLoading = true;
        state.startError = null;
      })
      .addCase(startQuest.fulfilled, (state, action) => {
        state.startLoading = false;
        const { userQuest, quest } = action.payload;
        
        // Move quest from available to active
        const questIndex = state.availableQuests.findIndex(q => q._id === quest._id);
        if (questIndex !== -1) {
          const questWithProgress = {
            ...state.availableQuests[questIndex],
            userProgress: {
              status: userQuest.status,
              progress: userQuest.progress || {},
              startedAt: userQuest.startedAt,
              expiresAt: userQuest.expiresAt,
              progressPercent: 0
            },
            isActive: true
          };
          
          state.activeQuests.push(questWithProgress);
          state.availableQuests.splice(questIndex, 1);
          
          // Update stats
          state.stats.activeCount += 1;
        }
      })
      .addCase(startQuest.rejected, (state, action) => {
        state.startLoading = false;
        state.startError = action.payload;
      });

    // Update Quest Progress
    builder
      .addCase(updateQuestProgress.pending, (state, action) => {
        const { questId } = action.meta.arg;
        state.progressLoading = {
          ...state.progressLoading,
          [questId]: true
        };
        state.progressError = null;
      })
      .addCase(updateQuestProgress.fulfilled, (state, action) => {
        const { questId, userQuest, isCompleted, rewards } = action.payload;
        
        state.progressLoading = {
          ...state.progressLoading,
          [questId]: false
        };
        
        const quest = state.activeQuests.find(q => q._id === questId);
        if (quest && quest.userProgress) {
          quest.userProgress = {
            ...quest.userProgress,
            ...userQuest
          };
          
          if (isCompleted) {
            quest.isCompleted = true;
            
            // Move to completed quests
            state.completedQuests.unshift(quest);
            state.activeQuests = state.activeQuests.filter(q => q._id !== questId);
            
            // Update stats and XP
            state.stats.activeCount -= 1;
            state.stats.completedCount += 1;
            
            if (rewards) {
              state.totalXP = rewards.totalXP;
              if (rewards.levelUp) {
                state.userLevel = rewards.newLevel;
              }
              
              // Set completion notification
              state.questNotification = {
                type: 'completed',
                quest: quest.title,
                rewards,
                timestamp: new Date().toISOString()
              };
            }
          }
        }
      })
      .addCase(updateQuestProgress.rejected, (state, action) => {
        const { questId } = action.meta.arg;
        state.progressLoading = {
          ...state.progressLoading,
          [questId]: false
        };
        state.progressError = action.payload;
      });

    // Abandon Quest
    builder
      .addCase(abandonQuest.fulfilled, (state, action) => {
        const { questId } = action.payload;
        const questIndex = state.activeQuests.findIndex(q => q._id === questId);
        
        if (questIndex !== -1) {
          const quest = state.activeQuests[questIndex];
          // Move back to available quests
          state.availableQuests.push({
            ...quest,
            userProgress: null,
            isActive: false,
            isCompleted: false
          });
          
          state.activeQuests.splice(questIndex, 1);
          state.stats.activeCount -= 1;
        }
      });

    // Reset Daily Quests
    builder
      .addCase(resetDailyQuests.pending, (state) => {
        state.resetLoading = true;
      })
      .addCase(resetDailyQuests.fulfilled, (state, action) => {
        state.resetLoading = false;
        state.needsDailyReset = false;
        state.lastReset = new Date().toISOString();
        
        // Refresh quests after reset
        // This will be handled by fetching quests again
      })
      .addCase(resetDailyQuests.rejected, (state, action) => {
        state.resetLoading = false;
        state.error = action.payload;
      });

    // Check Daily Reset
    builder
      .addCase(checkDailyReset.fulfilled, (state, action) => {
        const { needsReset, lastReset, timeUntilReset, nextResetAt } = action.payload;
        state.needsDailyReset = needsReset;
        state.lastReset = lastReset;
        state.timeUntilReset = timeUntilReset;
        state.nextResetAt = nextResetAt;
      });

    // Load User Quests (alias for fetchQuests)
    builder
      .addCase(loadUserQuests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserQuests.fulfilled, (state, action) => {
        state.loading = false;
        const { 
          activeQuests, 
          availableQuests, 
          completedQuests, 
          userLevel, 
          totalXP, 
          stats 
        } = action.payload;
        
        state.activeQuests = activeQuests;
        state.availableQuests = availableQuests;
        state.completedQuests = completedQuests;
        state.userLevel = userLevel;
        state.totalXP = totalXP;
        state.stats = stats;
      })
      .addCase(loadUserQuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearError,
  setSelectedQuest,
  setFilter,
  clearQuestNotification,
  addQuestProgress,
  questCompleted
} = questSlice.actions;

export default questSlice.reducer;