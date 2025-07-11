// app/api/stories/user/[userId]/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Story from '@/lib/models/Story';
import User from '@/lib/models/User';
import { 
  getAuthenticatedUser, 
  handleApiError, 
  successResponse,
  rateLimitMiddleware,
  ERROR_TYPES,
  ApiError
} from '@/lib/middleware/auth';

// GET - Get stories by a specific user
export async function GET(request, { params }) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(100, 60 * 1000);
    rateLimit(request);
    
    // Authentication
    const currentUser = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const { userId } = await params;
    
    // Check if viewing own stories
    const isOwnProfile = currentUser._id.toString() === userId;
    
    // Get target user
    const targetUser = await User.findById(userId)
      .select('username avatar avatarUrls characterClass level privacy');
    
    if (!targetUser) {
      throw new ApiError(
        ERROR_TYPES.NOT_FOUND,
        'Kullanıcı bulunamadı',
        404
      );
    }
    
    // Check privacy settings
    if (!isOwnProfile) {
      // Check if following
      const isFollowing = currentUser.following?.includes(userId);
      
      // Check story visibility settings
      if (targetUser.privacy?.hideStoriesFromNonFollowers && !isFollowing) {
        return successResponse({
          stories: [],
          message: 'Bu kullanıcının hikayelerini görmek için takip etmelisiniz'
        }, 'Hikayeler gizli');
      }
    }
    
    // Build query based on relationship
    const query = {
      user: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    };
    
    if (!isOwnProfile) {
      // If not following, only show public stories
      const isFollowing = currentUser.following?.includes(userId);
      if (!isFollowing) {
        query.visibility = 'public';
      } else {
        query.visibility = { $in: ['public', 'friends'] };
      }
    }
    
    // Get stories
    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    // Mark which stories the current user has viewed
    const formattedStories = stories.map(story => ({
      ...story,
      hasViewed: story.viewers.some(v => 
        v.user.toString() === currentUser._id.toString()
      ),
      viewerCount: story.viewers.length,
      timeRemaining: getTimeRemaining(story.expiresAt)
    }));
    
    // Group all stories together
    const result = {
      author: {
        _id: targetUser._id,
        username: targetUser.username,
        avatar: targetUser.avatar,
        avatarUrls: targetUser.avatarUrls,
        characterClass: targetUser.characterClass,
        level: targetUser.level
      },
      stories: formattedStories,
      hasUnviewed: formattedStories.some(s => !s.hasViewed)
    };
    
    return successResponse({
      storiesData: result,
      count: formattedStories.length
    }, 'Kullanıcı hikayeleri başarıyla getirildi');
    
  } catch (error) {
    console.error('User Stories GET Error:', error);
    return handleApiError(error);
  }
}

// Helper function to calculate time remaining
function getTimeRemaining(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry - now;
  
  if (diffMs <= 0) return null;
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}s ${diffMins}d`;
  } else {
    return `${diffMins}d`;
  }
}