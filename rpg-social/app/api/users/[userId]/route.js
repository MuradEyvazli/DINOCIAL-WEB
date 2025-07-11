// app/api/users/[userId]/route.js
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

// Check if current user can view the profile
function canViewProfile(targetUser, currentUserId) {
  // If it's the same user, always allow
  if (currentUserId && targetUser._id.toString() === currentUserId) {
    return true;
  }
  
  // Check privacy settings
  const visibility = targetUser.preferences?.privacy?.profileVisibility || 'public';
  
  switch (visibility) {
    case 'public':
      return true;
    case 'friends':
      // TODO: Implement friends system - for now, treat as private
      return false;
    case 'private':
      return false;
    default:
      return true; // Default to public if no preference set
  }
}

// Get user's ranking in different categories
async function getUserRanking(userId, category = 'xp') {
  try {
    let sortCriteria;
    switch (category) {
      case 'xp':
        sortCriteria = { xp: -1, level: -1 };
        break;
      case 'level':
        sortCriteria = { level: -1, xp: -1 };
        break;
      case 'posts':
        sortCriteria = { 'stats.postsCount': -1, xp: -1 };
        break;
      case 'quests':
        sortCriteria = { 'stats.questsCompleted': -1, xp: -1 };
        break;
      case 'impact':
        sortCriteria = { 'stats.impactScore': -1, xp: -1 };
        break;
      default:
        sortCriteria = { xp: -1, level: -1 };
    }

    const user = await User.findById(userId).select('xp level stats').lean();
    if (!user) return null;

    let query = {
      isActive: true,
      'preferences.privacy.profileVisibility': { $in: ['public', null] }
    };

    // Count users ranked higher
    let higherRankedQuery = { ...query };
    
    switch (category) {
      case 'xp':
        higherRankedQuery.$or = [
          { xp: { $gt: user.xp } },
          { xp: user.xp, level: { $gt: user.level } }
        ];
        break;
      case 'level':
        higherRankedQuery.$or = [
          { level: { $gt: user.level } },
          { level: user.level, xp: { $gt: user.xp } }
        ];
        break;
      case 'posts':
        higherRankedQuery['stats.postsCount'] = { $gt: user.stats?.postsCount || 0 };
        break;
      case 'quests':
        higherRankedQuery['stats.questsCompleted'] = { $gt: user.stats?.questsCompleted || 0 };
        break;
      case 'impact':
        higherRankedQuery['stats.impactScore'] = { $gt: user.stats?.impactScore || 0 };
        break;
    }

    const higherRankedCount = await User.countDocuments(higherRankedQuery);
    return {
      category,
      rank: higherRankedCount + 1,
      totalUsers: await User.countDocuments(query)
    };
  } catch (error) {
    console.error('Error calculating user ranking:', error);
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { userId } = params;
    const currentUserId = await getCurrentUser(request);
    
    // Find the target user
    const user = await User.findById(userId)
      .select('-password') // Never include password
      .lean();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Check if current user can view this profile
    if (!canViewProfile(user, currentUserId)) {
      return NextResponse.json({
        success: false,
        message: 'Bu profili görme yetkiniz yok',
        isPrivate: true
      }, { status: 403 });
    }

    // Get user rankings in different categories
    const rankings = await Promise.all([
      getUserRanking(userId, 'xp'),
      getUserRanking(userId, 'level'),
      getUserRanking(userId, 'posts'),
      getUserRanking(userId, 'quests'),
      getUserRanking(userId, 'impact')
    ]);

    // Calculate additional stats
    const joinDate = new Date(user.createdAt);
    const daysSinceJoining = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
    
    // Calculate activity streak (simplified)
    const activityStreak = Math.min(Math.floor(daysSinceJoining / 7), 30);
    
    // Get achievements count
    const achievementsCount = user.badges?.length || 0;
    
    // Prepare response data
    const profileData = {
      id: user._id.toString(),
      username: user.username,
      email: currentUserId === user._id.toString() ? user.email : undefined, // Only show email to self
      level: user.level || 1,
      xp: user.xp || 0,
      characterClass: user.characterClass,
      avatar: user.avatarUrls?.medium || user.avatar || null,
      avatarUrls: user.avatarUrls || null,
      bio: user.bio || '',
      
      // Privacy-respecting stats
      stats: user.preferences?.privacy?.showStats !== false ? {
        postsCount: user.stats?.postsCount || 0,
        commentsCount: user.stats?.commentsCount || 0,
        likesGiven: user.stats?.likesGiven || 0,
        likesReceived: user.stats?.likesReceived || 0,
        questsCompleted: user.stats?.questsCompleted || 0,
        impactScore: user.stats?.impactScore || 0
      } : null,
      
      // Activity data (if privacy allows)
      activity: user.preferences?.privacy?.showActivity !== false ? {
        joinDate: user.createdAt,
        lastActive: user.lastActiveAt,
        isOnline: user.lastActiveAt && (new Date() - new Date(user.lastActiveAt)) < 5 * 60 * 1000,
        daysSinceJoining,
        activityStreak
      } : null,
      
      // Achievements
      achievements: {
        count: achievementsCount,
        badges: user.badges || [],
        recentBadges: user.badges?.slice(-5).reverse() || []
      },
      
      // Regions
      regions: {
        visited: user.visitedRegions || ['humor_valley'],
        unlocked: user.unlockedRegions || ['humor_valley'],
        current: user.currentRegion || 'humor_valley'
      },
      
      // Rankings
      rankings: {
        xp: rankings[0],
        level: rankings[1],
        posts: rankings[2],
        quests: rankings[3],
        impact: rankings[4]
      },
      
      // Social data
      social: {
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        isFollowing: false // TODO: Implement following system
      },
      
      // Privacy settings (only show to self)
      privacy: currentUserId === user._id.toString() ? user.preferences?.privacy : undefined,
      
      // Verification status
      isVerified: user.isVerified || false,
      
      // Whether this is the current user's own profile
      isOwnProfile: currentUserId === user._id.toString()
    };

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('User Profile API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}