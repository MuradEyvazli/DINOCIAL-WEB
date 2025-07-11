// app/api/stories/[id]/like/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Story from '@/lib/models/Story';
import { 
  getAuthenticatedUser, 
  handleApiError, 
  successResponse,
  rateLimitMiddleware,
  ERROR_TYPES,
  ApiError
} from '@/lib/middleware/auth';

// POST - Toggle like on a story
export async function POST(request, { params }) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(60, 60 * 1000); // 60 likes per minute
    rateLimit(request);
    
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const { id: storyId } = await params;
    
    // Find story
    const story = await Story.findById(storyId);
    if (!story) {
      throw new ApiError(
        ERROR_TYPES.NOT_FOUND,
        'Hikaye bulunamadı',
        404
      );
    }
    
    // Check if story is expired
    if (story.isExpired()) {
      throw new ApiError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Bu hikaye artık aktif değil',
        400
      );
    }
    
    // Toggle like
    const isLiked = await story.toggleLike(user._id);
    
    // Emit real-time event
    if (global.io) {
      const storyOwnerId = story.user.toString();
      
      // Emit to story owner if it's not their own story
      if (storyOwnerId !== user._id.toString()) {
        global.io.to(`user:${storyOwnerId}`).emit('story:liked', {
          storyId: story._id.toString(),
          likedBy: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar
          },
          isLiked,
          likeCount: story.likes.length
        });
      }
      
      // Emit to all users viewing this story
      global.io.emit('story:like_update', {
        storyId: story._id.toString(),
        likeCount: story.likes.length,
        isLiked,
        userId: user._id.toString()
      });
    }
    
    return successResponse({
      isLiked,
      likeCount: story.likes.length,
      story: {
        _id: story._id,
        likeCount: story.likes.length
      }
    }, isLiked ? 'Hikaye beğenildi' : 'Beğeni kaldırıldı');
    
  } catch (error) {
    console.error('Story like error:', error);
    return handleApiError(error);
  }
}

// GET - Get who liked the story (for story owner)
export async function GET(request, { params }) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const { id: storyId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    // Find story and check ownership
    const story = await Story.findById(storyId);
    if (!story) {
      throw new ApiError(
        ERROR_TYPES.NOT_FOUND,
        'Hikaye bulunamadı',
        404
      );
    }
    
    // Only story owner can see who liked
    if (story.user.toString() !== user._id.toString()) {
      throw new ApiError(
        ERROR_TYPES.FORBIDDEN,
        'Bu bilgiyi görme yetkiniz yok',
        403
      );
    }
    
    // Get likes with pagination
    const totalLikes = story.likes.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Populate user info for likes
    await story.populate({
      path: 'likes.user',
      select: 'username avatar avatarUrls level characterClass',
      options: {
        skip: startIndex,
        limit: limit
      }
    });
    
    const likes = story.likes.slice(startIndex, endIndex).map(like => ({
      user: like.user,
      likedAt: like.likedAt
    }));
    
    return successResponse({
      likes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLikes / limit),
        totalLikes,
        hasMore: endIndex < totalLikes
      }
    }, 'Beğeniler getirildi');
    
  } catch (error) {
    console.error('Story likes fetch error:', error);
    return handleApiError(error);
  }
}