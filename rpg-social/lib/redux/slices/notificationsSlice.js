import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Notification storage key
const NOTIFICATIONS_KEY = 'rpg_social_notifications';
const NOTIFICATION_SETTINGS_KEY = 'rpg_social_notification_settings';

// Utility functions for localStorage
const getStoredNotifications = () => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading notifications from localStorage:', error);
    return [];
  }
};

const storeNotifications = (notifications) => {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error storing notifications to localStorage:', error);
  }
};

const getNotificationSettings = () => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      enabled: true,
      sound: true,
      friendRequests: true,
      messages: true,
      questUpdates: true,
      achievements: true
    };
  } catch (error) {
    return {
      enabled: true,
      sound: true,
      friendRequests: true,
      messages: true,
      questUpdates: true,
      achievements: true
    };
  }
};

const storeNotificationSettings = (settings) => {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error storing notification settings:', error);
  }
};

// Generate unique notification ID
const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Browser notification API
const showBrowserNotification = (title, body, icon = null) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: icon || '/DinocialWhite.png',
        badge: '/DinocialWhite.png',
        tag: 'rpg-social',
        requireInteraction: false,
        silent: false
      });
      
      // Auto close after 5 seconds
      setTimeout(() => {
        try {
          notification.close();
        } catch (e) {
          console.log('Notification already closed');
        }
      }, 5000);
      
      return notification;
    }
  } catch (error) {
    console.error('Error showing browser notification:', error);
  }
  return null;
};

// Request notification permission
export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
};

