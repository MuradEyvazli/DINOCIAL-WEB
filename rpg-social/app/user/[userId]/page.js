// app/user/[userId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Star, 
  Users, 
  MapPin, 
  Calendar,
  Share,
  Award,
  Target,
  Zap,
  Heart,
  MessageCircle,
  RefreshCw,
  Shield,
  Crown,
  TrendingUp,
  Eye,
  EyeOff,
  UserPlus,
  UserCheck,
  AlertCircle,
  Loader,
  Clock,
  Flame,
  Badge,
  Map
} from 'lucide-react';
import { REGIONS } from '@/lib/constants';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth);
  
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add auth token if available
        const token = localStorage.getItem('auth-token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/users/${params.userId}`, {
          headers,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.success) {
          if (response.status === 403) {
            setError({ type: 'private', message: data.message });
          } else if (response.status === 404) {
            setError({ type: 'notfound', message: data.message });
          } else {
            setError({ type: 'error', message: data.message });
          }
          return;
        }
        
        setProfileData(data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError({ type: 'error', message: 'Profil yüklenirken bir hata oluştu' });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.userId) {
      fetchProfile();
    }
  }, [params.userId]);

  // Helper functions
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} saat önce`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days < 7) return `${days} gün önce`;
      if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
      if (days < 365) return `${Math.floor(days / 30)} ay önce`;
      return `${Math.floor(days / 365)} yıl önce`;
    }
  };

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

  const getRankingInfo = (category) => {
    const ranking = profileData?.rankings?.[category];
    if (!ranking) return null;
    
    const percentage = ((ranking.totalUsers - ranking.rank + 1) / ranking.totalUsers * 100).toFixed(1);
    return {
      rank: ranking.rank,
      total: ranking.totalUsers,
      percentage: percentage,
      isTopPercent: percentage >= 90
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          {error.type === 'private' ? (
            <>
              <EyeOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Özel Profil</h1>
              <p className="text-gray-400 mb-6">{error.message}</p>
            </>
          ) : error.type === 'notfound' ? (
            <>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Kullanıcı Bulunamadı</h1>
              <p className="text-gray-400 mb-6">Aradığınız kullanıcı mevcut değil.</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Hata</h1>
              <p className="text-gray-400 mb-6">{error.message}</p>
            </>
          )}
          
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 mx-auto px-6 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri Dön</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="glass-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-purple-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Geri Dön
          </button>
          
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Users className="w-8 h-8 text-purple-400 mr-3" />
            Kullanıcı Profili
          </h1>
          
          <div className="flex space-x-2">
            {!profileData?.isOwnProfile && (
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <UserPlus className="w-5 h-5" />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Share className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div 
          className="glass-card p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Character Avatar */}
            <div className="relative">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-r ${profileData.characterClass.color} flex items-center justify-center text-6xl border-4 border-white/20 shadow-2xl overflow-hidden`}>
                {profileData.avatar ? (
                  <img 
                    src={profileData.avatar} 
                    alt={`${profileData.username} profil fotoğrafı`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.characterClass.icon
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                {profileData.level}
              </div>
              {profileData.activity?.isOnline && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Character Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
                <h2 className="text-4xl font-bold text-white">{profileData.username}</h2>
                {profileData.isVerified && (
                  <Badge className="w-6 h-6 text-blue-400" />
                )}
              </div>
              
              <p className="text-xl text-purple-400 mb-4">
                Seviye {profileData.level} {profileData.characterClass.name}
              </p>
              
              {profileData.bio && (
                <p className="text-gray-300 mb-6 max-w-2xl">
                  {profileData.bio}
                </p>
              )}

              {/* XP Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Deneyim Puanı</span>
                  <span className="text-purple-400">{profileData.xp} XP</span>
                </div>
                <div className="experience-bar">
                  <div 
                    className="experience-fill" 
                    style={{ width: `${(profileData.xp / (profileData.level * 100)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Activity Status */}
              {profileData.activity && (
                <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      {profileData.activity.isOnline ? 'Çevrimiçi' : `Son görülme: ${formatTimeAgo(profileData.activity.lastActive)}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      {formatTimeAgo(profileData.activity.joinDate)} katıldı
                    </span>
                  </div>
                  {profileData.activity.activityStreak > 0 && (
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400">
                        {profileData.activity.activityStreak} gün streak
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {profileData.stats && (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{profileData.stats.postsCount}</div>
              <div className="text-gray-400 text-sm">Gönderi</div>
              {getRankingInfo('posts') && (
                <div className="text-xs text-purple-400 mt-1">
                  #{getRankingInfo('posts').rank}
                </div>
              )}
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{profileData.stats.questsCompleted}</div>
              <div className="text-gray-400 text-sm">Görev</div>
              {getRankingInfo('quests') && (
                <div className="text-xs text-purple-400 mt-1">
                  #{getRankingInfo('quests').rank}
                </div>
              )}
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{profileData.achievements.count}</div>
              <div className="text-gray-400 text-sm">Başarım</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{profileData.stats.impactScore}</div>
              <div className="text-gray-400 text-sm">Etki Puanı</div>
              {getRankingInfo('impact') && (
                <div className="text-xs text-purple-400 mt-1">
                  #{getRankingInfo('impact').rank}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div 
          className="flex space-x-1 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'overview' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'achievements' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Başarımlar
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'rankings' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Sıralamalar
          </button>
          <button
            onClick={() => setActiveTab('regions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'regions' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Bölgeler
          </button>
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
              >
                {/* Character Abilities */}
                <div className="glass-card p-6 mb-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Star className="w-6 h-6 text-yellow-400 mr-2" />
                    Özel Yetenekler
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {profileData.characterClass.abilities.map((ability, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Zap className="w-5 h-5 text-purple-400 mr-2" />
                          <span className="text-white font-medium">{ability}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                            style={{ width: `${75 + index * 5}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Achievements Preview */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Award className="w-6 h-6 text-yellow-400 mr-2" />
                    Son Başarımlar
                  </h3>
                  {profileData.achievements.recentBadges.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Henüz başarım yok</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {profileData.achievements.recentBadges.slice(0, 4).map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity || 'common')}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{achievement.icon || '🏆'}</div>
                            <h4 className="text-white font-bold text-sm mb-1">{achievement.name}</h4>
                            <p className="text-gray-300 text-xs">{achievement.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
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
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Award className="w-6 h-6 text-yellow-400 mr-2" />
                  Tüm Başarımlar ({profileData.achievements.count})
                </h3>
                
                {profileData.achievements.badges.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Henüz başarım kazanılmamış</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {profileData.achievements.badges.map((achievement, index) => (
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
                          <h4 className="text-white font-bold mb-1">{achievement.name}</h4>
                          <p className="text-gray-300 text-sm mb-2">{achievement.description}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${getRarityColor(achievement.rarity || 'common')}`}>
                            {(achievement.rarity || 'common').toUpperCase()}
                          </span>
                          <p className="text-gray-400 text-xs mt-2">
                            {achievement.unlockedAt ? formatTimeAgo(achievement.unlockedAt) : 'Yeni kazanıldı'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Rankings Tab */}
            {activeTab === 'rankings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card p-6"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
                  Sıralama Detayları
                </h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'xp', name: 'Deneyim Puanı', icon: Zap, color: 'text-purple-400' },
                    { key: 'level', name: 'Seviye', icon: Star, color: 'text-yellow-400' },
                    { key: 'posts', name: 'Gönderiler', icon: MessageCircle, color: 'text-blue-400' },
                    { key: 'quests', name: 'Görevler', icon: Target, color: 'text-green-400' },
                    { key: 'impact', name: 'Etki Puanı', icon: TrendingUp, color: 'text-red-400' }
                  ].map((category) => {
                    const ranking = getRankingInfo(category.key);
                    return (
                      <div key={category.key} className="bg-white/5 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <category.icon className={`w-6 h-6 ${category.color}`} />
                            <span className="text-white font-medium">{category.name}</span>
                          </div>
                          {ranking ? (
                            <div className="text-right">
                              <div className="text-white font-bold">#{ranking.rank}</div>
                              <div className="text-gray-400 text-sm">
                                Top %{ranking.percentage}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">Veri yok</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  <Map className="w-6 h-6 text-green-400 mr-2" />
                  Keşfedilen Bölgeler ({profileData.regions.visited.length}/{REGIONS.length})
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {REGIONS.map((region, index) => {
                    const isVisited = profileData.regions.visited.includes(region.id);
                    const isCurrent = profileData.regions.current === region.id;
                    
                    return (
                      <motion.div
                        key={region.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isCurrent
                            ? `bg-gradient-to-r ${region.color} bg-opacity-30 border-white/30`
                            : isVisited 
                            ? `bg-gradient-to-r ${region.color} bg-opacity-20 border-white/20` 
                            : 'bg-gray-700/20 border-gray-600/50'
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
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
                          {isCurrent ? (
                            <span className="inline-block px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                              ŞU AN BURADA
                            </span>
                          ) : isVisited ? (
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Character Stats */}
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Karakter Bilgileri</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Seviye:</span>
                  <span className="text-white font-bold">{profileData.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deneyim:</span>
                  <span className="text-white font-bold">{profileData.xp} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sınıf:</span>
                  <span className="text-white font-bold">{profileData.characterClass.name}</span>
                </div>
                {profileData.stats && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Toplam Gönderi:</span>
                      <span className="text-white font-bold">{profileData.stats.postsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Toplam Görev:</span>
                      <span className="text-white font-bold">{profileData.stats.questsCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Etki Puanı:</span>
                      <span className="text-white font-bold">{profileData.stats.impactScore}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Başarım Sayısı:</span>
                  <span className="text-white font-bold">{profileData.achievements.count}</span>
                </div>
              </div>
            </motion.div>

            {/* Character Card */}
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Karakter Kartı</h3>
              
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${profileData.characterClass.color} flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-white/20 overflow-hidden`}>
                  {profileData.avatar ? (
                    <img 
                      src={profileData.avatar} 
                      alt={`${profileData.username} profil fotoğrafı`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profileData.characterClass.icon
                  )}
                </div>
                
                <h4 className="text-white font-bold mb-1">{profileData.username}</h4>
                <p className="text-purple-400 mb-2">Seviye {profileData.level} {profileData.characterClass.name}</p>
                
                {profileData.activity && (
                  <div className="bg-white/5 p-3 rounded-lg mb-4">
                    <div className="text-xs text-gray-400 mb-1">Durum</div>
                    <div className={`text-sm font-bold ${profileData.activity.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                      {profileData.activity.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  {profileData.activity && `${formatTimeAgo(profileData.activity.joinDate)} katıldı`}
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">İşlemler</h3>
              
              <div className="space-y-3">
                {!profileData.isOwnProfile && (
                  <>
                    <button className="w-full bg-purple-500/20 text-purple-400 py-2 rounded text-sm hover:bg-purple-500/30 transition-colors">
                      Takip Et
                    </button>
                    <button 
                      onClick={() => router.push('/messages')}
                      className="w-full bg-blue-500/20 text-blue-400 py-2 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      Mesaj Gönder
                    </button>
                  </>
                )}
                <button 
                  onClick={() => router.push('/leaderboard')}
                  className="w-full bg-yellow-500/20 text-yellow-400 py-2 rounded text-sm hover:bg-yellow-500/30 transition-colors"
                >
                  Liderlik Tablosunu Gör
                </button>
                <button className="w-full bg-gray-500/20 text-gray-400 py-2 rounded text-sm hover:bg-gray-500/30 transition-colors">
                  Profili Paylaş
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}