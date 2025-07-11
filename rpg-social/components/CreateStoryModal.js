'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Type, 
  Image as ImageIcon, 
  Video, 
  Palette,
  Send,
  Loader,
  Upload
} from 'lucide-react';
import { createStory, uploadStoryMedia } from '@/lib/redux/slices/storiesSlice';

const backgroundColors = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#6b7280', // Gray
];

export default function CreateStoryModal({ onClose }) {
  const dispatch = useDispatch();
  const { createLoading, uploadLoading } = useSelector((state) => state.stories);
  
  const [storyType, setStoryType] = useState('text'); // text, image, video
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(backgroundColors[0]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [error, setError] = useState('');
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    if (storyType === 'image' && !validImageTypes.includes(file.type)) {
      setError('Lütfen geçerli bir resim dosyası seçin (JPEG, PNG, GIF)');
      return;
    }
    
    if (storyType === 'video' && !validVideoTypes.includes(file.type)) {
      setError('Lütfen geçerli bir video dosyası seçin (MP4, WebM, OGG)');
      return;
    }
    
    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = storyType === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Dosya boyutu çok büyük. Maksimum: ${storyType === 'image' ? '10MB' : '50MB'}`);
      return;
    }
    
    setError('');
    setMediaFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async () => {
    if (storyType === 'text' && !content.trim()) {
      setError('Lütfen bir metin girin');
      return;
    }
    
    if ((storyType === 'image' || storyType === 'video') && !mediaFile) {
      setError('Lütfen bir dosya seçin');
      return;
    }
    
    try {
      let mediaUrl = null;
      
      // Upload media if needed
      if (mediaFile) {
        const uploadResult = await dispatch(uploadStoryMedia({ file: mediaFile })).unwrap();
        mediaUrl = uploadResult.url;
      }
      
      // Create story
      await dispatch(createStory({
        content: {
          text: storyType === 'text' ? content : '',
          mediaUrl,
          mediaType: storyType,
          backgroundColor: storyType === 'text' ? backgroundColor : '#000000',
          textColor: '#ffffff'
        },
        type: storyType,
        visibility: 'friends'
      })).unwrap();
      
      onClose();
    } catch (error) {
      setError(error.message || 'Hikaye oluşturulurken bir hata oluştu');
    }
  };
  
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-black/80 to-slate-800/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Header - Enhanced */}
        <div className="relative p-6 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Hikaye Oluştur
                </h2>
                <p className="text-sm text-slate-500 font-medium">Anını paylaş</p>
              </div>
            </div>
            
            <motion.button
              onClick={onClose}
              className="p-3 text-slate-500 hover:text-slate-700 hover:bg-white/50 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/30"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        {/* Story Type Selector */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setStoryType('text')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
                storyType === 'text' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Type className="w-5 h-5" />
              <span className="font-medium">Metin</span>
            </button>
            
            <button
              onClick={() => setStoryType('image')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
                storyType === 'image' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-medium">Resim</span>
            </button>
            
            <button
              onClick={() => setStoryType('video')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
                storyType === 'video' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="font-medium">Video</span>
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
          {storyType === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hikaye Metni
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hikayeni yaz..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {content.length}/500
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arka Plan Rengi
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {backgroundColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-full aspect-square rounded-lg transition-all ${
                        backgroundColor === color 
                          ? 'ring-2 ring-offset-2 ring-blue-500' 
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Preview */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Önizleme
                </label>
                <div 
                  className="w-full aspect-[9/16] rounded-lg flex items-center justify-center p-8"
                  style={{ backgroundColor }}
                >
                  <p className="text-white text-2xl font-bold text-center">
                    {content || 'Hikayeni yaz...'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!mediaPreview ? (
                <label className="block">
                  <input
                    type="file"
                    accept={storyType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-full aspect-[9/16] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">
                      {storyType === 'image' ? 'Resim Seç' : 'Video Seç'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {storyType === 'image' ? 'Maks. 10MB' : 'Maks. 50MB'}
                    </p>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <div className="w-full aspect-[9/16] rounded-lg overflow-hidden bg-black">
                    {storyType === 'image' ? (
                      <img 
                        src={mediaPreview} 
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video 
                        src={mediaPreview}
                        className="w-full h-full object-contain"
                        controls
                      />
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={createLoading || uploadLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createLoading || uploadLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>{uploadLoading ? 'Yükleniyor...' : 'Oluşturuluyor...'}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Hikayeyi Paylaş</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}