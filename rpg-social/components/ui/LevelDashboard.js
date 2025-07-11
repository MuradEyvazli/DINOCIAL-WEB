'use client';

import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchLevelProgression } from '@/lib/redux/slices/levelsSlice';
import LevelProgressBar from './LevelProgressBar';
import { 
  Trophy, 
  Star, 
  Calendar,
  BarChart3,
  Sparkles,
  Gift
} from 'lucide-react';

export default function LevelDashboard({ userId = null, compact = false }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { 
    userProgression, 
    recentLevelUps, 
    upcomingRewards, 
    dailyXPProgress,
    progressionLoading 
  } = useSelector(state => state.levels);

  useEffect(() => {
    // Only fetch if we have a logged in user or specific userId provided
    if (user?._id || userId) {
      dispatch(fetchLevelProgression({ userId }));
    }
  }, [dispatch, user?._id, userId]);

  if (progressionLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!userProgression && !progressionLoading) {
    
    // Show modern profile UI with user info
    if (user) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Modern Profile Header */}
          <div className="relative">
            {/* Cover Background */}
            <div className="h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
            
            {/* Profile Content */}
            <div className="relative px-6 pb-6">
              {/* Avatar */}
              <div className="relative -mt-10 mb-4">
                <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Online Status */}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              {/* User Info */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {user.username}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {user.characterClass?.name || 'Maceracı'}
                </p>
                
                {/* Level Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-semibold text-gray-700">
                    Seviye {user.level || 1}
                  </span>
                </div>
              </div>
              
              {/* XP Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">XP İlerlemesi</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.xp || 0} XP
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: '25%' }}
                  />
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {user.followerCount || 0}
                  </div>
                  <div className="text-xs text-gray-500">Takipçi</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {user.badges?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Rozet</div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => dispatch(fetchLevelProgression({ userId }))}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm"
              >
                İlerlememi Görüntüle
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-slate-600">Giriş yapmanız gerekiyor</p>
      </div>
    );
  }

  const currentLevel = userProgression.currentLevel;
  const nextLevel = userProgression.nextLevel;
  const isMaxLevel = userProgression.isMaxLevel;

  const getTierColor = (level) => {
    if (level <= 10) return '#64748b';
    if (level <= 20) return '#06b6d4';
    if (level <= 30) return '#10b981';
    if (level <= 40) return '#3b82f6';
    if (level <= 50) return '#8b5cf6';
    if (level <= 60) return '#f59e0b';
    if (level <= 70) return '#ef4444';
    if (level <= 80) return '#ec4899';
    if (level <= 90) return '#7c3aed';
    return '#dc2626';
  };

  if (compact) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
            style={{ background: `linear-gradient(135deg, ${getTierColor(currentLevel.level)} 0%, ${getTierColor(currentLevel.level)}dd 100%)` }}
          >
            {currentLevel.level}
          </div>
          <div className="flex-1">
            <LevelProgressBar size="small" showDetails={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Modern Profile Header */}
      <div className="relative">
        {/* Cover Background */}
        <div 
          className="h-24 bg-gradient-to-r"
          style={{ background: `linear-gradient(135deg, ${getTierColor(currentLevel.level)} 0%, ${getTierColor(currentLevel.level)}dd 100%)` }}
        ></div>
        
        {/* Profile Content */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{ background: `linear-gradient(135deg, ${getTierColor(currentLevel.level)} 0%, ${getTierColor(currentLevel.level)}dd 100%)` }}
                >
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Level Badge */}
            <div 
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white"
              style={{ background: `linear-gradient(135deg, ${getTierColor(currentLevel.level)} 0%, ${getTierColor(currentLevel.level)}dd 100%)` }}
            >
              {currentLevel.level}
            </div>
          </div>
          
          {/* User Info */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user.username}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              {currentLevel.tier} • {currentLevel.title}
            </p>
            
            {/* Character Icon */}
            <div className="text-2xl mb-2">{currentLevel.icon}</div>
          </div>
          
          {/* XP Progress */}
          <div className="mb-4">
            <LevelProgressBar size="medium" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Level Quote */}
        {currentLevel.quote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <p className="text-gray-700 italic text-center text-sm">
              "{currentLevel.quote}"
            </p>
          </motion.div>
        )}

        {/* Stats Grid - Modern Style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <BarChart3 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600">
              {user?.xp || 0}
            </p>
            <p className="text-xs text-gray-500">Toplam XP</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">
              {user?.badges?.length || 0}
            </p>
            <p className="text-xs text-gray-500">Rozetler</p>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <Calendar className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-yellow-600">
              {dailyXPProgress.current || 0}
            </p>
            <p className="text-xs text-gray-500">Günlük XP</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
            <Star className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-600">
              {user?.followerCount || 0}
            </p>
            <p className="text-xs text-gray-500">Takipçi</p>
          </div>
        </div>

        {/* Daily XP Progress */}
        {dailyXPProgress && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-medium text-gray-900 text-sm">Günlük XP</h3>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {dailyXPProgress.current}/{dailyXPProgress.goal}
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <motion.div
                className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${dailyXPProgress.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Next Level */}
        {!isMaxLevel && nextLevel && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3 text-sm">Sonraki Seviye</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${getTierColor(nextLevel.level)} 0%, ${getTierColor(nextLevel.level)}dd 100%)` }}
                >
                  {nextLevel.level}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{nextLevel.title}</p>
                  <p className="text-xs text-gray-500">{userProgression.xpNeededForNext} XP kaldı</p>
                </div>
              </div>
              <div className="text-lg">
                {nextLevel.icon}
              </div>
            </div>
          </div>
        )}

        {/* Recent Achievements - Simplified */}
        {(recentLevelUps && recentLevelUps.length > 0) || (upcomingRewards && upcomingRewards.length > 0) ? (
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Son Aktiviteler
            </h3>
            <div className="space-y-2">
              {recentLevelUps?.slice(0, 1).map((levelUp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Seviye {levelUp.level} Başarıldı
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(levelUp.achievedAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
              ))}
              
              {upcomingRewards?.slice(0, 1).map((reward, index) => (
                <div
                  key={reward._id}
                  className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Seviye {reward.level} Hedefi
                    </p>
                    <p className="text-xs text-gray-500">
                      Yaklaşan ödüller
                    </p>
                  </div>
                  <Gift className="w-4 h-4 text-blue-500" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}