// app/api/seed/users/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';

const CHARACTER_CLASSES = [
  {
    id: 'warrior',
    name: 'Savaşçı',
    icon: '⚔️',
    color: 'from-red-500 to-orange-600',
    description: 'Güçlü ve cesur, zorlukların üstesinden gelir.',
    abilities: ['Güç', 'Dayanıklılık', 'Liderlik']
  },
  {
    id: 'mage',
    name: 'Büyücü',
    icon: '🔮',
    color: 'from-purple-500 to-indigo-600',
    description: 'Bilgi ve büyü ustası, problemi çözer.',
    abilities: ['Zeka', 'Sezgi', 'Yaratıcılık']
  },
  {
    id: 'archer',
    name: 'Okçu',
    icon: '🏹',
    color: 'from-green-500 to-emerald-600',
    description: 'Keskin nişancı, hedefi şaşmaz.',
    abilities: ['Dikkat', 'Sabır', 'Çeviklik']
  },
  {
    id: 'healer',
    name: 'Şifacı',
    icon: '💚',
    color: 'from-pink-500 to-rose-600',
    description: 'İyileştirici güç, herkese yardım eder.',
    abilities: ['Empati', 'Şefkat', 'Bilgelik']
  },
  {
    id: 'rogue',
    name: 'Hırsız',
    icon: '🗡️',
    color: 'from-gray-500 to-slate-600',
    description: 'Gizli ve zeki, her durumdan çıkar yol bulur.',
    abilities: ['Hız', 'Gizlilik', 'Şans']
  },
  {
    id: 'paladin',
    name: 'Paladin',
    icon: '🛡️',
    color: 'from-yellow-500 to-amber-600',
    description: 'Adalet savaşçısı, iyiliği korur.',
    abilities: ['Adalet', 'Koruma', 'İnanç']
  }
];

const SAMPLE_USERS = [
  {
    username: 'DragonSlayer99',
    email: 'dragonslayer@example.com',
    level: 45,
    xp: 12500,
    characterClass: CHARACTER_CLASSES[0],
    stats: {
      postsCount: 152,
      commentsCount: 89,
      likesGiven: 245,
      likesReceived: 189,
      questsCompleted: 34,
      impactScore: 8900
    }
  },
  {
    username: 'MysticMage',
    email: 'mysticmage@example.com',
    level: 42,
    xp: 11200,
    characterClass: CHARACTER_CLASSES[1],
    stats: {
      postsCount: 134,
      commentsCount: 76,
      likesGiven: 198,
      likesReceived: 167,
      questsCompleted: 29,
      impactScore: 7800
    }
  },
  {
    username: 'ShadowArcher',
    email: 'shadowarcher@example.com',
    level: 38,
    xp: 9800,
    characterClass: CHARACTER_CLASSES[2],
    stats: {
      postsCount: 98,
      commentsCount: 45,
      likesGiven: 156,
      likesReceived: 123,
      questsCompleted: 25,
      impactScore: 6700
    }
  },
  {
    username: 'HolyHealer',
    email: 'holyhealer@example.com',
    level: 40,
    xp: 10500,
    characterClass: CHARACTER_CLASSES[3],
    stats: {
      postsCount: 87,
      commentsCount: 112,
      likesGiven: 267,
      likesReceived: 234,
      questsCompleted: 31,
      impactScore: 8200
    }
  },
  {
    username: 'StealthNinja',
    email: 'stealthninja@example.com',
    level: 36,
    xp: 8900,
    characterClass: CHARACTER_CLASSES[4],
    stats: {
      postsCount: 76,
      commentsCount: 34,
      likesGiven: 123,
      likesReceived: 98,
      questsCompleted: 22,
      impactScore: 5600
    }
  },
  {
    username: 'GuardianKnight',
    email: 'guardianknight@example.com',
    level: 41,
    xp: 11000,
    characterClass: CHARACTER_CLASSES[5],
    stats: {
      postsCount: 109,
      commentsCount: 67,
      likesGiven: 189,
      likesReceived: 145,
      questsCompleted: 28,
      impactScore: 7200
    }
  },
  {
    username: 'FireWizard',
    email: 'firewizard@example.com',
    level: 37,
    xp: 9200,
    characterClass: CHARACTER_CLASSES[1],
    stats: {
      postsCount: 89,
      commentsCount: 56,
      likesGiven: 134,
      likesReceived: 112,
      questsCompleted: 24,
      impactScore: 6100
    }
  },
  {
    username: 'EarthShaker',
    email: 'earthshaker@example.com',
    level: 43,
    xp: 11800,
    characterClass: CHARACTER_CLASSES[0],
    stats: {
      postsCount: 145,
      commentsCount: 78,
      likesGiven: 212,
      likesReceived: 178,
      questsCompleted: 32,
      impactScore: 8500
    }
  },
  {
    username: 'WindRunner',
    email: 'windrunner@example.com',
    level: 35,
    xp: 8200,
    characterClass: CHARACTER_CLASSES[2],
    stats: {
      postsCount: 67,
      commentsCount: 42,
      likesGiven: 98,
      likesReceived: 76,
      questsCompleted: 19,
      impactScore: 4900
    }
  },
  {
    username: 'LightBringer',
    email: 'lightbringer@example.com',
    level: 39,
    xp: 10100,
    characterClass: CHARACTER_CLASSES[5],
    stats: {
      postsCount: 93,
      commentsCount: 58,
      likesGiven: 167,
      likesReceived: 134,
      questsCompleted: 26,
      impactScore: 6800
    }
  },
  {
    username: 'IceQueen',
    email: 'icequeen@example.com',
    level: 44,
    xp: 12100,
    characterClass: CHARACTER_CLASSES[1],
    stats: {
      postsCount: 156,
      commentsCount: 89,
      likesGiven: 234,
      likesReceived: 198,
      questsCompleted: 35,
      impactScore: 9200
    }
  },
  {
    username: 'ThunderStorm',
    email: 'thunderstorm@example.com',
    level: 33,
    xp: 7500,
    characterClass: CHARACTER_CLASSES[0],
    stats: {
      postsCount: 54,
      commentsCount: 31,
      likesGiven: 87,
      likesReceived: 65,
      questsCompleted: 16,
      impactScore: 4200
    }
  },
  {
    username: 'SilentBlade',
    email: 'silentblade@example.com',
    level: 46,
    xp: 13200,
    characterClass: CHARACTER_CLASSES[4],
    stats: {
      postsCount: 167,
      commentsCount: 95,
      likesGiven: 278,
      likesReceived: 234,
      questsCompleted: 38,
      impactScore: 9800
    }
  },
  {
    username: 'PhoenixRider',
    email: 'phoenixrider@example.com',
    level: 41,
    xp: 10800,
    characterClass: CHARACTER_CLASSES[2],
    stats: {
      postsCount: 112,
      commentsCount: 67,
      likesGiven: 189,
      likesReceived: 156,
      questsCompleted: 29,
      impactScore: 7600
    }
  },
  {
    username: 'CrystalSage',
    email: 'crystalsage@example.com',
    level: 40,
    xp: 10300,
    characterClass: CHARACTER_CLASSES[3],
    stats: {
      postsCount: 98,
      commentsCount: 123,
      likesGiven: 245,
      likesReceived: 212,
      questsCompleted: 27,
      impactScore: 7900
    }
  }
];

