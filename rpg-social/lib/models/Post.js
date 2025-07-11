// lib/models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  content: {
    text: {
      type: String,
      required: true,
      maxLength: 2000,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'achievement', 'quest_completion'],
      default: 'text'
    },
    // For special post types
    metadata: {
      imageUrl: String,
      imagePublicId: String, // Cloudinary public ID
      achievementId: String,
      questId: String,
      region: String
    }
  },
  
  // Engagement metrics
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxLength: 500,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Visibility and status
  visibility: {
    type: String,
    enum: ['public', 'friends', 'guild', 'private'],
    default: 'public'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // RPG-specific features
  region: {
    type: String,
    default: null
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Moderation
  isReported: {
    type: Boolean,
    default: false
  },
  
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES for performance
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ 'likes.user': 1 });
postSchema.index({ region: 1 });
postSchema.index({ visibility: 1, isActive: 1 });

// VIRTUALS
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Check if user liked this post
postSchema.virtual('isLikedBy').get(function() {
  // This will be set dynamically in API responses
  return false;
});

// INSTANCE METHODS
postSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );
  
  if (existingLike) {
    // Remove like
    this.likes = this.likes.filter(like => 
      like.user.toString() !== userId.toString()
    );
    return false; // unliked
  } else {
    // Add like
    this.likes.push({ user: userId });
    return true; // liked
  }
};

postSchema.methods.addComment = function(userId, content) {
  const newComment = {
    user: userId,
    content: content.trim(),
    createdAt: new Date()
  };
  this.comments.push(newComment);
  return this.comments[this.comments.length - 1];
};

postSchema.methods.removeComment = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (comment && comment.user.toString() === userId.toString()) {
    this.comments.pull(commentId);
    return true;
  }
  return false;
};

// STATIC METHODS
postSchema.statics.getForFeed = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({
    isActive: true,
    visibility: 'public'
  })
  .populate('author', 'username avatar avatarUrls characterClass level')
  .populate('comments.user', 'username avatar avatarUrls')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

postSchema.statics.getByUser = function(authorId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({
    author: authorId,
    isActive: true
  })
  .populate('author', 'username avatar avatarUrls characterClass level')
  .populate('comments.user', 'username avatar avatarUrls')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// MIDDLEWARE
// Update user's post count when a new post is created
postSchema.post('save', async function() {
  if (this.isNew && this.isActive) {
    await mongoose.model('User').findByIdAndUpdate(
      this.author,
      { $inc: { 'stats.postsCount': 1 } }
    );
  }
});

// Update user's post count when a post is deleted
postSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  if (update.isActive === false) {
    const post = await this.model.findOne(this.getQuery());
    if (post && post.isActive) {
      await mongoose.model('User').findByIdAndUpdate(
        post.author,
        { $inc: { 'stats.postsCount': -1 } }
      );
    }
  }
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;