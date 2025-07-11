// app/api/users/follow/route.js
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

// Follow a user
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı ID gerekli'
      }, { status: 400 });
    }

    // Can't follow yourself
    if (currentUserId === userId) {
      return NextResponse.json({
        success: false,
        message: 'Kendinizi takip edemezsiniz'
      }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId).select('username avatar avatarUrls characterClass level preferences.privacy');
    if (!targetUser) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Privacy check
    if (targetUser.preferences?.privacy?.profileVisibility === 'private') {
      return NextResponse.json({
        success: false,
        message: 'Bu kullanıcı takip edilmeye izin vermiyor'
      }, { status: 403 });
    }

    // Check if already following
    const currentUser = await User.findById(currentUserId);
    const isAlreadyFollowing = currentUser.following.some(f => f.user.toString() === userId);
    
    if (isAlreadyFollowing) {
      return NextResponse.json({
        success: false,
        message: 'Bu kullanıcıyı zaten takip ediyorsunuz'
      }, { status: 409 });
    }

    // Add to following list and followers list
    await Promise.all([
      // Add to current user's following list
      User.findByIdAndUpdate(currentUserId, {
        $addToSet: { 
          following: { 
            user: userId, 
            followedAt: new Date() 
          } 
        }
      }),
      // Add to target user's followers list
      User.findByIdAndUpdate(userId, {
        $addToSet: { 
          followers: { 
            user: currentUserId, 
            followedAt: new Date() 
          } 
        }
      })
    ]);

    // TODO: Send notification to target user
    // TODO: Check if this creates a mutual follow (friendship)

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı takip edildi',
      data: {
        _id: targetUser._id,
        username: targetUser.username,
        avatar: targetUser.avatarUrls?.medium || targetUser.avatar,
        characterClass: targetUser.characterClass,
        level: targetUser.level,
        isFollowing: true,
        followedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Follow User API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Kullanıcı takip edilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}