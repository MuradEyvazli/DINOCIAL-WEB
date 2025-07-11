'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Crown, 
  Star, 
  Trophy, 
  Users, 
  MapPin, 
  Calendar,
  MessageCircle,
  UserPlus,
  UserCheck,
  ExternalLink,
  Zap,
  Target,
  Award,
  Heart
} from 'lucide-react';

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  userId, 
  profileData,
  currentUser 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(profileData || null);

  useEffect(() => {
    if (isOpen && userId && !profileData) {
      fetchUserProfile();
    } else if (profileData) {
      setProfile(profileData);
    }
  }, [isOpen, userId, profileData]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    onClose();
    router.push(`/user/${userId}`);
  };

  const handleSendMessage = () => {
    onClose();
    router.push(`/messages?user=${userId}`);
  };

  const handleAddFriend = async () => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientId: userId })
      });

      if (response.ok) {
        // Optionally update UI to show request sent
        console.log('Friend request sent');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="relative w-full max-w-2xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl border border-blue-200/50 shadow-2xl overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <motion.div
                  className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-slate-600">Profil yükleniyor...</p>
              </div>
            </div>
          )}

          {/* Profile Content */}
          {profile && !isLoading && (
            <div className="relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-white/20 to-blue-200/20"></div>
              
              <div className="relative p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
                  {/* Avatar */}
                  <motion.div 
                    className="relative"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r ${profile.characterClass?.color || 'from-blue-400 to-blue-600'} blur-xl opacity-30 animate-pulse`}></div>
                      <div className={`relative w-32 h-32 rounded-full bg-gradient-to-r ${profile.characterClass?.color || 'from-blue-400 to-blue-600'} flex items-center justify-center text-5xl border-4 border-white/30 shadow-2xl overflow-hidden`}>
                        {profile.avatar ? (
                          <img 
                            src={profile.avatar} 
                            alt={`${profile.username} profil fotoğrafı`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="drop-shadow-lg">{profile.characterClass?.icon || '👤'}</span>
                        )}
                      </div>
                      
                      {/* Level Badge */}
                      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg border-3 border-white">
                        {profile.level || 1}
                      </div>
                      
                      {/* Online Status */}
                      <div className="absolute top-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    </div>
                  </motion.div>

                  {/* Info Section */}
                  <div className="flex-1 text-center md:text-left">
                    <motion.h2 
                      className="text-4xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {profile.username}
                    </motion.h2>
                    
                    <motion.p 
                      className="text-xl text-blue-600 mb-4 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Seviye {profile.level} {profile.characterClass?.name || 'Gezgin'}
                    </motion.p>

                    {/* Quick Stats */}
                    <motion.div 
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {[
                        { value: profile.stats?.postsCount || 0, label: "Gönderi", icon: "📝" },
                        { value: profile.social?.followersCount || 0, label: "Takipçi", icon: "👥" },
                        { value: profile.achievements?.count || 0, label: "Başarım", icon: "🏆" },
                        { value: profile.stats?.impactScore || 0, label: "Etki", icon: "⚡" }
                      ].map((stat, index) => (
                        <div key={stat.label} className="text-center p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-blue-200/30">
                          <div className="text-2xl mb-1">{stat.icon}</div>
                          <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                          <div className="text-slate-600 text-sm">{stat.label}</div>
                        </div>
                      ))}
                    </motion.div>

                    {/* Character Class Description */}
                    {profile.characterClass?.description && (
                      <motion.p 
                        className="text-slate-600 mb-6 text-sm leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {profile.characterClass.description}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Recent Achievements */}
                {profile.achievements && profile.achievements.recentBadges && profile.achievements.recentBadges.length > 0 && (
                  <motion.div 
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <Award className="w-5 h-5 text-blue-500 mr-2" />
                      Son Başarımlar
                    </h3>
                    <div className="flex space-x-3 overflow-x-auto">
                      {profile.achievements.recentBadges.map((achievement, index) => (
                        <div key={index} className="flex-shrink-0 text-center p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-blue-200/30 min-w-[80px]">
                          <div className="text-2xl mb-1">{achievement.icon || '🏆'}</div>
                          <div className="text-xs text-slate-600 font-medium">{achievement.name}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                {currentUser && currentUser.id !== profile.id && (
                  <motion.div 
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <button
                      onClick={handleViewFullProfile}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>Profili Görüntüle</span>
                    </button>
                    
                    <button
                      onClick={handleSendMessage}
                      className="flex-1 flex items-center justify-center space-x-2 bg-white border-2 border-blue-200 text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Mesaj Gönder</span>
                    </button>
                    
                    <button
                      onClick={handleAddFriend}
                      className="flex items-center justify-center space-x-2 bg-white border-2 border-blue-200 text-blue-600 px-4 py-3 rounded-xl font-medium hover:bg-blue-50 transition-all"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="hidden sm:inline">Arkadaş Ekle</span>
                    </button>
                  </motion.div>
                )}

                {/* Self Profile View */}
                {currentUser && currentUser.id === profile.id && (
                  <motion.div 
                    className="flex justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <button
                      onClick={handleViewFullProfile}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>Profilimi Düzenle</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}