// lib/redux/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ page = 1, type = 'all' } = {}, { getState, rejectWithValue }) => {
    try {
      // For now, return mock data since API might not exist yet
      return {
        notifications: [
          {
            id: 'notif_1',
            type: 'quest',
            title: 'Yeni Görev!',
            message: 'Ejder Mağarası görevi açıldı',
            read: false,
            createdAt: new Date().toISOString(),
            data: { questId: 'quest_1' }
          },
          {
            id: 'notif_2', 
            type: 'guild',
            title: 'Guild Etkinliği',
            message: 'Guild savaşı başlıyor!',
            read: true,
            createdAt: new Date(Date.now() - 60000).toISOString(),
            data: { guildId: 'guild_1' }
          }
        ],
        page,
        hasMore: false,
        unreadCount: 1
      };
      
      // When API is ready, use this code:
      /*
      const { auth } = getState();
      const response = await fetch(`/api/notifications?page=${page}&type=${type}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return data;
      */
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationIds, { getState, rejectWithValue }) => {
    try {
      // For now, return success without API call
      return { 
        notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds],
        success: true 
      };
      
      // When API is ready, use this code:
      /*
      const { auth } = getState();
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ notificationIds }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return { notificationIds, data };
      */
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  filters: {
    type: 'all', // all, quest, social, guild, system
    read: 'all' // all, read, unread
  },
  pagination: {
    currentPage: 1,
    hasMore: true
  }
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = action.payload;
      state.notifications.unshift(notification);
      if (!notification.read) {
        state.unreadCount += 1;
      }
      
      // Keep only last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearAll: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const { notifications = [], page = 1, hasMore = false, unreadCount = 0 } = action.payload || {};
        
        // Ensure notifications is always an array
        const notificationsList = Array.isArray(notifications) ? notifications : [];
        
        if (page === 1) {
          state.notifications = notificationsList;
        } else {
          state.notifications.push(...notificationsList);
        }
        
        state.pagination = { currentPage: page, hasMore };
        state.unreadCount = unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch notifications';
      })
      
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { notificationIds = [] } = action.payload || {};
        const idsArray = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
        
        state.notifications.forEach(notification => {
          if (idsArray.includes(notification.id) && !notification.read) {
            notification.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark as read';
      });
  },
});

export const {
  addNotification,
  updateFilters,
  clearAll,
  clearError
} = notificationSlice.actions;

export default notificationSlice.reducer;