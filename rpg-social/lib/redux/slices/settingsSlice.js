// lib/redux/slices/settingsSlice.js - Cloudinary desteği ile güncellenmiş (Hata düzeltmeli)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Upload Avatar - Cloudinary entegrasyonu ile
export const uploadAvatar = createAsyncThunk(
  'settings/uploadAvatar',
  async (formData, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('📸 Redux: Avatar upload başlatıldı');
      
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Token bulunamadı');
      }

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type'ı FormData için belirtmiyoruz
        },
        body: formData
      });

      const data = await response.json();
      console.log('📸 Redux: Avatar upload response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Avatar yüklenirken hata oluştu');
      }

      // Auth slice'ındaki user bilgisini de güncelle
      if (data.data.user) {
        dispatch({ 
          type: 'auth/updateUser', 
          payload: data.data.user 
        });
      }

      return {
        avatarUrl: data.data.avatarUrl,
        avatarUrls: data.data.avatarUrls,
        metadata: data.data.metadata,
        user: data.data.user
      };
    } catch (error) {
      console.error('❌ Redux: Avatar upload error:', error);
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Delete Avatar - Cloudinary entegrasyonu ile
export const deleteAvatar = createAsyncThunk(
  'settings/deleteAvatar',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('🗑️ Redux: Avatar delete başlatıldı');
      
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Avatar silinirken hata oluştu');
      }

      // Auth slice'ındaki user bilgisini güncelle
      if (data.data) {
        dispatch({ 
          type: 'auth/updateUser', 
          payload: data.data 
        });
      }

      return data.data;
    } catch (error) {
      console.error('❌ Redux: Avatar delete error:', error);
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Update Profile
export const updateProfile = createAsyncThunk(
  'settings/updateProfile',
  async (profileData, { rejectWithValue, getState, dispatch }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Profil güncellenirken hata oluştu');
      }

      // Auth slice'ını güncelle
      dispatch({ 
        type: 'auth/updateUser', 
        payload: data.data 
      });

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Change Password
export const changePassword = createAsyncThunk(
  'settings/changePassword',
  async (passwordData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Şifre değiştirilirken hata oluştu');
      }

      return data.message;
    } catch (error) {
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Update Notifications
export const updateNotifications = createAsyncThunk(
  'settings/updateNotifications',
  async (notificationData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Bildirim ayarları güncellenirken hata oluştu');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Update Privacy
export const updatePrivacy = createAsyncThunk(
  'settings/updatePrivacy',
  async (privacyData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(privacyData)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Gizlilik ayarları güncellenirken hata oluştu');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Update Preferences
export const updatePreferences = createAsyncThunk(
  'settings/updatePreferences',
  async (preferencesData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferencesData)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Tercihler güncellenirken hata oluştu');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Delete Account
export const deleteAccount = createAsyncThunk(
  'settings/deleteAccount',
  async (password, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Hesap silinirken hata oluştu');
      }

      return data.message;
    } catch (error) {
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

// Export Data
export const exportData = createAsyncThunk(
  'settings/exportData',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('token');

      const response = await fetch('/api/user/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Veri dışa aktarılırken hata oluştu');
      }

      // Blob olarak dosyayı al
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return 'Veriler başarıyla indirildi';
    } catch (error) {
      return rejectWithValue(error.message || 'Ağ hatası');
    }
  }
);

const initialState = {
  isLoading: false,
  isProfileLoading: false,
  isPasswordLoading: false,
  isNotificationsLoading: false,
  isPrivacyLoading: false,
  isPreferencesLoading: false,
  isAvatarUploading: false,
  isAvatarDeleting: false,
  isDeletingAccount: false,
  isExportingData: false,
  
  error: null,
  profileError: null,
  passwordError: null,
  notificationsError: null,
  privacyError: null,
  preferencesError: null,
  avatarError: null,
  deleteError: null,
  exportError: null,
  
  successMessage: null,
  profileSuccess: null,
  passwordSuccess: null,
  notificationsSuccess: null,
  privacySuccess: null,
  preferencesSuccess: null,
  avatarSuccess: null,
  deleteSuccess: null,
  exportSuccess: null,
  
  // Avatar yükleme durumu
  avatarUploadProgress: 0,
  
  // Current settings cache
  currentSettings: {
    notifications: null,
    privacy: null,
    preferences: null
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.profileError = null;
      state.passwordError = null;
      state.notificationsError = null;
      state.privacyError = null;
      state.preferencesError = null;
      state.avatarError = null;
      state.deleteError = null;
      state.exportError = null;
      
      state.successMessage = null;
      state.profileSuccess = null;
      state.passwordSuccess = null;
      state.notificationsSuccess = null;
      state.privacySuccess = null;
      state.preferencesSuccess = null;
      state.avatarSuccess = null;
      state.deleteSuccess = null;
      state.exportSuccess = null;
    },
    
    clearSpecificError: (state, action) => {
      const { type } = action.payload;
      state[`${type}Error`] = null;
    },
    
    clearSpecificSuccess: (state, action) => {
      const { type } = action.payload;
      state[`${type}Success`] = null;
    },
    
    setCurrentSettings: (state, action) => {
      const { type, data } = action.payload;
      state.currentSettings[type] = data;
    },
    
    setAvatarUploadProgress: (state, action) => {
      state.avatarUploadProgress = action.payload;
    },
    
    resetAvatarUploadProgress: (state) => {
      state.avatarUploadProgress = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isProfileLoading = true;
        state.profileError = null;
        state.profileSuccess = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isProfileLoading = false;
        state.profileSuccess = 'Profil başarıyla güncellendi';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isProfileLoading = false;
        state.profileError = action.payload;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isPasswordLoading = true;
        state.passwordError = null;
        state.passwordSuccess = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isPasswordLoading = false;
        state.passwordSuccess = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isPasswordLoading = false;
        state.passwordError = action.payload;
      })
      
      // Update Notifications
      .addCase(updateNotifications.pending, (state) => {
        state.isNotificationsLoading = true;
        state.notificationsError = null;
        state.notificationsSuccess = null;
      })
      .addCase(updateNotifications.fulfilled, (state, action) => {
        state.isNotificationsLoading = false;
        state.notificationsSuccess = 'Bildirim ayarları güncellendi';
        state.currentSettings.notifications = action.payload;
      })
      .addCase(updateNotifications.rejected, (state, action) => {
        state.isNotificationsLoading = false;
        state.notificationsError = action.payload;
      })
      
      // Update Privacy
      .addCase(updatePrivacy.pending, (state) => {
        state.isPrivacyLoading = true;
        state.privacyError = null;
        state.privacySuccess = null;
      })
      .addCase(updatePrivacy.fulfilled, (state, action) => {
        state.isPrivacyLoading = false;
        state.privacySuccess = 'Gizlilik ayarları güncellendi';
        state.currentSettings.privacy = action.payload;
      })
      .addCase(updatePrivacy.rejected, (state, action) => {
        state.isPrivacyLoading = false;
        state.privacyError = action.payload;
      })
      
      // Update Preferences
      .addCase(updatePreferences.pending, (state) => {
        state.isPreferencesLoading = true;
        state.preferencesError = null;
        state.preferencesSuccess = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.isPreferencesLoading = false;
        state.preferencesSuccess = 'Tercihler güncellendi';
        state.currentSettings.preferences = action.payload;
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.isPreferencesLoading = false;
        state.preferencesError = action.payload;
      })
      
      // Upload Avatar - Cloudinary (Düzeltilmiş)
      .addCase(uploadAvatar.pending, (state) => {
        state.isAvatarUploading = true;
        state.avatarError = null;
        state.avatarSuccess = null;
        state.avatarUploadProgress = 0;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isAvatarUploading = false;
        state.avatarSuccess = 'Avatar başarıyla güncellendi';
        state.avatarUploadProgress = 100;
        // setTimeout yerine progress component seviyesinde sıfırlanacak
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isAvatarUploading = false;
        state.avatarError = action.payload;
        state.avatarUploadProgress = 0;
      })
      
      // Delete Avatar - Cloudinary
      .addCase(deleteAvatar.pending, (state) => {
        state.isAvatarDeleting = true;
        state.avatarError = null;
        state.avatarSuccess = null;
      })
      .addCase(deleteAvatar.fulfilled, (state, action) => {
        state.isAvatarDeleting = false;
        state.avatarSuccess = 'Avatar başarıyla kaldırıldı';
      })
      .addCase(deleteAvatar.rejected, (state, action) => {
        state.isAvatarDeleting = false;
        state.avatarError = action.payload;
      })
      
      // Delete Account
      .addCase(deleteAccount.pending, (state) => {
        state.isDeletingAccount = true;
        state.deleteError = null;
        state.deleteSuccess = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.isDeletingAccount = false;
        state.deleteSuccess = action.payload;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isDeletingAccount = false;
        state.deleteError = action.payload;
      })
      
      // Export Data
      .addCase(exportData.pending, (state) => {
        state.isExportingData = true;
        state.exportError = null;
        state.exportSuccess = null;
      })
      .addCase(exportData.fulfilled, (state, action) => {
        state.isExportingData = false;
        state.exportSuccess = action.payload;
      })
      .addCase(exportData.rejected, (state, action) => {
        state.isExportingData = false;
        state.exportError = action.payload;
      });
  }
});

export const { 
  clearMessages, 
  clearSpecificError, 
  clearSpecificSuccess,
  setCurrentSettings,
  setAvatarUploadProgress,
  resetAvatarUploadProgress
} = settingsSlice.actions;

export default settingsSlice.reducer;