export async function POST(request) {
  try {
    // Check if this is development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        message: 'Seed endpoint sadece development ortamında kullanılabilir'
      }, { status: 403 });
    }

    await connectToDatabase();

    const { action } = await request.json();

    if (action === 'clear') {
      // Clear all users
      await User.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'Tüm kullanıcılar silindi'
      });
    }

    if (action === 'seed' || !action) {
      // Check if users already exist
      const existingUsersCount = await User.countDocuments();
      
      if (existingUsersCount > 0) {
        return NextResponse.json({
          success: false,
          message: `Zaten ${existingUsersCount} kullanıcı mevcut. Önce 'clear' action ile temizleyin.`
        }, { status: 400 });
      }

      // Create users
      const createdUsers = [];
      
      for (const userData of SAMPLE_USERS) {
        try {
          const user = new User({
            ...userData,
            password: 'test123456', // Default password for all test users
            badges: [
              {
                id: 'newcomer',
                name: 'Yeni Gelmiş',
                icon: '🌟',
                description: 'Dinocial dünyasına hoş geldin!',
                unlockedAt: new Date()
              }
            ],
            visitedRegions: ['humor_valley'],
            unlockedRegions: ['humor_valley'],
            currentRegion: 'humor_valley',
            isActive: true,
            isVerified: true,
            lastLoginAt: new Date(),
            lastActiveAt: new Date()
          });

          const savedUser = await user.save();
          createdUsers.push({
            id: savedUser._id,
            username: savedUser.username,
            level: savedUser.level,
            xp: savedUser.xp
          });
        } catch (error) {
          console.error(`Error creating user ${userData.username}:`, error.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: `${createdUsers.length} test kullanıcısı oluşturuldu`,
        data: {
          usersCreated: createdUsers.length,
          users: createdUsers
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Geçersiz action. "seed" veya "clear" kullanın.'
    }, { status: 400 });

  } catch (error) {
    console.error('Seed Users API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        message: 'Seed endpoint sadece development ortamında kullanılabilir'
      }, { status: 403 });
    }

    await connectToDatabase();
    
    const userCount = await User.countDocuments();
    const topUsers = await User.find()
      .select('username level xp stats')
      .sort({ xp: -1, level: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: userCount,
        topUsers: topUsers.map(user => ({
          username: user.username,
          level: user.level,
          xp: user.xp,
          posts: user.stats?.postsCount || 0,
          quests: user.stats?.questsCompleted || 0
        }))
      }
    });

  } catch (error) {
    console.error('Seed Users GET Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}