// lib/utils/validation.js
export const validateEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };
  
  export const validateUsername = (username) => {
    if (!username || username.length < 3 || username.length > 20) {
      return {
        isValid: false,
        message: 'Kullanıcı adı 3-20 karakter arasında olmalıdır'
      };
    }
    
    // Sadece harf, rakam, alt çizgi ve tire karakterlerine izin ver
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return {
        isValid: false,
        message: 'Kullanıcı adı sadece harf, rakam, _ ve - karakterlerini içerebilir'
      };
    }
    
    return { isValid: true };
  };
  
  export const validatePassword = (password) => {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      };
    }
    
    if (password.length > 128) {
      return {
        isValid: false,
        message: 'Şifre çok uzun'
      };
    }
    
    return { isValid: true };
  };
  
  export const validateBio = (bio) => {
    if (!bio) return { isValid: true };
    
    if (bio.length > 500) {
      return {
        isValid: false,
        message: 'Bio 500 karakterden uzun olamaz'
      };
    }
    
    return { isValid: true };
  };
  
  export const validateProfileData = (data) => {
    const errors = {};
    
    if (data.username) {
      const usernameValidation = validateUsername(data.username);
      if (!usernameValidation.isValid) {
        errors.username = usernameValidation.message;
      }
    }
    
    if (data.email) {
      if (!validateEmail(data.email)) {
        errors.email = 'Geçerli bir e-posta adresi giriniz';
      }
    }
    
    if (data.bio !== undefined) {
      const bioValidation = validateBio(data.bio);
      if (!bioValidation.isValid) {
        errors.bio = bioValidation.message;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const validatePasswordChange = (data) => {
    const errors = {};
    
    if (!data.currentPassword) {
      errors.currentPassword = 'Mevcut şifre gerekli';
    }
    
    if (!data.newPassword) {
      errors.newPassword = 'Yeni şifre gerekli';
    } else {
      const passwordValidation = validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.message;
      }
    }
    
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Şifre onayı gerekli';
    } else if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    
    if (data.currentPassword === data.newPassword) {
      errors.newPassword = 'Yeni şifre eski şifreden farklı olmalıdır';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const validateFileUpload = (file) => {
    const errors = {};
    
    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.type = 'Sadece JPEG, PNG ve WebP dosyaları kabul edilir';
    }
    
    // Dosya boyutu kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.size = 'Dosya boyutu 5MB\'dan büyük olamaz';
    }
    
    // Dosya adı kontrolü
    if (!file.name || file.name.trim() === '') {
      errors.name = 'Dosya adı geçersiz';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const validateNotificationSettings = (settings) => {
    const errors = {};
    
    // Email notifications validation
    if (settings.email && typeof settings.email !== 'object') {
      errors.email = 'E-posta bildirimleri geçersiz format';
    }
    
    // Push notifications validation
    if (settings.push && typeof settings.push !== 'object') {
      errors.push = 'Push bildirimleri geçersiz format';
    }
    
    // InApp notifications validation
    if (settings.inApp && typeof settings.inApp !== 'object') {
      errors.inApp = 'Uygulama içi bildirimler geçersiz format';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const validatePrivacySettings = (settings) => {
    const errors = {};
    
    // Profile visibility validation
    if (settings.profileVisibility && !['public', 'friends', 'private'].includes(settings.profileVisibility)) {
      errors.profileVisibility = 'Geçersiz profil görünürlüğü değeri';
    }
    
    // Boolean field validations
    const booleanFields = ['showStats', 'showActivity', 'allowDirectMessages', 'showOnlineStatus'];
    booleanFields.forEach(field => {
      if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
        errors[field] = `${field} değeri boolean olmalıdır`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const validatePreferences = (preferences) => {
    const errors = {};
    
    // Theme validation
    if (preferences.theme && !['dark', 'light', 'auto'].includes(preferences.theme)) {
      errors.theme = 'Geçersiz tema değeri';
    }
    
    // Language validation
    if (preferences.language && !['tr', 'en', 'de'].includes(preferences.language)) {
      errors.language = 'Geçersiz dil değeri';
    }
    
    // Date format validation
    if (preferences.dateFormat && !['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(preferences.dateFormat)) {
      errors.dateFormat = 'Geçersiz tarih formatı';
    }
    
    // Timezone validation (basic check)
    if (preferences.timezone && typeof preferences.timezone !== 'string') {
      errors.timezone = 'Geçersiz zaman dilimi';
    }
    
    // Boolean validations
    const booleanFields = ['autoSave', 'compactMode'];
    booleanFields.forEach(field => {
      if (preferences[field] !== undefined && typeof preferences[field] !== 'boolean') {
        errors[field] = `${field} değeri boolean olmalıdır`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // Sanitize functions
  export const sanitizeString = (str) => {
    if (!str) return '';
    return str.toString().trim().slice(0, 1000); // Max 1000 karakter
  };
  
  export const sanitizeUsername = (username) => {
    if (!username) return '';
    return username.toString().trim().toLowerCase().slice(0, 20);
  };
  
  export const sanitizeEmail = (email) => {
    if (!email) return '';
    return email.toString().trim().toLowerCase();
  };
  
  export const sanitizeBio = (bio) => {
    if (!bio) return '';
    return bio.toString().trim().slice(0, 500);
  };