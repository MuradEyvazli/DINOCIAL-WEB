'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Trash2,
  Eye,
  Send,
  Heart,
  Clock
} from 'lucide-react';
import { 
  viewStory,
  deleteStory,
  likeStory,
  markStoryAsViewed,
  setCurrentStoryIndex,
  setCurrentUserIndex,
  fetchStoryLikes,
  fetchStoryViewers
} from '@/lib/redux/slices/storiesSlice';

export default function StoryViewer({ userId, initialStoryIndex = 0, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { storiesByUser, currentUserIndex, currentStoryIndex, likeLoading } = useSelector((state) => state.stories);
  
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [reply, setReply] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  
  const progressInterval = useRef(null);
  const storyDuration = 5000; // 5 seconds per story
  
  const userIds = Object.keys(storiesByUser || {});
  const currentUserId = userIds[currentUserIndex] || userId;
  const stories = storiesByUser?.[currentUserId] || [];
  const currentStory = stories[currentStoryIndex] || stories[0];
  
  useEffect(() => {
    if (!currentStory || isPaused) return;
    
    // Reset progress
    setProgress(0);
    
    // Start progress timer
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (storyDuration / 100));
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);
    
    // Mark as viewed
    if (currentStory && !currentStory.hasViewed && currentStory.user._id !== user._id) {
      dispatch(viewStory({ storyId: currentStory._id }));
      dispatch(markStoryAsViewed({ userId: currentUserId, storyIndex: currentStoryIndex }));
    }
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStory, isPaused, currentStoryIndex, currentUserId]);
  
  // Separate effect to handle story progression when progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && !isPaused) {
      const timer = setTimeout(() => {
        handleNextStory();
      }, 100); // Small delay to avoid setState during render
      
      return () => clearTimeout(timer);
    }
  }, [progress, isPaused]);
  
  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      dispatch(setCurrentStoryIndex(currentStoryIndex + 1));
    } else {
      handleNextUser();
    }
  };
  
  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      dispatch(setCurrentStoryIndex(currentStoryIndex - 1));
    } else {
      handlePreviousUser();
    }
  };
  
  const handleNextUser = () => {
    if (currentUserIndex < userIds.length - 1) {
      dispatch(setCurrentUserIndex(currentUserIndex + 1));
      dispatch(setCurrentStoryIndex(0));
      setProgress(0);
    } else {
      onClose();
    }
  };
  
  const handlePreviousUser = () => {
    if (currentUserIndex > 0) {
      dispatch(setCurrentUserIndex(currentUserIndex - 1));
      dispatch(setCurrentStoryIndex(0));
      setProgress(0);
    }
  };
  
  const handleDeleteStory = async () => {
    if (currentStory && currentStory.user._id === user._id) {
      await dispatch(deleteStory({ storyId: currentStory._id }));
      if (stories.length === 1) {
        onClose();
      } else {
        handleNextStory();
      }
    }
  };
  
  const handleReply = () => {
    if (reply.trim()) {
      // TODO: Send reply to story owner
      setReply('');
      setShowReplyInput(false);
    }
  };
  
  const handleLike = async () => {
    if (currentStory && !likeLoading) {
      dispatch(likeStory({ storyId: currentStory._id }));
    }
  };
  
  const formatTimeAgo = (date) => {
    const now = new Date();
    const storyDate = new Date(date);
    const diffMs = now - storyDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours}sa`;
    if (diffMinutes > 0) return `${diffMinutes}dk`;
    return 'Az önce';
  };
  
  if (!currentStory) return null;
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Story Container */}
      <div className="relative w-full h-full max-w-md mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 flex space-x-2">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                initial={{ width: index < currentStoryIndex ? '100%' : '0%' }}
                animate={{ 
                  width: index < currentStoryIndex ? '100%' : 
                         index === currentStoryIndex ? `${progress}%` : '0%' 
                }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          ))}
        </div>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-8 bg-gradient-to-b from-white/90 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                {currentStory.user.avatar ? (
                  <img 
                    src={currentStory.user.avatar} 
                    alt={currentStory.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {currentStory.user.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-slate-800 font-semibold">{currentStory.user.username}</p>
                <p className="text-slate-500 text-xs">{formatTimeAgo(currentStory.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              
              {currentStory.content.mediaType === 'video' && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
              
              {currentStory.user._id === user._id && (
                <div className="relative">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                      <button
                        onClick={handleDeleteStory}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hikayeyi Sil</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
          
        {/* Story Content */}
        <div 
          className="absolute top-16 left-0 right-0 bottom-20 bg-slate-50 overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            
            if (x < width / 3) {
              handlePreviousStory();
            } else if (x > (2 * width) / 3) {
              handleNextStory();
            }
          }}
        >
          {currentStory.content.mediaType === 'image' && currentStory.content.mediaUrl ? (
            <img 
              src={currentStory.content.mediaUrl} 
              alt="Story"
              className="w-full h-full object-contain"
            />
          ) : currentStory.content.mediaType === 'video' && currentStory.content.mediaUrl ? (
            <video 
              src={currentStory.content.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center p-8"
              style={{ backgroundColor: currentStory.content.backgroundColor || '#6366f1' }}
            >
              <p 
                className="text-3xl font-bold text-center"
                style={{ color: currentStory.content.textColor || '#ffffff' }}
              >
                {currentStory.content.text}
              </p>
            </div>
          )}
          
          {/* Navigation Areas */}
          <div className="absolute left-0 top-0 bottom-0 w-1/3" />
          <div className="absolute right-0 top-0 bottom-0 w-1/3" />
        </div>
          
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-white/90 to-transparent backdrop-blur-sm">
          {currentStory.user._id === user._id ? (
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">{currentStory.viewCount || 0} görüntülenme</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">{currentStory.likeCount || 0} beğeni</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Like and Stats Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-slate-600">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{currentStory.viewCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{currentStory.likeCount || 0}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    currentStory.hasLiked 
                      ? 'bg-red-500 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  <Heart className={`w-5 h-5 ${currentStory.hasLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">
                    {currentStory.hasLiked ? 'Beğenildi' : 'Beğen'}
                  </span>
                </button>
              </div>
              
              {!showReplyInput ? (
                <button
                  onClick={() => setShowReplyInput(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span>Mesaj Gönder</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Yanıt yaz..."
                    className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={!reply.trim()}
                    className="p-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        {currentUserIndex > 0 && (
          <button
            onClick={handlePreviousUser}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-600 hover:bg-white transition-colors z-20 shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {currentUserIndex < userIds.length - 1 && (
          <button
            onClick={handleNextUser}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-600 hover:bg-white transition-colors z-20 shadow-sm"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </motion.div>
  );
}