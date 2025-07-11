// lib/utils/notificationSimulator.js
import { store } from '@/lib/redux/store';
import { createNotification } from '@/lib/redux/slices/notificationsSlice';
import { simulateIncomingFriendRequest } from '@/lib/redux/slices/friendsSlice';

// Fake users for simulation
const FAKE_USERS = [
  {
    _id: 'sim_user_1',
    username: 'ahmet_istanbul',
    level: 15,
    characterClass: {
      name: 'Aktivist',
      icon: '✊',
      color: 'from-red-400 to-red-600'
    },
    stats: {
      impactScore: 1250,
      friendsCount: 12
    },
    avatar: null
  },
  {
    _id: 'sim_user_2',
    username: 'zeynep_ankara',
    level: 22,
    characterClass: {
      name: 'Toplum Lideri',
      icon: '🌟',
      color: 'from-yellow-400 to-yellow-600'
    },
    stats: {
      impactScore: 2150,
      friendsCount: 28
    },
    avatar: null
  },
  {
    _id: 'sim_user_3',
    username: 'mehmet_izmir',
    level: 8,
    characterClass: {
      name: 'Gönüllü',
      icon: '🤝',
      color: 'from-green-400 to-green-600'
    },
    stats: {
      impactScore: 680,
      friendsCount: 5
    },
    avatar: null
  },
  {
    _id: 'sim_user_4',
    username: 'ayse_bursa',
    level: 18,
    characterClass: {
      name: 'Değişim Temsilcisi',
      icon: '🎯',
      color: 'from-purple-400 to-purple-600'
    },
    stats: {
      impactScore: 1580,
      friendsCount: 18
    },
    avatar: null
  },
  {
    _id: 'sim_user_5',
    username: 'can_antalya',
    level: 12,
    characterClass: {
      name: 'Çevre Koruyucusu',
      icon: '🌱',
      color: 'from-emerald-400 to-emerald-600'
    },
    stats: {
      impactScore: 940,
      friendsCount: 8
    },
    avatar: null
  }
];

// Notification templates
const NOTIFICATION_TEMPLATES = {
  friend_request: (sender) => ({
    type: 'friend_request',
    title: 'Yeni Arkadaşlık İsteği',
    message: `${sender.username} sana arkadaşlık isteği gönderdi`,
    data: {
      senderId: sender._id,
      senderName: sender.username,
      senderLevel: sender.level,
      senderClass: sender.characterClass?.name
    }
  }),
  
  new_message: (sender) => ({
    type: 'new_message',
    title: 'Yeni Mesaj',
    message: `${sender.username} sana mesaj gönderdi`,
    data: {
      senderId: sender._id,
      senderName: sender.username,
      conversationId: `conv_${Date.now()}`
    }
  }),
  
  quest_completed: () => {
    const quests = [
      'Çevre Temizliği',
      'Ağaç Dikimi',
      'Hayır Organizasyonu',
      'Gönüllü Çalışması',
      'Eğitim Desteği'
    ];
    const quest = quests[Math.floor(Math.random() * quests.length)];
    const xp = Math.floor(Math.random() * 200) + 50;
    
    return {
      type: 'quest_completed',
      title: 'Görev Tamamlandı!',
      message: `"${quest}" görevini başarıyla tamamladın! +${xp} XP kazandın`,
      data: {
        questId: `quest_${Date.now()}`,
        questTitle: quest,
        xpEarned: xp
      }
    };
  },
  
  achievement_unlocked: () => {
    const achievements = [
      { name: 'İlk Adım', desc: 'İlk görevinizi tamamladınız' },
      { name: 'Sosyal Kelebek', desc: '10 arkadaş edindiniz' },
      { name: 'Çevre Dostu', desc: '5 çevre görevi tamamladınız' },
      { name: 'Yardımsever', desc: '1000 etki puanına ulaştınız' },
      { name: 'Lider', desc: '100 takipçiye ulaştınız' }
    ];
    const achievement = achievements[Math.floor(Math.random() * achievements.length)];
    
    return {
      type: 'achievement_unlocked',
      title: 'Başarım Açıldı! 🏆',
      message: `"${achievement.name}" başarımını kazandınız: ${achievement.desc}`,
      data: {
        achievementId: `achievement_${Date.now()}`,
        achievementName: achievement.name,
        achievementDesc: achievement.desc
      }
    };
  }
};

// Get random user
const getRandomUser = () => {
  return FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
};

// Simulate friend request
export const simulateFriendRequest = () => {
  const sender = getRandomUser();
  
  // Create incoming friend request
  store.dispatch(simulateIncomingFriendRequest({ sender }));
  
  // Create notification
  const notification = NOTIFICATION_TEMPLATES.friend_request(sender);
  store.dispatch(createNotification(notification));
  
  console.log('Simulated friend request from:', sender.username);
};

// Simulate new message
export const simulateNewMessage = () => {
  const sender = getRandomUser();
  const notification = NOTIFICATION_TEMPLATES.new_message(sender);
  
  store.dispatch(createNotification(notification));
  
  console.log('Simulated message from:', sender.username);
};

// Simulate quest completion
export const simulateQuestCompleted = () => {
  const notification = NOTIFICATION_TEMPLATES.quest_completed();
  
  store.dispatch(createNotification(notification));
  
  console.log('Simulated quest completion:', notification.data.questTitle);
};

// Simulate achievement unlock
export const simulateAchievementUnlocked = () => {
  const notification = NOTIFICATION_TEMPLATES.achievement_unlocked();
  
  store.dispatch(createNotification(notification));
  
  console.log('Simulated achievement unlock:', notification.data.achievementName);
};

// Simulate random notification
export const simulateRandomNotification = () => {
  const types = ['friend_request', 'new_message', 'quest_completed', 'achievement_unlocked'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  switch (randomType) {
    case 'friend_request':
      simulateFriendRequest();
      break;
    case 'new_message':
      simulateNewMessage();
      break;
    case 'quest_completed':
      simulateQuestCompleted();
      break;
    case 'achievement_unlocked':
      simulateAchievementUnlocked();
      break;
  }
};

// Auto-simulate notifications (for demo purposes)
export const startNotificationSimulation = () => {
  // Simulate first notification after 3 seconds
  setTimeout(() => {
    simulateFriendRequest();
  }, 3000);
  
  // Simulate random notifications every 30-60 seconds
  const interval = setInterval(() => {
    if (Math.random() > 0.3) { // 70% chance
      simulateRandomNotification();
    }
  }, 45000); // Every 45 seconds
  
  return interval;
};

// Stop simulation
export const stopNotificationSimulation = (interval) => {
  if (interval) {
    clearInterval(interval);
  }
};

// Development helper - add test buttons to console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.rpgSocialDev = {
    simulateFriendRequest,
    simulateNewMessage,
    simulateQuestCompleted,
    simulateAchievementUnlocked,
    simulateRandomNotification,
    startNotificationSimulation,
    stopNotificationSimulation
  };
  
  console.log('🎮 RPG Social Dev Tools loaded!');
  console.log('Use window.rpgSocialDev to simulate notifications:');
  console.log('- rpgSocialDev.simulateFriendRequest()');
  console.log('- rpgSocialDev.simulateNewMessage()');
  console.log('- rpgSocialDev.simulateQuestCompleted()');
  console.log('- rpgSocialDev.simulateAchievementUnlocked()');
  console.log('- rpgSocialDev.simulateRandomNotification()');
}