// app/api/guilds/join/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
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

// POST - Join a guild
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
    const { guildId } = body;

    if (!guildId) {
      return NextResponse.json({
        success: false,
        message: 'Guild ID gerekli'
      }, { status: 400 });
    }

    // Mock join logic - in real app, this would update the database
    return NextResponse.json({
      success: true,
      message: 'Guild\'e başarıyla katıldınız!',
      data: {
        guildId,
        userId: currentUserId,
        joinedAt: new Date(),
        role: 'member'
      }
    });

  } catch (error) {
    console.error('Join Guild API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Guild\'e katılma hatası'
    }, { status: 500 });
  }
}