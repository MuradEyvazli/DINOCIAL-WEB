// app/api/debug/fix-user-levels/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';

export async function GET(request) {
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

    // Veritabanına bağlan
    await connectToDatabase();

    // Kullanıcı bilgilerini al
    const user = await User.findById(authResult._id)
      .select('+level +xp +visitedRegions +unlockedRegions +calculatedLevel');

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    console.log('Debug - User data found:', {
      userId: user._id,
      username: user.username,
      level: user.level,
      xp: user.xp,
      calculatedLevel: user.calculatedLevel,
      visitedRegions: user.visitedRegions,
      unlockedRegions: user.unlockedRegions
    });

    // Check if level needs fixing
    const needsFix = !user.level || user.level < 1 || user.calculatedLevel > user.level;
    let fixed = false;
    let originalLevel = user.level;

    if (needsFix) {
      console.log('Debug - Level needs fixing:', {
        currentLevel: user.level,
        calculatedLevel: user.calculatedLevel,
        xp: user.xp
      });

      // Fix the level
      user.level = Math.max(1, user.calculatedLevel || 1);
      
      // Ensure regions are properly set
      if (!user.visitedRegions || user.visitedRegions.length === 0) {
        user.visitedRegions = ['humor_valley'];
      }
      
      if (!user.unlockedRegions || user.unlockedRegions.length === 0) {
        user.unlockedRegions = ['humor_valley'];
      }

      await user.save();
      fixed = true;
      
      console.log('Debug - Level fixed:', {
        originalLevel,
        newLevel: user.level,
        xp: user.xp
      });
    }

    return NextResponse.json({
      success: true,
      message: fixed ? 'Kullanıcı seviyeleri düzeltildi' : 'Kullanıcı seviyeleri zaten doğru',
      data: {
        userId: user._id,
        username: user.username,
        originalLevel,
        currentLevel: user.level,
        xp: user.xp,
        calculatedLevel: user.calculatedLevel,
        visitedRegions: user.visitedRegions,
        unlockedRegions: user.unlockedRegions,
        fixed
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Debug API Error:', error);

    // Auth middleware hatası
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
}

export async function POST(request) {
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

    // Veritabanına bağlan
    await connectToDatabase();

    // Force fix all users with invalid levels
    const usersWithInvalidLevels = await User.find({
      $or: [
        { level: { $exists: false } },
        { level: { $lt: 1 } },
        { level: null }
      ]
    }).select('+level +xp');

    console.log(`Debug - Found ${usersWithInvalidLevels.length} users with invalid levels`);

    let fixedCount = 0;
    
    for (const user of usersWithInvalidLevels) {
      const originalLevel = user.level;
      user.level = Math.max(1, user.calculatedLevel || 1);
      
      // Ensure regions are properly set
      if (!user.visitedRegions || user.visitedRegions.length === 0) {
        user.visitedRegions = ['humor_valley'];
      }
      
      if (!user.unlockedRegions || user.unlockedRegions.length === 0) {
        user.unlockedRegions = ['humor_valley'];
      }

      await user.save();
      fixedCount++;
      
      console.log(`Debug - Fixed user ${user.username}: ${originalLevel} -> ${user.level}`);
    }

    return NextResponse.json({
      success: true,
      message: `${fixedCount} kullanıcı seviyesi düzeltildi`,
      data: {
        usersFound: usersWithInvalidLevels.length,
        usersFixed: fixedCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Debug Mass Fix API Error:', error);

    // Auth middleware hatası
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
}