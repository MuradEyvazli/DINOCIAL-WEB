// app/api/friends/request/[requestId]/route.js
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

// Accept or reject friend request
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { requestId } = params;
    const { action } = await request.json();

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Geçersiz işlem'
      }, { status: 400 });
    }

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId)
      .populate('sender', 'username avatar avatarUrls characterClass level stats.impactScore bio')
      .populate('recipient', 'username avatar avatarUrls characterClass level');

    if (!friendRequest) {
      return NextResponse.json({
        success: false,
        message: 'Arkadaşlık isteği bulunamadı'
      }, { status: 404 });
    }

    // Check if current user is the recipient
    if (friendRequest.recipient._id.toString() !== currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok'
      }, { status: 403 });
    }

    // Check if request is still pending
    if (friendRequest.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: 'Bu istek zaten işlenmiş'
      }, { status: 409 });
    }

    if (action === 'accept') {
      // Accept the request
      await friendRequest.accept();

      // Add each other to friends lists (following/followers)
      await Promise.all([
        // Sender follows recipient
        User.findByIdAndUpdate(friendRequest.sender._id, {
          $addToSet: { 
            following: { 
              user: friendRequest.recipient._id, 
              followedAt: new Date() 
            } 
          }
        }),
        // Recipient follows sender (mutual follow = friendship)
        User.findByIdAndUpdate(friendRequest.recipient._id, {
          $addToSet: { 
            following: { 
              user: friendRequest.sender._id, 
              followedAt: new Date() 
            } 
          }
        })
      ]);

      // TODO: Send real-time notification
      // TODO: Send email notification

      return NextResponse.json({
        success: true,
        message: 'Arkadaşlık isteği kabul edildi',
        data: {
          friend: {
            _id: friendRequest.sender._id,
            username: friendRequest.sender.username,
            avatar: friendRequest.sender.avatarUrls?.medium || friendRequest.sender.avatar,
            characterClass: friendRequest.sender.characterClass,
            level: friendRequest.sender.level,
            stats: friendRequest.sender.stats,
            bio: friendRequest.sender.bio,
            friendshipDate: new Date().toISOString()
          },
          requestId: friendRequest._id
        }
      });

    } else if (action === 'reject') {
      // Reject the request
      await friendRequest.reject();

      // TODO: Send notification to sender (optional)

      return NextResponse.json({
        success: true,
        message: 'Arkadaşlık isteği reddedildi',
        data: {
          requestId: friendRequest._id
        }
      });
    }

  } catch (error) {
    console.error('Friend Request Response API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'İstek işlenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Delete/cancel friend request
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { requestId } = params;

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return NextResponse.json({
        success: false,
        message: 'Arkadaşlık isteği bulunamadı'
      }, { status: 404 });
    }

    // Check if current user is the sender (only sender can cancel)
    if (friendRequest.sender.toString() !== currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok'
      }, { status: 403 });
    }

    // Delete the request
    await FriendRequest.findByIdAndDelete(requestId);

    return NextResponse.json({
      success: true,
      message: 'Arkadaşlık isteği iptal edildi',
      data: {
        requestId: requestId
      }
    });

  } catch (error) {
    console.error('Friend Request Delete API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'İstek iptal edilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}