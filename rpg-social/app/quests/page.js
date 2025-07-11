// app/quests/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Target, 
  Star, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Zap,
  Calendar,
  Filter,
  Plus,
  Gift,
  Loader
} from 'lucide-react';
import { 
  fetchQuests, 
  startQuest,
  updateQuestProgress,
  setFilter,
  setSelectedQuest 
} from '@/lib/redux/slices/questSlice';

export default function QuestsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { 
    activeQuests, 
    availableQuests, 
    completedQuests, 
    loading, 
    startLoading, 
    progressLoading,
    userLevel,
    totalXP,
    stats,
    filter,
    selectedQuest,
    questNotification 
  } = useSelector((state) => state.quests);
  
  const [activeTab, setActiveTab] = useState('active');
  const [showQuestCompleteAnimation, setShowQuestCompleteAnimation] = useState(false);
  const [completedQuestData, setCompletedQuestData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch quests on component mount
    dispatch(fetchQuests({ type: 'all' }));
  }, [isAuthenticated, router, dispatch]);

  // Watch for quest completion notifications
  useEffect(() => {
    if (questNotification && questNotification.type === 'quest_completed') {
      setCompletedQuestData(questNotification);
      setShowQuestCompleteAnimation(true);
      setTimeout(() => setShowQuestCompleteAnimation(false), 5000);
    }
  }, [questNotification]);

  const handleStartQuest = async (questId) => {
    try {
      await dispatch(startQuest({ questId })).unwrap();
    } catch (error) {
      console.error('Start quest error:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      case 'legendary': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'social': return '👥';
      case 'exploration': return '🗺️';
      case 'creativity': return '🎨';
      case 'challenge': return '⚔️';
      default: return '📋';
    }
  };

  const calculateProgress = (quest) => {
    if (!quest.requirements) return 0;
    
    if (quest.userProgress && quest.userProgress.progressPercent !== undefined) {
      return quest.userProgress.progressPercent;
    }
    
    const totalRequirements = quest.requirements.length;
    let completedRequirements = 0;
    
    quest.requirements.forEach(req => {
      const currentProgress = quest.userProgress?.progress?.[req.type] || 0;
      if (currentProgress >= req.target) {
        completedRequirements++;
      }
    });
    
    return (completedRequirements / totalRequirements) * 100;
  };

  const isQuestCompleted = (quest) => {
    return quest.isCompleted || quest.userProgress?.status === 'completed';
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) return 'Süresi doldu';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}s ${minutes}d`;
    }
    return `${minutes}d`;
  };

  const filteredActiveQuests = activeQuests.filter(quest => {
    if (filter === 'all') return true;
    return quest.type === filter;
  });

  const filteredAvailableQuests = availableQuests.filter(quest => {
    if (filter === 'all') return true;
    return quest.type === filter;
  });

  const filteredCompletedQuests = completedQuests.filter(quest => {
    if (filter === 'all') return true;
    return quest.type === filter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center">
        <motion.div 
          className="text-center space-y-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Animated Logo/Icon */}
          <motion.div
            className="relative w-24 h-24 mx-auto"
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full opacity-20 blur-xl"></div>
            <Target className="w-24 h-24 text-purple-400 relative z-10" />
          </motion.div>

          {/* Animated Loading Text */}
          <div className="space-y-4">
            <motion.h2 
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ 
                backgroundSize: '200% 200%'
              }}
            >
              Görevler yükleniyor...
            </motion.h2>
            
            {/* Animated dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-purple-400 rounded-full"
                  animate={{
                    y: [-10, 0, -10],
                    opacity: [0.4, 1, 0.4]
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

            {/* Progress bar */}
            <div className="w-64 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full"
                animate={{ 
                  x: ['-100%', '100%'] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
            
            <motion.p 
              className="text-slate-600 text-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Görev listesi hazırlanıyor...
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Quest Completion Celebration */}
      {showQuestCompleteAnimation && completedQuestData && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center max-w-md mx-auto p-8"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ 
              scale: [0.5, 1.1, 1],
              opacity: 1,
              y: [50, -10, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 1.2,
              times: [0, 0.6, 1],
              ease: "easeOut"
            }}
          >
            {/* Main Celebration Icon */}
            <motion.div
              className="text-8xl mb-4"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 15, -15, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎯
            </motion.div>
            
            <motion.h2 
              className="text-4xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              GÖREV TAMAMLANDI!
            </motion.h2>
            
            <motion.div 
              className="text-3xl font-bold text-green-400 mb-4"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
            >
              {completedQuestData.quest?.title || 'Görev'}
            </motion.div>
            
            {/* Rewards Display */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-white text-xl mb-2">Ödüller</h3>
              <div className="flex justify-center space-x-4">
                {completedQuestData.quest?.rewards?.xp && (
                  <div className="text-center">
                    <div className="text-2xl">⭐</div>
                    <div className="text-yellow-400 font-bold">+{completedQuestData.quest.rewards.xp} XP</div>
                  </div>
                )}
                {completedQuestData.quest?.rewards?.coins && (
                  <div className="text-center">
                    <div className="text-2xl">🪙</div>
                    <div className="text-yellow-400 font-bold">+{completedQuestData.quest.rewards.coins} Coin</div>
                  </div>
                )}
                {completedQuestData.quest?.rewards?.badge && (
                  <div className="text-center">
                    <div className="text-2xl">🏆</div>
                    <div className="text-purple-400 font-bold">Rozet</div>
                  </div>
                )}
              </div>
            </motion.div>
            
            <motion.p 
              className="text-xl text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Tebrikler! Yeni görevler seni bekliyor!
            </motion.p>
            
            {/* Celebration Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFA726'][i % 6],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    rotate: 360,
                    y: [-30, -120],
                    x: [0, (Math.random() - 0.5) * 150]
                  }}
                  transition={{ 
                    duration: 3,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
            
            {/* Stars */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute text-yellow-300 text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: 0.5 + i * 0.2,
                  ease: "easeInOut"
                }}
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="w-6 h-6 text-blue-600 mr-2" />
              Görev Merkezi
            </h1>
            
            <div className="text-right">
              <div className="text-gray-900 font-medium">{user?.username}</div>
              <div className="text-gray-500 text-sm">Seviye {userLevel || user?.level || 1}</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{stats.activeCount || 0}</div>
            <div className="text-gray-500 text-sm">Aktif Görev</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{stats.completedCount || 0}</div>
            <div className="text-gray-500 text-sm">Tamamlanan</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Calendar className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {stats.dailyQuests || 0}
            </div>
            <div className="text-gray-500 text-sm">Günlük Görev</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {totalXP || user?.xp || 0}
            </div>
            <div className="text-gray-500 text-sm">Toplam XP</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Quest List */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex space-x-2 mb-6 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                  activeTab === 'active' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aktif ({activeQuests.length})
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                  activeTab === 'available' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mevcut ({availableQuests.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                  activeTab === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tamamlanan ({completedQuests.length})
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => dispatch(setFilter(e.target.value))}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Türler</option>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="achievement">Başarım</option>
                <option value="social">Sosyal</option>
                <option value="content">İçerik</option>
              </select>
            </div>

            {/* Quest Cards */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Görevler yükleniyor...</p>
                </div>
              ) : (
                <>
                  {/* Active Quests */}
                  {activeTab === 'active' && filteredActiveQuests.map((quest, index) => (
                    <div
                      key={quest._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => dispatch(setSelectedQuest(quest))}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-2xl mr-3">{getTypeIcon(quest.type)}</span>
                            <h3 className="text-gray-900 font-bold text-lg">{quest.title}</h3>
                            {quest.type === 'daily' && (
                              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                                GÜNLÜK
                              </span>
                            )}
                            {quest.type === 'weekly' && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                HAFTALIK
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-3">{quest.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              quest.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              quest.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              quest.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {quest.difficulty.toUpperCase()}
                            </span>
                            <span className="text-blue-600 flex items-center font-medium">
                              <Zap className="w-4 h-4 mr-1" />
                              +{quest.rewards.xp} XP
                            </span>
                            {quest.userProgress?.expiresAt && (
                              <span className="text-red-600 flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {getTimeRemaining(quest.userProgress.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <div className={`text-sm mb-2 font-medium ${
                            isQuestCompleted(quest) ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {Math.round(calculateProgress(quest))}% Tamamlandı
                          </div>
                          
                          <div className="w-32 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300" 
                              style={{ width: `${calculateProgress(quest)}%` }}
                            ></div>
                          </div>
                          
                          {isQuestCompleted(quest) && (
                            <button className="mt-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors">
                              Ödül Al
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Requirements */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {quest.requirements.map((req, reqIndex) => {
                          const currentProgress = quest.userProgress?.progress?.[req.type] || 0;
                          const progressPercent = (currentProgress / req.target) * 100;
                          
                          return (
                            <div key={reqIndex} className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">{req.description}</span>
                                <span className="text-gray-500 font-medium">{currentProgress}/{req.target}</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Available Quests */}
                  {activeTab === 'available' && filteredAvailableQuests.map((quest, index) => (
                    <motion.div
                      key={quest._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <span className="text-2xl mr-3">{getTypeIcon(quest.type)}</span>
                            <h3 className="text-gray-900 font-bold text-lg">{quest.title}</h3>
                            {quest.type === 'daily' && (
                              <span className="ml-2 px-2 py-1 bg-yellow-50 text-yellow-600 text-xs rounded border border-yellow-200">
                                GÜNLÜK
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-4">{quest.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              quest.difficulty === 'easy' ? 'bg-green-50 text-green-700 border border-green-200' :
                              quest.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              quest.difficulty === 'hard' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {quest.difficulty.toUpperCase()}
                            </span>
                            <span className="text-blue-600 flex items-center font-medium">
                              <Zap className="w-4 h-4 mr-1" />
                              +{quest.rewards.xp} XP
                            </span>
                            {quest.rewards.badge && (
                              <span className="text-amber-600 flex items-center font-medium">
                                <Trophy className="w-4 h-4 mr-1" />
                                {quest.rewards.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <button
                            onClick={() => handleStartQuest(quest._id)}
                            disabled={startLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {startLoading ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Başlat
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Requirements Preview */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Gereksinimler:</h4>
                        <div className="space-y-1">
                          {quest.requirements.map((req, reqIndex) => (
                            <div key={reqIndex} className="flex items-center text-sm text-gray-600">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                              <span>{req.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Completed Quests */}
                  {activeTab === 'completed' && filteredCompletedQuests.map((quest, index) => (
                    <motion.div
                      key={quest._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <span className="text-2xl mr-3">{getTypeIcon(quest.type)}</span>
                            <h3 className="text-gray-900 font-bold text-lg">{quest.title}</h3>
                            <div className="ml-2 flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Tamamlandı
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{quest.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-green-600 flex items-center font-medium">
                              <Trophy className="w-4 h-4 mr-1" />
                              +{quest.rewards.xp} XP Kazanıldı
                            </span>
                            <span className="text-gray-500">
                              {quest.userProgress?.completedAt ? new Date(quest.userProgress.completedAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                            </span>
                            {quest.rewards.badge && (
                              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs flex items-center border border-purple-200">
                                <Trophy className="w-3 h-3 mr-1" />
                                {quest.rewards.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Daily Quests Timer */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-6 h-6 text-amber-500 mr-2" />
                Günlük Görevler
              </h3>
              
              <div className="text-center mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-2xl font-bold text-amber-600">
                  {getTimeRemaining(new Date(Date.now() + 24 * 60 * 60 * 1000))}
                </div>
                <div className="text-gray-600 text-sm">Yenilenmesine</div>
              </div>
              
              <div className="space-y-3">
                {activeQuests.filter(q => q.type === 'daily').map((quest) => (
                  <div key={quest._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-700 text-sm font-medium">{quest.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isQuestCompleted(quest) ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {Math.round(calculateProgress(quest))}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isQuestCompleted(quest) ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${calculateProgress(quest)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quest Categories */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Görev Kategorileri</h3>
              
              <div className="space-y-2">
                {[
                  { key: 'Tümü', type: 'all', icon: '📋' },
                  { key: 'Günlük', type: 'daily', icon: '📅' },
                  { key: 'Haftalık', type: 'weekly', icon: '📆' },
                  { key: 'Başarım', type: 'achievement', icon: '🏆' },
                  { key: 'Sosyal', type: 'social', icon: '👥' },
                  { key: 'İçerik', type: 'content', icon: '✍️' }
                ].map(({ key, type, icon }) => {
                  const allQuests = [...activeQuests, ...availableQuests, ...completedQuests];
                  const questCount = type === 'all' ? allQuests.length : allQuests.filter(q => q.type === type).length;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => dispatch(setFilter(type))}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        filter === type 
                          ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{icon}</span>
                          <span className="font-medium">{key}</span>
                        </div>
                        <span className="text-sm bg-white rounded-full px-2 py-1 border border-gray-200">{questCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Quest Shop */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Gift className="w-6 h-6 text-pink-500 mr-2" />
                Görev Mağazası
              </h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 font-medium">XP Boost</span>
                    <span className="text-amber-600 font-bold">500 XP</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">1 saat boyunca %50 daha fazla XP kazan</p>
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    Satın Al
                  </button>
                </div>
                
                <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 font-medium">Özel Görev</span>
                    <span className="text-purple-600 font-bold">1000 XP</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Efsanevi zorlukta özel görev satın al</p>
                  <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    Satın Al
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Selected Quest Details */}
            {selectedQuest && (
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Görev Detayları</h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm font-medium">Tür:</span>
                    <div className="flex items-center mt-2">
                      <span className="text-xl mr-2">{getTypeIcon(selectedQuest.type)}</span>
                      <span className="text-gray-900 capitalize font-medium">{selectedQuest.type}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm font-medium">Zorluk:</span>
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedQuest.difficulty === 'easy' ? 'bg-green-50 text-green-700 border border-green-200' :
                        selectedQuest.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        selectedQuest.difficulty === 'hard' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {selectedQuest.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-gray-600 text-sm font-medium">Ödül:</span>
                    <div className="text-blue-600 mt-2 flex items-center font-medium">
                      <Zap className="w-4 h-4 mr-1" />
                      +{selectedQuest.xpReward} XP
                    </div>
                  </div>
                  
                  {selectedQuest.expiresAt && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-gray-600 text-sm font-medium">Kalan Süre:</span>
                      <div className="text-red-600 mt-2 flex items-center font-medium">
                        <Clock className="w-4 h-4 mr-1" />
                        {getTimeRemaining(selectedQuest.expiresAt)}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setSelectedQuest(null)}
                    className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}