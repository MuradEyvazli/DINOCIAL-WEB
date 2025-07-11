// lib/models/AdminLog.js - Admin activity logging
import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    required: true,
    index: true
  },
  
  targetType: {
    type: String,
    enum: [
      'user', 'post', 'guild', 'quest', 'message', 'conversation', 'system',
      'content_analytics', 'friendship_monitoring', 'message_monitoring',
      'user_management', 'security_monitoring', 'system_logs'
    ],
    required: true,
    index: true
  },
  
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String,
    default: ''
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  metadata: {
    previousValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    reason: String,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });

// Virtual for formatted timestamp
adminLogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to log admin actions
adminLogSchema.statics.logAction = async function(admin, action, targetType, targetId, details = {}, ipAddress = 'unknown', severity = 'medium') {
  try {
    const log = new this({
      admin: admin._id || admin,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      severity,
      userAgent: details.userAgent || ''
    });
    
    await log.save();
    return log;
  } catch (error) {
    console.error('Admin log error:', error);
    throw error;
  }
};

// Static method to get activity summary
adminLogSchema.statics.getActivitySummary = async function(timeframe = 'day') {
  const startDate = new Date();
  
  switch (timeframe) {
    case 'hour':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }
  
  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  return await this.aggregate(pipeline);
};

const AdminLog = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);

export default AdminLog;