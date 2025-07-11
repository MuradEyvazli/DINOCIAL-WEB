// app/api/stories/[id]/viewers/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Story from '@/lib/models/Story';
import { 
  getAuthenticatedUser, 
  handleApiError, 
  successResponse,
  ERROR_TYPES,
  ApiError
} from '@/lib/middleware/auth';

// GET - Get who viewed the story (for story owner)
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
    
    // Only story owner can see who viewed
    if (story.user.toString() !== user._id.toString()) {
      throw new ApiError(
        ERROR_TYPES.FORBIDDEN,
        'Bu bilgiyi görme yetkiniz yok',
        403
      );
    }
    
    // Get viewers with pagination
    const totalViewers = story.viewers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Populate user info for viewers
    await story.populate({
      path: 'viewers.user',
      select: 'username avatar avatarUrls level characterClass',
      options: {
        skip: startIndex,
        limit: limit
      }
    });
    
    const viewers = story.viewers.slice(startIndex, endIndex).map(viewer => ({
      user: viewer.user,
      viewedAt: viewer.viewedAt
    }));
    
    return successResponse({
      viewers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalViewers / limit),
        totalViewers,
        hasMore: endIndex < totalViewers
      }
    }, 'İzleyenler getirildi');
    
  } catch (error) {
    console.error('Story viewers fetch error:', error);
    return handleApiError(error);
  }
}