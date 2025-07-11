// app/api/posts/[postId]/comments/route.js
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

// POST - Add comment to post
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
    const body = await request.json();
    const { content } = body;

    // Validation
    if (!content?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Yorum içeriği gerekli'
      }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({
        success: false,
        message: 'Yorum 500 karakterden fazla olamaz'
      }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({
        success: false,
        message: 'Gönderi bulunamadı'
      }, { status: 404 });
    }

    // Add comment
    const newComment = post.addComment(currentUserId, content);
    await post.save();

    // Update user stats
    await User.findByIdAndUpdate(currentUserId, {
      $inc: { 'stats.commentsCount': 1 }
    });

    // Populate comment user info
    await post.populate('comments.user', 'username avatar avatarUrls characterClass level');

    // Get the populated comment
    const populatedComment = post.comments.id(newComment._id);

    // Broadcast comment update via Socket.IO if available
    if (global.io) {
      global.io.emit('post:comment', {
        postId,
        comment: populatedComment,
        commentsCount: post.commentsCount
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Yorum eklendi',
      data: {
        comment: populatedComment,
        commentsCount: post.commentsCount
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Add Comment API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Remove comment from post
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

    const { postId } = params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({
        success: false,
        message: 'Yorum ID gerekli'
      }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({
        success: false,
        message: 'Gönderi bulunamadı'
      }, { status: 404 });
    }

    // Find the comment and check ownership
    const comment = post.comments.find(c => 
      c._id.toString() === commentId || c.id === commentId
    );
    
    if (!comment) {
      return NextResponse.json({
        success: false,
        message: 'Yorum bulunamadı'
      }, { status: 404 });
    }
    
    if (comment.user.toString() !== currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Bu yorumu silme yetkiniz yok'
      }, { status: 403 });
    }
    
    // Remove the comment
    post.comments = post.comments.filter(c => 
      c._id.toString() !== commentId && c.id !== commentId
    );

    await post.save();

    // Update user stats
    await User.findByIdAndUpdate(currentUserId, {
      $inc: { 'stats.commentsCount': -1 }
    });

    // Broadcast comment removal via Socket.IO if available
    if (global.io) {
      global.io.emit('post:comment:delete', {
        postId,
        commentId,
        commentsCount: post.commentsCount
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Yorum silindi',
      data: {
        commentsCount: post.commentsCount
      }
    });

  } catch (error) {
    console.error('Delete Comment API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}