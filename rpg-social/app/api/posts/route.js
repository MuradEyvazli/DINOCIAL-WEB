// app/api/posts/route.js
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

// GET - Get posts feed
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId'); // For user-specific posts

    let posts;
    if (userId) {
      // Get posts by specific user
      posts = await Post.getByUser(userId, page, limit);
    } else {
      // Get general feed
      posts = await Post.getForFeed(currentUserId, page, limit);
    }

    // Add isLikedBy information for each post and ensure unique IDs
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLikedBy = post.likes.some(like => 
        like.user.toString() === currentUserId
      );
      // Ensure each post has unique _id
      postObj._id = post._id.toString();
      return postObj;
    });

    return NextResponse.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          currentPage: page,
          hasMore: posts.length === limit,
          total: await Post.countDocuments({
            isActive: true,
            visibility: 'public',
            ...(userId && { author: userId })
          })
        }
      }
    });

  } catch (error) {
    console.error('Posts API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST - Create new post
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

    const body = await request.json();
    const { content, type = 'text', visibility = 'public', region, tags, metadata } = body;

    // Validation
    if (!content?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Gönderi içeriği gerekli'
      }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({
        success: false,
        message: 'Gönderi içeriği 2000 karakterden fazla olamaz'
      }, { status: 400 });
    }

    // Create new post
    const newPost = new Post({
      author: currentUserId,
      content: {
        text: content.trim(),
        type,
        metadata
      },
      visibility,
      region,
      tags: tags || []
    });

    await newPost.save();

    // Populate author information
    await newPost.populate('author', 'username avatar avatarUrls characterClass level');

    // Broadcast new post to followers via Socket.IO if available
    if (global.io) {
      global.io.emit('post:new', {
        post: newPost.toObject(),
        authorId: currentUserId
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gönderi başarıyla paylaşıldı',
      data: newPost
    }, { status: 201 });

  } catch (error) {
    console.error('Create Post API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}