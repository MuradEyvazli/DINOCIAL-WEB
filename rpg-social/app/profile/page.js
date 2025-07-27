// app/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Star, 
  Users, 
  MapPin, 
  Calendar,
  Edit,
  Share,
  Award,
  Target,
  Zap,
  Heart,
  MessageCircle,
  RefreshCw,
  Check,
  X,
  Clock,
  UserMinus
} from 'lucide-react';
import { REGIONS } from '@/lib/constants';
import ProfileCard from '@/components/ProfileCard';

// Import Redux actions
import { fetchPosts } from '@/lib/redux/slices/socialSlice';
import { loadUserQuests } from '@/lib/redux/slices/questSlice';
import { loadUser } from '@/lib/redux/slices/authSlice';
import { 
  getUserFriends, 
  getFollowData, 
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  unfollowUser 
} from '@/lib/redux/slices/friendsSlice';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Redux state selectors
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { visitedRegions, achievements, isLoading: gameLoading, gameStats } = useSelector((state) => state.game);
  const { userPosts, isLoading: socialLoading } = useSelector((state) => state.social);
  const { completedQuests, stats: questStats, loading: isLoadingQuests } = useSelector((state) => state.quests);
  const { 
    friends, 
    following, 
    followers, 
    incomingRequests, 
    outgoingRequests,
    stats: friendStats 
  } = useSelector((state) => state.friends);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState(new Set());
  const [removingFriends, setRemovingFriends] = useState(new Set());
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadUserData = async () => {
      try {
        setIsDataLoading(true);
        
        // Load user posts
        await dispatch(fetchPosts({ region: 'all', page: 1, limit: 10, userId: user?.id }));
        
        // Load user quests
        await dispatch(loadUserQuests());
        
        // Load friends and follow data
        await dispatch(getUserFriends());
        await dispatch(getFollowData());
        await dispatch(getFriendRequests());
        
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [dispatch, user, isAuthenticated, router]);

  // Watch for level changes and show celebration
  useEffect(() => {
    if (user && user.level !== undefined) {
      if (previousLevel !== null && user.level > previousLevel) {
        setShowLevelUpCelebration(true);
        setTimeout(() => setShowLevelUpCelebration(false), 4000);
      }
      setPreviousLevel(user.level);
    }
  }, [user?.level, previousLevel]);


  // Also refresh data when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !isDataLoading) {
        // Refresh data when user comes back to tab
        Promise.all([
          dispatch(loadUser()),  // Refresh user data (XP, level, etc.)
          dispatch(fetchPosts({ region: 'all', page: 1, limit: 10, userId: user?.id })),
          dispatch(loadUserQuests()),
          dispatch(getUserFriends()),
          dispatch(getFollowData()),
          dispatch(getFriendRequests())
        ]).catch(error => console.error('Error refreshing data on visibility change:', error));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dispatch, user, isDataLoading]);

  // Get recent achievements (last 10)
  const recentAchievements = achievements.slice(-10).reverse();

  // Get recent posts from userPosts or filter from all posts
  const recentPosts = userPosts.slice(0, 10) || [];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-400/10';
      case 'rare': return 'border-blue-400 bg-blue-400/10';
      case 'epic': return 'border-purple-400 bg-purple-400/10';
      case 'legendary': return 'border-yellow-400 bg-yellow-400/10';
      default: return 'border-gray-400 bg-gray-400/10';
    }
  };

  const getRegionName = (regionId) => {
    const region = REGIONS.find(r => r.id === regionId);
    return region ? region.name : regionId;
  };

  const getRegionIcon = (regionId) => {
    const region = REGIONS.find(r => r.id === regionId);
    return region ? region.icon : '📍';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} saat önce`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} gün önce`;
    }
  };

  // Friend request handlers
  const handleAcceptFriendRequest = async (requestId) => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await dispatch(acceptFriendRequest({ requestId })).unwrap();
      // Refresh friend requests and friends data after successful action
      await Promise.all([
        dispatch(getFriendRequests()),
        dispatch(getUserFriends())
      ]);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      // Show user-friendly error message
      alert('Arkadaşlık isteği kabul edilemedi: ' + (error || 'Bilinmeyen hata'));
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await dispatch(rejectFriendRequest({ requestId })).unwrap();
      // Refresh friend requests after successful action
      await dispatch(getFriendRequests());
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      // Show user-friendly error message
      alert('Arkadaşlık isteği reddedilemedi: ' + (error || 'Bilinmeyen hata'));
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (removingFriends.has(friendId)) return;
    
    // Confirm before removing
    if (!confirm(`${friendName} kullanıcısını arkadaş listenden kaldırmak istediğinize emin misiniz?`)) {
      return;
    }
    
    setRemovingFriends(prev => new Set(prev).add(friendId));
    try {
      // Use unfollowUser since friendship is based on mutual following
      await dispatch(unfollowUser({ userId: friendId })).unwrap();
      // Refresh friends and follow data after successful removal
      await Promise.all([
        dispatch(getUserFriends()),
        dispatch(getFollowData())
      ]);
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Arkadaş kaldırılamadı: ' + (error || 'Bilinmeyen hata'));
    } finally {
      setRemovingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  if (!isAuthenticated || !user || isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-800 text-lg">
            {!isAuthenticated ? 'Yönlendiriliyor...' : 'Profil yükleniyor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-200/30 to-white/30"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Level Up Celebration */}
      {showLevelUpCelebration && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.2, 1],
              opacity: 1,
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 1,
              times: [0, 0.6, 1],
              ease: "easeOut"
            }}
          >
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-2">SEVİYE ATLADIN!</h2>
            <div className="text-6xl font-bold text-yellow-400 mb-4">
              Seviye {user.level}
            </div>
            <p className="text-xl text-white/80">Tebrikler! Yeni yetenekler kazandın!</p>
            
            {/* Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    rotate: 360,
                    y: [-20, -100],
                    x: [0, (Math.random() - 0.5) * 200]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modern Header */}
      <div className="relative z-10">
        <motion.nav 
          className="backdrop-blur-xl bg-white/80 border-b border-blue-200/50 p-6 shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-slate-600 hover:text-slate-800 transition-all duration-300 group"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              <span className="font-medium">Dashboard</span>
            </motion.button>
            
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 bg-clip-text text-transparent"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Karakter Profili
              </motion.h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button 
                className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-slate-600 hover:text-slate-800 transition-all duration-300 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit className="w-5 h-5" />
              </motion.button>
              <motion.button 
                className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-slate-600 hover:text-slate-800 transition-all duration-300 shadow-lg"
                whileHover={{ scale: 1.1, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Share className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.nav>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Profile Section */}
        <motion.div 
          className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-200/50 p-8 mb-12 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-white/20 to-blue-200/20"></div>
          
          <div className="relative flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">
            {/* Character Avatar - Enhanced */}
            <motion.div 
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className={`absolute inset-0 w-40 h-40 rounded-full bg-gradient-to-r ${user.characterClass.color} blur-xl opacity-30 animate-pulse`}></div>
                
                {/* Main Avatar */}
                <div className={`relative w-40 h-40 rounded-full bg-gradient-to-r ${user.characterClass.color} flex items-center justify-center text-6xl border-4 border-white/30 shadow-2xl overflow-hidden`}>
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.username} profil fotoğrafı`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="drop-shadow-lg">{user.characterClass.icon}</span>
                  )}
                </div>
                
                {/* Level Badge */}
                <motion.div 
                  className="absolute -bottom-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white/20"
                  whileHover={{ scale: 1.1 }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {user.level}
                </motion.div>
                
                {/* Status Indicator */}
                <div className="absolute top-2 right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              </div>
            </motion.div>

            {/* Character Info - Enhanced */}
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.h2 
                className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-3"
                whileHover={{ scale: 1.05 }}
              >
                {user.username}
              </motion.h2>
              
              <motion.p 
                className="text-2xl text-blue-600 mb-6 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Seviye {user.level} {user.characterClass.name}
              </motion.p>
              
              <motion.p 
                className="text-slate-600 mb-8 max-w-2xl text-lg leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {user.characterClass.description}
              </motion.p>

              {/* XP Progress - Enhanced */}
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-700 font-medium">Deneyim Puanı</span>
                  <span className="text-blue-600 font-bold text-lg">{user.xp} / {user.level * 100} XP</span>
                </div>
                <div className="h-4 bg-blue-100 rounded-full overflow-hidden backdrop-blur-sm border border-blue-200">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.xp / (user.level * 100)) * 100}%` }}
                    transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
                  >
                    <div className="h-full bg-gradient-to-r from-white/30 to-transparent"></div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Quick Stats - Enhanced */}
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                {[
                  { value: user.stats?.postsCount || userPosts.length || 0, label: "Gönderi", icon: "📝", color: "from-blue-400 to-blue-600" },
                  { value: questStats?.totalCompleted || completedQuests.length || 0, label: "Görev", icon: "🎯", color: "from-blue-500 to-blue-700" },
                  { value: achievements.length || 0, label: "Başarım", icon: "🏆", color: "from-blue-400 to-blue-600" },
                  { value: user.stats?.impactScore || 0, label: "Etki Puanı", icon: "⚡", color: "from-blue-500 to-blue-700" }
                ].map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-blue-200/30 hover:bg-white/80 transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + index * 0.1 }}
                  >
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-slate-600 text-sm font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Modern Tabs */}
        <motion.div 
          className="flex flex-wrap gap-3 mb-12 p-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-blue-200/50 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[
            { id: 'overview', label: 'Genel Bakış', icon: '📊' },
            { id: 'achievements', label: 'Başarımlar', icon: '🏆' },
            { id: 'posts', label: 'Gönderiler', icon: '📝' },
            { id: 'regions', label: 'Bölgeler', icon: '🗺️' },
            { id: 'friends', label: 'Arkadaşlar', icon: '👥' },
            { id: 'requests', label: 'İstekler', icon: '📬', badge: incomingRequests.length }
          ].map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <motion.span 
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {tab.badge}
                </motion.span>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                {/* Character Abilities - Enhanced */}
                <motion.div 
                  className="rounded-3xl bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-xl border-2 border-blue-200/60 p-8 shadow-2xl relative overflow-hidden"
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/40 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative">
                    <motion.h3 
                      className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-8 flex items-center"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div 
                        className="p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 mr-4 shadow-lg"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Star className="w-8 h-8 text-white drop-shadow-lg" />
                      </motion.div>
                      Özel Yetenekler & Ustalıklar
                    </motion.h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {user.characterClass.abilities.map((ability, index) => {
                        const masteryLevel = 75 + index * 5;
                        const abilityColors = [
                          { bg: "from-blue-400 to-blue-500", icon: "from-blue-500 to-blue-600", accent: "blue" },
                          { bg: "from-blue-500 to-blue-600", icon: "from-blue-600 to-blue-700", accent: "blue" },
                          { bg: "from-blue-400 to-blue-600", icon: "from-blue-500 to-blue-700", accent: "blue" },
                          { bg: "from-blue-500 to-blue-700", icon: "from-blue-600 to-blue-800", accent: "blue" }
                        ];
                        const colorScheme = abilityColors[index % abilityColors.length];
                        
                        return (
                          <motion.div 
                            key={index} 
                            className="group relative p-6 rounded-2xl bg-white/80 border-2 border-blue-100/60 hover:border-blue-200 transition-all duration-400 shadow-lg hover:shadow-xl"
                            whileHover={{ scale: 1.03, y: -5, rotateY: 5 }}
                            initial={{ opacity: 0, x: -30, rotateX: 20 }}
                            animate={{ opacity: 1, x: 0, rotateX: 0 }}
                            transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
                          >
                            {/* Floating particles around card */}
                            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                              {[...Array(3)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-1 h-1 bg-gradient-to-r from-blue-300 to-blue-400 rounded-full"
                                  style={{
                                    left: `${20 + i * 30}%`,
                                    top: `${10 + i * 20}%`,
                                  }}
                                  animate={{
                                    y: [0, -10, 0],
                                    opacity: [0.3, 0.8, 0.3],
                                    scale: [1, 1.5, 1],
                                  }}
                                  transition={{
                                    duration: 2 + i,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.5,
                                  }}
                                />
                              ))}
                            </div>
                            
                            {/* Header with Icon and Title */}
                            <div className="flex items-center mb-6">
                              <motion.div 
                                className={`p-3 rounded-xl bg-gradient-to-br ${colorScheme.icon} mr-4 shadow-lg group-hover:shadow-xl`}
                                whileHover={{ rotate: 360, scale: 1.1 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                              >
                                <Zap className="w-6 h-6 text-white drop-shadow-sm" />
                              </motion.div>
                              <div className="flex-1">
                                <h4 className="text-slate-700 font-bold text-xl mb-1">{ability}</h4>
                                <span className={`text-${colorScheme.accent}-600 text-sm font-medium`}>
                                  {masteryLevel >= 90 ? 'Efsanevi' : masteryLevel >= 80 ? 'Uzman' : 'Gelişmekte'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Mastery Progress with Enhanced Design */}
                            <div className="relative mb-4">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-600 font-medium">Ustalık Seviyesi</span>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-${colorScheme.accent}-600 font-bold text-lg`}>{masteryLevel}%</span>
                                  {masteryLevel >= 90 && (
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                      <Trophy className="w-5 h-5 text-amber-500" />
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Custom Progress Bar */}
                              <div className="relative h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner border border-gray-200">
                                <motion.div 
                                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorScheme.bg} rounded-full shadow-lg relative overflow-hidden`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${masteryLevel}%` }}
                                  transition={{ delay: 0.5 + index * 0.15, duration: 1.5, ease: "easeOut" }}
                                >
                                  {/* Animated shine effect */}
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 + index * 0.3 }}
                                  />
                                  
                                  {/* Pulsing glow */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                                </motion.div>
                                
                                {/* Progress indicator dots */}
                                <div className="absolute inset-0 flex items-center justify-between px-1">
                                  {[25, 50, 75].map((milestone) => (
                                    <div
                                      key={milestone}
                                      className={`w-1 h-1 rounded-full ${
                                        masteryLevel >= milestone ? 'bg-white/60' : 'bg-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Ability Stats */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                              <div className="text-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Güç</div>
                                <div className={`text-sm font-bold text-${colorScheme.accent}-600`}>
                                  {Math.floor(masteryLevel * 0.8)}
                                </div>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Hız</div>
                                <div className={`text-sm font-bold text-${colorScheme.accent}-600`}>
                                  {Math.floor(masteryLevel * 0.9)}
                                </div>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Kontrol</div>
                                <div className={`text-sm font-bold text-${colorScheme.accent}-600`}>
                                  {Math.floor(masteryLevel * 0.85)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <Target className="w-6 h-6 text-secondary mr-2" />
                    Son Aktiviteler
                  </h3>
                  <div className="space-y-4">
                    {(() => {
                      const activities = [];
                      
                      // Add recent completed quests
                      completedQuests.slice(0, 2).forEach(quest => {
                        activities.push({
                          type: 'quest',
                          text: `"${quest.title}" görevini tamamladı`,
                          time: quest.completedAt ? formatTimeAgo(new Date(quest.completedAt)) : 'Yakın zamanda',
                          icon: '🎯'
                        });
                      });
                      
                      // Add recent achievements
                      recentAchievements.slice(0, 2).forEach(achievement => {
                        activities.push({
                          type: 'achievement',
                          text: `"${achievement.name}" başarımını kazandı`,
                          time: achievement.unlockedAt ? formatTimeAgo(new Date(achievement.unlockedAt)) : 'Yakın zamanda',
                          icon: achievement.icon || '🏆'
                        });
                      });
                      
                      // Add recent posts
                      recentPosts.slice(0, 2).forEach(post => {
                        const regionName = getRegionName(post.region);
                        activities.push({
                          type: 'post',
                          text: `${regionName}'da gönderi paylaştı`,
                          time: formatTimeAgo(new Date(post.createdAt)),
                          icon: '📝'
                        });
                      });
                      
                      // Sort by time and take first 4
                      return activities.slice(0, 4);
                    })().map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg">
                        <span className="text-2xl">{activity.icon}</span>
                        <div className="flex-1">
                          <p className="text-slate-800">{activity.text}</p>
                          <p className="text-slate-600 text-sm">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                    
                    {(() => {
                      const totalActivities = completedQuests.length + achievements.length + recentPosts.length;
                      return totalActivities === 0;
                    })() && (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-600 text-sm">Henüz aktivite yok</p>
                        <p className="text-slate-500 text-xs mt-1">Görevler ve keşifler yapmaya başla!</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card p-6"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <Award className="w-6 h-6 text-accent mr-2" />
                  Kazanılan Başarımlar ({achievements.length})
                </h3>
                
                {achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Henüz başarım kazanılmamış</p>
                    <p className="text-slate-500 text-sm mt-2">Görevleri tamamlayarak başarımlar kazan!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity || 'common')}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">{achievement.icon || '🏆'}</div>
                          <h4 className="text-slate-800 font-bold mb-1">{achievement.name}</h4>
                          <p className="text-slate-600 text-sm mb-2">{achievement.description}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${getRarityColor(achievement.rarity || 'common')}`}>
                            {(achievement.rarity || 'common').toUpperCase()}
                          </span>
                          <p className="text-slate-600 text-xs mt-2">
                            {achievement.unlockedAt ? formatTimeAgo(new Date(achievement.unlockedAt)) : 'Yeni kazanıldı'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                {socialLoading ? (
                  <div className="glass-card p-12 text-center">
                    <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Gönderiler yükleniyor...</p>
                  </div>
                ) : recentPosts.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Henüz gönderi paylaşılmamış</p>
                    <p className="text-gray-500 text-sm mt-2">İlk gönderini paylaşarak topluluğa katıl!</p>
                  </div>
                ) : (
                  recentPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      className="glass-card p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getRegionIcon(post.region)}</span>
                          <div>
                            <span className="text-purple-400 font-medium">{getRegionName(post.region)}</span>
                            <p className="text-gray-400 text-sm">{formatTimeAgo(new Date(post.createdAt))}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-yellow-400 font-bold">{post.impactScore || 0}</span>
                          <p className="text-gray-400 text-xs">Etki Puanı</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-4">{post.content}</p>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <span className="flex items-center text-red-400">
                          <Heart className="w-4 h-4 mr-1" />
                          {post.interactions?.filter(i => i.type === 'support')?.length || 0}
                        </span>
                        <span className="flex items-center text-blue-400">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments?.length || 0}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* Regions Tab */}
            {activeTab === 'regions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card p-6"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <MapPin className="w-6 h-6 text-green-400 mr-2" />
                  Keşfedilen Bölgeler ({visitedRegions.length}/{REGIONS.length})
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {REGIONS.map((region, index) => {
                    const isVisited = visitedRegions.includes(region.id);
                    
                    return (
                      <motion.div
                        key={region.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isVisited 
                            ? `bg-gradient-to-r ${region.color} bg-opacity-20 border-white/20` 
                            : 'bg-gray-700/20 border-gray-600/50'
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        whileHover={{ scale: isVisited ? 1.05 : 1 }}
                      >
                        <div className="text-center">
                          <div className={`text-4xl mb-2 ${isVisited ? '' : 'grayscale opacity-50'}`}>
                            {region.icon}
                          </div>
                          <h4 className={`font-bold mb-1 ${isVisited ? 'text-white' : 'text-gray-500'}`}>
                            {region.name}
                          </h4>
                          <p className={`text-sm mb-2 ${isVisited ? 'text-gray-300' : 'text-gray-600'}`}>
                            {region.description}
                          </p>
                          {isVisited ? (
                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              KEŞFEDİLDİ
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-gray-500/20 text-gray-500 rounded text-xs">
                              SEVİYE {region.levelRequirement} GEREKLİ
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Friends List */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Users className="w-6 h-6 text-blue-400 mr-2" />
                    Arkadaşlar ({friends.length})
                  </h3>
                  
                  {friends.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Henüz arkadaş eklenmemiş</p>
                      <p className="text-gray-500 text-sm mt-2">Dashboard&apos;dan arkadaş arayabilirsin!</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {friends.map((friend, index) => (
                        <motion.div
                          key={friend._id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <ProfileCard
                                user={friend}
                                currentUser={user}
                                size="md"
                                showLevel={true}
                                showUsername={true}
                                className="flex-1"
                              />
                              <div className="text-right">
                                <p className="text-gray-400 text-sm">
                                  {friend.stats?.impactScore || 0} Etki Puanı
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveFriend(friend._id, friend.username)}
                              disabled={removingFriends.has(friend._id)}
                              className={`p-2 rounded-lg text-sm transition-colors ${
                                removingFriends.has(friend._id)
                                  ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                              }`}
                              title="Arkadaşlıktan Çıkar"
                            >
                              {removingFriends.has(friend._id) ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserMinus className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Following List */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Heart className="w-6 h-6 text-blue-400 mr-2" />
                    Takip Edilenler ({following.length})
                  </h3>
                  
                  {following.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Henüz kimse takip edilmiyor</p>
                      <p className="text-gray-500 text-sm mt-2">İlginç kullanıcıları takip etmeye başla!</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {following.map((user, index) => (
                        <motion.div
                          key={user._id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-500/30 transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ProfileCard
                            user={user}
                            currentUser={user}
                            size="md"
                            showLevel={true}
                            showUsername={true}
                            className="w-full"
                          />
                          <div className="mt-2 text-center">
                            <p className="text-gray-400 text-sm">
                              {user.stats?.impactScore || 0} Etki Puanı
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Followers List */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Star className="w-6 h-6 text-blue-400 mr-2" />
                    Takipçiler ({followers.length})
                  </h3>
                  
                  {followers.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Henüz takipçi yok</p>
                      <p className="text-gray-500 text-sm mt-2">Etkileyici içerikler paylaş!</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {followers.map((follower, index) => (
                        <motion.div
                          key={follower._id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-500/30 transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ProfileCard
                            user={follower}
                            currentUser={user}
                            size="md"
                            showLevel={true}
                            showUsername={true}
                            className="w-full"
                          />
                          <div className="mt-2 text-center">
                            <p className="text-gray-400 text-sm">
                              {follower.stats?.impactScore || 0} Etki Puanı
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Incoming Friend Requests */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Users className="w-6 h-6 text-blue-400 mr-2" />
                    Gelen Arkadaşlık İstekleri ({incomingRequests.length})
                  </h3>
                  
                  {incomingRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Yeni arkadaşlık isteği yok</p>
                      <p className="text-gray-500 text-sm mt-2">Yeni istekler burada görünecek</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {incomingRequests.map((request, index) => (
                        <motion.div
                          key={request._id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-500/30 transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <ProfileCard
                                user={request.sender}
                                currentUser={user}
                                size="lg"
                                showLevel={true}
                                showUsername={true}
                                className="flex-1"
                              />
                              <div className="text-right">
                                <p className="text-gray-400 text-sm">
                                  {request.sender.stats?.impactScore || 0} Etki Puanı
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {formatTimeAgo(new Date(request.createdAt))}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleAcceptFriendRequest(request._id)}
                                disabled={processingRequests.has(request._id)}
                                className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                                  processingRequests.has(request._id)
                                    ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                }`}
                              >
                                {processingRequests.has(request._id) ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span>{processingRequests.has(request._id) ? 'İşleniyor...' : 'Kabul Et'}</span>
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(request._id)}
                                disabled={processingRequests.has(request._id)}
                                className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                                  processingRequests.has(request._id)
                                    ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                }`}
                              >
                                {processingRequests.has(request._id) ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                <span>{processingRequests.has(request._id) ? 'İşleniyor...' : 'Reddet'}</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing Friend Requests */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Clock className="w-6 h-6 text-blue-400 mr-2" />
                    Gönderilen İstekler ({outgoingRequests.length})
                  </h3>
                  
                  {outgoingRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Bekleyen istek yok</p>
                      <p className="text-gray-500 text-sm mt-2">Gönderdiğin istekler burada görünecek</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {outgoingRequests.map((request, index) => (
                        <motion.div
                          key={request._id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <ProfileCard
                                user={request.recipient}
                                currentUser={user}
                                size="md"
                                showLevel={true}
                                showUsername={true}
                                className="flex-1"
                              />
                              <div className="text-right">
                                <p className="text-gray-400 text-sm">
                                  {formatTimeAgo(new Date(request.createdAt))}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm">
                              <Clock className="w-4 h-4" />
                              <span>Bekliyor</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Modern Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Enhanced Character Stats */}
            <motion.div 
              className="rounded-3xl bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-xl border-2 border-blue-200/60 p-8 shadow-2xl relative overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-300/30 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/30 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="relative">
                <motion.h3 
                  className="text-2xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-8 flex items-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div 
                    className="p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 mr-4 shadow-lg"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <Trophy className="w-7 h-7 text-white drop-shadow-lg" />
                  </motion.div>
                  Karakter İstatistikleri
                </motion.h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { 
                      label: "Toplam Gönderi", 
                      value: user.stats?.postsCount || userPosts.length || 0, 
                      icon: "📝", 
                      color: "blue",
                      bg: "from-blue-400 to-blue-500",
                      description: "Paylaştığın toplam içerik"
                    },
                    { 
                      label: "Toplam Yorum", 
                      value: user.stats?.commentsCount || 0, 
                      icon: "💬", 
                      color: "blue",
                      bg: "from-blue-500 to-blue-600",
                      description: "Yaptığın toplam yorum"
                    },
                    { 
                      label: "Verilen Beğeni", 
                      value: user.stats?.likesGiven || 0, 
                      icon: "👍", 
                      color: "blue",
                      bg: "from-blue-400 to-blue-600",
                      description: "Başkalarına verdiğin beğeni"
                    },
                    { 
                      label: "Alınan Beğeni", 
                      value: user.stats?.likesReceived || 0, 
                      icon: "❤️", 
                      color: "blue",
                      bg: "from-blue-500 to-blue-700",
                      description: "Aldığın toplam beğeni"
                    },
                    { 
                      label: "Tamamlanan Görev", 
                      value: questStats?.totalCompleted || completedQuests.length || 0, 
                      icon: "🎯", 
                      color: "blue",
                      bg: "from-blue-400 to-blue-600",
                      description: "Başarıyla tamamladığın görevler"
                    },
                    { 
                      label: "Toplam Etki Puanı", 
                      value: user.stats?.impactScore || questStats?.totalXpEarned || 0, 
                      icon: "⚡", 
                      color: "blue",
                      bg: "from-blue-600 to-blue-700",
                      description: "Toplam kazandığın etki puanı"
                    },
                    { 
                      label: "Keşfedilen Bölge", 
                      value: visitedRegions.length || 1, 
                      icon: "🗺️", 
                      color: "blue",
                      bg: "from-blue-400 to-blue-500",
                      description: "Keşfettiğin farklı bölgeler"
                    },
                    { 
                      label: "Arkadaş Sayısı", 
                      value: friendStats.friendsCount || 0, 
                      icon: "👥", 
                      color: "blue",
                      bg: "from-blue-500 to-blue-600",
                      description: "Karşılıklı arkadaşlarının sayısı"
                    },
                    { 
                      label: "Takipçi Sayısı", 
                      value: friendStats.followersCount || 0, 
                      icon: "👋", 
                      color: "blue",
                      bg: "from-blue-400 to-blue-700",
                      description: "Seni takip eden kişi sayısı"
                    },
                    { 
                      label: "Takip Edilen", 
                      value: friendStats.followingCount || 0, 
                      icon: "🔔", 
                      color: "blue",
                      bg: "from-blue-500 to-blue-600",
                      description: "Takip ettiğin kişi sayısı"
                    }
                  ].map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      className="group relative p-4 rounded-2xl bg-white/70 border-2 border-blue-100/50 hover:border-blue-200/80 transition-all duration-300 shadow-lg hover:shadow-xl"
                      whileHover={{ 
                        scale: 1.02, 
                        x: 5,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.08, duration: 0.5 }}
                    >
                      {/* Animated background glow */}
                      <motion.div 
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                        initial={false}
                        animate={{ opacity: [0, 0.05, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Icon with animated background */}
                          <motion.div 
                            className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} shadow-lg group-hover:shadow-xl`}
                            whileHover={{ 
                              rotate: [0, -10, 10, 0],
                              scale: 1.1 
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <span className="text-xl drop-shadow-sm">{stat.icon}</span>
                          </motion.div>
                          
                          {/* Text content */}
                          <div className="flex-1">
                            <h4 className="text-slate-700 font-bold text-lg mb-1">
                              {stat.label}
                            </h4>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              {stat.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Value with enhanced styling */}
                        <div className="text-right ml-4">
                          <motion.div 
                            className={`text-3xl font-bold bg-gradient-to-r ${stat.bg} bg-clip-text text-transparent mb-1`}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {stat.value}
                          </motion.div>
                          <div className="flex items-center justify-end space-x-1">
                            {/* Progress indicator */}
                            <div className="flex space-x-1">
                              {[...Array(3)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${stat.bg}`}
                                  animate={{ 
                                    opacity: [0.3, 1, 0.3],
                                    scale: [1, 1.2, 1]
                                  }}
                                  transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity, 
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover effect line */}
                      <motion.div 
                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.bg} rounded-full`}
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  ))}
                </div>
                
                {/* Summary section */}
                <motion.div 
                  className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-rose-50 border-2 border-rose-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                >
                  <h4 className="text-lg font-bold text-slate-700 mb-3 flex items-center">
                    <span className="text-2xl mr-2">📊</span>
                    Performans Özeti
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Toplam Aktivite:</span>
                      <span className="font-bold text-slate-700">
                        {(user.stats?.postsCount || 0) + (user.stats?.commentsCount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sosyal Ağ:</span>
                      <span className="font-bold text-slate-700">
                        {(friendStats.friendsCount || 0) + (friendStats.followersCount || 0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Zap className="w-6 h-6 text-blue-400 mr-3" />
                Hızlı İşlemler
              </h3>
              
              <div className="space-y-3">
                {[
                  { label: "Dashboard'a Git", icon: "🏠", action: () => router.push('/dashboard'), color: "from-purple-500 to-pink-500" },
                  { label: "Görevleri Görüntüle", icon: "🎯", action: () => router.push('/quests'), color: "from-blue-500 to-cyan-500" },
                  { label: "Haritayı Aç", icon: "🗺️", action: () => router.push('/map'), color: "from-green-500 to-emerald-500" },
                  { label: "Ayarlar", icon: "⚙️", action: () => {}, color: "from-gray-500 to-slate-500" }
                ].map((item, index) => (
                  <motion.button 
                    key={item.label}
                    onClick={item.action}
                    className={`w-full p-4 rounded-xl bg-gradient-to-r ${item.color} bg-opacity-20 border border-white/10 hover:border-white/20 text-white font-medium transition-all duration-300 flex items-center space-x-3 group`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}