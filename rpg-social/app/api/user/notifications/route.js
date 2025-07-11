// app/api/user/notifications/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import connectToDatabase from '@/lib/db/mongodb';

export async function PUT(request) {
  try {
    await connectToDatabase();
    
    // Token doğrulama
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Token gerekli' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Request body'yi al
    const body = await request.json();
    const { email, push, inApp } = body;

    // Notification preferences güncelle
    const updateData = {
      'preferences.notifications': {}
    };

    if (email !== undefined) {
      updateData['preferences.notifications.email'] = email;
    }

    if (push !== undefined) {
      updateData['preferences.notifications.push'] = push;
    }

    if (inApp !== undefined) {
      updateData['preferences.notifications.inApp'] = inApp;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({
      success: true,
      message: 'Bildirim ayarları başarıyla güncellendi',
      data: updatedUser.preferences.notifications
    });

  } catch (error) {
    console.error('Notifications update error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, message: 'Geçersiz token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Token doğrulama
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Token gerekli' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Kullanıcıyı bul
    const user = await User.findById(userId).select('preferences.notifications');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.preferences?.notifications || {
        email: {
          achievements: true,
          quests: true,
          guild: true,
          messages: true,
          marketing: false
        },
        push: {
          achievements: true,
          quests: true,
          guild: true,
          messages: true,
          mentions: true
        },
        inApp: {
          achievements: true,
          quests: true,
          guild: true,
          messages: true,
          sound: true
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, message: 'Geçersiz token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}