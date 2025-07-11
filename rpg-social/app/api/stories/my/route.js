// app/api/stories/my/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Story from '@/lib/models/Story';
import { 
  getAuthenticatedUser, 
  handleApiError, 
  successResponse,
  rateLimitMiddleware
} from '@/lib/middleware/auth';

// GET - Get current user's stories
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(100, 60 * 1000);
    rateLimit(request);
    
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {
      user: user._id,
      isActive: true
    };
    
    if (!includeExpired) {
      query.expiresAt = { $gt: new Date() };
    }
    
    // Get stories
    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const totalStories = await Story.countDocuments(query);
    
    // Calculate statistics
    const activeStories = stories.filter(s => s.expiresAt > new Date()).length;
    const totalViews = stories.reduce((sum, story) => sum + story.viewCount, 0);
    const avgViewsPerStory = activeStories > 0 ? Math.round(totalViews / activeStories) : 0;
    
    // Add viewer info and format stories
    const formattedStories = stories.map(story => ({
      ...story,
      isExpired: story.expiresAt < new Date(),
      viewerCount: story.viewers.length,
      timeRemaining: story.expiresAt > new Date() ? getTimeRemaining(story.expiresAt) : null
    }));
    
    return successResponse({
      stories: formattedStories,
      statistics: {
        totalStories,
        activeStories,
        totalViews,
        avgViewsPerStory
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalStories / limit),
        hasMore: skip + limit < totalStories
      }
    }, 'Hikayeleriniz başarıyla getirildi');
    
  } catch (error) {
    console.error('My Stories GET Error:', error);
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
    return `${diffHours} saat ${diffMins} dakika`;
  } else {
    return `${diffMins} dakika`;
  }
}