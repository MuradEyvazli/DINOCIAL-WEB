// app/notifications/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Trophy, 
  Users, 
  MessageCircle, 
  Crown, 
  Target, 
  Star, 
  Gift,
  AlertCircle,
  CheckCircle,
  Filter,
  Search,
  MoreVertical,
  Check,
  X,
  Archive,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Calendar,
  Zap,
  Shield,
  Heart,
  Flame,
  Award,
  TrendingUp
} from 'lucide-react';
import { 
  fetchNotifications, 
  markAsRead, 
  updateFilters, 
  clearAll 
} from '@/lib/redux/slices/notificationSlice';

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount, isLoading, filters } = useSelector((state) => state.notifications);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sample notifications data
  const [sampleNotifications] = useState([
    {
      id: 'notif_1',
      type: 'achievement',
      title: 'Yeni Başarım Kazandın!',
      message: '"Sosyal Kelebek" rozetini aldın. 10 farklı kullanıcıyla etkileşim kurarak bu başarımı elde ettin.',
      icon: '🏆',
      color: 'from-yellow-500 to-amber-600',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      actionUrl: '/achievements',
      data: {
        achievementId: 'social_butterfly',
        xpGained: 100
      }
    },
    {
      id: 'notif_2',
      type: 'quest',
      title: 'Görev Tamamlandı',
      message: '"Günlük Sosyal Görev" tamamlandı. 50 XP kazandın!',
      icon: '🎯',
      color: 'from-blue-500 to-cyan-600',
      read: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      actionUrl: '/quests',
      data: {
        questId: 'daily_social_1',
        xpGained: 50
      }
    },
    {
      id: 'notif_3',
      type: 'social',
      title: 'Yeni Takipçi',
      message: 'DragonMaster seni takip etmeye başladı.',
      icon: '👥',
      color: 'from-purple-500 to-pink-600',
      read: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      actionUrl: '/profile/user_1',
      data: {
        userId: 'user_1',
        username: 'DragonMaster'
      }
    },
    {
      id: 'notif_4',
      type: 'guild',
      title: 'Guild Daveti',
      message: '"Efsane Savaşçıları" guild\'ine davet edildin.',
      icon: '🛡️',
      color: 'from-red-500 to-orange-600',
      read: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      actionUrl: '/guilds/guild_1',
      data: {
        guildId: 'guild_1',
        guildName: 'Efsane Savaşçıları',
        inviterId: 'user_2'
      }
    },
    {
      id: 'notif_5',
      type: 'message',
      title: 'Yeni Mesaj',
      message: 'ShadowNinja: "Yeni quest\'e başlayalım mı?"',
      icon: '💬',
      color: 'from-green-500 to-emerald-600',
      read: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actionUrl: '/messages/conv_2',
      data: {
        conversationId: 'conv_2',
        senderId: 'user_2',
        senderName: 'ShadowNinja'
      }
    },
    {
      id: 'notif_6',
      type: 'system',
      title: 'Seviye Atladın!',
      message: 'Tebrikler! Seviye 15\'e ulaştın. Yeni yetenekler açıldı!',
      icon: '⭐',
      color: 'from-indigo-500 to-purple-600',
      read: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      actionUrl: '/profile',
      data: {
        newLevel: 15,
        oldLevel: 14,
        xpGained: 200
      }
    },
    {
      id: 'notif_7',
      type: 'quest',
      title: 'Yeni Haftalık Görev',
      message: '"Bölge Kaşifi" görevi başladı. 3 farklı bölgede içerik paylaş.',
      icon: '🗺️',
      color: 'from-teal-500 to-cyan-600',
      read: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      actionUrl: '/quests',
      data: {
        questId: 'weekly_explorer',
        difficulty: 'medium',
        xpReward: 150
      }
    },
    {
      id: 'notif_8',
      type: 'social',
      title: 'Gönderine Beğeni',
      message: 'MysticHealer gönderini beğendi ve 5 etki puanı verdi.',
      icon: '❤️',
      color: 'from-pink-500 to-rose-600',
      read: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      actionUrl: '/profile',
      data: {
        postId: 'post_1',
        userId: 'user_3',
        username: 'MysticHealer',
        impactPoints: 5
      }
    }
  ]);

  const notificationTypes = [
    { id: 'all', name: 'Tümü', icon: Bell, count: sampleNotifications.length },
    { id: 'achievement', name: 'Başarımlar', icon: Trophy, count: sampleNotifications.filter(n => n.type === 'achievement').length },
    { id: 'quest', name: 'Görevler', icon: Target, count: sampleNotifications.filter(n => n.type === 'quest').length },
    { id: 'social', name: 'Sosyal', icon: Users, count: sampleNotifications.filter(n => n.type === 'social').length },
    { id: 'guild', name: 'Guild', icon: Shield, count: sampleNotifications.filter(n => n.type === 'guild').length },
    { id: 'message', name: 'Mesajlar', icon: MessageCircle, count: sampleNotifications.filter(n => n.type === 'message').length },
    { id: 'system', name: 'Sistem', icon: Settings, count: sampleNotifications.filter(n => n.type === 'system').length }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'quest': return Target;
      case 'social': return Users;
      case 'guild': return Shield;
      case 'message': return MessageCircle;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'şimdi';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const filteredNotifications = sampleNotifications.filter(notification => {
    const matchesType = filters.type === 'all' || notification.type === filters.type;
    const matchesRead = filters.read === 'all' || 
      (filters.read === 'unread' && !notification.read) ||
      (filters.read === 'read' && notification.read);
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesRead && matchesSearch;
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      // Mark as read
      dispatch(markAsRead([notification.id]));
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = sampleNotifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      dispatch(markAsRead(unreadIds));
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'read':
        dispatch(markAsRead(selectedNotifications));
        break;
      case 'delete':
        // Dispatch delete action
        break;
      case 'archive':
        // Dispatch archive action
        break;
    }
    setSelectedNotifications([]);
  };

  const unreadNotifications = sampleNotifications.filter(n => !n.read);

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
            <Bell className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mr-4" />
            Bildirimler
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Tüm aktivitelerini ve güncellemelerini takip et
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-card p-4 text-center">
            <Bell className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{sampleNotifications.length}</div>
            <div className="text-gray-400 text-sm">Toplam</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{unreadNotifications.length}</div>
            <div className="text-gray-400 text-sm">Okunmamış</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {sampleNotifications.filter(n => n.type === 'achievement').length}
            </div>
            <div className="text-gray-400 text-sm">Başarım</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">Bugün</div>
            <div className="text-gray-400 text-sm">
              {sampleNotifications.filter(n => {
                const today = new Date();
                const notifDate = new Date(n.createdAt);
                return notifDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3">
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Kategoriler</h3>
              
              <div className="space-y-2">
                {notificationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => dispatch(updateFilters({ type: type.id }))}
                    className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                      filters.type === type.id
                        ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <type.icon className="w-5 h-5" />
                      <span>{type.name}</span>
                    </div>
                    <span className="text-sm bg-white/10 px-2 py-1 rounded-full">
                      {type.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Read Status Filter */}
              <div className="mt-6">
                <h4 className="text-white font-medium mb-3">Durum</h4>
                <div className="space-y-2">
                  {[
                    { id: 'all', name: 'Tümü' },
                    { id: 'unread', name: 'Okunmamış' },
                    { id: 'read', name: 'Okunmuş' }
                  ].map((status) => (
                    <button
                      key={status.id}
                      onClick={() => dispatch(updateFilters({ read: status.id }))}
                      className={`w-full text-left p-2 rounded transition-all ${
                        filters.read === status.id
                          ? 'bg-purple-500/20 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-white font-medium mb-3">Hızlı İşlemler</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={unreadNotifications.length === 0}
                    className="w-full text-left p-2 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    Tümünü Okundu İşaretle
                  </button>
                  
                  <button
                    onClick={() => dispatch(clearAll())}
                    className="w-full text-left p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    Tümünü Temizle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-9">
            <motion.div 
              className="glass-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* Controls */}
              <div className="p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-white">
                      {filters.type === 'all' ? 'Tüm Bildirimler' : 
                       notificationTypes.find(t => t.id === filters.type)?.name}
                    </h2>
                    
                    {selectedNotifications.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">
                          {selectedNotifications.length} seçili
                        </span>
                        
                        <button
                          onClick={() => handleBulkAction('read')}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Okundu işaretle"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleBulkAction('archive')}
                          className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                          title="Arşivle"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleBulkAction('delete')}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Bildirim ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-white/10">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification, index) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        className={`p-4 hover:bg-white/5 transition-all cursor-pointer ${
                          !notification.read ? 'bg-blue-500/5 border-l-4 border-l-blue-500' : ''
                        } ${selectedNotifications.includes(notification.id) ? 'bg-purple-500/10' : ''}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Selection Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectNotification(notification.id);
                            }}
                            className="mt-1 w-4 h-4 border border-white/20 rounded flex items-center justify-center hover:border-purple-400 transition-colors"
                          >
                            {selectedNotifications.includes(notification.id) && (
                              <Check className="w-3 h-3 text-purple-400" />
                            )}
                          </button>

                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${notification.color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-xl">{notification.icon}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className={`font-medium ${!notification.read ? 'text-white' : 'text-gray-200'}`}>
                                  {notification.title}
                                </h3>
                                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                
                                {/* Additional Data */}
                                {notification.data?.xpGained && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-400 text-sm">
                                      +{notification.data.xpGained} XP
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <span className="text-gray-500 text-xs whitespace-nowrap">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  // Empty State
                  <div className="p-16 text-center">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Bildirim bulunamadı</h3>
                    <p className="text-gray-400">
                      {searchQuery 
                        ? 'Arama kriterlerine uygun bildirim bulunamadı.'
                        : 'Bu kategoride henüz bildirim yok.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Load More */}
              {filteredNotifications.length > 0 && (
                <div className="p-4 border-t border-white/10 text-center">
                  <button className="text-purple-400 hover:text-white transition-colors">
                    Daha Fazla Yükle
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}