// app/leaderboard/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Star, 
  Zap, 
  Target, 
  Users, 
  TrendingUp,
  Medal,
  Award,
  Flame,
  Calendar,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Loader,
  ArrowRight,
  Shield
} from 'lucide-react';
import { fetchLeaderboard, setCategory, setTimeframe, setSearchQuery, clearError } from '@/lib/redux/slices/leaderboardSlice';

export default function LeaderboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { 
    rankings, 
    userRank, 
    currentCategory, 
    currentTimeframe, 
    searchQuery: reduxSearchQuery,
    totalUsers,
    isLoading, 
    error,
    pagination
  } = useSelector((state) => state.leaderboard);
  
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showMyRank, setShowMyRank] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Custom number formatter
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Debounced search functionality
  const debouncedSearch = useCallback((query) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      dispatch(setSearchQuery(query));
    }, 500);
    
    setSearchTimeout(timeout);
  }, [dispatch, searchTimeout]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
    debouncedSearch(query);
  };

  // Fetch leaderboard data
  useEffect(() => {
    dispatch(fetchLeaderboard({
      category: currentCategory,
      timeframe: currentTimeframe,
      search: reduxSearchQuery,
      page: 1
    }));
  }, [dispatch, currentCategory, currentTimeframe, reduxSearchQuery]);

  // Load more functionality
  const loadMore = () => {
    if (!isLoading && pagination.hasMore) {
      dispatch(fetchLeaderboard({
        category: currentCategory,
        timeframe: currentTimeframe,
        search: reduxSearchQuery,
        page: pagination.currentPage + 1
      }));
    }
  };

  const categories = [
    { id: 'xp', name: 'Deneyim Puanı', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'level', name: 'Seviye', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'posts', name: 'Gönderiler', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'quests', name: 'Görevler', icon: Target, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { id: 'impact', name: 'Etki Puanı', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 'guilds', name: 'Loncalar', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' }
  ];

  const timeframes = [
    { id: 'all', name: 'Tüm Zamanlar' },
    { id: 'month', name: 'Bu Ay' },
    { id: 'week', name: 'Bu Hafta' },
    { id: 'today', name: 'Bugün' }
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-amber-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-500" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <span className="text-gray-600 font-bold text-lg">#{rank}</span>;
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-slate-500';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-amber-500';
    if (rank <= 10) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (rank <= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    return 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <span className="text-gray-400">-</span>;
  };

  const formatValue = (value, category) => {
    switch (category) {
      case 'xp':
      case 'impact':
        return formatNumber(value);
      case 'level':
        return `Seviye ${value}`;
      case 'posts':
      case 'quests':
        return `${value} tane`;
      default:
        return value.toString();
    }
  };

  const displayedRankings = rankings || [];

  const handleCategoryChange = (categoryId) => {
    dispatch(setCategory(categoryId));
  };

  const handleTimeframeChange = (timeframeId) => {
    dispatch(setTimeframe(timeframeId));
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchLeaderboard({
      category: currentCategory,
      timeframe: currentTimeframe,
      search: reduxSearchQuery,
      page: 1
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Liderlik Tablosu
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              En başarılı kullanıcıları keşfet ve kendi sıralamandaki yerini gör
            </p>
            {totalUsers > 0 && (
              <div className="mt-4 inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 text-sm font-medium">
                  {totalUsers} kullanıcı yarışıyor
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <motion.div 
            className="bg-white rounded-xl shadow-sm border border-red-200 p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-red-600 font-bold">Bir hata oluştu</h3>
                  <p className="text-gray-600 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                Tekrar Dene
              </button>
            </div>
          </motion.div>
        )}

        {/* Category Selector */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`p-4 rounded-xl transition-all duration-200 border-2 ${
                  currentCategory === category.id
                    ? `${category.bg} ${category.border} ${category.color}`
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <category.icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">{category.name}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Timeframe Selector */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Zaman Aralığı</h3>
              <div className="flex space-x-2">
                {timeframes.map((timeframe) => (
                  <button
                    key={timeframe.id}
                    onClick={() => handleTimeframeChange(timeframe.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentTimeframe === timeframe.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {timeframe.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and My Rank */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 w-48 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isLoading && localSearchQuery && (
                  <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                )}
              </div>

              <button
                onClick={() => setShowMyRank(!showMyRank)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>Benim Sıram</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* User's Current Rank */}
        <AnimatePresence>
          {showMyRank && isAuthenticated && userRank && (
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${user?.characterClass?.color || 'from-blue-500 to-purple-500'} flex items-center justify-center border-2 border-blue-200 overflow-hidden`}>
                      {user?.avatar || user?.avatarUrls?.medium ? (
                        <img 
                          src={user.avatarUrls?.medium || user.avatar} 
                          alt={`${user.username} profil fotoğrafı`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{user?.characterClass?.icon || '👤'}</span>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      #{userRank.rank}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg">Senin Sıran</h3>
                    <p className="text-gray-600">{formatValue(userRank.value, currentCategory)}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {getChangeIcon(userRank.change)}
                      <span className={`text-sm font-medium ${
                        userRank.change > 0 ? 'text-green-600' : 
                        userRank.change < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {userRank.change !== 0 ? `${Math.abs(userRank.change)} ${userRank.change > 0 ? 'yükseldi' : 'düştü'}` : 'Değişim yok'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => router.push('/profile')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Profili Gör</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not authenticated message */}
        <AnimatePresence>
          {showMyRank && !isAuthenticated && (
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-amber-600 font-bold">Sıralamayı görmek için giriş yap</h3>
                    <p className="text-gray-600 text-sm">Kendi sıralamandaki yerini görmek için hesabına giriş yapmalısın.</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                >
                  Giriş Yap
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top 3 Podium */}
        {displayedRankings.length >= 3 && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Top 3 Liderler</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* 2nd Place */}
                {displayedRankings[1] && (
                  <motion.div 
                    className="order-1 md:order-1"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <div 
                      className="bg-gray-50 rounded-xl p-6 text-center h-80 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300"
                      onClick={() => router.push(`/user/${displayedRankings[1].user.id}`)}
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-slate-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Medal className="w-8 h-8 text-white" />
                      </div>
                      <div className={`w-20 h-20 rounded-xl bg-gradient-to-r ${displayedRankings[1].user.characterClass?.color || 'from-gray-500 to-slate-600'} flex items-center justify-center mx-auto mb-4 border-2 border-gray-300 overflow-hidden`}>
                        {displayedRankings[1].user.avatar ? (
                          <img 
                            src={displayedRankings[1].user.avatar} 
                            alt={`${displayedRankings[1].user.username} profil fotoğrafı`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{displayedRankings[1].user.characterClass?.icon || '👤'}</span>
                        )}
                      </div>
                      <div className="inline-flex items-center px-3 py-1 bg-gray-200 rounded-full mb-3">
                        <span className="text-gray-700 font-bold text-sm">#2</span>
                      </div>
                      <h3 className="text-gray-900 font-bold text-lg mb-1">{displayedRankings[1].user.username}</h3>
                      <p className="text-gray-600 text-sm mb-3">Seviye {displayedRankings[1].user.level}</p>
                      <p className="text-2xl font-bold text-gray-800 mb-3">{formatValue(displayedRankings[1].value, currentCategory)}</p>
                      <div className="flex items-center justify-center space-x-1 bg-orange-50 rounded-lg px-3 py-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600 text-sm font-medium">{displayedRankings[1].streak} gün</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 1st Place */}
                {displayedRankings[0] && (
                  <motion.div 
                    className="order-2 md:order-2"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div 
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 text-center h-96 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-amber-200 relative"
                      onClick={() => router.push(`/user/${displayedRankings[0].user.id}`)}
                    >
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Crown className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Crown className="w-10 h-10 text-white" />
                      </div>
                      <div className={`w-24 h-24 rounded-xl bg-gradient-to-r ${displayedRankings[0].user.characterClass?.color || 'from-amber-500 to-yellow-600'} flex items-center justify-center mx-auto mb-4 border-4 border-amber-400 overflow-hidden shadow-lg`}>
                        {displayedRankings[0].user.avatar ? (
                          <img 
                            src={displayedRankings[0].user.avatar} 
                            alt={`${displayedRankings[0].user.username} profil fotoğrafı`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{displayedRankings[0].user.characterClass?.icon || '👤'}</span>
                        )}
                      </div>
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full mb-3 text-white shadow-lg">
                        <Crown className="w-4 h-4 mr-1" />
                        <span className="font-bold text-sm">ŞAMPİYON</span>
                      </div>
                      <h3 className="text-gray-900 font-bold text-xl mb-1">{displayedRankings[0].user.username}</h3>
                      <p className="text-amber-700 mb-3">Seviye {displayedRankings[0].user.level}</p>
                      <p className="text-3xl font-bold text-amber-600 mb-3">{formatValue(displayedRankings[0].value, currentCategory)}</p>
                      <div className="flex items-center justify-center space-x-1 bg-orange-50 rounded-lg px-3 py-1 mb-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600 text-sm font-medium">{displayedRankings[0].streak} gün</span>
                      </div>
                      <div className="flex justify-center">
                        <div className="flex items-center space-x-1 bg-amber-100 rounded-lg px-3 py-1">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-600 text-xs font-medium">EFSANE</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {displayedRankings[2] && (
                  <motion.div 
                    className="order-3 md:order-3"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div 
                      className="bg-orange-50 rounded-xl p-6 text-center h-80 cursor-pointer hover:shadow-lg transition-all duration-300 border border-orange-200 hover:border-orange-300"
                      onClick={() => router.push(`/user/${displayedRankings[2].user.id}`)}
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div className={`w-20 h-20 rounded-xl bg-gradient-to-r ${displayedRankings[2].user.characterClass?.color || 'from-orange-500 to-amber-600'} flex items-center justify-center mx-auto mb-4 border-2 border-orange-400 overflow-hidden`}>
                        {displayedRankings[2].user.avatar ? (
                          <img 
                            src={displayedRankings[2].user.avatar} 
                            alt={`${displayedRankings[2].user.username} profil fotoğrafı`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{displayedRankings[2].user.characterClass?.icon || '👤'}</span>
                        )}
                      </div>
                      <div className="inline-flex items-center px-3 py-1 bg-orange-200 rounded-full mb-3">
                        <span className="text-orange-700 font-bold text-sm">#3</span>
                      </div>
                      <h3 className="text-gray-900 font-bold text-lg mb-1">{displayedRankings[2].user.username}</h3>
                      <p className="text-gray-600 text-sm mb-3">Seviye {displayedRankings[2].user.level}</p>
                      <p className="text-2xl font-bold text-gray-800 mb-3">{formatValue(displayedRankings[2].value, currentCategory)}</p>
                      <div className="flex items-center justify-center space-x-1 bg-orange-100 rounded-lg px-3 py-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600 text-sm font-medium">{displayedRankings[2].streak} gün</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Rankings List */}
        {displayedRankings.length > 3 && (
          <motion.div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Tam Sıralama</h2>
              <p className="text-gray-600 text-sm mt-1">Tüm kullanıcıların sıralaması</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {displayedRankings.slice(3).map((item, index) => (
                <motion.div
                  key={item.user.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => router.push(`/user/${item.user.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg ${getRankBadge(item.rank)} flex items-center justify-center text-white font-bold text-sm`}>
                        {item.rank}
                      </div>
                      
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${item.user.characterClass?.color || 'from-gray-500 to-slate-600'} flex items-center justify-center border-2 border-gray-200 overflow-hidden`}>
                        {item.user.avatar ? (
                          <img 
                            src={item.user.avatar} 
                            alt={`${item.user.username} profil fotoğrafı`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{item.user.characterClass?.icon || '👤'}</span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-gray-900 font-bold">{item.user.username}</h3>
                        <p className="text-gray-600 text-sm">Seviye {item.user.level} • {item.user.characterClass?.name || 'Kullanıcı'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-gray-900 font-bold">{formatValue(item.value, currentCategory)}</div>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-orange-600 text-xs font-medium">{item.streak} gün</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                        {getChangeIcon(item.change)}
                        <span className={`text-sm font-medium ${
                          item.change > 0 ? 'text-green-600' : 
                          item.change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {item.change !== 0 ? Math.abs(item.change) : '-'}
                        </span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Load More */}
            {pagination.hasMore && (
              <div className="p-4 border-t border-gray-200 text-center">
                <button 
                  onClick={loadMore}
                  disabled={isLoading}
                  className="flex items-center space-x-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Daha Fazla Yükle</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && displayedRankings.length === 0 && (
          <motion.div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Liderlik tablosu yükleniyor...</h3>
            <p className="text-gray-600">En başarılı kullanıcılar geliyor!</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && displayedRankings.length === 0 && !error && (
          <motion.div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {reduxSearchQuery ? 'Sonuç bulunamadı' : 'Henüz lider yok'}
            </h3>
            <p className="text-gray-600 mb-6">
              {reduxSearchQuery 
                ? 'Arama kriterlerine uygun kullanıcı bulunamadı.' 
                : 'İlk lider olmak için maceraya başla!'
              }
            </p>
            {reduxSearchQuery && (
              <button
                onClick={() => {
                  setLocalSearchQuery('');
                  dispatch(setSearchQuery(''));
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Aramayı Temizle
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}