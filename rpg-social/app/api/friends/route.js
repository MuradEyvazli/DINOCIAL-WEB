// app/api/friends/route.js
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

// Get user's friends list
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Get current user with populated friends
    const currentUser = await User.findById(currentUserId)
      .populate({
        path: 'following.user',
        select: 'username avatar avatarUrls characterClass level stats.impactScore bio isOnline lastActiveAt',
        match: search ? { username: { $regex: search, $options: 'i' } } : {}
      })
      .lean();

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Filter out null values (from search match) and format friends
    const allFriends = currentUser.following
      .filter(f => f.user) // Remove null matches
      .map(f => ({
        _id: f.user._id,
        username: f.user.username,
        avatar: f.user.avatarUrls?.medium || f.user.avatar,
        characterClass: f.user.characterClass,
        level: f.user.level,
        stats: f.user.stats,
        bio: f.user.bio,
        isOnline: f.user.lastActiveAt && (new Date() - new Date(f.user.lastActiveAt)) < 5 * 60 * 1000,
        friendshipDate: f.followedAt,
        lastActiveAt: f.user.lastActiveAt
      }))
      .sort((a, b) => {
        // Sort by online status first, then by last active
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return new Date(b.lastActiveAt) - new Date(a.lastActiveAt);
      });

    // Apply pagination
    const friends = allFriends.slice(skip, skip + limit);

    // Get mutual friends count for each friend (optional, expensive operation)
    // const friendsWithMutualCount = await Promise.all(
    //   friends.map(async (friend) => {
    //     const mutualCount = await User.aggregate([
    //       { $match: { _id: mongoose.Types.ObjectId(friend._id) } },
    //       { $project: { 
    //         mutualFriends: {
    //           $size: {
    //             $setIntersection: [
    //               '$following.user',
    //               currentUser.following.map(f => f.user)
    //             ]
    //           }
    //         }
    //       }}
    //     ]);
        
    //     return {
    //       ...friend,
    //       mutualFriendsCount: mutualCount[0]?.mutualFriends || 0
    //     };
    //   })
    // );

    // Calculate stats
    const totalFriends = allFriends.length;
    const onlineFriends = allFriends.filter(f => f.isOnline).length;

    return NextResponse.json({
      success: true,
      data: {
        friends: friends,
        stats: {
          totalFriends,
          onlineFriends,
          offlineFriends: totalFriends - onlineFriends
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalFriends / limit),
          hasMore: skip + friends.length < totalFriends,
          total: totalFriends
        }
      }
    });

  } catch (error) {
    console.error('Friends List API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Arkadaş listesi alınırken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}