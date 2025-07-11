// app/dashboard/page.js
'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  Users, 
  Trophy, 
  Target, 
  Bell, 
  Settings, 
  LogOut,
  Plus,
  Star,
  Zap,
  MessageCircle,
  Heart,
  Send,
  MoreHorizontal,
  Image as ImageIcon,
  Share2,
  Bookmark,
  X,
  Loader,
  Smile,
  TrendingUp,
  Trash2,
  UserPlus,
  Search
} from 'lucide-react';
import { logout } from '@/lib/redux/slices/authSlice';
import { 
  fetchPosts, 
  createPost, 
  toggleLike, 
  addComment, 
  setShowCreateModal,
  initializePostsSocket,
  deletePost,
  deleteComment,
  toggleSavePost
} from '@/lib/redux/slices/postsSlice';
import FriendSearch from '@/components/FriendSearch';
import Stories from '@/components/Stories';
import LevelDashboard from '@/components/ui/LevelDashboard';
import ProfileCard, { ClickableAvatar, ClickableUsername } from '@/components/ProfileCard';
// DevTools kaldırıldı
import { getUserFriends, getFriendRequests } from '@/lib/redux/slices/friendsSlice';
// Bildirim simulator kaldırıldı

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useSelector((state) => state.auth);
  const { 
    posts, 
    loading, 
    showCreateModal, 
    createLoading, 
    hasMore, 
    currentPage 
  } = useSelector((state) => state.posts);
  const { stats: friendStats } = useSelector((state) => state.friends);
  
  const [timeOfDay, setTimeOfDay] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showComments, setShowComments] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  // Simulation interval state kaldırıldı

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Set time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Günaydın');
    else if (hour < 18) setTimeOfDay('İyi öğleden sonra');
    else setTimeOfDay('İyi akşamlar');

    // Fetch initial posts
    dispatch(fetchPosts({ page: 1 }));
    
    // Load friends data
    dispatch(getUserFriends());
    dispatch(getFriendRequests());
    // Initialize Socket.IO for real-time updates
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(initializePostsSocket(token));
    }
    
    // Bildirim simulasyonu kaldırıldı
  }, [isAuthenticated, router, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    await dispatch(createPost({ content: newPostContent.trim() }));
    setNewPostContent('');
  };

  const handleToggleLike = async (postId) => {
    try {
      console.log('Toggling like for post:', postId);
      const result = await dispatch(toggleLike({ postId })).unwrap();
      console.log('Like toggle result:', result);
    } catch (error) {
      console.error('Like toggle error:', error);
    }
  };

  const handleAddComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim() || isSubmittingComment[postId]) return;
    
    // Prevent multiple submissions
    setIsSubmittingComment({ ...isSubmittingComment, [postId]: true });
    
    try {
      console.log('Adding comment to post:', postId, 'Content:', content);
      const result = await dispatch(addComment({ postId, content: content.trim() })).unwrap();
      console.log('Comment add result:', result);
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (error) {
      console.error('Comment add error:', error);
    } finally {
      setIsSubmittingComment({ ...isSubmittingComment, [postId]: false });
    }
  };

  const toggleComments = (postId) => {
    setShowComments({
      ...showComments,
      [postId]: !showComments[postId]
    });
  };

  const handleDeletePost = async (postId) => {
    try {
      await dispatch(deletePost({ postId })).unwrap();
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Delete post error:', error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await dispatch(deleteComment({ postId, commentId })).unwrap();
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  const handleSavePost = (postId) => {
    const post = posts.find(p => p._id === postId);
    dispatch(toggleSavePost({ postId, isSaved: !post?.isSaved }));
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Az önce';
    if (diffMinutes < 60) return `${diffMinutes}dk`;
    if (diffHours < 24) return `${diffHours}sa`;
    if (diffDays < 7) return `${diffDays}g`;
    
    return time.toLocaleDateString('tr-TR');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Loader className="w-16 h-16 text-primary mx-auto" />
          </motion.div>
          <motion.p 
            className="text-slate-800 text-lg font-medium"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Dashboard hazırlanıyor...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Dashboard Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left Section - Welcome */}
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard
                </h1>
                <p className="text-gray-600 text-sm">
                  {timeOfDay}, {user.username}!
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <Trophy className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-900 text-sm font-medium">Lv. {user.level || 1}</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-gray-900 text-sm font-medium">{friendStats.friendsCount || 0} Arkadaş</span>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              {/* Friend Search Button */}
              <button
                onClick={() => setShowFriendSearch(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">Arkadaş Ara</span>
                {friendStats.pendingRequestsCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                    {friendStats.pendingRequestsCount}
                  </span>
                )}
              </button>

              {/* Quick Navigation */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => router.push('/map')}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-white rounded transition-all"
                  title="Harita"
                >
                  <Map className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => router.push('/quests')}
                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-white rounded transition-all"
                  title="Görevler"
                >
                  <Target className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => router.push('/profile')}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-white rounded transition-all"
                  title="Profil"
                >
                  <Trophy className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded transition-all"
                  title="Çıkış"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Level Dashboard */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-20">
              <LevelDashboard />
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            
            {/* Stories Section */}
            <Stories />
            
            {/* Create Post */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Neler düşünüyorsun?"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    maxLength={2000}
                  />
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100">
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        {newPostContent.length}/2000
                      </span>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim() || createLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {createLoading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Paylaş
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {loading && posts.length === 0 ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Gönderiler yükleniyor...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz gönderi yok</h3>
                  <p className="text-gray-500 mb-6">İlk gönderiyi siz paylaşın!</p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <div
                    key={post._id || post.id || `post-${index}-${post.createdAt}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <ProfileCard
                          user={post.author}
                          currentUser={user}
                          size="md"
                          showLevel={true}
                          showUsername={true}
                          className="flex-1"
                        />
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatTime(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {post.author._id === user._id && (
                        <div className="relative group">
                          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => {
                                setPostToDelete(post._id);
                                setShowDeleteModal(true);
                              }}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Gönderiyi Sil</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{post.content.text}</p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleToggleLike(post._id)}
                          className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                            post.isLikedBy 
                              ? 'text-red-500 bg-red-50' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.isLikedBy ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{post.likesCount || 0}</span>
                        </button>
                        
                        <button
                          onClick={() => toggleComments(post._id)}
                          className="flex items-center space-x-2 p-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.commentsCount || 0}</span>
                        </button>
                        
                        <button className="flex items-center space-x-2 p-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleSavePost(post._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          post.isSaved 
                            ? 'text-amber-500 bg-amber-50' 
                            : 'text-gray-500 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Comments Section */}
                    {showComments[post._id] && (
                      <motion.div
                        className="mt-4 border-t border-slate-200 pt-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {/* Add Comment */}
                        <div className="flex space-x-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-xs">
                                {user.username[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              value={commentInputs[post._id] || ''}
                              onChange={(e) => setCommentInputs({
                                ...commentInputs,
                                [post._id]: e.target.value
                              })}
                              placeholder="Yorum ekle..."
                              className="flex-1 input-field rounded-full"
                              maxLength={500}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post._id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(post._id)}
                              disabled={!commentInputs[post._id]?.trim()}
                              className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {post.comments?.map((comment, commentIndex) => (
                            <div key={`${post._id}-comment-${commentIndex}`} className="flex space-x-3">
                              <ClickableAvatar
                                user={comment.user}
                                currentUser={user}
                                size="sm"
                                showLevel={false}
                                className="flex-shrink-0"
                              />
                              
                              <div className="flex-1 group">
                                <div className="bg-slate-100 rounded-lg p-3 relative">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                      <ClickableUsername
                                        user={comment.user}
                                        currentUser={user}
                                        size="sm"
                                        className="font-semibold text-slate-800"
                                      />
                                      <span className="text-xs text-slate-500">
                                        {formatTime(comment.createdAt)}
                                      </span>
                                    </div>
                                    
                                    {(comment.user._id === user._id || comment.user === user._id) && (
                                      <button
                                        onClick={() => handleDeleteComment(post._id, comment._id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-red-500"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-slate-800 text-sm">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={() => dispatch(fetchPosts({ page: currentPage + 1 }))}
                  disabled={loading}
                  className="rpg-button-secondary"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Quick Actions */}
          <div className="col-span-12 lg:col-span-3">
            <div className="space-y-4 sticky top-20">
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Erişim</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/map')}
                    className="w-full flex items-center space-x-3 p-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                  >
                    <Map className="w-5 h-5" />
                    <span className="font-medium">Harita</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/quests')}
                    className="w-full flex items-center space-x-3 p-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors"
                  >
                    <Target className="w-5 h-5" />
                    <span className="font-medium">Görevler</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/leaderboard')}
                    className="w-full flex items-center space-x-3 p-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-colors"
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="font-medium">Liderlik</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/guilds')}
                    className="w-full flex items-center space-x-3 p-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Loncalar</span>
                  </button>
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Trend Konular
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-blue-700 text-sm font-semibold">#YeniGörev</p>
                    <p className="text-gray-500 text-xs">125 gönderi</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-purple-700 text-sm font-semibold">#EfsaneLoot</p>
                    <p className="text-gray-500 text-xs">89 gönderi</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-orange-700 text-sm font-semibold">#LoncaSavaşı</p>
                    <p className="text-gray-500 text-xs">67 gönderi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Post Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-200 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4">Gönderiyi Sil</h3>
              <p className="text-slate-600 mb-6">
                Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  className="flex-1 rpg-button-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDeletePost(postToDelete)}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Search Modal */}
      <FriendSearch 
        isOpen={showFriendSearch} 
        onClose={() => setShowFriendSearch(false)} 
      />
      
      {/* DevTools kaldırıldı */}
    </div>
  );
}