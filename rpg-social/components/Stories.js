'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Clock,
  Image as ImageIcon,
  Type,
  Video,
  Send,
  Loader,
  MessageCircle
} from 'lucide-react';
import { 
  fetchStories, 
  setIsViewingStories, 
  setShowCreateModal,
  createStory,
  viewStory,
  deleteStory,
  setCurrentUserIndex,
  setCurrentStoryIndex,
  markStoryAsViewed
} from '@/lib/redux/slices/storiesSlice';
import StoryViewer from './StoryViewer';
import CreateStoryModal from './CreateStoryModal';

export default function Stories() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    storiesByUser, 
    loading, 
    isViewingStories,
    showCreateModal,
    myStories
  } = useSelector((state) => state.stories);
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  useEffect(() => {
    // Fetch stories on mount
    dispatch(fetchStories({ includeOwn: true }));

    // Refresh stories every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchStories({ includeOwn: true }));
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleStoryClick = (userId, storyIndex = 0) => {
    setSelectedUserId(userId);
    setSelectedStoryIndex(storyIndex);
    dispatch(setCurrentUserIndex(Object.keys(storiesByUser || {}).indexOf(userId)));
    dispatch(setCurrentStoryIndex(storyIndex));
    dispatch(setIsViewingStories(true));
    
    // Mark story as viewed
    const story = storiesByUser?.[userId]?.[storyIndex];
    if (story && !story.hasViewed && story.user._id !== user._id) {
      dispatch(viewStory({ storyId: story._id }));
      dispatch(markStoryAsViewed({ userId, storyIndex }));
    }
  };

  const handleCreateStory = () => {
    dispatch(setShowCreateModal(true));
  };

  const userIds = Object.keys(storiesByUser || {});
  const hasOwnStory = myStories?.length > 0;

  if (loading && userIds.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="glass-card p-6 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Hikayeler</h3>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {userIds.length + (hasOwnStory ? 1 : 0)} aktif
          </span>
        </div>
        
        <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
          {/* Add Story Button */}
          <motion.button
            onClick={handleCreateStory}
            className="flex-shrink-0 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <div className="w-16 h-20 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300 group-hover:border-primary group-hover:from-blue-50 group-hover:to-primary/5 transition-all duration-300 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center overflow-hidden mb-2">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                {!hasOwnStory && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <p className="text-xs text-center mt-2 text-slate-600 font-medium">
                {hasOwnStory ? 'Hikayem' : 'Ekle'}
              </p>
            </div>
          </motion.button>

          {/* User Stories */}
          {userIds.map((userId, index) => {
            const userStories = storiesByUser?.[userId] || [];
            const firstStory = userStories[0];
            const hasUnviewed = userStories.some(story => !story.hasViewed);
            
            if (!firstStory) return null;
            
            return (
              <motion.button
                key={userId}
                onClick={() => handleStoryClick(userId)}
                className="flex-shrink-0 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
              >
                <div className="relative">
                  <div className="w-16 h-20 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl overflow-hidden relative group-hover:shadow-md transition-all duration-300">
                    {/* Story preview */}
                    <div className="absolute inset-0">
                      {firstStory.user.avatar ? (
                        <img 
                          src={firstStory.user.avatar} 
                          alt={firstStory.user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {firstStory.user.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                    
                    {/* Unviewed indicator */}
                    {hasUnviewed && (
                      <div className="absolute inset-0 border-3 border-primary rounded-2xl">
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full" />
                      </div>
                    )}
                    
                    {/* Story count */}
                    {userStories.length > 1 && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{userStories.length}</span>
                      </div>
                    )}
                    
                    {/* User avatar */}
                    <div className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-white p-0.5 shadow-sm">
                      {firstStory.user.avatar ? (
                        <img 
                          src={firstStory.user.avatar} 
                          alt={firstStory.user.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {firstStory.user.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-center mt-2 text-slate-600 font-medium truncate max-w-[64px]">
                    {firstStory.user.username}
                  </p>
                </div>
              </motion.button>
            );
          })}
          
          {userIds.length === 0 && !hasOwnStory && (
            <div className="flex-1 text-center py-6 text-slate-500 text-sm">
              <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              Henüz hikaye yok. İlk hikayeni paylaş!
            </div>
          )}
        </div>
      </motion.div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {isViewingStories && selectedUserId && (
          <StoryViewer 
            userId={selectedUserId}
            initialStoryIndex={selectedStoryIndex}
            onClose={() => {
              dispatch(setIsViewingStories(false));
              setSelectedUserId(null);
              setSelectedStoryIndex(0);
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateStoryModal 
            onClose={() => dispatch(setShowCreateModal(false))}
          />
        )}
      </AnimatePresence>
    </>
  );
}