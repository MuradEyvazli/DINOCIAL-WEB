// lib/constants/index.js - Updated with CHARACTER_CLASSES
export const CHARACTER_CLASSES = [
  {
    id: 'artist',
    name: 'Sanatçı',
    description: 'Yaratıcılık ve estetikle güçlenen sınıf',
    icon: '🎨',
    color: 'from-purple-500 to-pink-500',
    abilities: ['Yaratıcı İçerik Bonusu', 'Estetik Analiz', 'Sanat Değerlendirmesi']
  },
  {
    id: 'explorer',
    name: 'Keşifçi', 
    description: 'Yeni bölgeleri ve içerikleri keşfeden cesur ruh',
    icon: '🗺️',
    color: 'from-green-500 to-blue-500',
    abilities: ['Bölge Bonusu', 'Keşif Ödülü', 'Harita Navigasyonu']
  },
  {
    id: 'guardian',
    name: 'Koruyucu',
    description: 'Topluluk değerlerini koruyan ve düzen sağlayan',
    icon: '🛡️',
    color: 'from-amber-500 to-yellow-500',
    abilities: ['Moderasyon Bonusu', 'Güven Puanı', 'Topluluk Koruması']
  },
  {
    id: 'sage',
    name: 'Bilge',
    description: 'Bilgi ve hikmetle yol gösteren akıl ustası',
    icon: '📚',
    color: 'from-blue-500 to-indigo-500',
    abilities: ['Bilgi Bonusu', 'Analiz Gücü', 'Öğretim Yeteneği']
  },
  {
    id: 'entertainer',
    name: 'Şovmen',
    description: 'Mizah ve eğlenceyle topluluk ruhunu güçlendiren',
    icon: '🎭',
    color: 'from-orange-500 to-red-500',
    abilities: ['Mizah Bonusu', 'Eğlence Gücü', 'Moral Desteği']
  },
  {
    id: 'builder',
    name: 'İnşaatçı',
    description: 'Topluluk projelerini hayata geçiren pratik usta',
    icon: '🔨',
    color: 'from-gray-500 to-slate-500',
    abilities: ['Proje Bonusu', 'İnşa Yeteneği', 'Sistem Kurma']
  }
];

export const REGIONS = [
  {
    id: 'humor_valley',
    name: 'Mizah Vadisi',
    description: 'Gülümseme ve neşenin hüküm sürdüğü bölge',
    theme: 'humor',
    color: 'from-yellow-400 to-orange-400',
    icon: '😄',
    levelRequirement: 1
  },
  {
    id: 'emotion_forest',
    name: 'Duygu Ormanı',
    description: 'Derin hislerin ve anlamlı paylaşımların merkezi',
    theme: 'emotion',
    color: 'from-emerald-400 to-teal-400',
    icon: '🌲',
    levelRequirement: 3
  },
  {
    id: 'knowledge_peak',
    name: 'Bilgi Zirvesi',
    description: 'Öğrenme ve paylaşımın en üst noktası',
    theme: 'knowledge',
    color: 'from-blue-400 to-indigo-400',
    icon: '🏔️',
    levelRequirement: 5
  },
  {
    id: 'creativity_realm',
    name: 'Yaratıcılık Diyarı',
    description: 'Sanat ve yaratıcılığın sınırsız olduğu alan',
    theme: 'creativity',
    color: 'from-purple-400 to-pink-400',
    icon: '✨',
    levelRequirement: 7
  },
  {
    id: 'debate_arena',
    name: 'Tartışma Arenası',
    description: 'Fikir alışverişi ve münazaraların yapıldığı yer',
    theme: 'debate',
    color: 'from-red-400 to-rose-400',
    icon: '⚔️',
    levelRequirement: 10
  }
];

export const QUEST_TYPES = {
  SOCIAL: 'social',
  EXPLORATION: 'exploration', 
  CREATIVITY: 'creativity',
  CHALLENGE: 'challenge'
};

export const QUEST_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  LEGENDARY: 'legendary'
};

export const INTERACTION_TYPES = {
  POWER: 'power',      // Güç - Beğeni alternatifi
  WISDOM: 'wisdom',    // Bilgelik - Düşündürücü içerik
  CREATIVITY: 'creativity', // Yaratıcılık - Özgün içerik
  SUPPORT: 'support'   // Destek - Yardımcı içerik
};

export const BADGE_RARITIES = {
  COMMON: 'common',
  RARE: 'rare', 
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const XP_REWARDS = {
  POST: 10,
  COMMENT: 5,
  INTERACTION_GIVEN: 2,
  INTERACTION_RECEIVED: 3,
  QUEST_EASY: 25,
  QUEST_MEDIUM: 50,
  QUEST_HARD: 100,
  QUEST_LEGENDARY: 250,
  DAILY_LOGIN: 5,
  FIRST_VISIT_REGION: 15,
  FOLLOW_USER: 1,
  GET_FOLLOWED: 2,
  LEVEL_UP: 50,
  BADGE_EARNED: 25
};

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 
  15500, 17300, 19200, 21200, 23300, 25500, 27800
];

