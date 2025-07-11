// app/api/auth/me-minimal/route.js - Minimal test endpoint
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  console.log('=== MINIMAL AUTH ENDPOINT ===');
  
  try {
    // Simple auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    console.log('Token verified, userId:', userId);

    // Connect to DB
    await connectToDatabase();
    console.log('DB connected');

    // Find user
    const user = await User.findById(userId).select('username level xp email isActive');
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    console.log('User found:', user.username);

    // Return minimal response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          level: user.level || 1,
          xp: user.xp || 0,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    console.error('Minimal auth error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    }, { status: 500 });
  }
}