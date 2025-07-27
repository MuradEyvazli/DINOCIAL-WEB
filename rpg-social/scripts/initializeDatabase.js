// Initialize Database Script
// Run this after deployment to set up initial data

const mongoose = require('mongoose');
const Level = require('../lib/models/Level');
const Quest = require('../lib/models/Quest');

// Level progression data
const levels = Array.from({ length: 100 }, (_, i) => ({
  level: i + 1,
  requiredXP: Math.floor(100 * Math.pow(1.5, i)),
  rewards: {
    coins: (i + 1) * 10,
    badges: i % 10 === 0 ? [`level_${i + 1}_master`] : [],
    items: i % 5 === 0 ? [`reward_item_${i + 1}`] : []
  }
}));

// Sample quests
const sampleQuests = [
  // Daily Quests
  {
    title: 'İlk Adımlar',
    description: 'Bugün ilk gönderini paylaş',
    type: 'daily',
    category: 'social',
    requirements: {
      posts: 1
    },
    rewards: {
      xp: 50,
      coins: 10
    },
    isActive: true
  },
  {
    title: 'Sosyal Kelebek',
    description: '3 farklı gönderiye yorum yap',
    type: 'daily',
    category: 'social',
    requirements: {
      comments: 3
    },
    rewards: {
      xp: 75,
      coins: 15
    },
    isActive: true
  },
  {
    title: 'Arkadaşlık Bağları',
    description: 'Yeni bir arkadaş ekle',
    type: 'daily',
    category: 'social',
    requirements: {
      friends: 1
    },
    rewards: {
      xp: 100,
      coins: 20
    },
    isActive: true
  },
  
  // Weekly Quests
  {
    title: 'Haftalık Meydan Okuma',
    description: 'Bu hafta 10 gönderi paylaş',
    type: 'weekly',
    category: 'content',
    requirements: {
      posts: 10
    },
    rewards: {
      xp: 500,
      coins: 100,
      items: ['weekly_champion_badge']
    },
    isActive: true
  },
  {
    title: 'Topluluk Lideri',
    description: '50 beğeni topla',
    type: 'weekly',
    category: 'engagement',
    requirements: {
      likes: 50
    },
    rewards: {
      xp: 750,
      coins: 150
    },
    isActive: true
  }
];

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Initialize Levels
    console.log('📊 Initializing level system...');
    const existingLevels = await Level.countDocuments();
    
    if (existingLevels === 0) {
      await Level.insertMany(levels);
      console.log('✅ Level system initialized with 100 levels');
    } else {
      console.log('ℹ️ Level system already initialized');
    }

    // Initialize Quests
    console.log('🎯 Initializing quest system...');
    const existingQuests = await Quest.countDocuments();
    
    if (existingQuests === 0) {
      await Quest.insertMany(sampleQuests);
      console.log('✅ Quest system initialized with sample quests');
    } else {
      console.log('ℹ️ Quest system already has data');
    }

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    
    // User indexes
    await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ level: -1, xp: -1 });
    await mongoose.connection.collection('users').createIndex({ createdAt: -1 });
    
    // Post indexes
    await mongoose.connection.collection('posts').createIndex({ author: 1, createdAt: -1 });
    await mongoose.connection.collection('posts').createIndex({ region: 1, createdAt: -1 });
    
    // Message indexes
    await mongoose.connection.collection('messages').createIndex({ conversationId: 1, createdAt: -1 });
    await mongoose.connection.collection('conversations').createIndex({ participants: 1 });
    
    console.log('✅ Database indexes created');

    console.log('\n🎉 Database initialization completed successfully!');
    
    // Summary
    const userCount = await mongoose.connection.collection('users').countDocuments();
    const postCount = await mongoose.connection.collection('posts').countDocuments();
    const questCount = await Quest.countDocuments();
    const levelCount = await Level.countDocuments();
    
    console.log('\n📈 Database Summary:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Posts: ${postCount}`);
    console.log(`- Quests: ${questCount}`);
    console.log(`- Levels: ${levelCount}`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the initialization
initializeDatabase();