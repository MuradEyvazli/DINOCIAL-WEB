// components/AvatarUpload.js - Cloudinary entegrasyonu ile güncellenmiş (Progress düzeltmeli)
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  AlertTriangle, 
  RefreshCw,
  Trash2,
  Download,
  Maximize,
  Crop
} from 'lucide-react';

// Redux actions
import { uploadAvatar, deleteAvatar, resetAvatarUploadProgress } from '@/lib/redux/slices/settingsSlice';

const AvatarUpload = ({ user, className = '', size = 'large' }) => {
  const dispatch = useDispatch();
  const { 
    isAvatarUploading, 
    isAvatarDeleting, 
    avatarError, 
    avatarSuccess,
    avatarUploadProgress 
  } = useSelector((state) => state.settings);
  
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [localError, setLocalError] = useState(null);
  
  const fileInputRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Progress sıfırlama - upload tamamlandıktan sonra
  useEffect(() => {
    if (avatarUploadProgress === 100 && avatarSuccess) {
      const timer = setTimeout(() => {
        dispatch(resetAvatarUploadProgress());
        setLocalProgress(0);
        setShowPreview(false);
        setPreview(null);
        setLocalError(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [avatarUploadProgress, avatarSuccess, dispatch]);

  // Local progress cleanup
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  // Boyut ayarları
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    xlarge: 'w-40 h-40'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
    xlarge: 'w-8 h-8'
  };

  // File validation
  const validateFile = (file) => {
    const errors = [];
    
    // Type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Sadece JPEG, PNG ve WebP dosyaları kabul edilir');
    }
    
    // Size validation (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('Dosya boyutu 5MB\'dan büyük olamaz');
    }
    
    // Resolution check
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 64 || img.height < 64) {
          errors.push('Resim en az 64x64 piksel olmalıdır');
        }
        if (img.width > 4096 || img.height > 4096) {
          errors.push('Resim çok büyük (max 4096x4096)');
        }
        resolve({ isValid: errors.length === 0, errors });
      };
      img.onerror = () => {
        errors.push('Geçersiz resim dosyası');
        resolve({ isValid: false, errors });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFile = useCallback(async (file) => {
    setLocalError(null);
    setLocalProgress(0);
    
    if (!file) return;

    console.log('📁 Dosya seçildi:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    const validation = await validateFile(file);
    if (!validation.isValid) {
      setLocalError(validation.errors[0]);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview({
        url: e.target.result,
        file: file,
        name: file.name,
        size: file.size
      });
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Upload avatar with progress simulation
  const uploadAvatarAction = async () => {
    if (!preview) return;

    try {
      console.log('📸 Avatar upload başlatılıyor...');
      setLocalProgress(0);
      setLocalError(null);
      
      const formData = new FormData();
      formData.append('avatar', preview.file);

      // Local progress simulation
      setLocalProgress(10);
      progressTimerRef.current = setInterval(() => {
        setLocalProgress(prev => {
          if (prev < 85) {
            return prev + 15;
          }
          return prev;
        });
      }, 300);

      const result = await dispatch(uploadAvatar(formData)).unwrap();
      
      // Clear progress timer
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      
      setLocalProgress(100);
      console.log('✅ Avatar upload başarılı:', result);

    } catch (error) {
      console.error('❌ Avatar upload hatası:', error);
      setLocalError(typeof error === 'string' ? error : 'Avatar yüklenirken hata oluştu');
      setLocalProgress(0);
      
      // Clear progress timer on error
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  };

  // Delete avatar
  const deleteAvatarAction = async () => {
    if (!user?.avatar && !user?.avatarUrls?.medium) return;

    try {
      console.log('🗑️ Avatar siliniyor...');
      await dispatch(deleteAvatar()).unwrap();
      console.log('✅ Avatar silme başarılı');
    } catch (error) {
      console.error('❌ Avatar silme hatası:', error);
      setLocalError(typeof error === 'string' ? error : 'Avatar silinirken hata oluştu');
    }
  };

  // Drag handlers
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
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get avatar URL with size preference
  const getAvatarUrl = () => {
    if (user?.avatarUrls) {
      return user.avatarUrls.medium || user.avatarUrls.original || user.avatar;
    }
    return user?.avatar;
  };

  // Close preview modal
  const closePreview = () => {
    setShowPreview(false);
    setPreview(null);
    setLocalProgress(0);
    setLocalError(null);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const currentError = localError || avatarError;
  const currentProgress = Math.max(localProgress, avatarUploadProgress);

  return (
    <div className={`avatar-upload-container ${className}`}>
      {/* Current Avatar Display */}
      <div className="flex items-center space-x-6 mb-6">
        <div className="relative group">
          {/* Avatar Image */}
          <div 
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-r ${user?.characterClass?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center border-4 border-white/20 overflow-hidden transition-all duration-300 group-hover:border-white/40 cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {getAvatarUrl() ? (
              <img 
                src={getAvatarUrl()} 
                alt="Profile" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className={`${size === 'small' ? 'text-lg' : size === 'medium' ? 'text-2xl' : 'text-3xl'}`}>
                {user?.characterClass?.icon || '👤'}
              </span>
            )}

            {/* Drag overlay */}
            {dragActive && (
              <div className="absolute inset-0 bg-purple-500/20 border-2 border-dashed border-purple-400 rounded-full flex items-center justify-center">
                <Upload className={iconSizes[size]} />
              </div>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isAvatarUploading ? (
                <RefreshCw className={`${iconSizes[size]} text-white animate-spin`} />
              ) : (
                <Camera className={`${iconSizes[size]} text-white`} />
              )}
            </div>
          </div>
          
          {/* Upload progress ring */}
          {(isAvatarUploading && currentProgress > 0 && currentProgress < 100) && (
            <div className="absolute inset-0 rounded-full">
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
                  strokeDasharray={`${currentProgress * 2.89} 289`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{currentProgress}%</span>
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAvatarUploading || isAvatarDeleting}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 rounded-full flex items-center justify-center shadow-lg transition-all"
          >
            {isAvatarUploading ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        
        {size !== 'small' && (
          <div>
            <h3 className="text-white font-bold text-lg">{user?.username}</h3>
            <p className="text-gray-400">Seviye {user?.level} {user?.characterClass?.name}</p>
            
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarUploading || isAvatarDeleting}
                className="text-sm px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-gray-500/20 text-purple-400 disabled:text-gray-500 rounded-lg transition-colors flex items-center space-x-1"
              >
                <Upload className="w-3 h-3" />
                <span>Değiştir</span>
              </button>
              
              {getAvatarUrl() && (
                <button
                  onClick={deleteAvatarAction}
                  disabled={isAvatarUploading || isAvatarDeleting}
                  className="text-sm px-3 py-1 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-500/20 text-red-400 disabled:text-gray-500 rounded-lg transition-colors flex items-center space-x-1"
                >
                  {isAvatarDeleting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  <span>Sil</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Error Message */}
      {currentError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{currentError}</span>
          <button
            onClick={() => setLocalError(null)}
            className="ml-auto text-red-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Success Message */}
      {avatarSuccess && !currentError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center space-x-3"
        >
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{avatarSuccess}</span>
        </motion.div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-4">Avatar Önizleme</h3>
                
                {/* Preview Image */}
                <div className="relative mx-auto w-32 h-32 mb-4">
                  <img
                    src={preview.url}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover border-4 border-purple-500/50"
                  />
                  
                  {(currentProgress > 0 && currentProgress < 100) && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  {currentProgress === 100 && (
                    <div className="absolute inset-0 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="text-sm text-gray-400 mb-6 space-y-1">
                  <p className="truncate">{preview.name}</p>
                  <p>{formatFileSize(preview.size)}</p>
                </div>

                {/* Progress Bar */}
                {currentProgress > 0 && currentProgress < 100 && (
                  <div className="mb-6">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Cloudinary&apos;a yükleniyor... {currentProgress}%</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={closePreview}
                    disabled={currentProgress > 0 && currentProgress < 100}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  
                  <button
                    onClick={uploadAvatarAction}
                    disabled={currentProgress > 0}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all flex items-center justify-center space-x-2"
                  >
                    {currentProgress > 0 && currentProgress < 100 ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Yükleniyor</span>
                      </>
                    ) : currentProgress === 100 ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tamamlandı</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Cloudinary&apos;a Yükle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarUpload;