// app/api/levels/progression/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Level from '@/lib/models/Level';
import User from '@/lib/models/User';
import { 
  getAuthenticatedUser, 
  handleApiError, 
  successResponse,
  rateLimitMiddleware,
  ERROR_TYPES,
  ApiError
} from '@/lib/middleware/auth';

// GET - Get user level progression
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(60, 60 * 1000);
    rateLimit(request);
    
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    
    // Get target user (default to current user)
    const targetUser = targetUserId ? 
      await User.findById(targetUserId).select('level xp username avatar stats') :
      user;
    
    if (!targetUser) {
      throw new ApiError(
        ERROR_TYPES.NOT_FOUND,
        'Kullanıcı bulunamadı',
        404
      );
    }
    
    // Ensure user has default level and XP
    if (!targetUser.level) targetUser.level = 1;
    if (!targetUser.xp) targetUser.xp = 0;
    
    console.log('Getting progression for user:', {
      id: targetUser._id,
      level: targetUser.level,
      xp: targetUser.xp
    });
    
    // Get user's current level progression
    const progression = await Level.getLevelProgression(targetUser.level || 1, targetUser.xp || 0);
    
    console.log('Progression result:', progression);
    
    if (!progression) {
      console.log('No progression data found, creating default...');
      // Create default progression if none exists
      const defaultLevel = await Level.findOne({ level: 1 });
      if (defaultLevel) {
        progression = {
          currentLevel: defaultLevel,
          nextLevel: await Level.findOne({ level: 2 }),
          xpInCurrentLevel: targetUser.xp || 0,
          xpNeededForNext: defaultLevel.xpToNext,
          progressPercentage: 0,
          isMaxLevel: false
        };
        
        console.log('Using default progression:', progression);
      } else {
        throw new ApiError(
          ERROR_TYPES.NOT_FOUND,
          'Seviye verisi bulunamadı',
          404
        );
      }
    }
    
    // Get user's tier information
    const currentLevel = progression.currentLevel;
    const tierLevels = await Level.find({ 
      tier: currentLevel.tier, 
      isActive: true 
    }).sort({ level: 1 });
    
    // Calculate tier progression
    const tierStart = tierLevels[0]?.level || currentLevel.level;
    const tierEnd = tierLevels[tierLevels.length - 1]?.level || currentLevel.level;
    const tierProgressPercentage = ((targetUser.level - tierStart + 1) / (tierEnd - tierStart + 1)) * 100;
    
    // Get next milestones
    const nextMilestone = await Level.findOne({
      level: { $gt: targetUser.level },
      $or: [
        { level: { $in: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] } }, // Tier completions
        { 'rewards.unlockedFeatures.0': { $exists: true } }, // Has unlocked features
        { 'rewards.badges.0': { $exists: true } } // Has badges
      ],
      isActive: true
    }).sort({ level: 1 });
    
    // Get recent level ups (last 5 levels)
    const recentLevels = await Level.find({
      level: { 
        $gte: Math.max(1, targetUser.level - 4),
        $lte: targetUser.level
      },
      isActive: true
    }).sort({ level: -1 });
    
    // Get upcoming rewards
    const upcomingRewards = await Level.find({
      level: { 
        $gt: targetUser.level,
        $lte: targetUser.level + 10
      },
      $or: [
        { 'rewards.unlockedFeatures.0': { $exists: true } },
        { 'rewards.badges.0': { $exists: true } },
        { 'rewards.specialAbilities.0': { $exists: true } }
      ],
      isActive: true
    }).sort({ level: 1 }).limit(5);
    
    return successResponse({
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        avatar: targetUser.avatar,
        level: targetUser.level,
        xp: targetUser.xp || 0
      },
      progression,
      tierInfo: {
        name: currentLevel.tier,
        color: currentLevel.tierColor,
        range: currentLevel.tierRange,
        levels: tierLevels,
        progressPercentage: tierProgressPercentage
      },
      nextMilestone,
      recentLevels,
      upcomingRewards
    }, 'Seviye ilerlemesi başarıyla getirildi');
    
  } catch (error) {
    console.error('Level progression GET Error:', error);
    return handleApiError(error);
  }
}

// POST - Level up user (when they gain XP)
export async function POST(request) {
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(10, 60 * 1000);
    rateLimit(request);
    
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    await connectToDatabase();
    
    const body = await request.json();
    const { xpGained, reason = 'activity' } = body;
    
    if (!xpGained || xpGained <= 0) {
      throw new ApiError(
        ERROR_TYPES.VALIDATION_ERROR,
        'Geçerli bir XP miktarı gerekli',
        400
      );
    }
    
    // Update user XP
    const newXP = (user.xp || 0) + xpGained;
    
    // Check if user should level up
    const newLevelData = await Level.getLevelByXP(newXP);
    const oldLevel = user.level;
    const newLevel = newLevelData.level;
    
    const leveledUp = newLevel > oldLevel;
    let unlockedRewards = [];
    
    if (leveledUp) {
      // Get all levels between old and new level for rewards
      const levelRange = await Level.find({
        level: { $gt: oldLevel, $lte: newLevel },
        isActive: true
      }).sort({ level: 1 });
      
      // Collect all unlocked rewards
      levelRange.forEach(level => {
        if (level.rewards.unlockedFeatures.length > 0) {
          unlockedRewards.push(...level.rewards.unlockedFeatures.map(feature => ({
            type: 'feature',
            name: feature,
            level: level.level
          })));
        }
        
        if (level.rewards.badges.length > 0) {
          unlockedRewards.push(...level.rewards.badges.map(badge => ({
            type: 'badge',
            ...badge,
            level: level.level
          })));
        }
        
        if (level.rewards.specialAbilities.length > 0) {
          unlockedRewards.push(...level.rewards.specialAbilities.map(ability => ({
            type: 'ability',
            ...ability,
            level: level.level
          })));
        }
      });
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        xp: newXP,
        level: newLevel,
        $push: leveledUp ? {
          'stats.levelHistory': {
            level: newLevel,
            achievedAt: new Date(),
            xpAtAchievement: newXP,
            reason
          }
        } : {}
      },
      { new: true }
    );
    
    // Get progression data
    const progression = await Level.getLevelProgression(newLevel, newXP);
    
    // Emit real-time event for level up
    if (leveledUp && global.io) {
      global.io.to(`user:${user._id}`).emit('level:up', {
        userId: user._id.toString(),
        oldLevel,
        newLevel,
        newXP,
        progression,
        unlockedRewards,
        levelData: newLevelData
      });
      
      // Notify friends about level up
      if (user.followers && user.followers.length > 0) {
        user.followers.forEach(followerId => {
          global.io.to(`user:${followerId}`).emit('friend:level_up', {
            userId: user._id.toString(),
            username: user.username,
            avatar: user.avatar,
            newLevel,
            levelData: newLevelData
          });
        });
      }
    }
    
    return successResponse({
      leveledUp,
      oldLevel,
      newLevel,
      xpGained,
      newXP,
      progression,
      unlockedRewards,
      user: {
        _id: updatedUser._id,
        level: updatedUser.level,
        xp: updatedUser.xp
      }
    }, leveledUp ? 
      `Tebrikler! Seviye ${newLevel}'e ulaştınız!` : 
      `${xpGained} XP kazandınız`
    );
    
  } catch (error) {
    console.error('Level progression POST Error:', error);
    return handleApiError(error);
  }
}