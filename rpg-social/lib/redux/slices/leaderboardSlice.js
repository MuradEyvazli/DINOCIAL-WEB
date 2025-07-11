// lib/redux/slices/leaderboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async ({ category = 'xp', timeframe = 'all', page = 1, search = '' } = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      // Build query parameters
      const params = new URLSearchParams({
        category,
        timeframe,
        page: page.toString(),
        limit: '50'
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`/api/leaderboard?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include' // Include cookies for auth
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Liderlik tablosu yüklenemedi');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        return rejectWithValue(data.message || 'Liderlik tablosu yüklenemedi');
      }
      
      return data.data;
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      return rejectWithValue(error.message || 'Network hatası');
    }
  }
);

const initialState = {
  rankings: [],
  userRank: null,
  currentCategory: 'xp',
  currentTimeframe: 'all',
  searchQuery: '',
  totalUsers: 0,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasMore: true
  }
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setCategory: (state, action) => {
      state.currentCategory = action.payload;
      // Reset rankings when category changes
      state.rankings = [];
      state.pagination = { currentPage: 1, totalPages: 1, hasMore: true };
    },
    setTimeframe: (state, action) => {
      state.currentTimeframe = action.payload;
      // Reset rankings when timeframe changes
      state.rankings = [];
      state.pagination = { currentPage: 1, totalPages: 1, hasMore: true };
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      // Reset rankings when search query changes
      state.rankings = [];
      state.pagination = { currentPage: 1, totalPages: 1, hasMore: true };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetLeaderboard: (state) => {
      state.rankings = [];
      state.userRank = null;
      state.searchQuery = '';
      state.pagination = { currentPage: 1, totalPages: 1, hasMore: true };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        const { 
          rankings = [], 
          userRank = null, 
          totalUsers = 0, 
          hasMore = false,
          currentPage = 1,
          totalPages = 1
        } = action.payload || {};
        
        if (currentPage === 1) {
          state.rankings = rankings;
        } else {
          state.rankings.push(...rankings);
        }
        
        state.userRank = userRank;
        state.totalUsers = totalUsers;
        state.pagination.hasMore = hasMore;
        state.pagination.currentPage = currentPage;
        state.pagination.totalPages = totalPages;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch leaderboard';
      });
  },
});

export const {
  setCategory,
  setTimeframe,
  setSearchQuery,
  clearError,
  resetLeaderboard
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer;