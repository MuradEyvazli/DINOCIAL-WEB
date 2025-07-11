// app/api/quests/[questId]/route.js
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

// GET - Get specific quest details
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { questId } = params;

    const quest = await Quest.findById(questId);
    if (!quest) {
      return NextResponse.json({
        success: false,
        message: 'Görev bulunamadı'
      }, { status: 404 });
    }

    // Get user's progress for this quest
    const userQuest = await UserQuest.findOne({
      user: currentUserId,
      quest: questId
    });

    return NextResponse.json({
      success: true,
      data: {
        quest,
        userProgress: userQuest ? {
          status: userQuest.status,
          progress: userQuest.progress ? Object.fromEntries(userQuest.progress) : {},
          startedAt: userQuest.startedAt,
          completedAt: userQuest.completedAt,
          expiresAt: userQuest.expiresAt,
          progressPercent: userQuest.progressPercent
        } : null
      }
    });

  } catch (error) {
    console.error('Get Quest Details API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT - Update quest progress
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { questId } = params;
    const body = await request.json();
    const { action, value = 1 } = body;

    // Find user's active quest
    const userQuest = await UserQuest.findOne({
      user: currentUserId,
      quest: questId,
      status: 'active'
    }).populate('quest');

    if (!userQuest) {
      return NextResponse.json({
        success: false,
        message: 'Aktif görev bulunamadı'
      }, { status: 404 });
    }

    // Check if quest is expired
    if (userQuest.isExpired) {
      userQuest.status = 'expired';
      await userQuest.save();
      return NextResponse.json({
        success: false,
        message: 'Bu görevin süresi dolmuş'
      }, { status: 400 });
    }

    // Update progress
    const isCompleted = userQuest.updateProgress(action, value);
    await userQuest.save();

    // If quest is completed, reward the user
    let rewardData = null;
    if (isCompleted) {
      const user = await User.findById(currentUserId);
      const quest = userQuest.quest;
      
      // Award XP and update stats
      user.xp = (user.xp || 0) + quest.rewards.xp;
      user.stats = user.stats || {};
      user.stats.questsCompleted = (user.stats.questsCompleted || 0) + 1;
      
      // Level up check
      const oldLevel = user.level || 1;
      const newLevel = Math.floor(user.xp / 100) + 1; // Simple level calculation: 100 XP per level
      user.level = newLevel;
      
      await user.save();

      rewardData = {
        xp: quest.rewards.xp,
        levelUp: newLevel > oldLevel,
        newLevel,
        totalXP: user.xp
      };

      // Broadcast quest completion via Socket.IO if available
      if (global.io) {
        global.io.to(currentUserId).emit('quest:completed', {
          questId,
          quest: quest.title,
          rewards: rewardData
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: isCompleted ? 'Görev tamamlandı!' : 'İlerleme kaydedildi',
      data: {
        userQuest: {
          status: userQuest.status,
          progress: userQuest.progress ? Object.fromEntries(userQuest.progress) : {},
          progressPercent: userQuest.progressPercent,
          completedAt: userQuest.completedAt
        },
        isCompleted,
        rewards: rewardData
      }
    });

  } catch (error) {
    console.error('Update Quest Progress API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Abandon quest
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { questId } = params;

    const userQuest = await UserQuest.findOne({
      user: currentUserId,
      quest: questId,
      status: 'active'
    });

    if (!userQuest) {
      return NextResponse.json({
        success: false,
        message: 'Aktif görev bulunamadı'
      }, { status: 404 });
    }

    userQuest.status = 'abandoned';
    await userQuest.save();

    return NextResponse.json({
      success: true,
      message: 'Görev bırakıldı'
    });

  } catch (error) {
    console.error('Abandon Quest API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}