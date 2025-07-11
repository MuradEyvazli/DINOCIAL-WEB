// app/api/quests/daily-reset/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Quest, UserQuest } from '@/lib/models/Quest';
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

// POST - Reset daily quests for user
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

    // Get all daily quests
    const dailyQuests = await Quest.find({
      type: 'daily',
      isActive: true
    });

    // Get user's current daily quest progress
    const userDailyQuests = await UserQuest.find({
      user: currentUserId,
      quest: { $in: dailyQuests.map(q => q._id) }
    }).populate('quest');

    const resetQuests = [];
    const newQuests = [];

    for (const quest of dailyQuests) {
      const existingUserQuest = userDailyQuests.find(
        uq => uq.quest && uq.quest._id.toString() === quest._id.toString()
      );

      if (existingUserQuest) {
        // Reset existing daily quest
        existingUserQuest.resetDaily();
        await existingUserQuest.save();
        resetQuests.push(quest.title);
      } else {
        // Create new daily quest for user
        const newUserQuest = new UserQuest({
          user: currentUserId,
          quest: quest._id,
          status: 'active',
          progress: new Map(),
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await newUserQuest.save();
        newQuests.push(quest.title);
      }
    }

    // Mark expired daily quests as expired
    await UserQuest.updateMany({
      user: currentUserId,
      expiresAt: { $lt: new Date() },
      status: 'active'
    }, {
      status: 'expired'
    });

    return NextResponse.json({
      success: true,
      message: 'Günlük görevler yenilendi',
      data: {
        resetQuests,
        newQuests,
        totalDailyQuests: dailyQuests.length
      }
    });

  } catch (error) {
    console.error('Daily Reset API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// GET - Check if daily reset is needed
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

    // Check when user last reset daily quests
    const lastReset = await UserQuest.findOne({
      user: currentUserId,
      'quest.type': 'daily',
      lastResetAt: { $exists: true }
    }).sort({ lastResetAt: -1 });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const needsReset = !lastReset || 
                      !lastReset.lastResetAt || 
                      lastReset.lastResetAt < startOfToday;

    // Calculate time until next reset
    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeUntilReset = tomorrow - now;

    return NextResponse.json({
      success: true,
      data: {
        needsReset,
        lastReset: lastReset?.lastResetAt,
        timeUntilReset,
        nextResetAt: tomorrow
      }
    });

  } catch (error) {
    console.error('Check Daily Reset API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}