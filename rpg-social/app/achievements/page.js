// app/achievements/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Star, 
  Shield, 
  Sword, 
  Heart, 
  Zap,
  Target,
  Users,
  Calendar,
  Award,
  Medal,
  Flame,
  Sparkles,
  Lock,
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  Share,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AchievementsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  // Sample achievements data
  const [achievements] = useState([
    {
      id: 'first_steps',
      name: 'İlk Adımlar',
      description: 'Dinocial\'a hoş geldin! İlk gönderini paylaştın.',
      icon: '🌟',
      category: 'social',
      rarity: 'common',
      points: 10,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      progress: { current: 1, max: 1 },
      requirements: ['İlk gönderinizi paylaşın']
    },
    {
      id: 'social_butterfly',
      name: 'Sosyal Kelebek',
      description: '10 farklı kullanıcıyla etkileşim kurdun.',
      icon: '🦋',
      category: 'social',
      rarity: 'rare',
      points: 25,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      progress: { current: 10, max: 10 },
      requirements: ['10 farklı kullanıcıyla etkileşim kurun']
    },
    {
      id: 'quest_master',
      name: 'Görev Ustası',
      description: '50 görev tamamladın. Sen gerçek bir kahraman!',
      icon: '🎯',
      category: 'quests',
      rarity: 'epic',
      points: 50,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      progress: { current: 50, max: 50 },
      requirements: ['50 görev tamamlayın']
    },
    {
      id: 'guild_leader',
      name: 'Guild Lideri',
      description: 'Kendi guild\'ini oluştur ve 20 üyeye ulaş.',
      icon: '👑',
      category: 'guild',
      rarity: 'legendary',
      points: 100,
      unlocked: false,
      progress: { current: 0, max: 20 },
      requirements: ['Guild oluşturun', '20 üyeye ulaşın']
    },
    {
      id: 'explorer',
      name: 'Kaşif',
      description: 'Tüm bölgeleri keşfettin.',
      icon: '🗺️',
      category: 'exploration',
      rarity: 'rare',
      points: 30,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      progress: { current: 5, max: 5 },
      requirements: ['5 farklı bölgeyi ziyaret edin']
    },
    {
      id: 'creative_soul',
      name: 'Yaratıcı Ruh',
      description: 'Yaratıcılık puanı 1000\'e ulaştı.',
      icon: '🎨',
      category: 'creativity',
      rarity: 'epic',
      points: 75,
      unlocked: false,
      progress: { current: 650, max: 1000 },
      requirements: ['1000 yaratıcılık puanı biriktirin']
    },
    {
      id: 'level_master',
      name: 'Seviye Ustası',
      description: '25. seviyeye ulaştın!',
      icon: '⭐',
      category: 'progression',
      rarity: 'rare',
      points: 40,
      unlocked: false,
      progress: { current: user?.level || 1, max: 25 },
      requirements: ['25. seviyeye ulaşın']
    },
    {
      id: 'daily_warrior',
      name: 'Günlük Savaşçı',
      description: '30 gün üst üste giriş yaptın.',
      icon: '🔥',
      category: 'dedication',
      rarity: 'epic',
      points: 60,
      unlocked: false,
      progress: { current: 12, max: 30 },
      requirements: ['30 gün üst üste giriş yapın']
    },
    {
      id: 'legendary_hero',
      name: 'Efsanevi Kahraman',
      description: 'Tüm kategorilerde en az bir epic başarım kazandın.',
      icon: '🏆',
      category: 'special',
      rarity: 'legendary',
      points: 200,
      unlocked: false,
      progress: { current: 2, max: 6 },
      requirements: ['Her kategoride en az bir epic başarım kazanın']
    }
  ]);

  const categories = [
    { id: 'all', name: 'Tümü', icon: Trophy },
    { id: 'social', name: 'Sosyal', icon: Users },
    { id: 'quests', name: 'Görevler', icon: Target },
    { id: 'guild', name: 'Guild', icon: Shield },
    { id: 'exploration', name: 'Keşif', icon: Award },
    { id: 'creativity', name: 'Yaratıcılık', icon: Sparkles },
    { id: 'progression', name: 'İlerleme', icon: TrendingUp },
    { id: 'dedication', name: 'Adanmışlık', icon: Flame },
    { id: 'special', name: 'Özel', icon: Crown }
  ];

  const rarities = [
    { id: 'all', name: 'Tümü', color: 'text-gray-400' },
    { id: 'common', name: 'Yaygın', color: 'text-gray-400' },
    { id: 'rare', name: 'Nadir', color: 'text-blue-400' },
    { id: 'epic', name: 'Epik', color: 'text-purple-400' },
    { id: 'legendary', name: 'Efsanevi', color: 'text-yellow-400' }
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-400/10 text-gray-400';
      case 'rare': return 'border-blue-400 bg-blue-400/10 text-blue-400';
      case 'epic': return 'border-purple-400 bg-purple-400/10 text-purple-400';
      case 'legendary': return 'border-yellow-400 bg-yellow-400/10 text-yellow-400';
      default: return 'border-gray-400 bg-gray-400/10 text-gray-400';
    }
  };

  const getRarityGlow = (rarity) => {
    switch (rarity) {
      case 'rare': return 'shadow-blue-500/25';
      case 'epic': return 'shadow-purple-500/25';
      case 'legendary': return 'shadow-yellow-500/25';
      default: return '';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || achievement.rarity === selectedRarity;
    const matchesUnlocked = !showOnlyUnlocked || achievement.unlocked;
    
    return matchesSearch && matchesCategory && matchesRarity && matchesUnlocked;
  });

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
  const completionPercentage = Math.round((unlockedAchievements.length / achievements.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 flex items-center justify-center">
            <Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-400 mr-4" />
            Başarımlar
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Macerandaki kilometre taşlarını keşfet ve rozetlerini topla!
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-card p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{unlockedAchievements.length}</div>
            <div className="text-gray-400 text-sm">Kazanılan</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalPoints}</div>
            <div className="text-gray-400 text-sm">Toplam Puan</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{completionPercentage}%</div>
            <div className="text-gray-400 text-sm">Tamamlama</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {unlockedAchievements.filter(a => a.rarity === 'legendary').length}
            </div>
            <div className="text-gray-400 text-sm">Efsanevi</div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="glass-card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Genel İlerleme</h3>
            <span className="text-purple-400 font-bold">{unlockedAchievements.length}/{achievements.length}</span>
          </div>
          
          <div className="experience-bar h-4 mb-2">
            <div 
              className="experience-fill h-4" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <p className="text-gray-400 text-sm">
            {achievements.length - unlockedAchievements.length} başarım daha var!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3">
            <motion.div 
              className="glass-card p-6 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Filtreler</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Başarım ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              {/* Show Only Unlocked */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-300">Sadece Kazanılanlar</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyUnlocked}
                    onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Kategoriler</h4>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const count = achievements.filter(a => category.id === 'all' || a.category === category.id).length;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                          selectedCategory === category.id
                            ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <category.icon className="w-5 h-5" />
                          <span>{category.name}</span>
                        </div>
                        <span className="text-sm bg-white/10 px-2 py-1 rounded-full">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rarity */}
              <div>
                <h4 className="text-white font-medium mb-3">Nadir­lik</h4>
                <div className="space-y-2">
                  {rarities.map((rarity) => {
                    const count = achievements.filter(a => rarity.id === 'all' || a.rarity === rarity.id).length;
                    
                    return (
                      <button
                        key={rarity.id}
                        onClick={() => setSelectedRarity(rarity.id)}
                        className={`w-full text-left p-2 rounded transition-all flex items-center justify-between ${
                          selectedRarity === rarity.id
                            ? 'bg-purple-500/20 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className={rarity.color}>{rarity.name}</span>
                        <span className="text-sm">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Recent Achievements */}
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Son Başarımlar</h3>
              
              <div className="space-y-3">
                {unlockedAchievements
                  .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
                  .slice(0, 3)
                  .map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center`}>
                        <span className="text-lg">{achievement.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{achievement.name}</p>
                        <p className="text-gray-400 text-xs">
                          {formatDate(achievement.unlockedAt)}
                        </p>
                      </div>
                      <span className="text-purple-400 text-sm">+{achievement.points}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>

          {/* Achievements Grid */}
          <div className="lg:col-span-9">
            <motion.div 
              className="mb-6 flex justify-between items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h2 className="text-xl font-bold text-white">
                {selectedCategory === 'all' ? 'Tüm Başarımlar' : 
                 categories.find(c => c.id === selectedCategory)?.name}
                <span className="text-gray-400 ml-2">({filteredAchievements.length})</span>
              </h2>
              
              <button className="rpg-button-secondary">
                <Share className="w-4 h-4" />
                <span>Paylaş</span>
              </button>
            </motion.div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  className={`achievement-card glass-card p-6 relative overflow-hidden ${
                    achievement.unlocked ? 'opacity-100' : 'opacity-60'
                  } ${getRarityGlow(achievement.rarity)}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: achievement.unlocked ? 1 : 0.6, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  {/* Rarity Border */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    achievement.rarity === 'common' ? 'from-gray-400 to-gray-500' :
                    achievement.rarity === 'rare' ? 'from-blue-400 to-blue-500' :
                    achievement.rarity === 'epic' ? 'from-purple-400 to-purple-500' :
                    'from-yellow-400 to-amber-500'
                  }`}></div>

                  {/* Lock Overlay */}
                  {!achievement.unlocked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                  )}

                  {/* Achievement Icon */}
                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl ${
                      achievement.unlocked 
                        ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} border-2` 
                        : 'bg-gray-600/50 border-2 border-gray-500'
                    }`}>
                      {achievement.unlocked ? achievement.icon : '❓'}
                    </div>
                    
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity.toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className={`font-bold text-lg mb-2 ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {achievement.unlocked ? achievement.name : '???'}
                    </h3>
                    
                    <p className={`text-sm mb-4 ${achievement.unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                      {achievement.unlocked ? achievement.description : 'Bu başarımı açmak için gerekli koşulları sağlayın.'}
                    </p>

                    {/* Progress Bar */}
                    {!achievement.unlocked && achievement.progress && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">İlerleme</span>
                          <span className="text-gray-400">
                            {achievement.progress.current}/{achievement.progress.max}
                          </span>
                        </div>
                        <div className="experience-bar h-2">
                          <div 
                            className="experience-fill h-2" 
                            style={{ width: `${(achievement.progress.current / achievement.progress.max) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Requirements */}
                    {!achievement.unlocked && (
                      <div className="mb-4">
                        <h4 className="text-gray-400 text-sm font-medium mb-2">Gereksinimler:</h4>
                        <ul className="text-xs text-gray-500 space-y-1">
                          {achievement.requirements.map((req, reqIndex) => (
                            <li key={reqIndex} className="flex items-center">
                              <span className="w-1 h-1 bg-gray-500 rounded-full mr-2"></span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Points and Date */}
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400 font-bold">
                        +{achievement.points} puan
                      </span>
                      
                      {achievement.unlocked && (
                        <span className="text-gray-400 text-xs">
                          {formatDate(achievement.unlockedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unlocked Badge */}
                  {achievement.unlocked && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle className="w-6 h-6 text-green-500 bg-slate-900 rounded-full" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredAchievements.length === 0 && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Başarım bulunamadı</h3>
                <p className="text-gray-400">
                  Filtre kriterlerine uygun başarım bulunamadı.
                </p>
              </motion.div>
            )}

            {/* Load More */}
            {filteredAchievements.length > 0 && filteredAchievements.length >= 12 && (
              <div className="text-center mt-8">
                <button className="rpg-button-secondary">
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}