// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Authentication middleware
    const authResult = await new Promise((resolve, reject) => {
      const req = {
        headers: {
          authorization: authHeader
        }
      };
      const res = {
        status: (code) => ({
          json: (data) => reject({ status: code, data })
        })
      };
      
      authenticate(req, res, () => {
        resolve(req.user);
      });
    });

    if (!authResult) {
      return NextResponse.json({
        success: false,
        message: 'Kimlik doğrulama başarısız'
      }, { status: 401 });
    }

    // Veritabanına bağlan
    await connectToDatabase();

    // Kullanıcı bilgilerini yeniden al (en güncel veriler için)
    const user = await User.findById(authResult._id)
      .select('-password')
      .populate({
        path: 'following.user',
        select: 'username characterClass level',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'followers.user', 
        select: 'username characterClass level',
        options: { strictPopulate: false }
      });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Hesap deaktif edilmiş'
      }, { status: 403 });
    }

    // Response verisi hazırla - Güvenli serialization
    let userResponse;
    try {
      // Sadece temel alanları al, virtuals kullanma
      userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        characterClass: user.characterClass,
        level: user.level || 1,
        xp: user.xp || 0,
        visitedRegions: user.visitedRegions || [],
        unlockedRegions: user.unlockedRegions || [],
        badges: user.badges || [],
        preferences: user.preferences || {},
        stats: user.stats || {},
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActiveAt: user.lastActiveAt
      };
      
      // Safely add follower counts
      userResponse.followerCount = user.followers?.length || 0;
      userResponse.followingCount = user.following?.length || 0;
      
      // Safe following/followers data
      userResponse.following = user.following || [];
      userResponse.followers = user.followers || [];
      
      // Add basic progress info
      userResponse.xpProgress = '0';
      userResponse.xpToNextLevel = 100;
      
    } catch (error) {
      console.error('User serialization error:', error);
      // Minimal fallback
      userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        level: 1,
        xp: 0,
        xpProgress: '0',
        xpToNextLevel: 100,
        followerCount: 0,
        followingCount: 0,
        characterClass: user.characterClass || {},
        isActive: user.isActive,
        createdAt: user.createdAt
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı bilgileri başarıyla alındı',
      data: {
        user: userResponse
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Me API Error:', error);
    console.error('Error stack:', error.stack);

    // Auth middleware hatası
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

    // Specific error handling
    if (error.message && error.message.includes('Cannot read properties')) {
      console.error('Property access error - likely virtual property issue');
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı verileri işlenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Authentication middleware
    const authResult = await new Promise((resolve, reject) => {
      const req = {
        headers: {
          authorization: request.headers.get('authorization')
        }
      };
      const res = {
        status: (code) => ({
          json: (data) => reject({ status: code, data })
        })
      };
      
      authenticate(req, res, () => {
        resolve(req.user);
      });
    });

    if (!authResult) {
      return NextResponse.json({
        success: false,
        message: 'Kimlik doğrulama başarısız'
      }, { status: 401 });
    }

    const body = await request.json();

    // Veritabanına bağlan
    await connectToDatabase();

    // Kullanıcıyı bul
    const user = await User.findById(authResult._id);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Güncellenebilir alanlar
    const allowedUpdates = ['username', 'bio', 'preferences', 'avatar'];
    const updates = {};

    // Sadece izin verilen alanları güncelle
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key) && body[key] !== undefined) {
        updates[key] = body[key];
      }
    });

    // Username kontrolü
    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ 
        username: updates.username,
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'Bu kullanıcı adı zaten alınmış',
          field: 'username'
        }, { status: 400 });
      }
    }

    // Güncellemeyi uygula
    Object.assign(user, updates);
    user.updatedAt = new Date();

    await user.save();

    // Response hazırla
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: {
        user: userResponse
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Profile Update API Error:', error);

    // Auth middleware hatası
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

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

    // Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json({
        success: false,
        message: `${field} zaten kullanımda`,
        field
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
}