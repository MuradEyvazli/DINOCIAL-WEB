// app/api/quests/seed/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Quest } from '@/lib/models/Quest';

// POST - Seed database with sample quests
export async function POST(request) {
  try {
    await connectToDatabase();

    // Clear existing quests (only in development)
    if (process.env.NODE_ENV === 'development') {
      await Quest.deleteMany({});
    }

    const sampleQuests = [
      // Daily Quests - Very Simple
      {
        title: 'Günlük Paylaşım',
        description: 'Bugün 1 gönderi paylaş',
        type: 'daily',
        category: 'content',
        difficulty: 'easy',
        rewards: { xp: 25, coins: 10 },
        requirements: [{
          type: 'create_post',
          target: 1,
          description: '1 gönderi paylaş'
        }],
        resetType: 'daily',
        icon: 'edit'
      },
      {
        title: 'Beğeni Dağıtıcı',
        description: 'Bugün 3 gönderi beğen',
        type: 'daily',
        category: 'social',
        difficulty: 'easy',
        rewards: { xp: 20, coins: 8 },
        requirements: [{
          type: 'like_posts',
          target: 3,
          description: '3 gönderi beğen'
        }],
        resetType: 'daily',
        icon: 'heart'
      },
      {
        title: 'Yorum Yapıcı',
        description: 'Bugün 2 yorum yap',
        type: 'daily',
        category: 'social',
        difficulty: 'easy',
        rewards: { xp: 30, coins: 12 },
        requirements: [{
          type: 'comment_posts',
          target: 2,
          description: '2 yorum yap'
        }],
        resetType: 'daily',
        icon: 'message-circle'
      },

      // Weekly Quests - Simple
      {
        title: 'Haftalık Aktif',
        description: 'Bu hafta 7 gönderi paylaş',
        type: 'weekly',
        category: 'content',
        difficulty: 'medium',
        rewards: { xp: 150, coins: 50 },
        requirements: [{
          type: 'create_post',
          target: 7,
          description: '7 gönderi paylaş'
        }],
        resetType: 'weekly',
        icon: 'calendar'
      },
      {
        title: 'Sosyal Kelebek',
        description: 'Bu hafta 15 yorum yap',
        type: 'weekly',
        category: 'social',
        difficulty: 'medium',
        rewards: { xp: 120, coins: 40 },
        requirements: [{
          type: 'comment_posts',
          target: 15,
          description: '15 yorum yap'
        }],
        resetType: 'weekly',
        icon: 'users'
      },

      // Achievement Quests - Simple
      {
        title: 'İlk Adım',
        description: 'İlk gönderini paylaş',
        type: 'achievement',
        category: 'beginner',
        difficulty: 'easy',
        rewards: { xp: 50, coins: 20, badge: 'Yeni Başlayan' },
        requirements: [{
          type: 'create_post',
          target: 1,
          description: 'İlk gönderini paylaş'
        }],
        resetType: 'none',
        icon: 'star'
      },
      {
        title: 'Sosyal Başlangıç',
        description: 'İlk yorumunu yap',
        type: 'achievement',
        category: 'social',
        difficulty: 'easy',
        rewards: { xp: 30, coins: 15, badge: 'Sosyal' },
        requirements: [{
          type: 'comment_posts',
          target: 1,
          description: 'İlk yorumunu yap'
        }],
        resetType: 'none',
        icon: 'message-circle'
      },
      {
        title: 'Beğeni Dağıtıcısı',
        description: 'İlk beğenini yap',
        type: 'achievement',
        category: 'social',
        difficulty: 'easy',
        rewards: { xp: 20, coins: 10, badge: 'Destekleyici' },
        requirements: [{
          type: 'like_posts',
          target: 1,
          description: 'İlk beğenini yap'
        }],
        resetType: 'none',
        icon: 'heart'
      },

      // Level-based Quests
      {
        title: 'Aktif Üye',
        description: '10 gönderi paylaş',
        type: 'achievement',
        category: 'content',
        difficulty: 'medium',
        rewards: { xp: 200, coins: 75, badge: 'Aktif Üye' },
        requirements: [{
          type: 'create_post',
          target: 10,
          description: '10 gönderi paylaş'
        }],
        resetType: 'none',
        icon: 'trending-up'
      },
      {
        title: 'Sosyal Usta',
        description: '50 yorum yap',
        type: 'achievement',
        category: 'social',
        difficulty: 'hard',
        rewards: { xp: 300, coins: 100, badge: 'Sosyal Usta' },
        requirements: [{
          type: 'comment_posts',
          target: 50,
          description: '50 yorum yap'
        }],
        resetType: 'none',
        icon: 'crown'
      }
    ];

    // Insert quests
    const insertedQuests = await Quest.insertMany(sampleQuests);

    return NextResponse.json({
      success: true,
      message: 'Sample quests created successfully',
      data: {
        questsCreated: insertedQuests.length,
        quests: insertedQuests
      }
    });

  } catch (error) {
    console.error('Seed Quests API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}