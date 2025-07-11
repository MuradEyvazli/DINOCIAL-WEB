// app/api/users/follow/data/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Get current user from JWT token
async function getCurrentUser(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Get follow data (following and followers)
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'both'; // 'following', 'followers', 'both'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    const results = {};

    if (type === 'following' || type === 'both') {
      // Get following list
      const followingData = await User.findById(currentUserId)
        .populate({
          path: 'following.user',
          select: 'username avatar avatarUrls characterClass level stats.impactScore bio isOnline lastActiveAt',
        })
        .select('following')
        .lean();

      const following = followingData.following
        .filter(f => f.user) // Remove any null references
        .map(f => ({
          _id: f.user._id,
          username: f.user.username,
          avatar: f.user.avatarUrls?.medium || f.user.avatar,
          characterClass: f.user.characterClass,
          level: f.user.level,
          stats: f.user.stats,
          bio: f.user.bio,
          isOnline: f.user.lastActiveAt && (new Date() - new Date(f.user.lastActiveAt)) < 5 * 60 * 1000,
          followedAt: f.followedAt,
          lastActiveAt: f.user.lastActiveAt
        }))
        .sort((a, b) => new Date(b.followedAt) - new Date(a.followedAt));

      results.following = type === 'following' ? following.slice(skip, skip + limit) : following;
    }

    if (type === 'followers' || type === 'both') {
      // Get followers list
      const followersData = await User.findById(currentUserId)
        .populate({
          path: 'followers.user',
          select: 'username avatar avatarUrls characterClass level stats.impactScore bio isOnline lastActiveAt',
        })
        .select('followers')
        .lean();

      const followers = followersData.followers
        .filter(f => f.user) // Remove any null references
        .map(f => ({
          _id: f.user._id,
          username: f.user.username,
          avatar: f.user.avatarUrls?.medium || f.user.avatar,
          characterClass: f.user.characterClass,
          level: f.user.level,
          stats: f.user.stats,
          bio: f.user.bio,
          isOnline: f.user.lastActiveAt && (new Date() - new Date(f.user.lastActiveAt)) < 5 * 60 * 1000,
          followedAt: f.followedAt,
          lastActiveAt: f.user.lastActiveAt,
          // Check if this follower is also being followed (mutual)
          isMutual: currentUser.following.some(following => 
            following.user.toString() === f.user._id.toString()
          )
        }))
        .sort((a, b) => new Date(b.followedAt) - new Date(a.followedAt));

      results.followers = type === 'followers' ? followers.slice(skip, skip + limit) : followers;
    }

    // Calculate pagination for single type requests
    let pagination = {};
    if (type !== 'both') {
      const totalCount = results[type]?.length || 0;
      pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
        total: totalCount
      };
    }

    // Calculate stats
    const stats = {
      followingCount: results.following?.length || currentUser.following.length,
      followersCount: results.followers?.length || currentUser.followers.length,
      mutualCount: results.followers?.filter(f => f.isMutual).length || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        stats,
        ...(type !== 'both' && { pagination })
      }
    });

  } catch (error) {
    console.error('Follow Data API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Takip verileri alınırken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}