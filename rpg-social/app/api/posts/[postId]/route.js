// app/api/posts/[postId]/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Post from '@/lib/models/Post';
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

// DELETE - Delete a post
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

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({
        success: false,
        message: 'Gönderi bulunamadı'
      }, { status: 404 });
    }

    // Check if user owns the post
    if (post.author.toString() !== currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Bu gönderiyi silme yetkiniz yok'
      }, { status: 403 });
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Broadcast post deletion via Socket.IO if available
    if (global.io) {
      global.io.emit('post:delete', {
        postId,
        authorId: currentUserId
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gönderi başarıyla silindi',
      data: { postId }
    });

  } catch (error) {
    console.error('Delete Post API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}