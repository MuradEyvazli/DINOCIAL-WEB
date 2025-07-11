// app/guilds/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Crown, 
  Sword, 
  Heart,
  Zap,
  TrendingUp,
  Calendar,
  MapPin,
  Award,
  MessageCircle,
  Settings,
  UserPlus,
  ArrowRight
} from 'lucide-react';
// No guild slice import needed, we'll use direct API calls

export default function GuildsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // API state
  const [guilds, setGuilds] = useState([]);
  const [myGuilds, setMyGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState({});
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    type: 'social',
    maxMembers: 50,
    isPublic: true
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchGuildsData();
  }, [isAuthenticated, router]);

  const fetchGuildsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/guilds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setGuilds(data.data.guilds);
        setMyGuilds(data.data.myGuilds);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Fetch guilds error:', error);
      setError('Guilds yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGuild = async (guildId) => {
    try {
      setJoinLoading({ ...joinLoading, [guildId]: true });
      const token = localStorage.getItem('token');
      const response = await fetch('/api/guilds/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guildId })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setGuilds(guilds.map(guild => 
          guild._id === guildId ? { ...guild, isJoined: true } : guild
        ));
        
        // Add to my guilds
        const joinedGuild = guilds.find(g => g._id === guildId);
        if (joinedGuild) {
          setMyGuilds([...myGuilds, { ...joinedGuild, isJoined: true }]);
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Join guild error:', error);
      setError('Guild\'e katılırken hata oluştu');
    } finally {
      setJoinLoading({ ...joinLoading, [guildId]: false });
    }
  };

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/guilds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();
      if (data.success) {
        // Add new guild to state
        setGuilds([data.data, ...guilds]);
        setMyGuilds([data.data, ...myGuilds]);
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          description: '',
          type: 'social',
          maxMembers: 50,
          isPublic: true
        });
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Create guild error:', error);
      setError('Guild oluştururken hata oluştu');
    } finally {
      setCreateLoading(false);
    }
  };

  const getGuildTypeIcon = (type) => {
    switch (type) {
      case 'combat': return '⚔️';
      case 'creative': return '🎨';
      case 'social': return '👥';
      case 'competitive': return '🏆';
      default: return '🛡️';
    }
  };

  const getGuildTypeColor = (type) => {
    switch (type) {
      case 'combat': return 'from-red-500 to-orange-600';
      case 'creative': return 'from-purple-500 to-pink-600';
      case 'social': return 'from-blue-500 to-cyan-600';
      case 'competitive': return 'from-yellow-500 to-amber-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const filteredGuilds = (activeTab === 'my-guilds' ? myGuilds : guilds)
    .filter((guild, index, self) => {
      // Remove duplicates based on _id
      const firstIndex = self.findIndex(g => g._id === guild._id);
      return firstIndex === index;
    })
    .filter(guild => {
      const matchesSearch = guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           guild.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           guild.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 blur-xl"></div>
            <Shield className="w-24 h-24 text-blue-400 relative z-10" />
          </motion.div>

          {/* Animated Loading Text */}
          <div className="space-y-4">
            <motion.h2 
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
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
              Loncalar yükleniyor...
            </motion.h2>
            
            {/* Animated dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-blue-400 rounded-full"
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
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
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
              Guild bilgileri hazırlanıyor...
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-4 flex items-center justify-center">
            <Shield className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mr-4" />
            Guild'lar
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Güçlü ittifaklar kur, birlikte maceralara atıl ve efsanevi başarılar elde et!
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-lg p-4 text-center">
            <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{guilds.length}</div>
            <div className="text-slate-600 text-sm">Aktif Guild</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-lg p-4 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{myGuilds.length}</div>
            <div className="text-slate-600 text-sm">Üye Olduğum</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">15%</div>
            <div className="text-slate-600 text-sm">XP Bonusu</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-lg p-4 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">234</div>
            <div className="text-slate-600 text-sm">Guild Görevi</div>
          </div>
        </motion.div>

        {/* Tabs and Search */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'discover' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100/70 text-slate-600 hover:text-slate-800'
              }`}
            >
              Keşfet ({guilds.filter(g => !g.isJoined).length})
            </button>
            <button
              onClick={() => setActiveTab('my-guilds')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'my-guilds' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-slate-100/70 text-slate-600 hover:text-slate-800'
              }`}
            >
              Guild'larım ({myGuilds.length})
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Guild ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/80 border border-slate-200 rounded-lg px-4 py-2 pl-10 w-64 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 bg-slate-100/70 hover:bg-slate-200/70 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5 text-slate-600" />
            </button>

            {/* Create Guild */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="rpg-button flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Guild Oluştur</span>
            </button>
          </div>
        </motion.div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div 
            className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-lg p-6 mb-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-slate-800 font-bold mb-4">Filtreler</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 mb-2">Tür</label>
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">Tümü</option>
                  <option value="combat">Savaş</option>
                  <option value="creative">Yaratıcı</option>
                  <option value="social">Sosyal</option>
                  <option value="competitive">Rekabetçi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-600 mb-2">Boyut</label>
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">Tümü</option>
                  <option value="small">Küçük (1-20)</option>
                  <option value="medium">Orta (21-40)</option>
                  <option value="large">Büyük (41+)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-600 mb-2">Seviye</label>
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">Tümü</option>
                  <option value="beginner">Başlangıç (1-10)</option>
                  <option value="intermediate">Orta (11-20)</option>
                  <option value="advanced">İleri (21+)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors ml-2"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Guild Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuilds.map((guild, index) => (
            <motion.div
              key={`guild_${guild._id || guild.name}_${index}`}
              className="guild-card bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-lg overflow-hidden cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setSelectedGuild(guild)}
              whileHover={{ scale: 1.02 }}
            >
              {/* Guild Banner */}
              <div className={`h-32 bg-gradient-to-r ${guild.banner} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">{guild.icon}</span>
                  </div>
                  <span className="text-white font-bold">Seviye {guild.stats?.level || guild.level}</span>
                </div>
                
                <div className="absolute top-4 right-4">
                  {guild.isJoined ? (
                    <span className="px-2 py-1 bg-green-500/80 text-white text-xs rounded-full">
                      Üye
                    </span>
                  ) : guild.isPublic ? (
                    <span className="px-2 py-1 bg-blue-500/80 text-white text-xs rounded-full">
                      Açık
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-500/80 text-white text-xs rounded-full">
                      Davetli
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg mb-1">{guild.name}</h3>
                  <div className="flex items-center text-white/80 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{guild.memberCount}/{guild.maxMembers}</span>
                    <div className="ml-2 flex-1 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full" 
                        style={{ width: `${(guild.memberCount / guild.maxMembers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guild Content */}
              <div className="p-6">
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {guild.description}
                </p>

                {/* Guild Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-slate-800 font-bold">{Math.floor(guild.stats.totalXP / 1000)}K</div>
                    <div className="text-slate-600 text-xs">Toplam XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-800 font-bold">{guild.stats.questsCompleted}</div>
                    <div className="text-slate-600 text-xs">Görev</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-600 font-bold">+{guild.benefits?.xpBonus || guild.xpBonus}%</div>
                    <div className="text-slate-600 text-xs">XP Bonus</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {guild.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Leader */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-600 text-sm">{guild.leader.username}</span>
                  </div>
                  
                  {!guild.isJoined ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGuild(guild._id);
                      }}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors flex items-center space-x-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Katıl</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/guilds/${guild._id}`);
                      }}
                      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors flex items-center space-x-1"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>Gir</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGuilds.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Guild bulunamadı</h3>
            <p className="text-slate-600 mb-6">
              {activeTab === 'my-guilds' 
                ? 'Henüz herhangi bir guild\'e üye değilsin.' 
                : 'Arama kriterlerine uygun guild bulunamadı.'}
            </p>
            {activeTab === 'discover' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="rpg-button"
              >
                Kendi Guild'ini Oluştur
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Guild Detail Modal */}
      {selectedGuild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Modal Header */}
            <div className={`h-40 bg-gradient-to-r ${selectedGuild.banner} relative`}>
              <button
                onClick={() => setSelectedGuild(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                ×
              </button>
              
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl">{selectedGuild.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedGuild.name}</h2>
                    <p className="text-slate-600">Seviye {selectedGuild.stats?.level || selectedGuild.level} Guild</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-6">{selectedGuild.description}</p>
              
              {/* Detailed Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-slate-800 font-bold">{selectedGuild.memberCount}/{selectedGuild.maxMembers}</div>
                  <div className="text-slate-600 text-sm">Üyeler</div>
                </div>
                
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-slate-800 font-bold">+{selectedGuild.benefits?.xpBonus || selectedGuild.xpBonus}%</div>
                  <div className="text-slate-600 text-sm">XP Bonusu</div>
                </div>
                
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <div className="text-slate-800 font-bold">{selectedGuild.stats.questsCompleted}</div>
                  <div className="text-slate-600 text-sm">Görevler</div>
                </div>
                
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-slate-800 font-bold">{selectedGuild.stats?.eventsWon || selectedGuild.stats?.wins || 0}</div>
                  <div className="text-slate-600 text-sm">Zaferler</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {!selectedGuild.isJoined ? (
                  <button
                    onClick={() => handleJoinGuild(selectedGuild._id)}
                    className="flex-1 rpg-button"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Guild'e Katıl
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push(`/guilds/${selectedGuild._id}`)}
                      className="flex-1 rpg-button"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Guild'e Git
                    </button>
                    <button className="flex-1 rpg-button-secondary">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Sohbet
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Guild Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-lg shadow-xl max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <form onSubmit={handleCreateGuild} className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Guild Oluştur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 mb-2">Guild Adı</label>
                  <input
                    type="text"
                    placeholder="Efsanevi Guild'im"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-slate-600 mb-2">Açıklama</label>
                  <textarea
                    placeholder="Guild'inizin amacını ve kurallarını yazın..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-slate-600 mb-2">Tür</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  >
                    <option value="social">Sosyal</option>
                    <option value="combat">Savaş</option>
                    <option value="creative">Yaratıcı</option>
                    <option value="competitive">Rekabetçi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-slate-600 mb-2">Maksimum Üye</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={createForm.maxMembers}
                    onChange={(e) => setCreateForm({ ...createForm, maxMembers: parseInt(e.target.value) })}
                  >
                    <option value={20}>20 Üye</option>
                    <option value={30}>30 Üye</option>
                    <option value={50}>50 Üye</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="public" 
                    className="mr-2" 
                    checked={createForm.isPublic}
                    onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                  />
                  <label htmlFor="public" className="text-slate-600">Herkese açık guild</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={createLoading}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="rpg-button"
                  disabled={createLoading}
                >
                  {createLoading ? 'Oluşturuluyor...' : 'Guild Oluştur (1000 XP)'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}