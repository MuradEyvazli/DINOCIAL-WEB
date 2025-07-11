// app/api/stories/route.js
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

// GET - Fetch active stories for the current user and their friends
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(100, 60 * 1000);
    rateLimit(request);
    
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const includeOwn = searchParams.get('includeOwn') === 'true';
    
    // Get stories grouped by user
    const storiesByUser = await Story.getActiveStoriesForUser(user._id, includeOwn);
    
    // Add any additional user data if needed
    const enrichedStoriesByUser = {};
    for (const [userId, stories] of Object.entries(storiesByUser)) {
      const firstStory = stories[0];
      if (firstStory) {
        // Get mutual status if needed
        const isMutual = user.following?.includes(firstStory.user._id.toString()) &&
                        user.followers?.includes(firstStory.user._id.toString());
        
        enrichedStoriesByUser[userId] = stories.map(story => ({
          ...story,
          user: {
            ...story.user,
            isMutual
          }
        }));
      }
    }
    
    return successResponse({
      storiesByUser: enrichedStoriesByUser,
      count: Object.keys(enrichedStoriesByUser).length
    }, 'Hikayeler başarıyla getirildi');
    
  } catch (error) {
    console.error('Stories GET Error:', error);
    return handleApiError(error);
  }
}

// POST - Create a new story
export async function POST(request) {
  try {
    // Rate limiting - limit story creation
    const rateLimit = rateLimitMiddleware(10, 60 * 60 * 1000); // 10 stories per hour
    rateLimit(request);
    
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const body = await request.json();
    const {
      content,
      type = 'text',
      visibility = 'friends',
      backgroundColor,
      textStyle,
      tags,
      location
    } = body;
    
    // Support both old and new content structure
    let storyContent = content;
    if (typeof content === 'object' && content.text !== undefined) {
      // New structure from CreateStoryModal
      storyContent = content;
    } else if (typeof content === 'string') {
      // Old structure - just text
      storyContent = { text: content };
    }
    
    // Validation
    if (!storyContent) {
      throw new ApiError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Hikaye içeriği gerekli',
        400
      );
    }
    
    // Determine content type from content structure
    const contentType = storyContent.mediaType || type;
    
    if (contentType === 'text' && !storyContent.text) {
      throw new ApiError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Metin hikayeleri için içerik metni gerekli',
        400
      );
    }
    
    if ((contentType === 'image' || contentType === 'video') && !storyContent.mediaUrl) {
      throw new ApiError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Medya hikayeleri için medya URL\'i gerekli',
        400
      );
    }
    
    // Check daily story limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayStoriesCount = await Story.countDocuments({
      user: user._id,
      createdAt: { $gte: todayStart },
      isActive: true
    });
    
    if (todayStoriesCount >= 20) {
      throw new ApiError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Günlük hikaye limitine ulaştınız (20 hikaye)',
        429
      );
    }
    
    // Create story
    const storyData = {
      user: user._id,
      content: {
        text: storyContent.text || '',
        mediaUrl: storyContent.mediaUrl,
        mediaType: storyContent.mediaType || contentType
      },
      type: contentType,
      visibility,
      tags: tags || []
    };
    
    // Add optional fields
    if (storyContent.backgroundColor || backgroundColor) {
      storyData.content.backgroundColor = storyContent.backgroundColor || backgroundColor;
    }
    if (storyContent.textColor) {
      storyData.content.textColor = storyContent.textColor;
    }
    if (textStyle) storyData.textStyle = textStyle;
    if (location) storyData.location = location;
    
    const newStory = new Story(storyData);
    await newStory.save();
    
    // Populate user info
    await newStory.populate('user', 'username avatar avatarUrls characterClass level');
    
    // Update user stats
    user.stats.postsCount += 1;
    await user.save();
    
    // Emit real-time event to followers
    if (global.io) {
      // Get user's followers
      const followers = await User.find({
        following: user._id,
        isActive: true
      }).select('_id');
      
      const followerIds = followers.map(f => f._id.toString());
      
      // Emit to each follower's room
      followerIds.forEach(followerId => {
        global.io.to(`user:${followerId}`).emit('story:new', {
          authorId: user._id.toString(),
          author: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            avatarUrls: user.avatarUrls,
            characterClass: user.characterClass,
            level: user.level
          },
          storyId: newStory._id.toString(),
          createdAt: newStory.createdAt
        });
      });
    }
    
    return successResponse({
      story: newStory
    }, 'Hikaye başarıyla oluşturuldu', 201);
    
  } catch (error) {
    console.error('Stories POST Error:', error);
    return handleApiError(error);
  }
}