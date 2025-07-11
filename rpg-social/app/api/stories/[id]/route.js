// app/api/stories/[id]/route.js
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

// PUT - Mark story as viewed
export async function PUT(request, { params }) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(100, 60 * 1000); // 100 views per minute
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
    
    // Add viewer (only if not already viewed and not own story)
    await story.addViewer(user._id);
    
    // Emit real-time event to story owner
    if (global.io) {
      const storyOwnerId = story.user.toString();
      
      // Emit to story owner if it's not their own story
      if (storyOwnerId !== user._id.toString()) {
        global.io.to(`user:${storyOwnerId}`).emit('story:viewed', {
          storyId: story._id.toString(),
          viewedBy: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar
          },
          viewCount: story.viewers.length
        });
      }
    }
    
    return successResponse({
      viewCount: story.viewers.length,
      story: {
        _id: story._id,
        viewCount: story.viewers.length
      }
    }, 'Hikaye izlendi olarak işaretlendi');
    
  } catch (error) {
    console.error('Story view error:', error);
    return handleApiError(error);
  }
}

// DELETE - Delete story (only by owner)
export async function DELETE(request, { params }) {
  try {
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
    
    // Check ownership
    if (story.user.toString() !== user._id.toString()) {
      throw new ApiError(
        ERROR_TYPES.FORBIDDEN,
        'Bu hikayeyi silme yetkiniz yok',
        403
      );
    }
    
    // Delete story
    await Story.findByIdAndDelete(storyId);
    
    // Emit real-time event
    if (global.io) {
      global.io.emit('story:deleted', {
        storyId: storyId,
        userId: user._id.toString()
      });
    }
    
    return successResponse({
      storyId
    }, 'Hikaye başarıyla silindi');
    
  } catch (error) {
    console.error('Story delete error:', error);
    return handleApiError(error);
  }
}