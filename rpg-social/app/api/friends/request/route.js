// app/api/friends/request/route.js
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

// Send friend request
export async function POST(request) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { userId, message } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı ID gerekli'
      }, { status: 400 });
    }

    // Kendisine istek gönderemez
    if (currentUserId === userId) {
      return NextResponse.json({
        success: false,
        message: 'Kendinize arkadaşlık isteği gönderemezsiniz'
      }, { status: 400 });
    }

    // Alıcı kullanıcı var mı kontrol et
    const recipient = await User.findById(userId).select('username avatar avatarUrls characterClass level preferences.privacy');
    if (!recipient) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Privacy check - direct messages allowed mı?
    if (recipient.preferences?.privacy?.allowDirectMessages === false) {
      return NextResponse.json({
        success: false,
        message: 'Bu kullanıcı arkadaşlık isteklerini kabul etmiyor'
      }, { status: 403 });
    }

    // Mevcut istek var mı kontrol et
    const existingRequest = await FriendRequest.checkExistingRequest(currentUserId, userId);
    if (existingRequest) {
      return NextResponse.json({
        success: false,
        message: 'Zaten bu kullanıcıyla aranızda bekleyen bir istek var'
      }, { status: 409 });
    }

    // Zaten arkadaş mı kontrol et
    const currentUser = await User.findById(currentUserId);
    const isAlreadyFriend = currentUser.following.some(f => f.user.toString() === userId);
    if (isAlreadyFriend) {
      return NextResponse.json({
        success: false,
        message: 'Bu kullanıcı zaten arkadaşınız'
      }, { status: 409 });
    }

    // Yeni arkadaşlık isteği oluştur
    const friendRequest = new FriendRequest({
      sender: currentUserId,
      recipient: userId,
      message: message?.trim() || undefined
    });

    await friendRequest.save();

    // Populate sender data for response
    await friendRequest.populate('sender', 'username avatar avatarUrls characterClass level stats.impactScore bio');
    await friendRequest.populate('recipient', 'username avatar avatarUrls characterClass level');

    // TODO: Real-time notification gönder (Socket.io ile)
    // TODO: Email/Push notification gönder

    return NextResponse.json({
      success: true,
      message: 'Arkadaşlık isteği gönderildi',
      data: {
        _id: friendRequest._id,
        recipient: friendRequest.recipient,
        sender: friendRequest.sender,
        status: friendRequest.status,
        message: friendRequest.message,
        createdAt: friendRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Friend Request API Error:', error);
    
    // Duplicate key error (already sent)
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Zaten bu kullanıcıya arkadaşlık isteği gönderilmiş'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: 'Arkadaşlık isteği gönderilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}