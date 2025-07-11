// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { generateToken, rateLimit } from '@/lib/middleware/auth';
import { loginSchema } from '@/lib/validation/authSchemas';

// Rate limiting - 10 login denemesi 15 dakikada
const loginRateLimit = rateLimit(10, 15 * 60 * 1000);

export async function POST(request) {
  try {
    console.log('🚀 Login API cagrildi');

    const body = await request.json();
    console.log('📨 Login verisi:', { email: body.email, hasPassword: !!body.password });

    // Validation
    try {
      await loginSchema.validate(body, { abortEarly: false });
    } catch (validationError) {
      const errors = validationError.inner.map(err => ({
        field: err.path,
        message: err.message
      }));

      return NextResponse.json({
        success: false,
        message: 'Validation hatası',
        errors
      }, { status: 400 });
    }

    const { email, password } = body;

    // Veritabanına bağlan
    await connectToDatabase();

    // Kullanıcıyı bul (şifre dahil)
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password');

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'E-posta adresi veya şifre hatalı',
        field: 'credentials'
      }, { status: 401 });
    }

    // Hesap aktif mi kontrol et
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Hesabınız deaktif edilmiş. Lütfen destek ekibi ile iletişime geçin.',
        field: 'account'
      }, { status: 403 });
    }

    // Şifre kontrolü
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'E-posta adresi veya şifre hatalı',
        field: 'credentials'
      }, { status: 401 });
    }

    // Son giriş zamanını güncelle
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    
    // Level kontrolü ve güncelleme
    const calculatedLevel = user.calculatedLevel;
    if (calculatedLevel > user.level) {
      user.level = calculatedLevel;
    }

    await user.save();

    // JWT token oluştur
    const token = generateToken(user._id);

    // Şifreyi response'dan çıkar
    const userResponse = user.toObject();
    delete userResponse.password;

    // Günlük giriş badge'i kontrolü (örnek)
    const today = new Date();
    const lastLogin = new Date(user.lastLoginAt);
    const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
    
    let newBadges = [];
    
    // Eğer günlük giriş badge'i yoksa ve bugün ilk giriş ise
    if (daysDiff >= 1 && !user.badges.some(b => b.id === 'daily_login')) {
      const dailyLoginBadge = {
        id: 'daily_login',
        name: 'Günlük Ziyaretçi',
        icon: '📅',
        description: 'Her gün düzenli olarak giriş yap',
        unlockedAt: new Date()
      };
      
      user.addBadge(dailyLoginBadge);
      newBadges.push(dailyLoginBadge);
      await user.save();
    }

    // Geri dönüş level kontrolü
    let levelUpInfo = null;
    if (calculatedLevel > userResponse.level) {
      levelUpInfo = {
        leveledUp: true,
        newLevel: calculatedLevel,
        oldLevel: userResponse.level
      };
    }

    return NextResponse.json({
      success: true,
      message: `Hoş geldin, ${user.username}! Macerana devam et!`,
      data: {
        user: {
          ...userResponse,
          level: calculatedLevel
        },
        token,
        ...(levelUpInfo && { levelUpInfo }),
        ...(newBadges.length > 0 && { newBadges })
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
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

    // Rate limit hatası
    if (error.status === 429) {
      return NextResponse.json({
        success: false,
        message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
      }, { status: 429 });
    }

    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
}