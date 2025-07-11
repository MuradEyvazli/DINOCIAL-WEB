// lib/models/Message.js
import mongoose from 'mongoose';

// Conversation Schema for grouping messages
const conversationSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  
  title: {
    type: String,
    default: null // For group conversations
  },
  
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata for RPG elements
  metadata: {
    region: {
      type: String,
      default: null // Which region this conversation started in
    },
    tags: [String], // For organizing conversations
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  content: {
    text: {
      type: String,
      maxLength: 2000,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system', 'quest_share', 'achievement_share'],
      default: 'text'
    },
    // File attachments
    files: [{
      originalName: String,
      fileName: String,
      filePath: String,
      fileSize: Number,
      fileType: String,
      isImage: Boolean,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // For special message types
    metadata: {
      questId: String,
      achievementId: String,
      imageUrl: String,
      systemType: String // 'user_joined', 'user_left', 'conversation_created', etc.
    }
  },
  
  // Message status for each participant
  status: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    delivered: {
      type: Boolean,
      default: false
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    }
  }],
  
  // Reply functionality
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Edit functionality
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    originalContent: {
      type: String,
      default: null
    }
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date,
    default: null
  },
  
  // Array of user IDs who have deleted this message for themselves
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // RPG-specific features
  rpgData: {
    xpShared: {
      type: Number,
      default: 0
    },
    itemShared: {
      type: String,
      default: null
    },
    challengeIssued: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES for performance
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'status.user': 1, 'status.read': 1 });

// VIRTUALS

// Get participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Get unread count for a specific user
conversationSchema.virtual('unreadCount').get(function() {
  // This will be calculated in the API based on user context
  return 0;
});

// Get message content with deleted check
messageSchema.virtual('displayContent').get(function() {
  if (this.isDeleted) {
    return 'Bu mesaj silindi';
  }
  return this.content.text;
});

// INSTANCE METHODS

// Conversation Methods
conversationSchema.methods.addParticipant = function(userId) {
  const exists = this.participants.some(p => p.user.toString() === userId.toString());
  if (!exists) {
    this.participants.push({ user: userId });
    return true;
  }
  return false;
};

conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  if (this.participants.length === 0) {
    this.isActive = false;
  }
};

conversationSchema.methods.updateLastSeen = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.lastSeenAt = new Date();
  }
};

conversationSchema.methods.getOtherParticipants = function(currentUserId) {
  return this.participants.filter(p => p.user.toString() !== currentUserId.toString());
};

// Message Methods
messageSchema.methods.markAsRead = function(userId) {
  const status = this.status.find(s => s.user.toString() === userId.toString());
  if (status && !status.read) {
    status.read = true;
    status.readAt = new Date();
    return true;
  }
  return false;
};

messageSchema.methods.markAsDelivered = function(userId) {
  const status = this.status.find(s => s.user.toString() === userId.toString());
  if (status && !status.delivered) {
    status.delivered = true;
    return true;
  }
  return false;
};

messageSchema.methods.editContent = function(newContent) {
  if (!this.edited.isEdited) {
    this.edited.originalContent = this.content.text;
  }
  this.content.text = newContent;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();
};

messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
};

// STATIC METHODS

// Find conversation between users
conversationSchema.statics.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    type: 'direct',
    'participants.user': { $all: [userId1, userId2] },
    'participants': { $size: 2 },
    isActive: true
  });
};

// Get conversations for a user
conversationSchema.statics.getForUser = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    'participants.user': userId,
    isActive: true
  })
  .populate('participants.user', 'username avatar avatarUrls characterClass level isOnline lastActiveAt')
  .populate('lastMessage.sender', 'username avatar avatarUrls')
  .sort({ 'lastMessage.timestamp': -1 })
  .skip(skip)
  .limit(limit);
};

// Get messages for a conversation
messageSchema.statics.getForConversation = function(conversationId, userId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    conversation: conversationId,
    isDeleted: false,
    deletedFor: { $ne: userId } // Exclude messages deleted by this user
  })
  .populate('sender', 'username avatar avatarUrls characterClass level')
  .populate('replyTo', 'content.text sender')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Get unread message count for user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    'status.user': userId,
    'status.read': false,
    isDeleted: false
  });
};

// MIDDLEWARE

// Update conversation's lastMessage when a new message is created
messageSchema.post('save', async function() {
  if (this.isNew && !this.isDeleted) {
    await mongoose.model('Conversation').findByIdAndUpdate(
      this.conversation,
      {
        lastMessage: {
          content: this.content.text,
          sender: this.sender,
          timestamp: this.createdAt
        }
      }
    );
  }
});

// Pre-save middleware to initialize message status for all participants
messageSchema.pre('save', async function() {
  if (this.isNew) {
    const conversation = await mongoose.model('Conversation').findById(this.conversation);
    if (conversation) {
      this.status = conversation.participants.map(participant => ({
        user: participant.user,
        delivered: participant.user.toString() === this.sender.toString(), // Sender automatically has delivered status
        read: participant.user.toString() === this.sender.toString() // Sender automatically has read status
      }));
    }
  }
});

// Create models - Force recreation to apply schema changes
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}
if (mongoose.models.Conversation) {
  delete mongoose.models.Conversation;
}

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

export { Conversation, Message };