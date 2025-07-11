import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: 500
    },
    mediaUrl: {
      type: String
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'text'],
      default: 'text'
    },
    backgroundColor: {
      type: String,
      default: '#6366f1'
    },
    textColor: {
      type: String,
      default: '#ffffff'
    }
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, {
  timestamps: true
});

// Indexes
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });
storySchema.index({ isActive: 1 });

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
  return this.viewers.length;
});

// Virtual for like count
storySchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to check if story is expired
storySchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to add viewer
storySchema.methods.addViewer = async function(userId) {
  const alreadyViewed = this.viewers.some(viewer => 
    viewer.user.toString() === userId.toString()
  );
  
  if (!alreadyViewed && this.user.toString() !== userId.toString()) {
    this.viewers.push({ user: userId });
    await this.save();
  }
};

// Method to toggle like
storySchema.methods.toggleLike = async function(userId) {
  const existingLikeIndex = this.likes.findIndex(like => 
    like.user.toString() === userId.toString()
  );
  
  if (existingLikeIndex !== -1) {
    // Unlike - remove like
    this.likes.splice(existingLikeIndex, 1);
  } else {
    // Like - add like
    this.likes.push({ user: userId });
  }
  
  await this.save();
  return existingLikeIndex === -1; // Return true if liked, false if unliked
};

// Method to check if user has liked
storySchema.methods.hasUserLiked = function(userId) {
  return this.likes.some(like => 
    like.user.toString() === userId.toString()
  );
};

// Static method to get active stories
storySchema.statics.getActiveStories = async function(userId) {
  const user = await mongoose.model('User').findById(userId).populate('following.user');
  const followingIds = user.following?.map(follow => follow.user._id) || [];
  followingIds.push(userId); // Include user's own stories
  
  return this.find({
    user: { $in: followingIds },
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('user', 'username avatar level')
  .sort({ createdAt: -1 });
};

// Static method to get active stories grouped by user for the frontend
storySchema.statics.getActiveStoriesForUser = async function(userId, includeOwn = false) {
  const currentUser = await mongoose.model('User').findById(userId);
  
  // Get ALL active stories from all users (public stories)
  const stories = await this.find({
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('user', 'username avatar avatarUrls level characterClass')
  .populate('likes.user', 'username avatar')
  .populate('viewers.user', 'username avatar')
  .sort({ user: 1, createdAt: -1 });
  
  // Group stories by user
  const storiesByUser = {};
  stories.forEach(story => {
    const storyUserId = story.user._id.toString();
    if (!storiesByUser[storyUserId]) {
      storiesByUser[storyUserId] = [];
    }
    
    // Add hasViewed and hasLiked flags
    const hasViewed = story.viewers.some(viewer => 
      viewer.user._id.toString() === currentUser._id.toString()
    );
    
    const hasLiked = story.likes.some(like => 
      like.user._id.toString() === currentUser._id.toString()
    );
    
    storiesByUser[storyUserId].push({
      ...story.toObject(),
      hasViewed,
      hasLiked,
      viewCount: story.viewers.length,
      likeCount: story.likes.length,
      isOwn: story.user._id.toString() === currentUser._id.toString()
    });
  });
  
  return storiesByUser;
};

// Auto-deactivate expired stories
storySchema.pre('find', function() {
  this.where({ expiresAt: { $gt: new Date() }, isActive: true });
});

storySchema.pre('findOne', function() {
  this.where({ expiresAt: { $gt: new Date() }, isActive: true });
});

const Story = mongoose.models.Story || mongoose.model('Story', storySchema);

export default Story;