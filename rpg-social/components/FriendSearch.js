// components/FriendSearch.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  Users, 
  Heart,
  HeartOff,
  X,
  Clock,
  Check,
  Trash2,
  History
} from 'lucide-react';
import { 
  searchUsers, 
  sendFriendRequest, 
  followUser, 
  unfollowUser,
  clearSearchResults,
  setSearchQuery
} from '@/lib/redux/slices/friendsSlice';

export default function FriendSearch({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { 
    searchResults, 
    searchLoading, 
    searchError, 
    searchQuery,
    outgoingRequests 
  } = useSelector((state) => state.friends);
  
  const [localQuery, setLocalQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const debounceTimer = useRef(null);

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('friendSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback((query) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (query.trim().length > 0) {
      debounceTimer.current = setTimeout(() => {
        dispatch(setSearchQuery(query));
        dispatch(searchUsers({ query: query.trim() }));
        
        // Add to search history
        addToSearchHistory(query.trim());
      }, 500);
    } else {
      dispatch(clearSearchResults());
    }
  }, [dispatch]);

  // Add search term to history
  const addToSearchHistory = (query) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      const newHistory = [query, ...filtered].slice(0, 10); // Keep only last 10 searches
      localStorage.setItem('friendSearchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('friendSearchHistory');
  };

  useEffect(() => {
    debouncedSearch(localQuery);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localQuery, debouncedSearch]);

  const handleSendFriendRequest = async (userId) => {
    try {
      console.log('Sending friend request to userId:', userId);
      const result = await dispatch(sendFriendRequest({ userId })).unwrap();
      console.log('Friend request sent successfully:', result);
    } catch (error) {
      console.error('Error sending friend request:', error);
      // You could add a toast notification here
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      console.log('Following user with userId:', userId);
      const result = await dispatch(followUser({ userId })).unwrap();
      console.log('User followed successfully:', result);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollowUser = async (userId) => {
    try {
      console.log('Unfollowing user with userId:', userId);
      const result = await dispatch(unfollowUser({ userId })).unwrap();
      console.log('User unfollowed successfully:', result);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleClose = () => {
    setLocalQuery('');
    setShowHistory(false);
    dispatch(clearSearchResults());
    onClose();
  };

  const handleHistoryClick = (historyItem) => {
    setLocalQuery(historyItem);
    setShowHistory(false);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    dispatch(clearSearchResults());
  };

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHistory && !event.target.closest('.search-input-container')) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistory]);

  const isRequestSent = (userId) => {
    return outgoingRequests.some(req => req.recipient._id === userId) || 
           searchResults.find(user => user._id === userId)?.friendRequestSent;
  };

  const getUserBadgeColor = (level) => {
    if (level >= 50) return 'from-yellow-400 to-yellow-600';
    if (level >= 30) return 'from-purple-400 to-purple-600';
    if (level >= 15) return 'from-blue-400 to-blue-600';
    return 'from-green-400 to-green-600';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="glass-card w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Kullanıcı Ara
                  </h2>
                  <p className="text-sm text-slate-600">
                    Yeni arkadaşlar keşfedin
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="mt-6 relative search-input-container">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Kullanıcı adı veya e-posta ile ara..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                className="w-full pl-12 pr-20 py-4 bg-white/50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                autoFocus
              />
              
              {/* Action Buttons */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 space-x-2">
                {localQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-white/50"
                    title="Aramayı Temizle"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {searchHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-white/50"
                    title="Arama Geçmişi"
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <motion.div
                  className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3 px-2">
                      <span className="text-slate-600 text-sm font-medium">Son Aramalar</span>
                      <button
                        onClick={clearSearchHistory}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded"
                        title="Geçmişi Temizle"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {searchHistory.map((historyItem, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(historyItem)}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        {historyItem}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="p-6 overflow-y-auto max-h-[55vh]">
            {searchLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-600">Aranıyor...</span>
              </div>
            )}

            {searchError && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-red-600 font-medium mb-2">Arama hatası</div>
                <div className="text-slate-500 text-sm">{searchError}</div>
              </div>
            )}

            {!searchLoading && !searchError && localQuery && searchResults.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-slate-600 font-medium">Kullanıcı bulunamadı</div>
                <div className="text-slate-500 text-sm mt-1">Farklı arama terimlerini deneyin</div>
              </div>
            )}

            {!localQuery && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-slate-600 font-medium">Arkadaş aramaya başlayın</div>
                <div className="text-slate-500 text-sm mt-1">Kullanıcı adı veya e-posta adresini girin</div>
              </div>
            )}

            {/* Search Results List */}
            <div className="space-y-3">
              {searchResults.map((user, index) => (
                <motion.div
                  key={user._id}
                  className="glass-card p-4 hover:shadow-lg transition-all border border-slate-200/50 hover:border-blue-300/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* User Avatar */}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${user.characterClass?.color || 'from-slate-400 to-slate-600'} flex items-center justify-center text-xl border-2 border-white shadow-md overflow-hidden`}>
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={`${user.username} profil fotoğrafı`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.characterClass?.icon || '👤'
                        )}
                      </div>

                      {/* User Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-slate-800 font-medium">{user.username}</h3>
                          <div className={`px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${getUserBadgeColor(user.level)} text-white shadow-sm`}>
                            Lv.{user.level}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm">
                          {user.characterClass?.name} • {user.stats?.impactScore || 0} Etki Puanı
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                          <span>{user.stats?.friendsCount || 0} Arkadaş</span>
                          <span>{user.stats?.followersCount || 0} Takipçi</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Follow Button */}
                      <button
                        onClick={() => user.isFollowing ? handleUnfollowUser(user._id) : handleFollowUser(user._id)}
                        className={`p-2 rounded-lg transition-all shadow-sm ${
                          user.isFollowing 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200' 
                            : 'bg-pink-100 text-pink-600 hover:bg-pink-200 border border-pink-200'
                        }`}
                        title={user.isFollowing ? 'Takibi Bırak' : 'Takip Et'}
                      >
                        {user.isFollowing ? <HeartOff className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                      </button>

                      {/* Friend Request Button */}
                      {isRequestSent(user._id) ? (
                        <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm border border-yellow-200 shadow-sm">
                          <Clock className="w-4 h-4" />
                          <span>İstek Gönderildi</span>
                        </div>
                      ) : user.isFriend ? (
                        <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm border border-green-200 shadow-sm">
                          <Check className="w-4 h-4" />
                          <span>Arkadaş</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            console.log('Clicked friend request button for user:', user);
                            handleSendFriendRequest(user._id);
                          }}
                          className="rpg-button text-sm flex items-center space-x-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Arkadaş Ekle</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}