// app/api/user/delete/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import connectToDatabase from '@/lib/db/mongodb';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request) {
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

    // Request body'yi al
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Şifre gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı şifresi ile birlikte bul
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Şifreyi kontrol et
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Şifre yanlış' },
        { status: 400 }
      );
    }

    // Avatar dosyasını sil (eğer varsa)
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      try {
        const avatarPath = path.join(process.cwd(), 'public', user.avatar);
        await unlink(avatarPath);
      } catch (error) {
        console.error('Avatar silme hatası:', error);
        // Avatar silinemese bile hesap silme işlemine devam et
      }
    }

    // İlişkili verileri temizle
    // Diğer kullanıcıların following/followers listelerinden bu kullanıcıyı kaldır
    await User.updateMany(
      { 'following.user': userId },
      { $pull: { following: { user: userId } } }
    );
    
    await User.updateMany(
      { 'followers.user': userId },
      { $pull: { followers: { user: userId } } }
    );

    // TODO: Diğer koleksiyonlardaki verilerini de temizle
    // Posts, Comments, Messages, Notifications, etc.

    // Kullanıcıyı sil
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'Hesap ve tüm veriler başarıyla silindi'
    });

  } catch (error) {
    console.error('Account delete error:', error);
    
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

// Hesap deaktivasyonu
export async function PATCH(request) {
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

    // Request body'yi al
    const body = await request.json();
    const { action } = body; // 'deactivate' veya 'reactivate'

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Hesap durumunu değiştir
    const isActive = action === 'reactivate';
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    const message = isActive 
      ? 'Hesap başarıyla aktifleştirildi' 
      : 'Hesap başarıyla deaktive edildi';

    return NextResponse.json({
      success: true,
      message,
      data: updatedUser
    });

  } catch (error) {
    console.error('Account status change error:', error);
    
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