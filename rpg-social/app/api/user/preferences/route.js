// app/api/user/preferences/route.js
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
    const { 
      theme, 
      language, 
      timezone, 
      dateFormat, 
      autoSave, 
      compactMode 
    } = body;

    // User preferences güncelle
    const updateData = {};

    if (theme !== undefined) {
      if (!['dark', 'light', 'auto'].includes(theme)) {
        return NextResponse.json(
          { success: false, message: 'Geçersiz tema değeri' },
          { status: 400 }
        );
      }
      updateData['preferences.theme'] = theme;
    }

    if (language !== undefined) {
      if (!['tr', 'en', 'de'].includes(language)) {
        return NextResponse.json(
          { success: false, message: 'Geçersiz dil değeri' },
          { status: 400 }
        );
      }
      updateData['preferences.language'] = language;
    }

    if (timezone !== undefined) {
      updateData['preferences.timezone'] = timezone;
    }

    if (dateFormat !== undefined) {
      if (!['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(dateFormat)) {
        return NextResponse.json(
          { success: false, message: 'Geçersiz tarih formatı' },
          { status: 400 }
        );
      }
      updateData['preferences.dateFormat'] = dateFormat;
    }

    if (autoSave !== undefined) {
      updateData['preferences.autoSave'] = Boolean(autoSave);
    }

    if (compactMode !== undefined) {
      updateData['preferences.compactMode'] = Boolean(compactMode);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({
      success: true,
      message: 'Tercihler başarıyla güncellendi',
      data: {
        theme: updatedUser.preferences?.theme || 'dark',
        language: updatedUser.preferences?.language || 'tr',
        timezone: updatedUser.preferences?.timezone || 'Europe/Istanbul',
        dateFormat: updatedUser.preferences?.dateFormat || 'DD/MM/YYYY',
        autoSave: updatedUser.preferences?.autoSave !== false,
        compactMode: updatedUser.preferences?.compactMode || false
      }
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    
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
    const user = await User.findById(userId).select('preferences');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        theme: user.preferences?.theme || 'dark',
        language: user.preferences?.language || 'tr',
        timezone: user.preferences?.timezone || 'Europe/Istanbul',
        dateFormat: user.preferences?.dateFormat || 'DD/MM/YYYY',
        autoSave: user.preferences?.autoSave !== false,
        compactMode: user.preferences?.compactMode || false
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    
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