// Get notifications
export const getNotifications = createAsyncThunk(
  'notifications/getNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try to fetch from API first
      try {
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('API not available');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message);
        }

        // Store API notifications to localStorage for persistence
        storeNotifications(data.data.notifications || []);
        
        return data.data;
      } catch (apiError) {
        // Fallback to localStorage
        console.log('Using localStorage for notifications');
        
        const storedNotifications = getStoredNotifications();
        
        // Sort by creation date (newest first)
        const sortedNotifications = storedNotifications.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        return {
          notifications: sortedNotifications,
          unreadCount: sortedNotifications.filter(n => !n.isRead).length
        };
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create a new notification
export const createNotification = createAsyncThunk(
  'notifications/createNotification',
  async ({ type, title, message, data = {}, showBrowser = true }, { getState, rejectWithValue }) => {
    try {
      const settings = getNotificationSettings();
      
      // Check if this type of notification is enabled
      const typeEnabled = {
        'friend_request': settings.friendRequests,
        'friend_request_accepted': settings.friendRequests,
        'friend_request_rejected': settings.friendRequests,
        'new_message': settings.messages,
        'quest_completed': settings.questUpdates,
        'quest_assigned': settings.questUpdates,
        'achievement_unlocked': settings.achievements,
        'level_up': settings.achievements
      };
      
      if (!settings.enabled || !typeEnabled[type]) {
        return null; // Don't create notification if disabled
      }
      
      const notification = {
        _id: generateNotificationId(),
        type,
        title,
        message,
        data,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      // Get current notifications and add new one
      const currentNotifications = getStoredNotifications();
      const updatedNotifications = [notification, ...currentNotifications];
      
      // Keep only last 100 notifications to prevent storage overflow
      const trimmedNotifications = updatedNotifications.slice(0, 100);
      
      // Store to localStorage
      storeNotifications(trimmedNotifications);
      
      // Show browser notification if enabled and requested
      if (showBrowser && settings.enabled && settings.sound) {
        showBrowserNotification(title, message);
      }
      
      return {
        notification,
        notifications: trimmedNotifications,
        unreadCount: trimmedNotifications.filter(n => !n.isRead).length
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ notificationId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try API first
      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('API not available');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message);
        }
      } catch (apiError) {
        console.log('Using localStorage for mark notification as read');
      }
      
      // Update localStorage regardless of API status
      const notifications = getStoredNotifications();
      const updatedNotifications = notifications.map(notif => 
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      );
      
      storeNotifications(updatedNotifications);
      
      return { 
        notificationId,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try API first
      try {
        const response = await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('API not available');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message);
        }
      } catch (apiError) {
        console.log('Using localStorage for mark all notifications as read');
      }
      
      // Update localStorage regardless of API status
      const notifications = getStoredNotifications();
      const updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }));
      
      storeNotifications(updatedNotifications);
      
      return { 
        notifications: updatedNotifications,
        unreadCount: 0
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async ({ notificationId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try API first
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('API not available');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message);
        }
      } catch (apiError) {
        console.log('Using localStorage for delete notification');
      }
      
      // Update localStorage regardless of API status
      const notifications = getStoredNotifications();
      const notification = notifications.find(n => n._id === notificationId);
      const updatedNotifications = notifications.filter(n => n._id !== notificationId);
      
      storeNotifications(updatedNotifications);
      
      return { 
        notificationId,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
        wasUnread: notification && !notification.isRead
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update notification settings
export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      storeNotificationSettings(settings);
      return settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Clear all notifications
export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try API first
      try {
        const response = await fetch('/api/notifications', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('API not available');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message);
        }
      } catch (apiError) {
        console.log('Using localStorage for clear all notifications');
      }
      
      // Clear localStorage regardless of API status
      storeNotifications([]);
      
      return {
        notifications: [],
        unreadCount: 0
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    
    // UI state
    showDropdown: false,
    
    // Real-time state
    lastCheck: null,
    isOnline: true
  },
  
  reducers: {
    toggleNotificationDropdown: (state) => {
      state.showDropdown = !state.showDropdown;
    },
    
    closeNotificationDropdown: (state) => {
      state.showDropdown = false;
    },
    
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    updateLastCheck: (state) => {
      state.lastCheck = new Date().toISOString();
    },
    
    // Real-time notification handlers
    addNewNotification: (state, action) => {
      const notification = action.payload;
      state.notifications.unshift(notification);
      if (!notification.isRead) {
        state.unreadCount += 1;
      }
    },
    
    removeNotificationById: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n._id !== notificationId);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Get Notifications
    builder
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, unreadCount } = action.payload || {};
        state.notifications = notifications || [];
        state.unreadCount = unreadCount || 0;
        state.lastCheck = new Date().toISOString();
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Notification
    builder
      .addCase(createNotification.fulfilled, (state, action) => {
        if (action.payload) {
          const { notification, notifications, unreadCount } = action.payload;
          state.notifications = notifications;
          state.unreadCount = unreadCount;
          
          // Show dropdown briefly for new notifications
          if (notification && !notification.isRead) {
            state.showDropdown = true;
            // Note: Auto-hide will be handled in the component
          }
        }
      });

    // Mark Notification as Read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const { notificationId, notifications, unreadCount } = action.payload || {};
        if (notifications) {
          state.notifications = notifications;
          state.unreadCount = unreadCount;
        } else if (notificationId) {
          // Fallback to state update
          const notification = state.notifications.find(n => n._id === notificationId);
          if (notification && !notification.isRead) {
            notification.isRead = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      });

    // Mark All Notifications as Read
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        const { notifications, unreadCount } = action.payload || {};
        if (notifications) {
          state.notifications = notifications;
          state.unreadCount = unreadCount;
        } else {
          // Fallback to state update
          state.notifications.forEach(notification => {
            notification.isRead = true;
          });
          state.unreadCount = 0;
        }
      });

    // Delete Notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const { notificationId, notifications, unreadCount, wasUnread } = action.payload || {};
        if (notifications) {
          state.notifications = notifications;
          state.unreadCount = unreadCount;
        } else if (notificationId) {
          // Fallback to state update
          const notification = state.notifications.find(n => n._id === notificationId);
          if (notification && !notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications = state.notifications.filter(n => n._id !== notificationId);
        }
      });

    // Update Settings
    builder
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });

    // Clear All Notifications
    builder
      .addCase(clearAllNotifications.fulfilled, (state, action) => {
        const { notifications, unreadCount } = action.payload || {};
        state.notifications = notifications || [];
        state.unreadCount = unreadCount || 0;
      });
  }
});

export const {
  toggleNotificationDropdown,
  closeNotificationDropdown,
  setOnlineStatus,
  updateLastCheck,
  addNewNotification,
  removeNotificationById,
  clearError
} = notificationsSlice.actions;

// Export utility functions
export { 
  getStoredNotifications, 
  storeNotifications, 
  getNotificationSettings, 
  storeNotificationSettings,
  showBrowserNotification
};

export default notificationsSlice.reducer;