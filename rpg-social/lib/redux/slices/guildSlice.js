// lib/redux/slices/guildSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchGuilds = createAsyncThunk(
  'guild/fetchGuilds',
  async ({ page = 1, filter = 'all' }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`/api/guilds?page=${page}&filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` },
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

export const joinGuild = createAsyncThunk(
  'guild/joinGuild',
  async (guildId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`/api/guilds/${guildId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` },
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

export const leaveGuild = createAsyncThunk(
  'guild/leaveGuild',
  async (guildId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`/api/guilds/${guildId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` },
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

export const createGuild = createAsyncThunk(
  'guild/createGuild',
  async (guildData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/guilds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(guildData),
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
  guilds: [],
  myGuilds: [],
  currentGuild: null,
  guildMembers: [],
  guildActivities: [],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasMore: true
  },
  filters: {
    type: 'all', // all, combat, social, creative, competitive
    size: 'all', // all, small, medium, large
    level: 'all' // all, beginner, intermediate, advanced
  }
};

const guildSlice = createSlice({
  name: 'guild',
  initialState,
  reducers: {
    setCurrentGuild: (state, action) => {
      state.currentGuild = action.payload;
    },
    updateGuildFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    addGuildActivity: (state, action) => {
      state.guildActivities.unshift(action.payload);
      if (state.guildActivities.length > 50) {
        state.guildActivities = state.guildActivities.slice(0, 50);
      }
    },
    updateGuildMember: (state, action) => {
      const { memberId, updates } = action.payload;
      const memberIndex = state.guildMembers.findIndex(m => m.id === memberId);
      if (memberIndex !== -1) {
        state.guildMembers[memberIndex] = { ...state.guildMembers[memberIndex], ...updates };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Guilds
      .addCase(fetchGuilds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGuilds.fulfilled, (state, action) => {
        state.isLoading = false;
        const { guilds, page, totalPages, hasMore } = action.payload;
        
        if (page === 1) {
          state.guilds = guilds;
        } else {
          state.guilds.push(...guilds);
        }
        
        state.pagination = { currentPage: page, totalPages, hasMore };
      })
      .addCase(fetchGuilds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Join Guild
      .addCase(joinGuild.fulfilled, (state, action) => {
        const guild = action.payload;
        state.myGuilds.push(guild);
        
        // Update guild member count
        const guildIndex = state.guilds.findIndex(g => g.id === guild.id);
        if (guildIndex !== -1) {
          state.guilds[guildIndex].memberCount += 1;
          state.guilds[guildIndex].isJoined = true;
        }
      })
      
      // Leave Guild
      .addCase(leaveGuild.fulfilled, (state, action) => {
        const { guildId } = action.payload;
        state.myGuilds = state.myGuilds.filter(g => g.id !== guildId);
        
        // Update guild member count
        const guildIndex = state.guilds.findIndex(g => g.id === guildId);
        if (guildIndex !== -1) {
          state.guilds[guildIndex].memberCount -= 1;
          state.guilds[guildIndex].isJoined = false;
        }
      })
      
      // Create Guild
      .addCase(createGuild.fulfilled, (state, action) => {
        const newGuild = action.payload;
        state.guilds.unshift(newGuild);
        state.myGuilds.push(newGuild);
      });
  },
});

export const {
  setCurrentGuild,
  updateGuildFilters,
  clearError,
  addGuildActivity,
  updateGuildMember
} = guildSlice.actions;

export default guildSlice.reducer;

