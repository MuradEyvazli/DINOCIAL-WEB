// app/api/posts/test/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Post from '@/lib/models/Post';

// Test endpoint to check posts
export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Get all posts
    const posts = await Post.find({}).limit(10);
    
    // Check for duplicates
    const ids = posts.map(p => p._id.toString());
    const uniqueIds = new Set(ids);
    
    return NextResponse.json({
      success: true,
      totalPosts: posts.length,
      uniqueCount: uniqueIds.size,
      hasDuplicates: posts.length !== uniqueIds.size,
      posts: posts.map(p => ({
        _id: p._id.toString(),
        content: p.content?.text?.substring(0, 50) + '...',
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}