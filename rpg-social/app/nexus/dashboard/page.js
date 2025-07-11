'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Shield, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Database,
  Settings,
  LogOut,
  Eye,
  Ban,
  MessageSquare,
  Crown,
  Zap,
  Monitor,
  BarChart3,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  Search,
  Filter,
  Download,
  RefreshCw,
  Bell,
  Trash2,
  UserX,
  MessageCircle,
  Link,
  Globe,
  Server,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit3,
  Plus,
  Minus,
  User,
  Calendar,
  Mail,
  MapPin,
  Star,
  Award,
  Users2
} from 'lucide-react';

export default function NexusDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminProfile, setAdminProfile] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState({
    onlineUsers: 0,
    activeConnections: 0,
    systemLoad: 0
  });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [contentStats, setContentStats] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [viewingMessages, setViewingMessages] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);

  useEffect(() => {
    // Verify nexus authentication
    const nexusToken = localStorage.getItem('nexusToken');
    if (!nexusToken) {
      router.push('/nexus');
      return;
    }

    // Load admin profile and system data
    loadDashboardData();

    // Start real-time updates
    const interval = setInterval(updateRealtimeData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      
      const response = await fetch('/api/nexus/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdminProfile(data.adminProfile);
        setSystemStats(data.systemStats);
      } else {
        // Token expired or invalid
        localStorage.removeItem('nexusToken');
        router.push('/nexus');
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRealtimeData = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      
      const response = await fetch('/api/nexus/realtime', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRealtimeData(data);
      }
    } catch (error) {
      console.error('Realtime update error:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const loadFriendsData = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFriendsData(data.relationships || []);
      }
    } catch (error) {
      console.error('Load friends data error:', error);
    }
  };

  const loadContentStats = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/content', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setContentStats(data);
      }
    } catch (error) {
      console.error('Load content stats error:', error);
    }
  };

  const loadSystemLogs = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Load system logs error:', error);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/security', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSecurityAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Load security alerts error:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch(`/api/nexus/conversations/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        setConversationMessages(data.messages);
        setViewingMessages(true);
      }
    } catch (error) {
      console.error('Load conversation messages error:', error);
    }
  };

  const updateSettings = async (section, newSettings) => {
    try {
      const token = localStorage.getItem('nexusToken');
      const response = await fetch('/api/nexus/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_settings',
          section,
          settings: newSettings
        })
      });
      if (response.ok) {
        loadSettings();
        alert('Ayarlar başarıyla güncellendi!');
      }
    } catch (error) {
      console.error('Update settings error:', error);
      alert('Ayarlar güncellenirken hata oluştu');
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      setUserActionLoading(true);
      const token = localStorage.getItem('nexusToken');
      const response = await fetch(`/api/nexus/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
        setViewingUserProfile(true);
      } else {
        alert('Kullanıcı profili yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Load user profile error:', error);
      alert('Kullanıcı profili yüklenirken hata oluştu');
    } finally {
      setUserActionLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return;
    
    try {
      setUserActionLoading(true);
      const token = localStorage.getItem('nexusToken');
      const response = await fetch(`/api/nexus/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadUsers();
        alert('Kullanıcı başarıyla silindi');
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Kullanıcı silinirken hata oluştu');
    } finally {
      setUserActionLoading(false);
    }
  };

  const banUser = async (userId, reason = 'Admin action') => {
    if (!confirm('Bu kullanıcıyı banlamak istediğinizden emin misiniz?')) return;
    
    try {
      setUserActionLoading(true);
      const token = localStorage.getItem('nexusToken');
      const response = await fetch(`/api/nexus/users/${userId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'ban_user',
          reason
        })
      });
      if (response.ok) {
        loadUsers();
        alert('Kullanıcı başarıyla banlandı');
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Ban user error:', error);
      alert('Kullanıcı banlanırken hata oluştu');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexusToken');
    localStorage.removeItem('nexusLevel');
    router.push('/nexus');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="text-blue-600 font-semibold">Nexus Admin Panel Yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: Monitor },
    { id: 'users', name: 'Kullanıcı Yönetimi', icon: Users },
    { id: 'content', name: 'İçerik Analitik', icon: FileText },
    { id: 'messages', name: 'Mesaj İzleme', icon: MessageCircle },
    { id: 'friends', name: 'Arkadaşlık İlişkileri', icon: Link },
    { id: 'analytics', name: 'Analitik', icon: BarChart3 },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'logs', name: 'Sistem Kayıtları', icon: Activity },
    { id: 'settings', name: 'Ayarlar', icon: Settings }
  ];

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-black mb-2">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{change >= 0 ? '↗️' : '↘️'}</span>
              <span className="ml-1">{Math.abs(change)}% bu hafta</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'}`}>
          <Icon className={`w-6 h-6 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
        </div>
      </div>
    </motion.div>
  );

  const SystemMetric = ({ label, value, unit, status = 'normal' }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-gray-600 text-sm font-medium">{label}</span>
      <div className="flex items-center space-x-2">
        <span className="text-black font-mono font-semibold">{value}{unit}</span>
        <div className={`w-2 h-2 rounded-full ${
          status === 'good' ? 'bg-green-500' :
          status === 'warning' ? 'bg-yellow-500' :
          status === 'critical' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-2 bg-blue-600 rounded-lg"
              >
                <Database className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  NEXUS Admin Panel
                </h1>
                <p className="text-gray-600 text-sm">
                  RPG Social Yönetim Paneli v3.0
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Real-time indicators */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-1">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-medium">{realtimeData.onlineUsers} Online</span>
                </div>
                <div className="w-px h-4 bg-gray-400" />
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 font-medium">{realtimeData.systemLoad}% Yük</span>
                </div>
              </div>

              {/* Admin profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-black">
                    {adminProfile?.username || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {adminProfile?.role === 'super_admin' ? 'Süper Admin' : 'Admin'}
                  </p>
                  <p className="text-xs text-blue-600">
                    {adminProfile?.nexusLevel || 'ALPHA'} Seviye
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 space-y-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'hover:bg-gray-100 border border-transparent text-gray-700 hover:text-black'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Toplam Kullanıcı"
                      value={systemStats?.totalUsers || '0'}
                      change={systemStats?.userGrowth || 0}
                      icon={Users}
                      color="blue"
                    />
                    <StatCard
                      title="Aktif Kullanıcı"
                      value={systemStats?.activeUsers || '0'}
                      change={systemStats?.activityChange || 0}
                      icon={Activity}
                      color="green"
                    />
                    <StatCard
                      title="Toplam Gönderi"
                      value={systemStats?.totalPosts || '0'}
                      change={systemStats?.postGrowth || 0}
                      icon={FileText}
                      color="purple"
                    />
                    <StatCard
                      title="Online Kullanıcı"
                      value={realtimeData.onlineUsers}
                      icon={Wifi}
                      color="green"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* System Health */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-black">Sistem Durumu</h3>
                        <RefreshCw className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="space-y-4">
                        <SystemMetric 
                          label="Online Kullanıcı" 
                          value={realtimeData.onlineUsers} 
                          unit="" 
                          status={realtimeData.onlineUsers > 50 ? "good" : realtimeData.onlineUsers > 20 ? "warning" : "critical"} 
                        />
                        <SystemMetric 
                          label="Sistem Yükü" 
                          value={realtimeData.systemLoad} 
                          unit="%" 
                          status={realtimeData.systemLoad < 70 ? "good" : realtimeData.systemLoad < 85 ? "warning" : "critical"} 
                        />
                        <SystemMetric 
                          label="Toplam Kullanıcı" 
                          value={systemStats?.totalUsers || 0} 
                          unit="" 
                          status="good" 
                        />
                        <SystemMetric 
                          label="Aktif Kullanıcı (24h)" 
                          value={systemStats?.activeUsers || 0} 
                          unit="" 
                          status={systemStats?.activeUsers > 100 ? "good" : "warning"} 
                        />
                        <SystemMetric 
                          label="Başarısız Giriş (24h)" 
                          value={systemStats?.failedLogins || 0} 
                          unit="" 
                          status={systemStats?.failedLogins < 10 ? "good" : systemStats?.failedLogins < 50 ? "warning" : "critical"} 
                        />
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-black">Son Aktiviteler</h3>
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="space-y-4">
                        {systemStats?.recentActivity && systemStats.recentActivity.length > 0 ? (
                          systemStats.recentActivity.slice(0, 5).map((activity, index) => (
                            <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.severity === 'high' ? 'bg-red-500' :
                                activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <div className="flex-1">
                                <p className="text-black text-sm font-medium">
                                  {activity.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                                </p>
                                <p className="text-gray-600 text-xs">
                                  {activity.admin} - {new Date(activity.timestamp).toLocaleString('tr-TR')}
                                </p>
                                {activity.targetType && (
                                  <p className="text-gray-500 text-xs">Hedef: {activity.targetType}</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <div className="flex-1">
                              <p className="text-gray-600 text-sm">Son aktivite bulunamadı</p>
                              <p className="text-gray-500 text-xs">Sistem yeni başlatılmış olabilir</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  onAnimationComplete={() => users.length === 0 && loadUsers()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">Kullanıcı Yönetimi</h2>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Kullanıcı ara..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <select 
                        value={userFilter} 
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">Tüm Kullanıcılar</option>
                        <option value="active">Aktif</option>
                        <option value="banned">Banlı</option>
                        <option value="online">Online</option>
                      </select>
                      <button 
                        onClick={loadUsers}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Yenile</span>
                      </button>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <input 
                                type="checkbox" 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers(users.map(u => u._id));
                                  } else {
                                    setSelectedUsers([]);
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kullanıcı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Level/XP
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durum
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kayıt Tarihi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users
                            .filter(user => {
                              if (userSearch && !user.username.toLowerCase().includes(userSearch.toLowerCase())) return false;
                              if (userFilter === 'active' && !user.isActive) return false;
                              if (userFilter === 'banned' && !user.moderationInfo?.isBanned) return false;
                              if (userFilter === 'online' && new Date() - new Date(user.lastActiveAt) > 5 * 60 * 1000) return false;
                              return true;
                            })
                            .map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input 
                                  type="checkbox" 
                                  checked={selectedUsers.includes(user._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers([...selectedUsers, user._id]);
                                    } else {
                                      setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover" 
                                      src={user.avatarUrls?.small || user.avatar || '/default-avatar.png'} 
                                      alt={user.username}
                                      onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Level {user.level}</div>
                                <div className="text-sm text-gray-500">{user.xp} XP</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.moderationInfo?.isBanned ? 'bg-red-100 text-red-800' :
                                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.moderationInfo?.isBanned ? 'Banlı' : user.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button 
                                  onClick={() => loadUserProfile(user._id)}
                                  disabled={userActionLoading}
                                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                  title="Profili Görüntüle"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => banUser(user._id)}
                                  disabled={userActionLoading || user.moderationInfo?.isBanned}
                                  className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                                  title={user.moderationInfo?.isBanned ? 'Zaten Banlı' : 'Kullanıcıyı Banla'}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteUser(user._id)}
                                  disabled={userActionLoading}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  title="Kullanıcıyı Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {selectedUsers.length > 0 && (
                      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-600">{selectedUsers.length} kullanıcı seçildi</span>
                        <div className="space-x-2">
                          <button className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                            Toplu Ban
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                            Toplu Sil
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  onAnimationComplete={() => conversations.length === 0 && loadConversations()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">Mesaj İzleme</h2>
                    <button 
                      onClick={loadConversations}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Yenile</span>
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Konuşma
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Katılımcılar
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mesaj Sayısı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Son Mesaj
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {conversations.map((conv) => (
                            <tr key={conv._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {conv.isGroup || conv.type === 'group' ? (conv.title || conv.name || 'Grup Konuşması') : 'Özel Konuşma'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {conv.participants?.map(p => p.username).join(', ')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {conv.messageCount || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleDateString('tr-TR') : 'Henüz mesaj yok'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button 
                                  onClick={() => loadConversationMessages(conv._id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Mesajları Görüntüle"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <Ban className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'friends' && (
                <motion.div
                  key="friends"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  onAnimationComplete={() => friendsData.length === 0 && loadFriendsData()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">Arkadaşlık İlişkileri</h2>
                    <button 
                      onClick={loadFriendsData}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Yenile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Toplam Takip İlişkisi</h3>
                        <Link className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{systemStats?.totalUsers || 0}</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Aktif Kullanıcı</h3>
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{systemStats?.activeUsers || 0}</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">En Popüler Kullanıcı</h3>
                        <Crown className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-black">Veri yükleniyor...</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-black">Arkadaşlık Ağı</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kullanıcı 1
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kullanıcı 2
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durum
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {friendsData.map((friendship) => (
                            <tr key={friendship._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {friendship.requester?.username || 'Kullanıcı'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {friendship.recipient?.username || 'Kullanıcı'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Takip Ediyor
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {friendship.createdAt ? new Date(friendship.createdAt).toLocaleDateString('tr-TR') : 'Tarih yok'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button className="text-red-600 hover:text-red-900">
                                  <UserX className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'content' && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  onAnimationComplete={() => !contentStats && loadContentStats()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">İçerik Analitik</h2>
                    <button 
                      onClick={loadContentStats}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Yenile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Toplam Gönderi</h3>
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{contentStats?.totalPosts || 0}</p>
                      <p className="text-sm text-gray-600">+{contentStats?.todayPosts || 0} bugün</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Toplam Beğeni</h3>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{contentStats?.totalLikes || 0}</p>
                      <p className="text-sm text-gray-600">+{contentStats?.todayLikes || 0} bugün</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Toplam Yorum</h3>
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{contentStats?.totalComments || 0}</p>
                      <p className="text-sm text-gray-600">+{contentStats?.todayComments || 0} bugün</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">En Popüler Bölge</h3>
                        <Globe className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-lg font-semibold text-black">{contentStats?.topRegion?.name || 'Veri yok'}</p>
                      <p className="text-sm text-gray-600">{contentStats?.topRegion?.count || 0} gönderi</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-black mb-4">Bölgelere Göre İçerik Dağılımı</h3>
                      <div className="space-y-3">
                        {contentStats?.regionDistribution?.map((region, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">{region._id}</span>
                            <span className="text-sm text-gray-600">{region.count} gönderi</span>
                          </div>
                        )) || <p className="text-gray-500 text-center py-4">Veri yükleniyor...</p>}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-black mb-4">En Aktif Kullanıcılar</h3>
                      <div className="space-y-3">
                        {contentStats?.topUsers?.map((user, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{user.username}</span>
                            </div>
                            <span className="text-sm text-gray-600">{user.postCount} gönderi</span>
                          </div>
                        )) || <p className="text-gray-500 text-center py-4">Veri yükleniyor...</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  onAnimationComplete={() => securityAlerts.length === 0 && loadSecurityAlerts()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">Güvenlik Yönetimi</h2>
                    <button 
                      onClick={loadSecurityAlerts}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Yenile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Aktif Uyarılar</h3>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{securityAlerts.filter(a => a.status === 'active').length}</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Banlı Kullanıcı</h3>
                        <Ban className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{systemStats?.bannedUsers || 0}</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Başarısız Giriş</h3>
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{systemStats?.failedLogins || 0}</p>
                      <p className="text-sm text-gray-600">Son 24 saat</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Güvenlik Skoru</h3>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-black">{systemStats?.securityScore || 95}%</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-black">Güvenlik Uyarıları</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Uyarı Tipi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Açıklama
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Önem Seviyesi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durum
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {securityAlerts.map((alert) => (
                            <tr key={alert._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {alert.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {alert.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {alert.severity === 'high' ? 'Yüksek' :
                                   alert.severity === 'medium' ? 'Orta' : 'Düşük'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(alert.createdAt).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  alert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {alert.status === 'active' ? 'Aktif' : 'Çözüldü'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  onAnimationComplete={() => systemLogs.length === 0 && loadSystemLogs()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">Sistem Kayıtları</h2>
                    <div className="flex items-center space-x-4">
                      <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-black focus:border-blue-500 focus:outline-none">
                        <option value="all">Tüm Kayıtlar</option>
                        <option value="admin">Admin İşlemleri</option>
                        <option value="user">Kullanıcı İşlemleri</option>
                        <option value="system">Sistem Olayları</option>
                        <option value="security">Güvenlik</option>
                      </select>
                      <button 
                        onClick={loadSystemLogs}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Yenile</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih/Saat
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlem
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kullanıcı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hedef
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Adresi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Önem
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {systemLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(log.createdAt).toLocaleString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {log.action}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.admin?.username || 'Sistem'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.targetType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.ipAddress}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  log.severity === 'high' ? 'bg-red-100 text-red-800' :
                                  log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {log.severity === 'high' ? 'Yüksek' :
                                   log.severity === 'medium' ? 'Orta' : 'Düşük'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                  onAnimationComplete={() => !settings && loadSettings()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">Sistem Ayarları</h2>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => {
                          if (settings) {
                            const newSettings = { ...settings };
                            newSettings.general.maintenanceMode = !newSettings.general.maintenanceMode;
                            setSettings(newSettings);
                            updateSettings('general', { general: newSettings.general });
                          }
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                          settings?.general?.maintenanceMode 
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <Server className="w-4 h-4" />
                        <span>{settings?.general?.maintenanceMode ? 'Bakım Modunu Kapat' : 'Bakım Modunu Aç'}</span>
                      </button>
                      <button 
                        onClick={loadSettings}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Yenile</span>
                      </button>
                    </div>
                  </div>

                  {settings && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* General Settings */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                          <Settings className="w-5 h-5 mr-2" />
                          Genel Ayarlar
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Adı</label>
                            <input
                              type="text"
                              value={settings.general.siteName}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                newSettings.general.siteName = e.target.value;
                                setSettings(newSettings);
                              }}
                              onBlur={(e) => {
                                if (e.target.value !== settings.general.siteName) {
                                  updateSettings('general', { general: settings.general });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Bakım Modu</span>
                            <button
                              onClick={() => {
                                const newSettings = { ...settings };
                                newSettings.general.maintenanceMode = !newSettings.general.maintenanceMode;
                                setSettings(newSettings);
                                updateSettings('general', { general: newSettings.general });
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                settings.general.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Kullanıcı Kaydına İzin Ver</span>
                            <button
                              onClick={() => {
                                const newSettings = { ...settings };
                                newSettings.general.allowUserRegistration = !newSettings.general.allowUserRegistration;
                                setSettings(newSettings);
                                updateSettings('general', { general: newSettings.general });
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                settings.general.allowUserRegistration ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.general.allowUserRegistration ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Security Settings */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          Güvenlik Ayarları
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Giriş Denemesi</label>
                            <input
                              type="number"
                              value={settings.security.maxLoginAttempts}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                newSettings.security.maxLoginAttempts = parseInt(e.target.value);
                                setSettings(newSettings);
                              }}
                              onBlur={(e) => {
                                const newValue = parseInt(e.target.value);
                                if (newValue !== settings.security.maxLoginAttempts && !isNaN(newValue)) {
                                  updateSettings('security', { security: settings.security });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kilitleme Süresi (dk)</label>
                            <input
                              type="number"
                              value={settings.security.lockoutDuration}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                newSettings.security.lockoutDuration = parseInt(e.target.value);
                                setSettings(newSettings);
                              }}
                              onBlur={(e) => {
                                const newValue = parseInt(e.target.value);
                                if (newValue !== settings.security.lockoutDuration && !isNaN(newValue)) {
                                  updateSettings('security', { security: settings.security });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">E-posta Doğrulaması Gerekli</span>
                            <button
                              onClick={() => {
                                const newSettings = { ...settings };
                                newSettings.security.requireEmailVerification = !newSettings.security.requireEmailVerification;
                                setSettings(newSettings);
                                updateSettings('security', { security: newSettings.security });
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                settings.security.requireEmailVerification ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.security.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Gaming Settings */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                          <Zap className="w-5 h-5 mr-2" />
                          Oyun Ayarları
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gönderi Başına XP</label>
                            <input
                              type="number"
                              value={settings.gaming.xpPerPost}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                newSettings.gaming.xpPerPost = parseInt(e.target.value);
                                setSettings(newSettings);
                              }}
                              onBlur={(e) => {
                                const newValue = parseInt(e.target.value);
                                if (!isNaN(newValue)) {
                                  updateSettings('gaming', { gaming: settings.gaming });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Level</label>
                            <input
                              type="number"
                              value={settings.gaming.maxLevelCap}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                newSettings.gaming.maxLevelCap = parseInt(e.target.value);
                                setSettings(newSettings);
                              }}
                              onBlur={(e) => {
                                const newValue = parseInt(e.target.value);
                                if (!isNaN(newValue)) {
                                  updateSettings('gaming', { gaming: settings.gaming });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Loncaları Etkinleştir</span>
                            <button
                              onClick={() => {
                                const newSettings = { ...settings };
                                newSettings.gaming.enableGuilds = !newSettings.gaming.enableGuilds;
                                setSettings(newSettings);
                                updateSettings('gaming', { gaming: newSettings.gaming });
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                settings.gaming.enableGuilds ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.gaming.enableGuilds ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content Settings */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          İçerik Ayarları
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Gönderi Uzunluğu</label>
                            <input
                              type="number"
                              value={settings.content.maxPostLength}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                newSettings.content.maxPostLength = parseInt(e.target.value);
                                setSettings(newSettings);
                              }}
                              onBlur={(e) => {
                                const newValue = parseInt(e.target.value);
                                if (newValue !== settings.content.maxPostLength && !isNaN(newValue)) {
                                  updateSettings('content', { content: settings.content });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Resim Yüklemelerine İzin Ver</span>
                            <button
                              onClick={() => {
                                const newSettings = { ...settings };
                                newSettings.content.allowImageUploads = !newSettings.content.allowImageUploads;
                                setSettings(newSettings);
                                updateSettings('content', { content: newSettings.content });
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                settings.content.allowImageUploads ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.content.allowImageUploads ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Otomatik Moderasyon</span>
                            <button
                              onClick={() => {
                                const newSettings = { ...settings };
                                newSettings.content.autoModerateContent = !newSettings.content.autoModerateContent;
                                setSettings(newSettings);
                                updateSettings('content', { content: newSettings.content });
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                settings.content.autoModerateContent ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.content.autoModerateContent ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* User Profile Modal */}
              {viewingUserProfile && selectedUser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => setViewingUserProfile(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h3 className="text-xl font-bold text-black flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Kullanıcı Profili: {selectedUser.username}
                      </h3>
                      <button
                        onClick={() => setViewingUserProfile(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    
                    <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                          <div className="flex items-center space-x-4">
                            <img
                              src={selectedUser.avatarUrls?.large || selectedUser.avatar || '/default-avatar.png'}
                              alt={selectedUser.username}
                              className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                              onError={(e) => { e.target.src = '/default-avatar.png'; }}
                            />
                            <div>
                              <h4 className="text-xl font-bold text-black">{selectedUser.username}</h4>
                              <p className="text-gray-600">{selectedUser.email}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  selectedUser.moderationInfo?.isBanned ? 'bg-red-100 text-red-800' :
                                  selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedUser.moderationInfo?.isBanned ? 'Banlı' : selectedUser.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                                {selectedUser.isOnline && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Online
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Star className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-gray-700">Level</span>
                              </div>
                              <p className="text-xl font-bold text-black">{selectedUser.level}</p>
                              <p className="text-xs text-gray-600">{selectedUser.xp} XP</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Award className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-700">Karakter Sınıfı</span>
                              </div>
                              <p className="text-lg font-bold text-black">{selectedUser.characterClass?.name || 'Belirlenmemiş'}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Kayıt Tarihi:</span>
                                <p className="text-sm text-black">{new Date(selectedUser.createdAt).toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <Activity className="w-4 h-4 text-green-600" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Son Aktivite:</span>
                                <p className="text-sm text-black">
                                  {selectedUser.lastActiveAt 
                                    ? new Date(selectedUser.lastActiveAt).toLocaleString('tr-TR')
                                    : 'Henüz giriş yapmamış'
                                  }
                                </p>
                              </div>
                            </div>

                            {selectedUser.bio && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Biyografi:</span>
                                <p className="text-sm text-black mt-1">{selectedUser.bio}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Statistics & Activity */}
                        <div className="space-y-6">
                          <div>
                            <h5 className="text-lg font-semibold text-black mb-4">İstatistikler</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{selectedUser.stats?.postsCount || 0}</p>
                                <p className="text-sm text-gray-600">Gönderi</p>
                              </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{selectedUser.stats?.followersCount || 0}</p>
                                <p className="text-sm text-gray-600">Takipçi</p>
                              </div>
                              <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">{selectedUser.stats?.followingCount || 0}</p>
                                <p className="text-sm text-gray-600">Takip</p>
                              </div>
                              <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <p className="text-2xl font-bold text-orange-600">{selectedUser.questsCompleted || 0}</p>
                                <p className="text-sm text-gray-600">Quest Tamamlandı</p>
                              </div>
                            </div>
                          </div>

                          {selectedUser.badges && selectedUser.badges.length > 0 && (
                            <div>
                              <h5 className="text-lg font-semibold text-black mb-4">Rozetler</h5>
                              <div className="flex flex-wrap gap-2">
                                {selectedUser.badges.map((badge, index) => (
                                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    🏆 {badge.name || badge}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedUser.guild && (
                            <div className="p-4 bg-indigo-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Users2 className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-gray-700">Lonca</span>
                              </div>
                              <p className="text-lg font-bold text-black">{selectedUser.guild.name}</p>
                              <p className="text-sm text-gray-600">Rol: {selectedUser.guild.role}</p>
                            </div>
                          )}

                          {selectedUser.moderationInfo?.isBanned && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <h5 className="text-lg font-semibold text-red-800 mb-2">Moderasyon Bilgileri</h5>
                              <p className="text-sm text-red-700">
                                <strong>Ban Nedeni:</strong> {selectedUser.moderationInfo.banReason || 'Belirtilmemiş'}
                              </p>
                              <p className="text-sm text-red-700">
                                <strong>Ban Tarihi:</strong> {
                                  selectedUser.moderationInfo.banDate 
                                    ? new Date(selectedUser.moderationInfo.banDate).toLocaleDateString('tr-TR')
                                    : 'Bilinmiyor'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Kullanıcı ID: {selectedUser._id}
                        </div>
                        <div className="flex space-x-2">
                          {!selectedUser.moderationInfo?.isBanned && (
                            <button 
                              onClick={() => {
                                setViewingUserProfile(false);
                                banUser(selectedUser._id);
                              }}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                            >
                              Kullanıcıyı Banla
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setViewingUserProfile(false);
                              deleteUser(selectedUser._id);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Kullanıcıyı Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Message Viewer Modal */}
              {viewingMessages && selectedConversation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => setViewingMessages(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h3 className="text-xl font-bold text-black">
                        {selectedConversation.name || selectedConversation.title || 'Konuşma Detayları'}
                      </h3>
                      <button
                        onClick={() => setViewingMessages(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Katılımcılar: {selectedConversation.participants?.length || 0}</span>
                        <span>Mesaj Sayısı: {selectedConversation.messageCount || 0}</span>
                        <span>Tür: {selectedConversation.type === 'group' ? 'Grup' : 'Özel'}</span>
                      </div>
                    </div>

                    <div className="overflow-y-auto max-h-96 p-6">
                      <div className="space-y-4">
                        {conversationMessages.map((message) => (
                          <div key={message._id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={message.sender?.avatar || '/default-avatar.png'}
                              alt={message.sender?.username}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => { e.target.src = '/default-avatar.png'; }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-black text-sm">
                                  {message.sender?.username || 'Bilinmeyen Kullanıcı'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleString('tr-TR')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                {typeof message.content === 'object' 
                                  ? message.content.text || 'İçerik bulunamadı' 
                                  : message.content || 'İçerik bulunamadı'
                                }
                              </p>
                              {((message.content?.files && message.content.files.length > 0) || 
                                (message.attachments && message.attachments.length > 0)) && (
                                <div className="mt-2">
                                  <span className="text-xs text-blue-600">
                                    📎 {message.content?.files?.length || message.attachments?.length || 0} ek dosya
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {conversationMessages.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            Bu konuşmada henüz mesaj bulunmuyor.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Son güncelleme: {new Date(selectedConversation.updatedAt).toLocaleString('tr-TR')}
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                            Konuşmayı Devre Dışı Bırak
                          </button>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                            Konuşmayı Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Other tabs */}
              {!['overview', 'users', 'messages', 'friends', 'content', 'security', 'logs', 'settings'].includes(activeTab) && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm"
                >
                  <h2 className="text-2xl font-bold text-black mb-4">
                    {tabs.find(t => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-gray-600">
                    Bu panel şu anda geliştirilme aşamasında...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}