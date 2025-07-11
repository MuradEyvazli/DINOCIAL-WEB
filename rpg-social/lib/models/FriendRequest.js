// lib/models/FriendRequest.js
import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Göndericisi gereklidir'],
    index: true
  },
  
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Alıcı gereklidir'],
    index: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true
  },
  
  message: {
    type: String,
    maxlength: [200, 'Mesaj en fazla 200 karakter olabilir'],
    trim: true
  },
  
  // İstek işlendiğinde güncellenir
  respondedAt: {
    type: Date,
    index: true
  },
  
  // Otomatik silme için (30 gün sonra)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index - bir kullanıcı aynı kişiye birden fazla istek gönderemesin
friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

// Query optimization indexes
friendRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });
friendRequestSchema.index({ sender: 1, status: 1, createdAt: -1 });

// Validation: Kullanıcı kendisine istek gönderemesin
friendRequestSchema.pre('save', function(next) {
  if (this.sender.toString() === this.recipient.toString()) {
    const error = new Error('Kendisine arkadaşlık isteği gönderilemez');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Response handling middleware
friendRequestSchema.methods.accept = async function() {
  this.status = 'accepted';
  this.respondedAt = new Date();
  
  // Her iki kullanıcının da arkadaşlar listesine ekle
  const User = mongoose.model('User');
  
  await Promise.all([
    User.findByIdAndUpdate(this.sender, {
      $addToSet: { 
        following: { 
          user: this.recipient, 
          followedAt: new Date() 
        } 
      }
    }),
    User.findByIdAndUpdate(this.recipient, {
      $addToSet: { 
        followers: { 
          user: this.sender, 
          followedAt: new Date() 
        } 
      }
    })
  ]);
  
  return this.save();
};

friendRequestSchema.methods.reject = function() {
  this.status = 'rejected';
  this.respondedAt = new Date();
  return this.save();
};

// Static methods
friendRequestSchema.statics.findPendingForUser = function(userId) {
  return this.find({
    recipient: userId,
    status: 'pending'
  })
  .populate('sender', 'username avatar avatarUrls characterClass level stats.impactScore bio')
  .sort({ createdAt: -1 });
};

friendRequestSchema.statics.findSentByUser = function(userId) {
  return this.find({
    sender: userId,
    status: 'pending'
  })
  .populate('recipient', 'username avatar avatarUrls characterClass level stats.impactScore bio')
  .sort({ createdAt: -1 });
};

friendRequestSchema.statics.checkExistingRequest = function(senderId, recipientId) {
  return this.findOne({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId }
    ],
    status: 'pending'
  });
};

// Virtual for request age
friendRequestSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const FriendRequest = mongoose.models.FriendRequest || mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequest;