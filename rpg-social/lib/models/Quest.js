// lib/models/Quest.js
import mongoose from 'mongoose';

const questSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  type: {
    type: String,
    enum: ['daily', 'weekly', 'achievement', 'social', 'content', 'exploration'],
    required: true,
    index: true
  },
  
  category: {
    type: String,
    enum: ['beginner', 'social', 'content', 'exploration', 'achievement'],
    default: 'beginner'
  },
  
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'legendary'],
    default: 'easy'
  },
  
  // Rewards
  rewards: {
    xp: {
      type: Number,
      required: true,
      min: 0
    },
    coins: {
      type: Number,
      default: 0
    },
    badge: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: null
    }
  },
  
  // Requirements to complete
  requirements: [{
    type: {
      type: String,
      required: true,
      enum: [
        'create_post', 'like_posts', 'comment_posts', 'follow_users',
        'visit_regions', 'level_up', 'share_post', 'join_guild',
        'complete_profile', 'upload_avatar', 'login_days',
        'interact_with_class', 'help_newbie', 'explore_feature'
      ]
    },
    target: {
      type: Number,
      required: true,
      min: 1
    },
    description: {
      type: String,
      required: true
    }
  }],
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  
  startDate: {
    type: Date,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    default: null
  },
  
  // For daily/weekly quests
  resetType: {
    type: String,
    enum: ['none', 'daily', 'weekly'],
    default: 'none'
  },
  
  // Prerequisites
  prerequisites: {
    level: {
      type: Number,
      default: 0
    },
    completedQuests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest'
    }]
  },
  
  // Quest chain
  nextQuest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    default: null
  },
  
  // Metadata
  tags: [String],
  icon: {
    type: String,
    default: 'target'
  },
  
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// User Quest Progress Schema
const userQuestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  quest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    required: true
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'abandoned'],
    default: 'active'
  },
  
  progress: {
    type: Map,
    of: Number,
    default: {}
  },
  
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  expiresAt: {
    type: Date,
    default: null
  },
  
  // For daily quests
  lastResetAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// INDEXES
questSchema.index({ type: 1, isActive: 1 });
questSchema.index({ difficulty: 1 });
questSchema.index({ resetType: 1 });

userQuestSchema.index({ user: 1, status: 1 });
userQuestSchema.index({ user: 1, quest: 1 }, { unique: true });
userQuestSchema.index({ expiresAt: 1 });

// VIRTUALS
questSchema.virtual('difficultyColor').get(function() {
  const colors = {
    easy: 'text-green-400',
    medium: 'text-yellow-400', 
    hard: 'text-orange-400',
    legendary: 'text-purple-400'
  };
  return colors[this.difficulty] || 'text-gray-400';
});

userQuestSchema.virtual('progressPercent').get(function() {
  const quest = this.quest;
  if (!quest || !quest.requirements) return 0;
  
  let totalProgress = 0;
  const requirements = quest.requirements;
  
  for (const req of requirements) {
    const current = this.progress.get(req.type) || 0;
    const percent = Math.min((current / req.target) * 100, 100);
    totalProgress += percent;
  }
  
  return Math.round(totalProgress / requirements.length);
});

userQuestSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

userQuestSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// INSTANCE METHODS
userQuestSchema.methods.updateProgress = function(type, increment = 1) {
  const current = this.progress.get(type) || 0;
  this.progress.set(type, current + increment);
  
  // Check if quest is completed
  if (this.quest && this.quest.requirements) {
    const allCompleted = this.quest.requirements.every(req => {
      const progress = this.progress.get(req.type) || 0;
      return progress >= req.target;
    });
    
    if (allCompleted && this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
      return true; // Quest completed
    }
  }
  
  return false; // Quest not completed yet
};

userQuestSchema.methods.resetDaily = function() {
  if (this.quest.resetType === 'daily') {
    this.progress = new Map();
    this.status = 'active';
    this.completedAt = null;
    this.lastResetAt = new Date();
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
};

// STATIC METHODS
questSchema.statics.getAvailableQuests = function(userId, userLevel = 1) {
  return this.find({
    isActive: true,
    isHidden: false,
    'prerequisites.level': { $lte: userLevel }
  }).sort({ difficulty: 1, 'rewards.xp': 1 });
};

questSchema.statics.getDailyQuests = function() {
  return this.find({
    type: 'daily',
    isActive: true
  }).sort({ 'rewards.xp': 1 });
};

userQuestSchema.statics.getUserActiveQuests = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('quest');
};

userQuestSchema.statics.completeQuest = async function(userId, questId, progressData) {
  const userQuest = await this.findOne({
    user: userId,
    quest: questId,
    status: 'active'
  }).populate('quest');
  
  if (!userQuest) {
    throw new Error('Quest not found or not active');
  }
  
  // Update progress
  for (const [type, value] of Object.entries(progressData)) {
    userQuest.updateProgress(type, value);
  }
  
  const isCompleted = await userQuest.save();
  
  if (isCompleted) {
    // Reward user
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        xp: userQuest.quest.rewards.xp,
        'stats.questsCompleted': 1
      }
    });
    
    return {
      completed: true,
      rewards: userQuest.quest.rewards,
      userQuest
    };
  }
  
  return {
    completed: false,
    userQuest
  };
};

// MIDDLEWARE
userQuestSchema.pre('save', function() {
  // Set expiration for daily quests
  if (this.quest && this.quest.resetType === 'daily' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
});

const Quest = mongoose.models.Quest || mongoose.model('Quest', questSchema);
const UserQuest = mongoose.models.UserQuest || mongoose.model('UserQuest', userQuestSchema);

export { Quest, UserQuest };
export default Quest;