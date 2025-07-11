// app/api/users/search/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import FriendRequest from '@/lib/models/FriendRequest';
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
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        message: 'En az 2 karakter giriniz'
      }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Search users by username (case insensitive)
    const searchRegex = new RegExp(query.trim(), 'i');
    
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      username: { $regex: searchRegex },
      isActive: true,
      $or: [
        { 'preferences.privacy.profileVisibility': 'public' },
        { 'preferences.privacy.profileVisibility': { $exists: false } },
        { 'preferences.privacy': { $exists: false } },
        { 'preferences': { $exists: false } }
      ]
    })
    .select('username avatar avatarUrls characterClass level isOnline lastActiveAt bio')
    .sort({ 
      // Prioritize exact matches, then partial matches
      username: 1,
      level: -1 
    })
    .skip(skip)
    .limit(limit)
    .lean();

    // Get current user's social data
    const currentUser = await User.findById(currentUserId).select('following').lean();
    const currentUserFollowing = currentUser.following.map(f => f.user.toString());
    
    // Get pending friend requests
    const pendingRequests = await FriendRequest.find({
      $or: [
        { sender: currentUserId, status: 'pending' },
        { recipient: currentUserId, status: 'pending' }
      ]
    }).select('sender recipient').lean();
    
    const sentRequestIds = pendingRequests
      .filter(req => req.sender.toString() === currentUserId)
      .map(req => req.recipient.toString());
    
    const receivedRequestIds = pendingRequests
      .filter(req => req.recipient.toString() === currentUserId)
      .map(req => req.sender.toString());

    // Calculate activity status and social relationships
    const usersWithStatus = users.map(user => {
      const userId = user._id.toString();
      return {
        ...user,
        id: userId,
        isOnline: user.lastActiveAt && (new Date() - new Date(user.lastActiveAt)) < 5 * 60 * 1000,
        avatar: user.avatarUrls?.medium || user.avatar || null,
        // Social relationship status
        isFollowing: currentUserFollowing.includes(userId),
        isFriend: currentUserFollowing.includes(userId), // In this system, following = friendship
        friendRequestSent: sentRequestIds.includes(userId),
        friendRequestReceived: receivedRequestIds.includes(userId),
        stats: {
          ...user.stats,
          friendsCount: 0, // We can calculate this if needed
          followersCount: 0,
          followingCount: 0
        }
      };
    });

    // Count total results for pagination
    const totalUsers = await User.countDocuments({
      _id: { $ne: currentUserId },
      username: { $regex: searchRegex },
      isActive: true,
      $or: [
        { 'preferences.privacy.profileVisibility': 'public' },
        { 'preferences.privacy.profileVisibility': { $exists: false } },
        { 'preferences.privacy': { $exists: false } },
        { 'preferences': { $exists: false } }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStatus,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          hasMore: skip + users.length < totalUsers,
          total: totalUsers
        },
        query: query.trim()
      }
    });

  } catch (error) {
    console.error('User Search API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Arama hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}