// app/api/quests/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Quest, UserQuest } from '@/lib/models/Quest';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Get current user from JWT token
async function getCurrentUser(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET - Get available quests for user
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'all', 'daily', 'weekly', 'active'
    
    // Get user info
    const user = await User.findById(currentUserId);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Build quest filter
    const questFilter = {
      isActive: true,
      isHidden: false,
      'prerequisites.level': { $lte: user.level || 1 }
    };

    if (type && type !== 'all') {
      questFilter.type = type;
    }

    // Get available quests
    const availableQuests = await Quest.find(questFilter)
      .sort({ difficulty: 1, 'rewards.xp': 1 });

    // Get user's active quest progress
    const userQuests = await UserQuest.find({
      user: currentUserId,
      status: { $in: ['active', 'completed'] }
    }).populate('quest');

    // Create a map of user quest progress
    const userQuestMap = {};
    userQuests.forEach(uq => {
      if (uq.quest) {
        userQuestMap[uq.quest._id.toString()] = {
          status: uq.status,
          progress: uq.progress ? Object.fromEntries(uq.progress) : {},
          startedAt: uq.startedAt,
          completedAt: uq.completedAt,
          expiresAt: uq.expiresAt,
          progressPercent: uq.progressPercent
        };
      }
    });

    // Combine quest data with user progress
    const questsWithProgress = availableQuests.map(quest => ({
      _id: quest._id,
      title: quest.title,
      description: quest.description,
      type: quest.type,
      category: quest.category,
      difficulty: quest.difficulty,
      rewards: quest.rewards,
      requirements: quest.requirements,
      resetType: quest.resetType,
      icon: quest.icon,
      isDaily: quest.type === 'daily',
      isWeekly: quest.type === 'weekly',
      userProgress: userQuestMap[quest._id.toString()] || null,
      isCompleted: userQuestMap[quest._id.toString()]?.status === 'completed',
      isActive: userQuestMap[quest._id.toString()]?.status === 'active'
    }));

    // Separate active, available, and completed quests
    const activeQuests = questsWithProgress.filter(q => q.isActive);
    const completedQuests = questsWithProgress.filter(q => q.isCompleted);
    const availableQuestsFiltered = questsWithProgress.filter(q => !q.isActive && !q.isCompleted);

    return NextResponse.json({
      success: true,
      data: {
        activeQuests,
        availableQuests: availableQuestsFiltered,
        completedQuests,
        userLevel: user.level,
        totalXP: user.xp || 0,
        stats: {
          totalQuests: questsWithProgress.length,
          activeCount: activeQuests.length,
          completedCount: completedQuests.length,
          dailyQuests: questsWithProgress.filter(q => q.isDaily).length
        }
      }
    });

  } catch (error) {
    console.error('Get Quests API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST - Start a new quest
export async function POST(request) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const body = await request.json();
    const { questId } = body;

    if (!questId) {
      return NextResponse.json({
        success: false,
        message: 'Quest ID gerekli'
      }, { status: 400 });
    }

    // Check if quest exists and is available
    const quest = await Quest.findById(questId);
    if (!quest || !quest.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Görev bulunamadı veya aktif değil'
      }, { status: 404 });
    }

    // Check user level requirements
    const user = await User.findById(currentUserId);
    if (user.level < quest.prerequisites.level) {
      return NextResponse.json({
        success: false,
        message: `Bu görev için en az ${quest.prerequisites.level} seviye gerekli`
      }, { status: 400 });
    }

    // Check if user already has this quest
    const existingUserQuest = await UserQuest.findOne({
      user: currentUserId,
      quest: questId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingUserQuest) {
      return NextResponse.json({
        success: false,
        message: 'Bu görevi zaten başlattınız'
      }, { status: 400 });
    }

    // Create new user quest
    const userQuest = new UserQuest({
      user: currentUserId,
      quest: questId,
      status: 'active',
      progress: new Map(),
      startedAt: new Date()
    });

    // Set expiration for daily/weekly quests
    if (quest.resetType === 'daily') {
      userQuest.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (quest.resetType === 'weekly') {
      userQuest.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    await userQuest.save();
    await userQuest.populate('quest');

    return NextResponse.json({
      success: true,
      message: 'Görev başlatıldı',
      data: {
        userQuest,
        quest: userQuest.quest
      }
    });

  } catch (error) {
    console.error('Start Quest API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}