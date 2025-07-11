// app/api/auth/register/route.js - Debug Versiyonu
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/middleware/auth';
import { registerSchema } from '@/lib/validation/authSchemas';

export async function POST(request) {
  try {
    console.log('🚀 Register API çağrıldı');

    const body = await request.json();
    console.log('📨 Gelen veri:', {
      email: body.email,
      username: body.username,
      hasPassword: !!body.password,
      hasConfirmPassword: !!body.confirmPassword,
      characterClass: body.characterClass ? {
        id: body.characterClass.id,
        name: body.characterClass.name
      } : null
    });

    // Validation
    try {
      // Sadece temel alanları validate et
      const validateData = {
        email: body.email,
        username: body.username,
        password: body.password,
        characterClass: body.characterClass
      };
      
      await registerSchema.validate(validateData, { abortEarly: false });
      console.log('✅ Validation basarili');
    } catch (validationError) {
      console.log('❌ Validation hatasi:', validationError.errors || validationError.message);
      
      const errors = validationError.inner ? validationError.inner.map(err => ({
        field: err.path,
        message: err.message
      })) : [{ field: 'general', message: validationError.message }];

      return NextResponse.json({
        success: false,
        message: 'Validation hatasi',
        errors
      }, { status: 400 });
    }

    const { email, username, password, characterClass } = body;

    // Veritabanına bağlan
    console.log('🔗 MongoDB bağlantısı kuruluyor...');
    await connectToDatabase();
    console.log('✅ MongoDB bağlantısı başarılı');

    // Email ve username kontrolü
    console.log('🔍 Mevcut kullanıcı kontrolü...');
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      const message = field === 'email' 
        ? 'Bu e-posta adresi zaten kullanımda' 
        : 'Bu kullanıcı adı zaten alınmış';

      console.log('❌ Kullanıcı zaten mevcut:', field, existingUser[field]);

      return NextResponse.json({
        success: false,
        message,
        field
      }, { status: 400 });
    }

    console.log('✅ Kullanıcı kontrolü tamamlandı, yeni kullanıcı oluşturuluyor...');

    // Yeni kullanıcı oluştur
    const userData = {
      email: email.toLowerCase(),
      username,
      password, // Model'de otomatik hash'lenecek
      characterClass,
      level: 1,
      xp: 0,
      stats: {
        postsCount: 0,
        commentsCount: 0,
        likesGiven: 0,
        likesReceived: 0,
        questsCompleted: 0,
        impactScore: 0
      },
      badges: [
        {
          id: 'newcomer',
          name: 'Yeni Gelmiş',
          icon: '🌟',
          description: 'Dinocial dünyasına hoş geldin!',
          unlockedAt: new Date()
        }
      ],
      visitedRegions: ['humor_valley'],
      unlockedRegions: ['humor_valley'],
      currentRegion: 'humor_valley',
      isActive: true,
      isVerified: false,
      lastLoginAt: new Date(),
      lastActiveAt: new Date()
    };

    console.log('👤 Kullanıcı verisi hazırlandı:', {
      email: userData.email,
      username: userData.username,
      characterClass: userData.characterClass.name
    });

    const newUser = new User(userData);

    // Kullanıcıyı kaydet
    console.log('💾 Kullanıcı kaydediliyor...');
    const savedUser = await newUser.save();
    console.log('✅ Kullanıcı başarıyla kaydedildi, ID:', savedUser._id);

    // JWT token oluştur
    console.log('🔑 JWT token oluşturuluyor...');
    const token = generateToken(savedUser._id);
    console.log('✅ Token oluşturuldu');

    // Şifreyi response'dan çıkar
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    console.log('🎉 Kayıt işlemi başarıyla tamamlandı');

    return NextResponse.json({
      success: true,
      message: 'Hesap başarıyla oluşturuldu! Maceranı başlat!',
      data: {
        user: userResponse,
        token
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Register API Hatası:', error);
    console.error('Stack trace:', error.stack);

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      console.log('📝 Mongoose validation hatası:', error.errors);
      
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return NextResponse.json({
        success: false,
        message: 'Validation hatası',
        errors
      }, { status: 400 });
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      console.log('🔄 Duplicate key hatası:', error.keyValue);
      
      const field = Object.keys(error.keyValue)[0];
      const message = field === 'email' 
        ? 'Bu e-posta adresi zaten kullanımda' 
        : field === 'username' 
        ? 'Bu kullanıcı adı zaten alınmış'
        : 'Bu değer zaten kullanımda';

      return NextResponse.json({
        success: false,
        message,
        field
      }, { status: 400 });
    }

    // JWT hatası
    if (error.message && error.message.includes('JWT')) {
      console.log('🔑 JWT hatası:', error.message);
      
      return NextResponse.json({
        success: false,
        message: 'Token oluşturma hatası'
      }, { status: 500 });
    }

    // Generic server error
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}