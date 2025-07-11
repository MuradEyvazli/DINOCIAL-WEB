// app/api/posts/[postId]/like/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Post from '@/lib/models/Post';
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

// POST - Toggle like on post
export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { postId } = params;
    console.log('Like API - PostId:', postId, 'UserId:', currentUserId);

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({
        success: false,
        message: 'Gönderi bulunamadı'
      }, { status: 404 });
    }

    // Toggle like
    const isLiked = post.toggleLike(currentUserId);
    await post.save();

    // Update user stats
    if (isLiked) {
      // Increment likes given for current user
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { 'stats.likesGiven': 1 }
      });
      
      // Increment likes received for post author
      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.likesReceived': 1 }
      });
    } else {
      // Decrement likes given for current user
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { 'stats.likesGiven': -1 }
      });
      
      // Decrement likes received for post author
      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.likesReceived': -1 }
      });
    }

    // Broadcast like update via Socket.IO if available
    if (global.io) {
      global.io.emit('post:like', {
        postId,
        userId: currentUserId,
        isLiked,
        likesCount: post.likesCount
      });
    }

    return NextResponse.json({
      success: true,
      message: isLiked ? 'Gönderi beğenildi' : 'Beğeni kaldırıldı',
      data: {
        isLiked,
        likesCount: post.likesCount
      }
    });

  } catch (error) {
    console.error('Like Post API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}