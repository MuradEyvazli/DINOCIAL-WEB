// lib/models/Guild.js
import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 50
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  type: {
    type: String,
    enum: ['social', 'combat', 'creative', 'competitive'],
    default: 'social'
  },
  
  icon: {
    type: String,
    default: '🛡️'
  },
  
  banner: {
    type: String,
    default: 'from-purple-500 to-blue-600'
  },
  
  // Guild Leadership
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  officers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['officer', 'moderator'],
      default: 'officer'
    },
    appointedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'officer', 'leader'],
      default: 'member'
    },
    contribution: {
      xp: { type: Number, default: 0 },
      questsCompleted: { type: Number, default: 0 },
      events: { type: Number, default: 0 }
    }
  }],
  
  // Guild Settings
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 50,
      min: 5,
      max: 100
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    minLevelToJoin: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  
  // Guild Stats
  stats: {
    level: {
      type: Number,
      default: 1
    },
    xp: {
      type: Number,
      default: 0
    },
    totalXP: {
      type: Number,
      default: 0
    },
    questsCompleted: {
      type: Number,
      default: 0
    },
    eventsWon: {
      type: Number,
      default: 0
    },
    totalEvents: {
      type: Number,
      default: 0
    }
  },
  
  // Benefits
  benefits: {
    xpBonus: {
      type: Number,
      default: 5,
      min: 0,
      max: 50
    },
    questBonus: {
      type: Number,
      default: 0,
      min: 0,
      max: 25
    }
  },
  
  // Guild Features
  features: {
    chat: {
      type: Boolean,
      default: true
    },
    events: {
      type: Boolean,
      default: true
    },
    quests: {
      type: Boolean,
      default: true
    },
    shop: {
      type: Boolean,
      default: false
    }
  },
  
  tags: [String],
  
  // Activity
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes (name field already has unique: true, no need for separate index)
guildSchema.index({ type: 1 });
guildSchema.index({ 'settings.isPublic': 1 });
guildSchema.index({ 'stats.level': -1 });
guildSchema.index({ memberCount: -1 });

// Virtuals
guildSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

guildSchema.virtual('isJoinable').get(function() {
  return this.settings.isPublic && 
         this.memberCount < this.settings.maxMembers && 
         this.isActive;
});

guildSchema.virtual('winRate').get(function() {
  if (this.stats.totalEvents === 0) return 0;
  return Math.round((this.stats.eventsWon / this.stats.totalEvents) * 100);
});

// Instance Methods
guildSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member');
  }
  
  // Check capacity
  if (this.memberCount >= this.settings.maxMembers) {
    throw new Error('Guild is full');
  }
  
  this.members.push({
    user: userId,
    role,
    joinedAt: new Date()
  });
  
  return this.members[this.members.length - 1];
};

guildSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  if (memberIndex === -1) {
    throw new Error('User is not a member');
  }
  
  this.members.splice(memberIndex, 1);
  return true;
};

guildSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

guildSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

guildSchema.methods.addXP = function(amount) {
  this.stats.xp += amount;
  this.stats.totalXP += amount;
  
  // Level up calculation (every 10000 XP)
  const newLevel = Math.floor(this.stats.totalXP / 10000) + 1;
  if (newLevel > this.stats.level) {
    this.stats.level = newLevel;
    // Increase benefits based on level
    this.benefits.xpBonus = Math.min(5 + (this.stats.level * 2), 50);
    return { levelUp: true, newLevel };
  }
  
  return { levelUp: false };
};

guildSchema.methods.canUserJoin = function(user) {
  // Check if public
  if (!this.settings.isPublic) return false;
  
  // Check capacity
  if (this.memberCount >= this.settings.maxMembers) return false;
  
  // Check level requirement
  if (user.level < this.settings.minLevelToJoin) return false;
  
  // Check if already member
  if (this.isMember(user._id)) return false;
  
  return true;
};

// Static Methods
guildSchema.statics.findPublicGuilds = function(filters = {}) {
  const query = {
    'settings.isPublic': true,
    isActive: true
  };
  
  if (filters.type) query.type = filters.type;
  if (filters.minLevel) query['stats.level'] = { $gte: filters.minLevel };
  if (filters.maxLevel) query['stats.level'] = { $lte: filters.maxLevel };
  
  return this.find(query)
    .populate('leader', 'username level characterClass avatar')
    .populate('members.user', 'username level characterClass avatar')
    .sort({ 'stats.level': -1, memberCount: -1 });
};

guildSchema.statics.getUserGuilds = function(userId) {
  return this.find({
    'members.user': userId,
    isActive: true
  })
    .populate('leader', 'username level characterClass avatar')
    .populate('members.user', 'username level characterClass avatar');
};

// Middleware
guildSchema.pre('save', function() {
  this.lastActivity = new Date();
});

// Guild Application Schema
const guildApplicationSchema = new mongoose.Schema({
  guild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guild',
    required: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: Date,
  
  reviewNote: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Unique application per user per guild
guildApplicationSchema.index({ guild: 1, user: 1 }, { unique: true });

const Guild = mongoose.models.Guild || mongoose.model('Guild', guildSchema);
const GuildApplication = mongoose.models.GuildApplication || mongoose.model('GuildApplication', guildApplicationSchema);

export { Guild, GuildApplication };
export default Guild;