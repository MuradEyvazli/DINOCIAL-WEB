// app/api/leaderboard/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Get current user from JWT token
async function getCurrentUser(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Calculate user ranking for different timeframes
function getTimeframeFilter(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case 'today':
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { updatedAt: { $gte: startOfDay } };
    case 'week':
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { updatedAt: { $gte: startOfWeek } };
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { updatedAt: { $gte: startOfMonth } };
    case 'all':
    default:
      return {};
  }
}

// Get sorting criteria based on category
function getSortCriteria(category) {
  switch (category) {
    case 'xp':
      return { xp: -1, level: -1 };
    case 'level':
      return { level: -1, xp: -1 };
    case 'posts':
      return { 'stats.postsCount': -1, xp: -1 };
    case 'quests':
      return { 'stats.questsCompleted': -1, xp: -1 };
    case 'impact':
      return { 'stats.impactScore': -1, xp: -1 };
    case 'guilds':
      return { level: -1, 'stats.questsCompleted': -1 }; // Guild leaders based on level and quests
    default:
      return { xp: -1, level: -1 };
  }
}

// Get value for display based on category
function getCategoryValue(user, category) {
  switch (category) {
    case 'xp':
      return user.xp || 0;
    case 'level':
      return user.level || 1;
    case 'posts':
      return user.stats?.postsCount || 0;
    case 'quests':
      return user.stats?.questsCompleted || 0;
    case 'impact':
      return user.stats?.impactScore || 0;
    case 'guilds':
      return user.level || 1; // For guild leaders, show level
    default:
      return user.xp || 0;
  }
}

// Calculate streak (days active) - simplified for now
function calculateStreak(user) {
  // This is a simple calculation - in a real app you'd track daily activity
  const daysSinceCreation = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
  const baseStreak = Math.min(Math.floor(daysSinceCreation / 7), 30); // Max 30 days
  return Math.max(1, baseStreak);
}

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'xp';
    const timeframe = searchParams.get('timeframe') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const search = searchParams.get('search') || '';

    // Get current user
    const currentUserId = await getCurrentUser(request);

    // Build query
    let query = {
      isActive: true,
      // Only show users with public profiles
      'preferences.privacy.profileVisibility': { $in: ['public', null] }
    };

    // Add timeframe filter
    const timeframeFilter = getTimeframeFilter(timeframe);
    query = { ...query, ...timeframeFilter };

    // Add search filter if provided
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    // Get sort criteria
    const sortCriteria = getSortCriteria(category);

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(query)
      .select('username level xp characterClass stats avatarUrls avatar createdAt updatedAt')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Process rankings with rank calculation
    const rankings = users.map((user, index) => {
      const globalRank = skip + index + 1;
      const value = getCategoryValue(user, category);
      const streak = calculateStreak(user);
      
      return {
        rank: globalRank,
        user: {
          id: user._id.toString(),
          username: user.username,
          level: user.level || 1,
          characterClass: user.characterClass || {
            icon: '⚔️',
            name: 'Savaşçı',
            color: 'from-gray-500 to-slate-600'
          },
          avatar: user.avatarUrls?.medium || user.avatar || null
        },
        value,
        change: 0, // TODO: Implement daily rank change tracking
        streak,
        badges: [] // TODO: Implement badges system
      };
    });

    // Get current user's rank if authenticated
    let userRank = null;
    if (currentUserId) {
      try {
        const currentUser = await User.findById(currentUserId)
          .select('username level xp characterClass stats')
          .lean();
        
        if (currentUser) {
          // Count users ranked higher than current user
          const higherRankedCount = await User.countDocuments({
            ...query,
            ...getSortCriteria(category),
            $or: [
              // For XP: higher XP or same XP but higher level
              category === 'xp' ? {
                $or: [
                  { xp: { $gt: currentUser.xp } },
                  { 
                    xp: currentUser.xp, 
                    level: { $gt: currentUser.level } 
                  }
                ]
              } : {},
              // For other categories, use the appropriate field
              category === 'level' ? {
                $or: [
                  { level: { $gt: currentUser.level } },
                  { 
                    level: currentUser.level, 
                    xp: { $gt: currentUser.xp } 
                  }
                ]
              } : {},
              category === 'posts' ? {
                'stats.postsCount': { $gt: currentUser.stats?.postsCount || 0 }
              } : {},
              category === 'quests' ? {
                'stats.questsCompleted': { $gt: currentUser.stats?.questsCompleted || 0 }
              } : {},
              category === 'impact' ? {
                'stats.impactScore': { $gt: currentUser.stats?.impactScore || 0 }
              } : {}
            ].filter(condition => Object.keys(condition).length > 0)
          });

          userRank = {
            rank: higherRankedCount + 1,
            value: getCategoryValue(currentUser, category),
            change: 0 // TODO: Implement change tracking
          };
        }
      } catch (error) {
        console.error('Error calculating user rank:', error);
      }
    }

    // Calculate if there are more pages
    const hasMore = (page * limit) < totalUsers;

    return NextResponse.json({
      success: true,
      data: {
        category,
        timeframe,
        rankings,
        userRank,
        totalUsers,
        hasMore,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
