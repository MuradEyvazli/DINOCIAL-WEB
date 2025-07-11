// app/api/users/follow/[userId]/route.js
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

// Unfollow a user
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

    const { userId } = params;

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı ID gerekli'
      }, { status: 400 });
    }

    // Can't unfollow yourself
    if (currentUserId === userId) {
      return NextResponse.json({
        success: false,
        message: 'Kendinizi takipten çıkaramazsınız'
      }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId).select('username avatar avatarUrls characterClass level');
    if (!targetUser) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Check if currently following
    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.some(f => f.user.toString() === userId);
    
    if (!isFollowing) {
      return NextResponse.json({
        success: false,
        message: 'Bu kullanıcıyı zaten takip etmiyorsunuz'
      }, { status: 409 });
    }

    // Remove from following list and followers list
    await Promise.all([
      // Remove from current user's following list
      User.findByIdAndUpdate(currentUserId, {
        $pull: { 
          following: { user: userId }
        }
      }),
      // Remove from target user's followers list
      User.findByIdAndUpdate(userId, {
        $pull: { 
          followers: { user: currentUserId }
        }
      })
    ]);

    // TODO: Send notification to target user (optional)

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı takipten çıkarıldı',
      data: {
        userId: userId,
        isFollowing: false,
        unfollowedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Unfollow User API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Kullanıcı takipten çıkarılamadı',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}