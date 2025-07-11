// app/api/user/avatar/route.js - TAM ÇALIŞAN CLOUDİNARY VERSİYONU
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import connectToDatabase from '@/lib/db/mongodb';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary konfigürasyonu
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Rate limiting için basit bir cache
const uploadAttempts = new Map();

// Avatar upload
export async function POST(request) {
  try {
    console.log('📸 Cloudinary avatar upload başlatıldı');
    
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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz token' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Rate limiting kontrolü (Kullanıcı başına 5 upload/dakika)
    const now = Date.now();
    const userAttempts = uploadAttempts.get(userId) || [];
    const recentAttempts = userAttempts.filter(time => now - time < 60000);
    
    if (recentAttempts.length >= 5) {
      return NextResponse.json(
        { success: false, message: 'Çok fazla yükleme denemesi. 1 dakika sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // FormData'yı al
    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    console.log('📁 Dosya bilgileri:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Dosya doğrulama
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Sadece JPEG, PNG ve WebP dosyaları kabul edilir' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Dosya boyutu 5MB\'dan büyük olamaz' },
        { status: 400 }
      );
    }

    // Rate limiting kaydı
    uploadAttempts.set(userId, [...recentAttempts, now]);

    try {
      console.log('☁️ Cloudinary\'a yükleniyor...');
      
      // Dosyayı buffer'a çevir
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      // Eski avatarın public_id'sini al (silmek için)
      let oldPublicId = null;
      if (user.cloudinaryPublicId) {
        oldPublicId = user.cloudinaryPublicId;
      }

      // Cloudinary upload seçenekleri
      const uploadOptions = {
        folder: 'rpg-social/avatars',
        public_id: `avatar_${userId}_${Date.now()}`,
        transformation: [
          {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto:best',
            fetch_format: 'auto'
          }
        ],
        // Otomatik thumbnail'ler oluştur
        eager: [
          { 
            width: 150, 
            height: 150, 
            crop: 'fill', 
            gravity: 'face', 
            quality: 'auto:good',
            fetch_format: 'auto'
          },
          { 
            width: 64, 
            height: 64, 
            crop: 'fill', 
            gravity: 'face', 
            quality: 'auto:good',
            fetch_format: 'auto'
          },
          { 
            width: 32, 
            height: 32, 
            crop: 'fill', 
            gravity: 'face', 
            quality: 'auto:good',
            fetch_format: 'auto'
          }
        ],
        context: {
          user_id: userId,
          upload_date: new Date().toISOString(),
          type: 'avatar'
        }
      };

      // Cloudinary'a yükle
      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
      
      console.log('✅ Cloudinary upload başarılı:', {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height
      });

      // Kullanıcı avatar bilgilerini güncelle
      const updateData = {
        avatar: result.secure_url,
        cloudinaryPublicId: result.public_id,
        avatarUrls: {
          original: result.secure_url,
          large: result.eager[0]?.secure_url || result.secure_url,
          medium: result.secure_url,
          small: result.eager[1]?.secure_url || result.secure_url,
          tiny: result.eager[2]?.secure_url || result.secure_url
        },
        avatarMetadata: {
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          uploadedAt: new Date()
        }
      };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('-password');

      // Eski avatarı sil (background task olarak)
      if (oldPublicId && oldPublicId !== result.public_id) {
        cloudinary.uploader.destroy(oldPublicId).catch(error => {
          console.error('Eski avatar silme hatası:', error);
        });
      }

      console.log('🎉 Avatar başarıyla güncellendi:', updatedUser.username);

      return NextResponse.json({
        success: true,
        message: 'Avatar başarıyla yüklendi',
        data: {
          avatarUrl: result.secure_url,
          avatarUrls: updateData.avatarUrls,
          metadata: updateData.avatarMetadata,
          user: updatedUser
        }
      });

    } catch (cloudinaryError) {
      console.error('☁️ Cloudinary upload hatası:', cloudinaryError);
      
      // Cloudinary spesifik hata mesajları
      let errorMessage = 'Avatar yüklenirken hata oluştu';
      
      if (cloudinaryError.error?.message) {
        const cloudMessage = cloudinaryError.error.message;
        if (cloudMessage.includes('Invalid image file')) {
          errorMessage = 'Geçersiz resim dosyası';
        } else if (cloudMessage.includes('File size too large')) {
          errorMessage = 'Dosya boyutu çok büyük';
        } else if (cloudMessage.includes('Invalid API')) {
          errorMessage = 'Cloudinary konfigürasyon hatası';
        }
      }

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Avatar upload hatası:', error);
    
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Avatar silme
export async function DELETE(request) {
  try {
    console.log('🗑️ Avatar silme işlemi başlatıldı');
    
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

    // Cloudinary'dan sil
    if (user.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(user.cloudinaryPublicId);
        console.log('☁️ Cloudinary\'dan silindi:', user.cloudinaryPublicId);
      } catch (error) {
        console.error('Cloudinary silme hatası:', error);
        // Devam et, database'den de sil
      }
    }

    // Database'den avatar bilgilerini kaldır
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $unset: { 
          avatar: 1,
          cloudinaryPublicId: 1,
          avatarUrls: 1,
          avatarMetadata: 1
        }
      },
      { new: true }
    ).select('-password');

    console.log('✅ Avatar başarıyla silindi:', user.username);

    return NextResponse.json({
      success: true,
      message: 'Avatar başarıyla kaldırıldı',
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Avatar silme hatası:', error);
    
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

// Avatar bilgilerini getir (optimized URL'ler için)
export async function GET(request) {
  try {
    await connectToDatabase();
    
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

    const user = await User.findById(userId).select('avatar avatarUrls avatarMetadata cloudinaryPublicId');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const size = searchParams.get('size') || 'medium';
    const width = searchParams.get('width');
    const height = searchParams.get('height');
    const quality = searchParams.get('quality');

    let optimizedUrl = user.avatar;

    // Eğer Cloudinary public_id varsa, özel transformasyon uygula
    if (user.cloudinaryPublicId && (width || height || quality)) {
      const transformations = [];
      
      if (width || height) {
        transformations.push(`w_${width || 'auto'},h_${height || 'auto'},c_fill,g_face`);
      }
      
      if (quality) {
        transformations.push(`q_${quality}`);
      }
      
      transformations.push('f_auto');
      
      const transformStr = transformations.join(',');
      optimizedUrl = cloudinary.url(user.cloudinaryPublicId, {
        transformation: transformStr
      });
    } else if (user.avatarUrls && user.avatarUrls[size]) {
      // Mevcut URL'leri kullan
      optimizedUrl = user.avatarUrls[size];
    }

    return NextResponse.json({
      success: true,
      data: {
        url: optimizedUrl,
        urls: user.avatarUrls,
        metadata: user.avatarMetadata
      }
    });

  } catch (error) {
    console.error('❌ Avatar getirme hatası:', error);
    
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