export const DEFAULT_QUESTS = [
  {
    id: 'daily_social',
    title: 'Sosyal Butterfly',
    description: '3 farklı sınıftan kullanıcıyla etkileşim kur',
    type: QUEST_TYPES.SOCIAL,
    difficulty: QUEST_DIFFICULTIES.EASY,
    xpReward: 25,
    requirements: [
      {
        type: 'interact_with_class',
        target: 3,
        description: '3 farklı sınıftan kullanıcıya yorum yap veya etkileşim ver'
      }
    ],
    isDaily: true
  },
  {
    id: 'region_explorer',
    title: 'Bölge Kaşifi',
    description: '2 farklı bölgede içerik paylaş',
    type: QUEST_TYPES.EXPLORATION,
    difficulty: QUEST_DIFFICULTIES.MEDIUM,
    xpReward: 50,
    requirements: [
      {
        type: 'post_in_regions',
        target: 2,
        description: '2 farklı bölgede gönderi paylaş'
      }
    ],
    isDaily: true
  },
  {
    id: 'creative_master',
    title: 'Yaratıcılık Ustası',
    description: 'Yüksek yaratıcılık puanı alan bir içerik oluştur',
    type: QUEST_TYPES.CREATIVITY,
    difficulty: QUEST_DIFFICULTIES.HARD,
    xpReward: 100,
    requirements: [
      {
        type: 'high_creativity_score',
        target: 80,
        description: '80+ yaratıcılık puanı alan içerik paylaş'
      }
    ],
    isDaily: false
  },
  {
    id: 'weekly_networker',
    title: 'Ağ Kurucusu',
    description: '5 yeni kullanıcıyı takip et',
    type: QUEST_TYPES.SOCIAL,
    difficulty: QUEST_DIFFICULTIES.MEDIUM,
    xpReward: 75,
    requirements: [
      {
        type: 'follow_users',
        target: 5,
        description: '5 farklı kullanıcıyı takip et'
      }
    ],
    isWeekly: true
  }
];

// Notification types
export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MENTION: 'mention',
  QUEST_COMPLETED: 'quest_completed',
  LEVEL_UP: 'level_up',
  BADGE_EARNED: 'badge_earned',
  GUILD_INVITE: 'guild_invite',
  MESSAGE: 'message',
  SYSTEM: 'system'
};

// Privacy settings
export const PRIVACY_SETTINGS = {
  PROFILE_VISIBILITY: {
    PUBLIC: 'public',
    FRIENDS: 'friends',
    PRIVATE: 'private'
  },
  MESSAGE_PERMISSIONS: {
    EVERYONE: 'everyone',
    FRIENDS: 'friends',
    NONE: 'none'
  }
};

// Theme options
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  AUTO: 'auto'
};

// Language options
export const LANGUAGES = {
  TURKISH: 'tr',
  ENGLISH: 'en',
  GERMAN: 'de'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh'
  },
  USERS: {
    SEARCH: '/api/users/search',
    PROFILE: (username) => `/api/users/${username}`,
    FOLLOW: (username) => `/api/users/${username}/follow`,
    AVATAR: '/api/user/avatar',
    SETTINGS: '/api/user/settings'
  },
  QUESTS: {
    USER: '/api/quests/user',
    AVAILABLE: '/api/quests/available',
    ACCEPT: (id) => `/api/quests/${id}/accept`,
    COMPLETE: (id) => `/api/quests/${id}/complete`,
    ABANDON: (id) => `/api/quests/${id}/abandon`
  },
  REGIONS: {
    FEED: (id) => `/api/regions/${id}/feed`,
    CHANGE: '/api/user/region'
  },
  POSTS: {
    CREATE: '/api/posts',
    REACT: (id) => `/api/posts/${id}/react`,
    COMMENT: (id) => `/api/posts/${id}/comments`
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ağ bağlantısı hatası',
  UNAUTHORIZED: 'Yetkisiz erişim',
  FORBIDDEN: 'Bu işlem için izniniz yok',
  NOT_FOUND: 'İstenen kaynak bulunamadı',
  VALIDATION_ERROR: 'Girilen bilgiler geçersiz',
  SERVER_ERROR: 'Sunucu hatası oluştu'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Başarıyla giriş yapıldı',
  REGISTER_SUCCESS: 'Hesap başarıyla oluşturuldu',
  PROFILE_UPDATED: 'Profil güncellendi',
  SETTINGS_UPDATED: 'Ayarlar güncellendi',
  QUEST_COMPLETED: 'Görev tamamlandı',
  FOLLOW_SUCCESS: 'Kullanıcı takip edildi',
  UNFOLLOW_SUCCESS: 'Kullanıcı takipten çıkarıldı'
};

export default {
  CHARACTER_CLASSES,
  REGIONS,
  QUEST_TYPES,
  QUEST_DIFFICULTIES,
  INTERACTION_TYPES,
  BADGE_RARITIES,
  XP_REWARDS,
  LEVEL_THRESHOLDS,
  DEFAULT_QUESTS,
  NOTIFICATION_TYPES,
  PRIVACY_SETTINGS,
  THEMES,
  LANGUAGES,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};