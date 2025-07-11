// app/api/guilds/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Guild } from '@/lib/models/Guild';
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
    const type = searchParams.get('type'); // 'public', 'my', 'all'
    const guildType = searchParams.get('guildType'); // 'social', 'combat', etc.
    const search = searchParams.get('search');

    // Simple mock data that works with the current UI
    const sampleGuilds = [
      {
        _id: 'guild_1',
        name: 'Efsane Savaşçıları',
        description: 'En güçlü savaşçıların buluşma noktası. Birlikte zafer kazanıyoruz!',
        type: 'combat',
        memberCount: 47,
        maxMembers: 50,
        level: 15,
        xpBonus: 15,
        isPublic: true,
        isJoined: false,
        leader: {
          username: 'DragonSlayer',
          level: 28,
          characterClass: { icon: '⚔️', name: 'Savaşçı' }
        },
        stats: {
          level: 15,
          totalXP: 125000,
          questsCompleted: 234,
          eventsWon: 67
        },
        benefits: {
          xpBonus: 15
        },
        tags: ['PvP', 'Raids', 'Competitive'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        banner: 'from-red-500 to-orange-600',
        icon: '⚔️'
      },
      {
        _id: 'guild_2',
        name: 'Yaratıcı Ruhlar',
        description: 'Sanat, edebiyat ve yaratıcılık tutkunu olan herkesi bekliyoruz.',
        type: 'creative',
        memberCount: 32,
        maxMembers: 40,
        level: 12,
        xpBonus: 20,
        isPublic: true,
        isJoined: true,
        leader: {
          username: 'ArtMaster',
          level: 24,
          characterClass: { icon: '🎨', name: 'Sanatçı' }
        },
        stats: {
          level: 12,
          totalXP: 89000,
          questsCompleted: 156,
          eventsWon: 23
        },
        benefits: {
          xpBonus: 20
        },
        tags: ['Creative', 'Art', 'Friendly'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        banner: 'from-purple-500 to-pink-600',
        icon: '🎨'
      },
      {
        _id: 'guild_3',
        name: 'Bilgi Avcıları',
        description: 'Öğrenmeyi seven, bilgiyi paylaşan bir topluluk.',
        type: 'social',
        memberCount: 38,
        maxMembers: 45,
        level: 18,
        xpBonus: 25,
        isPublic: true,
        isJoined: false,
        leader: {
          username: 'WiseOwl',
          level: 31,
          characterClass: { icon: '🦉', name: 'Bilge' }
        },
        stats: {
          level: 18,
          totalXP: 156000,
          questsCompleted: 289,
          eventsWon: 45
        },
        benefits: {
          xpBonus: 25
        },
        tags: ['Learning', 'Discussion', 'Helpful'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        banner: 'from-blue-500 to-cyan-600',
        icon: '📚'
      }
    ];

    let filteredGuilds = sampleGuilds;

    // Filter by type
    if (type === 'my') {
      filteredGuilds = sampleGuilds.filter(guild => guild.isJoined);
    } else if (guildType && guildType !== 'all') {
      filteredGuilds = sampleGuilds.filter(guild => guild.type === guildType);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredGuilds = filteredGuilds.filter(guild => 
        guild.name.toLowerCase().includes(searchLower) ||
        guild.description.toLowerCase().includes(searchLower) ||
        guild.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    const myGuilds = sampleGuilds.filter(guild => guild.isJoined);

    return NextResponse.json({
      success: true,
      data: {
        guilds: filteredGuilds,
        myGuilds,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalGuilds: filteredGuilds.length,
          hasMore: false
        },
        stats: {
          totalGuilds: sampleGuilds.length,
          myGuildsCount: myGuilds.length,
          publicGuildsCount: sampleGuilds.filter(g => g.isPublic).length
        }
      }
    });

  } catch (error) {
    console.error('Guilds API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 });
  }
}

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
    const { name, description, type, maxMembers, isPublic } = body;

    // Basic validation
    if (!name || !description) {
      return NextResponse.json({
        success: false,
        message: 'Guild adı ve açıklama gerekli'
      }, { status: 400 });
    }

    // Simple guild creation (mock data for now)
    const newGuild = {
      _id: `guild_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      type: type || 'social',
      maxMembers: maxMembers || 50,
      isPublic: isPublic !== false,
      memberCount: 1,
      level: 1,
      xpBonus: 10,
      leaderId: currentUserId,
      createdAt: new Date(),
      leader: {
        username: 'You',
        level: 1
      },
      stats: {
        level: 1,
        totalXP: 0,
        questsCompleted: 0,
        eventsWon: 0
      },
      benefits: {
        xpBonus: 10
      },
      tags: [],
      banner: 'from-purple-500 to-blue-600',
      icon: '🛡️'
    };

    return NextResponse.json({
      success: true,
      message: 'Guild başarıyla oluşturuldu!',
      data: newGuild
    }, { status: 201 });

  } catch (error) {
    console.error('Create Guild API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Guild oluşturma hatası'
    }, { status: 500 });
  }
}

