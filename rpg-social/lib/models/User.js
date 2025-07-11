// lib/models/User.js - Cloudinary entegrasyonu ile güncellenmiş
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'E-posta adresi gereklidir'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi giriniz']
  },
  
  username: {
    type: String,
    required: [true, 'Kullanıcı adı gereklidir'],
    unique: true,
    minlength: [3, 'Kullanıcı adı en az 3 karakter olmalıdır'],
    maxlength: [20, 'Kullanıcı adı en fazla 20 karakter olabilir'],
    trim: true
  },
  
  password: {
    type: String,
    required: [true, 'Şifre gereklidir'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false // Password'u default olarak select etme
  },
  
  // Karakter bilgileri
  characterClass: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    abilities: [{
      type: String
    }]
  },
  
  // Oyun istatistikleri
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Kullanıcı istatistikleri
  stats: {
    postsCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    likesGiven: {
      type: Number,
      default: 0
    },
    likesReceived: {
      type: Number,
      default: 0
    },
    questsCompleted: {
      type: Number,
      default: 0
    },
    impactScore: {
      type: Number,
      default: 0
    },
    levelHistory: [{
      level: Number,
      achievedAt: Date,
      xpAtAchievement: Number,
      reason: String
    }],
    totalXPGained: {
      type: Number,
      default: 0
    },
    dailyXP: {
      type: Number,
      default: 0
    },
    lastXPReset: {
      type: Date,
      default: Date.now
    }
  },
  
  // Başarımlar ve rozetler
  badges: [{
    id: String,
    name: String,
    icon: String,
    description: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Oyun ilerlemesi
  visitedRegions: {
    type: [String],
    default: ['humor_valley'] // Başlangıç bölgesi
  },
  
  unlockedRegions: {
    type: [String],
    default: ['humor_valley']
  },
  
  currentRegion: {
    type: String,
    default: 'humor_valley'
  },
  
  // Sosyal veriler
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  following: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Hesap durumu
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Son aktivite
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  
  // Profil bilgileri
  bio: {
    type: String,
    maxlength: [500, 'Bio en fazla 500 karakter olabilir'],
    default: ''
  },
  
  // CLOUDINARY AVATAR ENTEGRASYONU - YENİ ALANLAR
  avatar: {
    type: String, // Ana avatar URL'i (geriye uyumluluk için)
    default: null
  },
  
  // Cloudinary spesifik alanlar
  cloudinaryPublicId: {
    type: String, // Cloudinary'daki public_id
    default: null,
    index: true // Hızlı silme işlemleri için
  },
  
  // Farklı boyutlarda avatar URL'leri
  avatarUrls: {
    original: { type: String, default: null },
    large: { type: String, default: null },    // 400x400
    medium: { type: String, default: null },   // 150x150
    small: { type: String, default: null },    // 64x64
    tiny: { type: String, default: null }      // 32x32
  },
  
  // Avatar metadata
  avatarMetadata: {
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    format: { type: String, default: null },
    size: { type: Number, default: null }, // bytes
    uploadedAt: { type: Date, default: null }
  },
  
  // Nexus Admin Profile - Gizli admin erişimi için
  nexusProfile: {
    quantumHash: {
      type: String,
      default: null,
      index: true
    },
    lastAccess: {
      type: Date,
      default: null
    },
    accessCount: {
      type: Number,
      default: 0
    },
    lastIpAddress: {
      type: String,
      default: null
    },
    securityLevel: {
      type: String,
      enum: ['ALPHA', 'BETA', 'OMEGA'],
      default: 'ALPHA'
    }
  },

  // User Role System
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'super_admin'],
    default: 'user',
    index: true
  },

  // Moderation Info
  moderationInfo: {
    isBanned: {
      type: Boolean,
      default: false
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    bannedAt: {
      type: Date,
      default: null
    },
    banReason: {
      type: String,
      default: null
    },
    banExpiresAt: {
      type: Date,
      default: null
    },
    warnings: [{
      moderator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    notes: [{
      admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      note: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Genişletilmiş Tercihler - Settings için
  preferences: {
    // Bildirim tercihleri
    notifications: {
      email: {
        achievements: {
          type: Boolean,
          default: true
        },
        quests: {
          type: Boolean,
          default: true
        },
        guild: {
          type: Boolean,
          default: true
        },
        messages: {
          type: Boolean,
          default: true
        },
        marketing: {
          type: Boolean,
          default: false
        }
      },
      push: {
        achievements: {
          type: Boolean,
          default: true
        },
        quests: {
          type: Boolean,
          default: true
        },
        guild: {
          type: Boolean,
          default: true
        },
        messages: {
          type: Boolean,
          default: true
        },
        mentions: {
          type: Boolean,
          default: true
        }
      },
      inApp: {
        achievements: {
          type: Boolean,
          default: true
        },
        quests: {
          type: Boolean,
          default: true
        },
        guild: {
          type: Boolean,
          default: true
        },
        messages: {
          type: Boolean,
          default: true
        },
        sound: {
          type: Boolean,
          default: true
        }
      }
    },
    
    // Gizlilik tercihleri
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      showStats: {
        type: Boolean,
        default: true
      },
      showActivity: {
        type: Boolean,
        default: true
      },
      allowDirectMessages: {
        type: Boolean,
        default: true
      },
      showOnlineStatus: {
        type: Boolean,
        default: true
      }
    },
    
    // Genel tercihler
    theme: {
      type: String,
      enum: ['dark', 'light', 'auto'],
      default: 'dark'
    },
    language: {
      type: String,
      enum: ['tr', 'en', 'de'],
      default: 'tr'
    },
    timezone: {
      type: String,
      default: 'Europe/Istanbul'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    compactMode: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true, // createdAt ve updatedAt otomatik eklenir
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Şifre hash'leme middleware
userSchema.pre('save', async function(next) {
  // Eğer şifre değiştirilmediyse, devam et
  if (!this.isModified('password')) return next();
  
  try {
    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Default regions ve preferences ayarlama middleware
userSchema.pre('save', function(next) {
  // Ensure visitedRegions and unlockedRegions have at least the starting region
  if (!this.visitedRegions || this.visitedRegions.length === 0) {
    this.visitedRegions = ['humor_valley'];
  }
  
  if (!this.unlockedRegions || this.unlockedRegions.length === 0) {
    this.unlockedRegions = ['humor_valley'];
  }
  
  // Ensure level is at least 1
  if (!this.level || this.level < 1) {
    this.level = 1;
  }
  
  // Eğer preferences yoksa, default'ları ayarla
  if (!this.preferences) {
    this.preferences = {};
  }
  
  // Notifications default'ları
  if (!this.preferences.notifications) {
    this.preferences.notifications = {
      email: {
        achievements: true,
        quests: true,
        guild: true,
        messages: true,
        marketing: false
      },
      push: {
        achievements: true,
        quests: true,
        guild: true,
        messages: true,
        mentions: true
      },
      inApp: {
        achievements: true,
        quests: true,
        guild: true,
        messages: true,
        sound: true
      }
    };
  }
  
  // Privacy default'ları
  if (!this.preferences.privacy) {
    this.preferences.privacy = {
      profileVisibility: 'public',
      showStats: true,
      showActivity: true,
      allowDirectMessages: true,
      showOnlineStatus: true
    };
  }
  
  next();
});

// Kullanıcı silinmeden önce Cloudinary'dan avatarı da sil
userSchema.pre('remove', async function(next) {
  if (this.cloudinaryPublicId) {
    try {
      const { v2: cloudinary } = require('cloudinary');
      await cloudinary.uploader.destroy(this.cloudinaryPublicId);
      console.log('🗑️ Cloudinary avatar silindi:', this.cloudinaryPublicId);
    } catch (error) {
      console.error('❌ Cloudinary avatar silme hatası:', error);
    }
  }
  next();
});

// VIRTUAL FIELDS

// Avatar display - öncelik sırası: Cloudinary URLs > avatar > varsayılan
userSchema.virtual('avatarDisplay').get(function() {
  if (this.avatarUrls && this.avatarUrls.medium) {
    return this.avatarUrls.medium;
  }
  if (this.avatar) {
    return this.avatar;
  }
  return null;
});

// Avatar thumbnail için
userSchema.virtual('avatarThumbnail').get(function() {
  if (this.avatarUrls && this.avatarUrls.small) {
    return this.avatarUrls.small;
  }
  if (this.avatar) {
    return this.avatar;
  }
  return null;
});

// Level calculation using database levels (async method required)
userSchema.methods.calculateLevel = async function() {
  const Level = require('./Level').default;
  const levelData = await Level.getLevelByXP(this.xp || 0);
  return levelData ? levelData.level : 1;
};

// Get next level XP requirement (async method)
userSchema.methods.getXPToNextLevel = async function() {
  const Level = require('./Level').default;
  const progression = await Level.getLevelProgression(this.level, this.xp || 0);
  return progression ? progression.xpNeededForNext : 0;
};

// Calculate level from XP
userSchema.virtual('calculatedLevel').get(function() {
  // Simple synchronous calculation based on thresholds
  const thresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 
    4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 
    15500, 17300, 19200, 21200, 23300, 25500, 27800];
  
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (this.xp >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, 100); // Cap at level 100
});

// XP needed to reach next level
userSchema.virtual('xpToNextLevel').get(function() {
  const thresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 
    4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 
    15500, 17300, 19200, 21200, 23300, 25500, 27800];
  
  if (this.level >= thresholds.length) {
    return 0; // Max level reached
  }
  
  const nextThreshold = thresholds[this.level] || 0;
  return Math.max(0, nextThreshold - this.xp);
});

// Online status kontrolü
userSchema.virtual('isOnline').get(function() {
  if (!this.lastActiveAt) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActiveAt > fiveMinutesAgo;
});

// INSTANCE METHODS

// Şifre karşılaştırma method'u
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Şifre karşılaştırma hatası');
  }
};

// Avatar URL'i al (Cloudinary entegrasyonu ile)
userSchema.methods.getAvatarUrl = function(size = 'medium', options = {}) {
  // Cloudinary public_id varsa özel transformasyon uygula
  if (this.cloudinaryPublicId && (options.width || options.height || options.quality)) {
    const { v2: cloudinary } = require('cloudinary');
    const transformations = [];
    
    if (options.width || options.height) {
      transformations.push(`w_${options.width || 'auto'},h_${options.height || 'auto'},c_fill,g_face`);
    }
    
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    transformations.push('f_auto');
    
    return cloudinary.url(this.cloudinaryPublicId, {
      transformation: transformations.join(',')
    });
  }
  
  // Mevcut URL'leri kullan
  if (this.avatarUrls && this.avatarUrls[size]) {
    return this.avatarUrls[size];
  }
  
  return this.avatar || null;
};

// XP ekleme method'u (database levels kullanarak)
userSchema.methods.addXP = async function(amount) {
  const oldLevel = this.level;
  this.xp += amount;
  
  // Calculate new level from database
  const Level = require('./Level').default;
  const newLevelData = await Level.getLevelByXP(this.xp);
  const newLevel = newLevelData ? newLevelData.level : this.level;
  
  if (newLevel > this.level) {
    this.level = newLevel;
    
    // Add to level history
    if (!this.stats.levelHistory) {
      this.stats.levelHistory = [];
    }
    
    this.stats.levelHistory.push({
      level: newLevel,
      achievedAt: new Date(),
      xpAtAchievement: this.xp,
      reason: 'XP gained'
    });
    
    return {
      leveledUp: true,
      newLevel: newLevel,
      oldLevel: oldLevel,
      xpGained: amount,
      levelData: newLevelData
    };
  }
  
  return {
    leveledUp: false,
    newLevel: this.level,
    xpGained: amount
  };
};

// Badge ekleme method'u
userSchema.methods.addBadge = function(badge) {
  // Aynı badge'i tekrar eklemeyi önle
  const exists = this.badges.some(b => b.id === badge.id);
  if (!exists) {
    this.badges.push({
      ...badge,
      unlockedAt: new Date()
    });
    return true;
  }
  return false;
};

// Follower ekleme method'u
userSchema.methods.follow = function(userId) {
  const alreadyFollowing = this.following.some(f => f.user.toString() === userId.toString());
  if (!alreadyFollowing) {
    this.following.push({ user: userId });
    return true;
  }
  return false;
};

// Unfollow method'u
userSchema.methods.unfollow = function(userId) {
  this.following = this.following.filter(f => f.user.toString() !== userId.toString());
};

// Son aktiviteyi güncelle
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
};

// Preferences güncelleme method'u
userSchema.methods.updatePreferences = function(section, data) {
  if (!this.preferences) {
    this.preferences = {};
  }
  
  if (section === 'notifications') {
    this.preferences.notifications = { ...this.preferences.notifications, ...data };
  } else if (section === 'privacy') {
    this.preferences.privacy = { ...this.preferences.privacy, ...data };
  } else {
    // General preferences
    Object.keys(data).forEach(key => {
      this.preferences[key] = data[key];
    });
  }
  
  this.markModified('preferences');
};

// Avatar güncelleme method'u (Cloudinary entegrasyonu)
userSchema.methods.updateAvatar = function(avatarData) {
  this.avatar = avatarData.url;
  this.cloudinaryPublicId = avatarData.publicId;
  this.avatarUrls = avatarData.urls;
  this.avatarMetadata = avatarData.metadata;
  
  this.markModified('avatarUrls');
  this.markModified('avatarMetadata');
};

// Avatar silme method'u
userSchema.methods.removeAvatar = function() {
  this.avatar = null;
  this.cloudinaryPublicId = null;
  this.avatarUrls = {
    original: null,
    large: null,
    medium: null,
    small: null,
    tiny: null
  };
  this.avatarMetadata = {
    width: null,
    height: null,
    format: null,
    size: null,
    uploadedAt: null
  };
  
  this.markModified('avatarUrls');
  this.markModified('avatarMetadata');
};

// İNDEXLER
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ cloudinaryPublicId: 1 });
userSchema.index({ level: -1 });
userSchema.index({ xp: -1 });
userSchema.index({ 'preferences.privacy.profileVisibility': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ createdAt: -1 });

// Model'i export et
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;