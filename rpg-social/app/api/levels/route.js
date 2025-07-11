// app/api/levels/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Level from '@/lib/models/Level';
import { 
  getAuthenticatedUser, 
  handleApiError, 
  successResponse,
  rateLimitMiddleware,
  ERROR_TYPES,
  ApiError
} from '@/lib/middleware/auth';

// GET - Get all levels or specific level info
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(100, 60 * 1000);
    rateLimit(request);
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const tier = searchParams.get('tier');
    const userXP = parseInt(searchParams.get('userXP')) || 0;
    const userLevel = parseInt(searchParams.get('userLevel')) || 1;
    
    if (level) {
      // Get specific level
      const levelData = await Level.findOne({ level: parseInt(level), isActive: true });
      if (!levelData) {
        throw new ApiError(
          ERROR_TYPES.NOT_FOUND,
          'Seviye bulunamadı',
          404
        );
      }
      
      return successResponse({
        level: levelData
      }, 'Seviye bilgisi getirildi');
    }
    
    if (tier) {
      // Get levels by tier
      const levels = await Level.find({ tier, isActive: true }).sort({ level: 1 });
      return successResponse({
        levels,
        count: levels.length
      }, `${tier} seviyesi seviyeleri getirildi`);
    }
    
    // Get user progression info
    if (userXP > 0 && userLevel > 0) {
      const progression = await Level.getLevelProgression(userLevel, userXP);
      const currentLevelByXP = await Level.getLevelByXP(userXP);
      
      return successResponse({
        progression,
        currentLevelByXP,
        shouldLevelUp: currentLevelByXP.level > userLevel
      }, 'Kullanıcı seviye ilerlemesi getirildi');
    }
    
    // Get all levels
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    
    const [levels, totalLevels] = await Promise.all([
      Level.find({ isActive: true })
        .sort({ level: 1 })
        .skip(skip)
        .limit(limit),
      Level.countDocuments({ isActive: true })
    ]);
    
    // Group by tiers
    const levelsByTier = {};
    levels.forEach(level => {
      if (!levelsByTier[level.tier]) {
        levelsByTier[level.tier] = [];
      }
      levelsByTier[level.tier].push(level);
    });
    
    return successResponse({
      levels,
      levelsByTier,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLevels / limit),
        totalLevels,
        hasMore: skip + levels.length < totalLevels
      }
    }, 'Seviyeler başarıyla getirildi');
    
  } catch (error) {
    console.error('Levels GET Error:', error);
    return handleApiError(error);
  }
}

// POST - Seed levels (admin only)
export async function POST(request) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    // Check if user is admin (check role field)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new ApiError(
        ERROR_TYPES.FORBIDDEN,
        'Bu işlem için admin yetkisi gerekli',
        403
      );
    }
    
    await connectToDatabase();
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'seed') {
      // Seed all 100 levels
      await Level.seedLevels();
      
      return successResponse({
        message: '100 seviye başarıyla oluşturuldu'
      }, 'Seviyeler başarıyla seed edildi');
    }
    
    if (action === 'reset') {
      // Delete all levels and reseed
      await Level.deleteMany({});
      await Level.seedLevels();
      
      return successResponse({
        message: 'Tüm seviyeler sıfırlandı ve yeniden oluşturuldu'
      }, 'Seviyeler başarıyla sıfırlandı');
    }
    
    throw new ApiError(
      ERROR_TYPES.VALIDATION_ERROR,
      'Geçersiz action parametresi',
      400
    );
    
  } catch (error) {
    console.error('Levels POST Error:', error);
    return handleApiError(error);
  }
}