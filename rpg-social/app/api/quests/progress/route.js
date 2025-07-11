// app/api/quests/progress/route.js
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

// POST - Update quest progress for multiple active quests
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
    const { action, value = 1 } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        message: 'Action gerekli'
      }, { status: 400 });
    }

    // Find all active quests that have this action type in their requirements
    const activeUserQuests = await UserQuest.find({
      user: currentUserId,
      status: 'active',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }).populate('quest');

    const completedQuests = [];
    const updatedQuests = [];

    for (const userQuest of activeUserQuests) {
      const quest = userQuest.quest;
      
      // Check if this quest has the action in its requirements
      const hasRequirement = quest.requirements.some(req => req.type === action);
      
      if (hasRequirement) {
        // Update progress
        const isCompleted = userQuest.updateProgress(action, value);
        await userQuest.save();
        
        updatedQuests.push({
          questId: quest._id,
          title: quest.title,
          progress: userQuest.progress ? Object.fromEntries(userQuest.progress) : {},
          progressPercent: userQuest.progressPercent
        });

        // If quest is completed, reward the user
        if (isCompleted) {
          const user = await User.findById(currentUserId);
          
          // Award XP and update stats
          user.xp = (user.xp || 0) + quest.rewards.xp;
          user.stats = user.stats || {};
          user.stats.questsCompleted = (user.stats.questsCompleted || 0) + 1;
          
          // Level up check
          const oldLevel = user.level || 1;
          const newLevel = Math.floor(user.xp / 100) + 1; // Simple level calculation: 100 XP per level
          user.level = newLevel;
          
          await user.save();

          const rewardData = {
            xp: quest.rewards.xp,
            levelUp: newLevel > oldLevel,
            newLevel,
            totalXP: user.xp
          };

          completedQuests.push({
            questId: quest._id,
            title: quest.title,
            rewards: rewardData
          });

          // Broadcast quest completion via Socket.IO if available
          if (global.io) {
            global.io.to(currentUserId).emit('quest:completed', {
              questId: quest._id,
              quest: quest.title,
              rewards: rewardData
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: updatedQuests.length > 0 ? 'Quest progress updated' : 'No matching active quests',
      data: {
        updatedQuests,
        completedQuests,
        totalUpdated: updatedQuests.length,
        totalCompleted: completedQuests.length
      }
    });

  } catch (error) {
    console.error('Quest Progress API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}