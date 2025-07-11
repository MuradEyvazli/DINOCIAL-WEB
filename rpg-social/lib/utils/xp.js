// lib/utils/xp.js
import axios from 'axios';

export const XP_REWARDS = {
  POST_CREATED: 50,
  POST_LIKED: 10,
  COMMENT_CREATED: 25,
  STORY_CREATED: 30,
  STORY_LIKED: 15,
  FRIEND_ADDED: 20,
  DAILY_LOGIN: 100,
  QUEST_COMPLETED: 200,
  GUILD_JOINED: 150,
  ACHIEVEMENT_UNLOCKED: 300
};

export const XP_REASONS = {
  POST_CREATED: 'Gönderi paylaşımı',
  POST_LIKED: 'Gönderi beğenisi',
  COMMENT_CREATED: 'Yorum yazma', 
  STORY_CREATED: 'Hikaye paylaşımı',
  STORY_LIKED: 'Hikaye beğenisi',
  FRIEND_ADDED: 'Arkadaş ekleme',
  DAILY_LOGIN: 'Günlük giriş',
  QUEST_COMPLETED: 'Görev tamamlama',
  GUILD_JOINED: 'Lonca katılımı',
  ACHIEVEMENT_UNLOCKED: 'Başarım kazanma'
};

export async function gainXP(action, customAmount = null) {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const xpAmount = customAmount || XP_REWARDS[action] || 0;
    const reason = XP_REASONS[action] || 'Aktivite';

    if (xpAmount <= 0) return;

    const response = await axios.post('/api/levels/progression', {
      xpGained: xpAmount,
      reason
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error('XP gain error:', error);
  }
}

export function shouldShowXPGain(action) {
  // Some actions should show XP gain notifications
  const showForActions = [
    'POST_CREATED',
    'QUEST_COMPLETED', 
    'ACHIEVEMENT_UNLOCKED',
    'GUILD_JOINED',
    'DAILY_LOGIN'
  ];
  
  return showForActions.includes(action);
}

export function getTierByLevel(level) {
  if (level <= 10) return { name: 'Beginner', color: '#64748b', icon: '🌱' };
  if (level <= 20) return { name: 'Novice', color: '#06b6d4', icon: '🌿' };
  if (level <= 30) return { name: 'Apprentice', color: '#10b981', icon: '🌸' };
  if (level <= 40) return { name: 'Adept', color: '#3b82f6', icon: '🌟' };
  if (level <= 50) return { name: 'Expert', color: '#8b5cf6', icon: '💎' };
  if (level <= 60) return { name: 'Master', color: '#f59e0b', icon: '👑' };
  if (level <= 70) return { name: 'Grandmaster', color: '#ef4444', icon: '⚔️' };
  if (level <= 80) return { name: 'Legend', color: '#ec4899', icon: '🏆' };
  if (level <= 90) return { name: 'Mythic', color: '#7c3aed', icon: '🔮' };
  return { name: 'Divine', color: '#dc2626', icon: '☀️' };
}

export function formatXP(xp) {
  if (xp >= 1000000) {
    return (xp / 1000000).toFixed(1) + 'M';
  }
  if (xp >= 1000) {
    return (xp / 1000).toFixed(1) + 'K';
  }
  return xp.toString();
}

export function getNextMilestone(level) {
  const milestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  return milestones.find(milestone => milestone > level) || 100;
}