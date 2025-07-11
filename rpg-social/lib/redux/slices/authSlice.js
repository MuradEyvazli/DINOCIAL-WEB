// lib/redux/slices/authSlice.js - registerUser action debug versiyonu
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Register user async thunk with better error handling
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, username, characterClass }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          confirmPassword: password, // confirmPassword'ü password ile aynı yap
          username, 
          characterClass 
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Kayıt sırasında bir hata oluştu');
      }
      
      // Token'ı localStorage'a kaydet
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      return data.data.user;
      
    } catch (error) {
      return rejectWithValue(error.message || 'Ag hatasi');
    }
  }
);

// Login user async thunk (existing)
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.data.token);
      return data.data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Load user async thunk (existing)
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        // Only remove token for auth errors (401, 403), not server errors (500)
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          return rejectWithValue('Token invalid');
        }
        
        // For other errors, don't remove token
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        return rejectWithValue(errorData.message || 'Server error');
      }
      
      const data = await response.json();
      return data.data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserStats: (state, action) => {
      if (state.user) {
        state.user.stats = { ...state.user.stats, ...action.payload };
      }
    },
    addUserXP: (state, action) => {
      if (state.user) {
        state.user.xp += action.payload;
        // Level up logic
        const currentLevel = state.user.level;
        const newLevel = calculateLevel(state.user.xp);
        if (newLevel > currentLevel) {
          state.user.level = newLevel;
        }
      }
    },
    addBadge: (state, action) => {
      if (state.user) {
        state.user.badges.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.token = localStorage.getItem('token');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.token = localStorage.getItem('token');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.token = localStorage.getItem('token');
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Helper function to calculate level based on XP
const calculateLevel = (xp) => {
  const thresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9300, 10700];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

export const { logout, clearError, updateUserStats, addUserXP, addBadge } = authSlice.actions;
export default authSlice.reducer;