// app/settings/page.js - Complete Professional Real-time Settings
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Palette, 
  Save,
  X,
  Check,
  AlertTriangle,
  Info,
  Camera,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Mail,
  Smartphone,
  Eye,
  Activity,
  MessageSquare,
  Globe,
  Clock,
  Zap,
  Sparkles,
  Search,
  Filter,
  ChevronRight,
  Star,
  Award,
  Bookmark,
  Heart,
  Moon,
  Sun,
  Monitor,
  Languages,
  MapPin,
  Calendar,
  Database,
  UserPlus,
  UserMinus,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Key,
  Fingerprint,
  Gauge
} from 'lucide-react';

// Redux actions
import {
  updateProfile,
  changePassword,
  updateNotifications,
  updatePrivacy,
  updatePreferences,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
  exportData,
  clearMessages,
  clearSpecificError,
  clearSpecificSuccess,
  resetAvatarUploadProgress
} from '@/lib/redux/slices/settingsSlice';

// Auth actions
import { logout } from '@/lib/redux/slices/authSlice';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { 
    isProfileLoading,
    isPasswordLoading,
    isNotificationsLoading,
    isPrivacyLoading,
    isPreferencesLoading,
    isAvatarUploading,
    isAvatarDeleting,
    isDeletingAccount,
    isExportingData,
    profileError,
    passwordError,
    notificationsError,
    privacyError,
    preferencesError,
    avatarError,
    deleteError,
    exportError,
    profileSuccess,
    passwordSuccess,
    notificationsSuccess,
    privacySuccess,
    preferencesSuccess,
    avatarSuccess,
    deleteSuccess,
    exportSuccess,
    avatarUploadProgress
  } = useSelector((state) => state.settings);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Form states with real-time tracking
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    email: {
      achievements: true,
      quests: true,
      guild: true,
      messages: true,
      marketing: false
    },
    push: {
      achievements: true,
      quests: true,
      guild: true,
      messages: true,
      mentions: true
    },
    inApp: {
      achievements: true,
      quests: true,
      guild: true,
      messages: true,
      sound: true
    }
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showStats: true,
    showActivity: true,
    allowDirectMessages: true,
    showOnlineStatus: true
  });
  
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'tr',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
    autoSave: true,
    compactMode: false
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  // Auto-save timer management - refs for cleanup
  const autoSaveTimer = useRef(null);
  const saveTimeouts = useRef({});
  const successTimers = useRef({});

  // Component cleanup - Tüm timer'ları temizle
  useEffect(() => {
    return () => {
      // Auto-save timer'ını temizle
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      // Tüm save timeout'ları temizle
      Object.values(saveTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      
      // Tüm success timer'ları temizle
      Object.values(successTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Initialize data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || ''
      }));
      
      // Load user preferences
      if (user.preferences) {
        if (user.preferences.notifications) {
          setNotifications(user.preferences.notifications);
        }
        if (user.preferences.privacy) {
          setPrivacy(user.preferences.privacy);
        }
        
        setPreferences({
          theme: user.preferences.theme || 'dark',
          language: user.preferences.language || 'tr',
          timezone: user.preferences.timezone || 'Europe/Istanbul',
          dateFormat: user.preferences.dateFormat || 'DD/MM/YYYY',
          autoSave: user.preferences.autoSave !== false,
          compactMode: user.preferences.compactMode || false
        });
        
        setAutoSaveEnabled(user.preferences.autoSave !== false);
      }
    }
  }, [user, isAuthenticated, router]);

  // Success message auto-clear with proper cleanup
  useEffect(() => {
    const successTypes = [
      { type: 'profile', success: profileSuccess },
      { type: 'password', success: passwordSuccess },
      { type: 'notifications', success: notificationsSuccess },
      { type: 'privacy', success: privacySuccess },
      { type: 'preferences', success: preferencesSuccess },
      { type: 'avatar', success: avatarSuccess },
      { type: 'export', success: exportSuccess }
    ];
    
    // Clear previous timers
    Object.values(successTimers.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    successTimers.current = {};
    
    successTypes.forEach(({ type, success }) => {
      if (success) {
        setLastSaved(new Date());
        setUnsavedChanges(false);
        
        successTimers.current[type] = setTimeout(() => {
          dispatch(clearSpecificSuccess({ type }));
          delete successTimers.current[type];
        }, 4000);
      }
    });
  }, [profileSuccess, passwordSuccess, notificationsSuccess, privacySuccess, preferencesSuccess, avatarSuccess, exportSuccess, dispatch]);

  // Avatar progress cleanup
  useEffect(() => {
    if (avatarUploadProgress === 100 && avatarSuccess) {
      const timer = setTimeout(() => {
        dispatch(resetAvatarUploadProgress());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [avatarUploadProgress, avatarSuccess, dispatch]);

  // Handle account deletion
  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => {
        dispatch(logout());
        router.push('/');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess, dispatch, router]);

  const tabs = [
    { 
      id: 'profile', 
      name: 'Profil Ayarları', 
      description: 'Kişisel bilgiler ve avatar',
      icon: User, 
      color: 'from-blue-500 via-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      category: 'personal'
    },
    { 
      id: 'security', 
      name: 'Güvenlik', 
      description: 'Şifre ve hesap güvenliği',
      icon: Shield, 
      color: 'from-red-500 via-red-600 to-rose-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      category: 'security'
    },
    { 
      id: 'notifications', 
      name: 'Bildirimler', 
      description: 'E-posta ve push bildirimleri',
      icon: Bell, 
      color: 'from-amber-500 via-orange-500 to-red-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      category: 'communication'
    },
    { 
      id: 'privacy', 
      name: 'Gizlilik', 
      description: 'Görünürlük ve veri kontrolü',
      icon: Eye, 
      color: 'from-emerald-500 via-green-600 to-teal-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      category: 'security'
    },
    { 
      id: 'preferences', 
      name: 'Tercihler', 
      description: 'Tema, dil ve görünüm',
      icon: Palette, 
      color: 'from-purple-500 via-violet-600 to-indigo-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      category: 'customization'
    },
    { 
      id: 'account', 
      name: 'Hesap Yönetimi', 
      description: 'Veri ve hesap işlemleri',
      icon: Database, 
      color: 'from-slate-500 via-gray-600 to-zinc-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconColor: 'text-slate-600',
      category: 'management'
    }
  ];

  // Real-time validation
  const validateField = useCallback((field, value) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'username':
        if (value.length < 3) {
          errors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
        } else if (value.length > 20) {
          errors.username = 'Kullanıcı adı en fazla 20 karakter olabilir';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          errors.username = 'Sadece harf, rakam, _ ve - karakterleri kullanılabilir';
        } else {
          delete errors.username;
        }
        break;
      case 'email':
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(value)) {
          errors.email = 'Geçerli bir e-posta adresi giriniz';
        } else {
          delete errors.email;
        }
        break;
      case 'bio':
        if (value.length > 500) {
          errors.bio = 'Bio en fazla 500 karakter olabilir';
        } else {
          delete errors.bio;
        }
        break;
      case 'newPassword':
        if (value.length > 0 && value.length < 6) {
          errors.newPassword = 'Şifre en az 6 karakter olmalıdır';
        } else {
          delete errors.newPassword;
        }
        break;
      case 'confirmPassword':
        if (value !== formData.newPassword) {
          errors.confirmPassword = 'Şifreler eşleşmiyor';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [validationErrors, formData.newPassword]);

  // Auto-save function with proper cleanup
  const triggerAutoSave = useCallback((section, data) => {
    if (!autoSaveEnabled || !preferences.autoSave) return;
    
    // Clear existing timer
    if (saveTimeouts.current[section]) {
      clearTimeout(saveTimeouts.current[section]);
    }
    
    // Set new timer
    saveTimeouts.current[section] = setTimeout(async () => {
      try {
        switch (section) {
          case 'profile':
            if (Object.keys(validationErrors).length === 0) {
              await dispatch(updateProfile(data)).unwrap();
            }
            break;
          case 'notifications':
            await dispatch(updateNotifications(data)).unwrap();
            break;
          case 'privacy':
            await dispatch(updatePrivacy(data)).unwrap();
            break;
          case 'preferences':
            await dispatch(updatePreferences(data)).unwrap();
            break;
        }
        setUnsavedChanges(false);
      } catch (error) {
        console.error(`Auto-save ${section} error:`, error);
      } finally {
        // Timer'ı temizle
        delete saveTimeouts.current[section];
      }
    }, 1500); // 1.5 seconds delay
    
    setUnsavedChanges(true);
  }, [autoSaveEnabled, preferences.autoSave, validationErrors, dispatch]);

  // Handle input changes with real-time updates
  const handleInputChange = useCallback((section, field, value) => {
    if (section === 'form') {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);
      validateField(field, value);
      
      // Trigger auto-save for profile fields
      if (['username', 'email', 'bio'].includes(field)) {
        triggerAutoSave('profile', {
          username: newFormData.username,
          email: newFormData.email,
          bio: newFormData.bio
        });
      }
    } else if (section === 'notifications') {
      const newNotifications = {
        ...notifications,
        [field.split('.')[0]]: {
          ...notifications[field.split('.')[0]],
          [field.split('.')[1]]: value
        }
      };
      setNotifications(newNotifications);
      triggerAutoSave('notifications', newNotifications);
    } else if (section === 'privacy') {
      const newPrivacy = { ...privacy, [field]: value };
      setPrivacy(newPrivacy);
      triggerAutoSave('privacy', newPrivacy);
    } else if (section === 'preferences') {
      const newPreferences = { ...preferences, [field]: value };
      setPreferences(newPreferences);
      
      if (field === 'autoSave') {
        setAutoSaveEnabled(value);
      }
      
      if (field !== 'autoSave') {
        triggerAutoSave('preferences', newPreferences);
      }
    }
  }, [formData, notifications, privacy, preferences, validateField, triggerAutoSave]);

  // Manual save function
  const handleSave = async (section) => {
    dispatch(clearSpecificError({ type: section }));
    
    try {
      switch (section) {
        case 'profile':
          await dispatch(updateProfile({
            username: formData.username,
            email: formData.email,
            bio: formData.bio
          })).unwrap();
          break;
          
        case 'security':
          if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            return;
          }
          await dispatch(changePassword({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword
          })).unwrap();
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          break;
          
        case 'notifications':
          await dispatch(updateNotifications(notifications)).unwrap();
          break;
          
        case 'privacy':
          await dispatch(updatePrivacy(privacy)).unwrap();
          break;
          
        case 'preferences':
          await dispatch(updatePreferences(preferences)).unwrap();
          break;
      }
    } catch (error) {
      console.error(`Save ${section} error:`, error);
    }
  };

  // Avatar upload with drag & drop
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await dispatch(uploadAvatar(formData)).unwrap();
    } catch (error) {
      console.error('Avatar upload error:', error);
    }
  };

  // Avatar delete
  const handleAvatarDelete = async () => {
    try {
      await dispatch(deleteAvatar()).unwrap();
    } catch (error) {
      console.error('Avatar delete error:', error);
    }
  };

  // Drag & drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const fakeEvent = { target: { files: [file] } };
        handleAvatarUpload(fakeEvent);
      }
    }
  }, []);

  const handleAccountDelete = async () => {
    if (!deletePassword) return;
    
    try {
      await dispatch(deleteAccount(deletePassword)).unwrap();
    } catch (error) {
      console.error('Account delete error:', error);
    }
  };

  const handleDataExport = async () => {
    try {
      await dispatch(exportData()).unwrap();
    } catch (error) {
      console.error('Data export error:', error);
    }
  };

  // Get avatar URL with size preference
  const getAvatarUrl = () => {
    if (user?.avatarUrls) {
      return user.avatarUrls.medium || user.avatarUrls.original || user.avatar;
    }
    return user?.avatar;
  };

  // Message components with better animations
  const SuccessMessage = ({ message, type, onClose }) => (
    <motion.div
      className="fixed top-24 right-4 z-50 max-w-md"
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <div className="glass-card p-4 border-l-4 border-l-green-500 backdrop-blur-xl">
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium">{message}</p>
              {lastSaved && (
                <p className="text-green-400 text-xs">
                  {lastSaved.toLocaleTimeString('tr-TR')} tarihinde kaydedildi
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const ErrorMessage = ({ message, onClose }) => (
    <motion.div
      className="fixed top-24 right-4 z-50 max-w-md"
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <div className="glass-card p-4 border-l-4 border-l-red-500 backdrop-blur-xl">
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-white font-medium">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-800">Yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f1f5f9%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Header with Search */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
                Ayarlar
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                Hesabınızı ve deneyiminizi tam kontrolünüzde tutun. Her detayı size göre özelleştirin.
              </p>
            </div>
            
            {/* Quick Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ayarlarda ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full sm:w-80 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                />
              </div>
              
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <Filter className="w-5 h-5" />
                <span>Hızlı Erişim</span>
              </button>
            </div>
          </div>
          
          {/* Auto-save Status */}
          {autoSaveEnabled && (
            <motion.div 
              className="flex items-center space-x-2 mt-6 px-4 py-2 bg-green-50 border border-green-200 rounded-xl inline-flex"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {unsavedChanges ? 'Değişiklikler kaydediliyor...' : 'Otomatik kaydetme aktif'}
              </span>
              {unsavedChanges && <RefreshCw className="w-4 h-4 animate-spin text-green-600" />}
            </motion.div>
          )}
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {profileSuccess && <SuccessMessage message={profileSuccess} type="profile" onClose={() => dispatch(clearSpecificSuccess({ type: 'profile' }))} />}
          {passwordSuccess && <SuccessMessage message={passwordSuccess} type="password" onClose={() => dispatch(clearSpecificSuccess({ type: 'password' }))} />}
          {notificationsSuccess && <SuccessMessage message={notificationsSuccess} type="notifications" onClose={() => dispatch(clearSpecificSuccess({ type: 'notifications' }))} />}
          {privacySuccess && <SuccessMessage message={privacySuccess} type="privacy" onClose={() => dispatch(clearSpecificSuccess({ type: 'privacy' }))} />}
          {preferencesSuccess && <SuccessMessage message={preferencesSuccess} type="preferences" onClose={() => dispatch(clearSpecificSuccess({ type: 'preferences' }))} />}
          {avatarSuccess && <SuccessMessage message={avatarSuccess} type="avatar" onClose={() => dispatch(clearSpecificSuccess({ type: 'avatar' }))} />}
          {exportSuccess && <SuccessMessage message={exportSuccess} type="export" onClose={() => dispatch(clearSpecificSuccess({ type: 'export' }))} />}
          {deleteSuccess && <SuccessMessage message={deleteSuccess} type="delete" onClose={() => dispatch(clearSpecificSuccess({ type: 'delete' }))} />}

          {profileError && <ErrorMessage message={profileError} onClose={() => dispatch(clearSpecificError({ type: 'profile' }))} />}
          {passwordError && <ErrorMessage message={passwordError} onClose={() => dispatch(clearSpecificError({ type: 'password' }))} />}
          {notificationsError && <ErrorMessage message={notificationsError} onClose={() => dispatch(clearSpecificError({ type: 'notifications' }))} />}
          {privacyError && <ErrorMessage message={privacyError} onClose={() => dispatch(clearSpecificError({ type: 'privacy' }))} />}
          {preferencesError && <ErrorMessage message={preferencesError} onClose={() => dispatch(clearSpecificError({ type: 'preferences' }))} />}
          {avatarError && <ErrorMessage message={avatarError} onClose={() => dispatch(clearSpecificError({ type: 'avatar' }))} />}
          {exportError && <ErrorMessage message={exportError} onClose={() => dispatch(clearSpecificError({ type: 'export' }))} />}
          {deleteError && <ErrorMessage message={deleteError} onClose={() => dispatch(clearSpecificError({ type: 'delete' }))} />}
        </AnimatePresence>

        {/* Modern Layout */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Modern Sidebar */}
          <div className="lg:col-span-1">
            <motion.div 
              className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden sticky top-24"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Kategoriler</h3>
                <p className="text-sm text-slate-500 mb-6">Ayar kategorilerini seçin</p>
                
                <div className="space-y-2">
                  {tabs.filter(tab => 
                    searchQuery === '' || 
                    tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tab.description.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((tab, index) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-lg transform scale-[1.02]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      whileHover={{ scale: activeTab === tab.id ? 1.02 : 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                          activeTab === tab.id 
                            ? 'bg-white/20 backdrop-blur-sm' 
                            : tab.bgColor + ' ' + tab.borderColor + ' border'
                        }`}>
                          <tab.icon className={`w-5 h-5 transition-all duration-300 ${
                            activeTab === tab.id ? 'text-white' : tab.iconColor
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm transition-all duration-300 ${
                            activeTab === tab.id ? 'text-white' : 'text-slate-900'
                          }`}>
                            {tab.name}
                          </div>
                          <div className={`text-xs mt-0.5 transition-all duration-300 ${
                            activeTab === tab.id ? 'text-white/80' : 'text-slate-500'
                          }`}>
                            {tab.description}
                          </div>
                        </div>
                        
                        {activeTab === tab.id && (
                          <motion.div
                            className="w-2 h-2 bg-white rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                          />
                        )}
                      </div>
                      
                      {activeTab === tab.id && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Modern Content Area */}
          <div className="lg:col-span-3">
            <motion.div 
              className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="p-8">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className="flex items-center space-x-4 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-slate-800 mb-1">Profil Ayarları</h2>
                      <p className="text-slate-600 text-lg">Kişisel bilgilerini ve görünümünü özelleştir</p>
                    </div>
                  </motion.div>
                  
                  <div className="space-y-8">
                    {/* Enhanced Avatar Upload */}
                    <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                      <div 
                        className="relative group cursor-pointer"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className={`w-32 h-32 rounded-2xl bg-gradient-to-r ${user?.characterClass?.color} flex items-center justify-center border-4 border-white/20 relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-white/40 ${dragActive ? 'border-purple-500/60 scale-105' : ''}`}>
                          {getAvatarUrl() ? (
                            <img src={getAvatarUrl()} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl">{user?.characterClass?.icon}</span>
                          )}
                          
                          {/* Upload overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {isAvatarUploading ? (
                              <RefreshCw className="w-8 h-8 text-white animate-spin" />
                            ) : (
                              <Camera className="w-8 h-8 text-white" />
                            )}
                          </div>
                          
                          {/* Upload button */}
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                            {isAvatarUploading ? (
                              <RefreshCw className="w-5 h-5 text-white animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-white" />
                            )}
                          </div>

                          {/* Progress ring */}
                          {isAvatarUploading && avatarUploadProgress > 0 && avatarUploadProgress < 100 && (
                            <div className="absolute inset-0 rounded-2xl">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="46"
                                  stroke="rgba(147, 51, 234, 0.2)"
                                  strokeWidth="8"
                                  fill="none"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="46"
                                  stroke="#7c3aed"
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${avatarUploadProgress * 2.89} 289`}
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{avatarUploadProgress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {dragActive && (
                          <div className="absolute inset-0 border-2 border-dashed border-purple-500 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                            <p className="text-purple-400 font-medium">Fotoğrafı buraya bırak</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center md:text-left">
                        <h3 className="text-slate-800 font-bold text-2xl mb-2">{user?.username}</h3>
                        <p className="text-slate-600 text-lg mb-4">Seviye {user?.level} {user?.characterClass?.name}</p>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isAvatarUploading}
                            className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-all flex items-center justify-center space-x-2 font-medium"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{isAvatarUploading ? 'Yükleniyor...' : 'Fotoğraf Değiştir'}</span>
                          </button>
                          {getAvatarUrl() && (
                            <button 
                              onClick={handleAvatarDelete}
                              disabled={isAvatarDeleting}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all flex items-center justify-center space-x-2"
                            >
                              {isAvatarDeleting ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <span>Kaldır</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Form Fields */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-slate-700 font-medium mb-2">Kullanıcı Adı</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleInputChange('form', 'username', e.target.value)}
                            className={`w-full px-4 py-3 bg-white/50 border-2 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-primary transition-all duration-300 ${validationErrors.username ? 'border-red-500 focus:border-red-500' : 'border-slate-300'}`}
                            disabled={isProfileLoading}
                            placeholder="Kullanıcı adını gir"
                          />
                          {validationErrors.username && (
                            <motion.p 
                              className="text-red-400 text-sm mt-1 flex items-center space-x-1"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>{validationErrors.username}</span>
                            </motion.p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-slate-700 font-medium mb-2">E-posta</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('form', 'email', e.target.value)}
                            className={`w-full px-4 py-3 bg-white/50 border-2 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-primary transition-all duration-300 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-300'}`}
                            disabled={isProfileLoading}
                            placeholder="E-posta adresini gir"
                          />
                          {validationErrors.email && (
                            <motion.p 
                              className="text-red-400 text-sm mt-1 flex items-center space-x-1"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>{validationErrors.email}</span>
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-700 font-medium mb-2">Biyografi</label>
                      <div className="relative">
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('form', 'bio', e.target.value)}
                          className={`w-full px-4 py-3 bg-white/50 border-2 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-primary transition-all duration-300 resize-none ${validationErrors.bio ? 'border-red-500 focus:border-red-500' : 'border-slate-300'}`}
                          placeholder="Kendinden bahset..."
                          maxLength={500}
                          disabled={isProfileLoading}
                          rows={4}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            {validationErrors.bio && (
                              <motion.p 
                                className="text-red-400 text-sm flex items-center space-x-1"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <AlertTriangle className="w-4 h-4" />
                                <span>{validationErrors.bio}</span>
                              </motion.p>
                            )}
                          </div>
                          <span className={`text-sm ${formData.bio.length > 450 ? 'text-accent' : formData.bio.length > 480 ? 'text-red-500' : 'text-slate-500'}`}>
                            {formData.bio.length}/500
                          </span>
                        </div>
                      </div>
                    </div>

                    {!autoSaveEnabled && (
                      <motion.button
                        onClick={() => handleSave('profile')}
                        disabled={isProfileLoading || Object.keys(validationErrors).length > 0}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isProfileLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Kaydediliyor...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Profili Kaydet</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Güvenlik Ayarları</h2>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl border-l-4 border-l-blue-500">
                      <div className="flex items-start space-x-3">
                        <Info className="w-6 h-6 text-blue-400 mt-1" />
                        <div>
                          <h3 className="text-slate-800 font-bold text-lg mb-2">Şifre Güvenliği</h3>
                          <p className="text-slate-600">Hesabının güvenliği için güçlü bir şifre kullan. En az 6 karakter, büyük-küçük harf ve rakam kombinasyonu önerilir.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-slate-700 font-medium mb-2">Mevcut Şifre</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('form', 'currentPassword', e.target.value)}
                          className="w-full px-4 py-3 bg-white/50 border-2 border-slate-300 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-primary transition-all duration-300"
                          placeholder="Mevcut şifreni gir"
                          disabled={isPasswordLoading}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-slate-700 font-medium mb-2">Yeni Şifre</label>
                          <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('form', 'newPassword', e.target.value)}
                            className={`w-full px-4 py-3 bg-gray-800/50 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all duration-300 ${validationErrors.newPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-700'}`}
                            placeholder="Yeni şifre"
                            disabled={isPasswordLoading}
                          />
                          {validationErrors.newPassword && (
                            <motion.p 
                              className="text-red-400 text-sm mt-1 flex items-center space-x-1"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>{validationErrors.newPassword}</span>
                            </motion.p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-gray-400 font-medium mb-2">Şifre Tekrar</label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('form', 'confirmPassword', e.target.value)}
                            className={`w-full px-4 py-3 bg-gray-800/50 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all duration-300 ${validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-700'}`}
                            placeholder="Şifreyi tekrar gir"
                            disabled={isPasswordLoading}
                          />
                          {validationErrors.confirmPassword && (
                            <motion.p 
                              className="text-red-400 text-sm mt-1 flex items-center space-x-1"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>{validationErrors.confirmPassword}</span>
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <motion.button
                        onClick={() => handleSave('security')}
                        disabled={isPasswordLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || Object.keys(validationErrors).length > 0}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isPasswordLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Güncelleniyor...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            <span>Şifre Güncelle</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Bildirim Ayarları</h2>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Email Notifications */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        E-posta Bildirimleri
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(notifications.email).map(([key, value]) => (
                          <motion.div 
                            key={key} 
                            className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                            whileHover={{ x: 4 }}
                          >
                            <div>
                              <h4 className="text-white font-medium text-lg">
                                {key === 'achievements' ? 'Başarımlar' :
                                 key === 'quests' ? 'Görevler' :
                                 key === 'guild' ? 'Guild' :
                                 key === 'messages' ? 'Mesajlar' :
                                 key === 'marketing' ? 'Pazarlama' : key}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {key === 'achievements' && 'Yeni başarımlar ve rozetler hakkında bilgilendir'}
                                {key === 'quests' && 'Görev güncellemeleri ve yeni görevler'}
                                {key === 'guild' && 'Guild aktiviteleri ve duyurular'}
                                {key === 'messages' && 'Yeni mesajlar ve yanıtlar'}
                                {key === 'marketing' && 'Özellikler ve güncellemeler hakkında'}
                              </p>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handleInputChange('notifications', `email.${key}`, e.target.checked)}
                                disabled={isNotificationsLoading}
                                className="sr-only peer"
                                id={`email-${key}`}
                              />
                              <label
                                htmlFor={`email-${key}`}
                                className="relative flex cursor-pointer items-center justify-center w-12 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                          <Smartphone className="w-5 h-5 text-green-400" />
                        </div>
                        Push Bildirimleri
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(notifications.push).map(([key, value]) => (
                          <motion.div 
                            key={key} 
                            className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                            whileHover={{ x: 4 }}
                          >
                            <div>
                              <h4 className="text-white font-medium text-lg">
                                {key === 'achievements' ? 'Başarımlar' :
                                 key === 'quests' ? 'Görevler' :
                                 key === 'guild' ? 'Guild' :
                                 key === 'messages' ? 'Mesajlar' :
                                 key === 'mentions' ? 'Bahsetmeler' : key}
                              </h4>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handleInputChange('notifications', `push.${key}`, e.target.checked)}
                                disabled={isNotificationsLoading}
                                className="sr-only peer"
                                id={`push-${key}`}
                              />
                              <label
                                htmlFor={`push-${key}`}
                                className="relative flex cursor-pointer items-center justify-center w-12 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {!autoSaveEnabled && (
                      <motion.button
                        onClick={() => handleSave('notifications')}
                        disabled={isNotificationsLoading}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isNotificationsLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Kaydediliyor...</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-5 h-5" />
                            <span>Bildirim Ayarlarını Kaydet</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Gizlilik Ayarları</h2>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="block text-gray-400 font-medium mb-3">Profil Görünürlüğü</label>
                      <select 
                        value={privacy.profileVisibility}
                        onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all duration-300"
                        disabled={isPrivacyLoading}
                      >
                        <option value="public">🌍 Herkese Açık</option>
                        <option value="friends">👥 Sadece Arkadaşlar</option>
                        <option value="private">🔒 Özel</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                        <motion.div 
                          key={key} 
                          className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                          whileHover={{ x: 4 }}
                        >
                          <div>
                            <h4 className="text-white font-medium text-lg flex items-center">
                              {key === 'showStats' && <><Activity className="w-5 h-5 mr-2 text-blue-400" />İstatistikleri Göster</>}
                              {key === 'showActivity' && <><Eye className="w-5 h-5 mr-2 text-green-400" />Aktiviteyi Göster</>}
                              {key === 'allowDirectMessages' && <><MessageSquare className="w-5 h-5 mr-2 text-purple-400" />Direkt Mesajlara İzin Ver</>}
                              {key === 'showOnlineStatus' && <><Globe className="w-5 h-5 mr-2 text-yellow-400" />Çevrimiçi Durumu Göster</>}
                            </h4>
                            <p className="text-gray-400 text-sm mt-1">
                              {key === 'showStats' && 'Diğer kullanıcılar istatistiklerini, seviyeni ve başarımlarını görebilir'}
                              {key === 'showActivity' && 'Son aktiviteler ve oynanan oyunlar timeline\'da görünür olur'}
                              {key === 'allowDirectMessages' && 'Arkadaş olmayan kullanıcılar da sana mesaj gönderebilir'}
                              {key === 'showOnlineStatus' && 'Çevrimiçi olup olmadığın ve son görülme zamanın diğerlerine görünür'}
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleInputChange('privacy', key, e.target.checked)}
                              disabled={isPrivacyLoading}
                              className="sr-only peer"
                              id={`privacy-${key}`}
                            />
                            <label
                              htmlFor={`privacy-${key}`}
                              className="relative flex cursor-pointer items-center justify-center w-12 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {!autoSaveEnabled && (
                      <motion.button
                        onClick={() => handleSave('privacy')}
                        disabled={isPrivacyLoading}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isPrivacyLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Kaydediliyor...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            <span>Gizlilik Ayarlarını Kaydet</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                      <Palette className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Tercihler</h2>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-400 font-medium mb-3">🎨 Tema</label>
                        <select 
                          value={preferences.theme}
                          onChange={(e) => handleInputChange('preferences', 'theme', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all duration-300"
                          disabled={isPreferencesLoading}
                        >
                          <option value="dark">🌙 Karanlık</option>
                          <option value="light">☀️ Aydınlık</option>
                          <option value="auto">🔄 Otomatik</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 font-medium mb-3">🌍 Dil</label>
                        <select 
                          value={preferences.language}
                          onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all duration-300"
                          disabled={isPreferencesLoading}
                        >
                          <option value="tr">🇹🇷 Türkçe</option>
                          <option value="en">🇺🇸 English</option>
                          <option value="de">🇩🇪 Deutsch</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-400 font-medium mb-3">🕐 Zaman Dilimi</label>
                        <select 
                          value={preferences.timezone}
                          onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all duration-300"
                          disabled={isPreferencesLoading}
                        >
                          <option value="Europe/Istanbul">🇹🇷 İstanbul</option>
                          <option value="Europe/London">🇬🇧 Londra</option>
                          <option value="America/New_York">🇺🇸 New York</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 font-medium mb-3">📅 Tarih Formatı</label>
                        <select 
                          value={preferences.dateFormat}
                          onChange={(e) => handleInputChange('preferences', 'dateFormat', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all duration-300"
                          disabled={isPreferencesLoading}
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(preferences).filter(([key]) => !['theme', 'language', 'timezone', 'dateFormat'].includes(key)).map(([key, value]) => (
                        <motion.div 
                          key={key} 
                          className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                          whileHover={{ x: 4 }}
                        >
                          <div>
                            <h4 className="text-white font-medium text-lg flex items-center">
                              {key === 'autoSave' && <><Zap className="w-5 h-5 mr-2 text-yellow-400" />Otomatik Kaydetme</>}
                              {key === 'compactMode' && <><Clock className="w-5 h-5 mr-2 text-blue-400" />Kompakt Mod</>}
                            </h4>
                            <p className="text-gray-400 text-sm mt-1">
                              {key === 'autoSave' && 'Değişiklikler otomatik olarak kaydedilir, manuel kaydetme gerekmez'}
                              {key === 'compactMode' && 'Daha az alan kaplayan, yoğun görünüm modunu etkinleştir'}
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleInputChange('preferences', key, e.target.checked)}
                              disabled={isPreferencesLoading}
                              className="sr-only peer"
                              id={`pref-${key}`}
                            />
                            <label
                              htmlFor={`pref-${key}`}
                              className="relative flex cursor-pointer items-center justify-center w-12 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.button
                      onClick={() => handleSave('preferences')}
                      disabled={isPreferencesLoading}
                      className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isPreferencesLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Kaydediliyor...</span>
                        </>
                      ) : (
                        <>
                          <Palette className="w-5 h-5" />
                          <span>Tercihleri Kaydet</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl">
                      <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Hesap Yönetimi</h2>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Data Export */}
                    <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl border-l-4 border-l-blue-500">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <Download className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-xl mb-2">Veri İndirme</h3>
                          <p className="text-gray-400 mb-4">
                            Tüm kişisel verilerini, profil bilgilerini, mesajlarını ve aktivite geçmişini JSON formatında indir.
                          </p>
                          <motion.button 
                            onClick={handleDataExport}
                            disabled={isExportingData}
                            className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 text-blue-400 disabled:text-gray-500 rounded-lg transition-all flex items-center space-x-2 font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isExportingData ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>İndiriliyor...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Verilerimi İndir</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl border-l-4 border-l-red-500">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                          <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-xl mb-2">Hesap Silme</h3>
                          <p className="text-gray-400 mb-4">
                            Hesabını kalıcı olarak sil. Bu işlem geri alınamaz ve tüm verilerini, arkadaşlıklarını, başarımlarını ve ilerlemeni kaybedersin.
                          </p>
                          <motion.button 
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isDeletingAccount}
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-500/20 text-red-400 disabled:text-gray-500 rounded-lg transition-all flex items-center space-x-2 font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Hesabı Kalıcı Olarak Sil</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              </div>
            </motion.div>
          </div>
        </div>
        </div>

        {/* Enhanced Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Hesabı Sil</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Bu işlem <strong>geri alınamaz</strong>. Tüm verilerini, başarımlarını, arkadaşlıklarını ve ilerlemeni <strong>kalıcı olarak</strong> kaybedeceksin.
                  </p>
                  
                  <div className="mb-6">
                    <label className="block text-gray-400 font-medium mb-2 text-left">
                      Devam etmek için şifreni gir:
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Şifreni gir"
                      className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-all duration-300"
                      disabled={isDeletingAccount}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletePassword('');
                      }}
                      disabled={isDeletingAccount}
                      className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-xl transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      İptal
                    </motion.button>
                    <motion.button
                      onClick={handleAccountDelete}
                      disabled={isDeletingAccount || !deletePassword}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl transition-all flex items-center justify-center space-x-2 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isDeletingAccount ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Siliniyor...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Evet, Sil</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}