// app/api/friends/requests/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
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

// Get friend requests (incoming and outgoing)
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
    const type = searchParams.get('type') || 'all'; // 'incoming', 'outgoing', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const results = {};

    if (type === 'incoming' || type === 'all') {
      // Get incoming requests (received by current user)
      const incomingRequests = await FriendRequest.find({
        recipient: currentUserId,
        status: 'pending'
      })
      .populate('sender', 'username avatar avatarUrls characterClass level stats.impactScore bio isOnline lastActiveAt')
      .sort({ createdAt: -1 })
      .skip(type === 'incoming' ? skip : 0)
      .limit(type === 'incoming' ? limit : 50)
      .lean();

      // Format incoming requests
      results.incoming = incomingRequests.map(req => ({
        _id: req._id,
        sender: {
          _id: req.sender._id,
          username: req.sender.username,
          avatar: req.sender.avatarUrls?.medium || req.sender.avatar,
          characterClass: req.sender.characterClass,
          level: req.sender.level,
          stats: req.sender.stats,
          bio: req.sender.bio,
          isOnline: req.sender.lastActiveAt && (new Date() - new Date(req.sender.lastActiveAt)) < 5 * 60 * 1000
        },
        message: req.message,
        createdAt: req.createdAt,
        status: req.status
      }));
    }

    if (type === 'outgoing' || type === 'all') {
      // Get outgoing requests (sent by current user)
      const outgoingRequests = await FriendRequest.find({
        sender: currentUserId,
        status: 'pending'
      })
      .populate('recipient', 'username avatar avatarUrls characterClass level stats.impactScore bio isOnline lastActiveAt')
      .sort({ createdAt: -1 })
      .skip(type === 'outgoing' ? skip : 0)
      .limit(type === 'outgoing' ? limit : 50)
      .lean();

      // Format outgoing requests
      results.outgoing = outgoingRequests.map(req => ({
        _id: req._id,
        recipient: {
          _id: req.recipient._id,
          username: req.recipient.username,
          avatar: req.recipient.avatarUrls?.medium || req.recipient.avatar,
          characterClass: req.recipient.characterClass,
          level: req.recipient.level,
          stats: req.recipient.stats,
          bio: req.recipient.bio,
          isOnline: req.recipient.lastActiveAt && (new Date() - new Date(req.recipient.lastActiveAt)) < 5 * 60 * 1000
        },
        message: req.message,
        createdAt: req.createdAt,
        status: req.status
      }));
    }

    // Count totals for pagination
    let pagination = {};
    if (type !== 'all') {
      const totalCount = await FriendRequest.countDocuments({
        [type === 'incoming' ? 'recipient' : 'sender']: currentUserId,
        status: 'pending'
      });

      pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + (results[type]?.length || 0) < totalCount,
        total: totalCount
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        ...(type !== 'all' && { pagination })
      }
    });

  } catch (error) {
    console.error('Friend Requests API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Arkadaşlık istekleri alınırken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}