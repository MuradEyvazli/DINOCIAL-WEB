// lib/models/Level.js
import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 100
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  xpRequired: {
    type: Number,
    required: true,
    min: 0
  },
  xpToNext: {
    type: Number,
    required: true,
    min: 0
  },
  rewards: {
    unlockedFeatures: [{
      type: String,
      trim: true
    }],
    unlockedRegions: [{
      type: String,
      trim: true
    }],
    badges: [{
      name: String,
      icon: String,
      description: String
    }],
    specialAbilities: [{
      name: String,
      description: String,
      icon: String
    }]
  },
  tier: {
    type: String,
    required: true,
    enum: ['Beginner', 'Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 'Grandmaster', 'Legend', 'Mythic', 'Divine'],
    default: 'Beginner'
  },
  tierColor: {
    type: String,
    required: true,
    default: '#64748b' // slate-500
  },
  icon: {
    type: String,
    default: '⭐'
  },
  quote: {
    type: String,
    required: true,
    trim: true
  },
  unlockMessage: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['Social', 'Explorer', 'Creator', 'Leader', 'Scholar', 'Warrior', 'Sage', 'Master'],
    default: 'Social'
  }
}, {
  timestamps: true
});

// Indexes for performance
levelSchema.index({ level: 1 });
levelSchema.index({ xpRequired: 1 });
levelSchema.index({ tier: 1 });
levelSchema.index({ isActive: 1 });

// Virtual for getting tier range
levelSchema.virtual('tierRange').get(function() {
  const tierRanges = {
    'Beginner': '1-10',
    'Novice': '11-20', 
    'Apprentice': '21-30',
    'Adept': '31-40',
    'Expert': '41-50',
    'Master': '51-60',
    'Grandmaster': '61-70',
    'Legend': '71-80',
    'Mythic': '81-90',
    'Divine': '91-100'
  };
  return tierRanges[this.tier] || '1-10';
});

// Static method to get level by XP
levelSchema.statics.getLevelByXP = async function(xp) {
  const level = await this.findOne({
    xpRequired: { $lte: xp },
    isActive: true
  }).sort({ level: -1 });
  
  return level || await this.findOne({ level: 1 });
};

// Static method to get next level
levelSchema.statics.getNextLevel = async function(currentLevel) {
  return await this.findOne({
    level: currentLevel + 1,
    isActive: true
  });
};

// Static method to get level progression
levelSchema.statics.getLevelProgression = async function(userLevel = 1, userXP = 0) {
  console.log('getLevelProgression called with:', { userLevel, userXP });
  
  // Ensure we have valid level
  if (!userLevel || userLevel < 1) userLevel = 1;
  if (!userXP || userXP < 0) userXP = 0;
  
  const currentLevelData = await this.findOne({ level: userLevel });
  const nextLevelData = await this.findOne({ level: userLevel + 1 });
  
  console.log('Found levels:', {
    current: currentLevelData?.level,
    next: nextLevelData?.level
  });
  
  if (!currentLevelData) {
    console.log('No current level data found, using level 1');
    // Fallback to level 1 if current level not found
    const fallbackLevel = await this.findOne({ level: 1 });
    if (!fallbackLevel) return null;
    
    return {
      currentLevel: fallbackLevel,
      nextLevel: await this.findOne({ level: 2 }),
      xpInCurrentLevel: userXP,
      xpNeededForNext: fallbackLevel.xpToNext,
      progressPercentage: 0,
      isMaxLevel: false
    };
  }
  
  const currentLevelXP = currentLevelData.xpRequired;
  const nextLevelXP = nextLevelData ? nextLevelData.xpRequired : currentLevelData.xpRequired;
  const xpInCurrentLevel = Math.max(0, userXP - currentLevelXP);
  const xpNeededForNext = nextLevelData ? Math.max(0, nextLevelXP - userXP) : 0;
  const progressPercentage = nextLevelData ? Math.min((xpInCurrentLevel / (nextLevelXP - currentLevelXP)) * 100, 100) : 100;
  
  console.log('Calculated progression:', {
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercentage
  });
  
  return {
    currentLevel: currentLevelData,
    nextLevel: nextLevelData,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercentage,
    isMaxLevel: !nextLevelData
  };
};

// Static method to seed initial levels
levelSchema.statics.seedLevels = async function() {
  const existingLevels = await this.countDocuments();
  if (existingLevels > 0) {
    console.log('Levels already seeded');
    return;
  }

  const levels = [];
  
  // Generate 100 levels with exponential XP growth
  for (let i = 1; i <= 100; i++) {
    // XP calculation: more challenging as level increases
    const baseXP = Math.floor(100 * Math.pow(1.15, i - 1));
    const xpToNext = i < 100 ? Math.floor(100 * Math.pow(1.15, i)) - baseXP : 0;
    
    // Determine tier
    let tier, tierColor, category;
    if (i <= 10) {
      tier = 'Beginner';
      tierColor = '#64748b'; // slate-500
      category = 'Social';
    } else if (i <= 20) {
      tier = 'Novice';
      tierColor = '#06b6d4'; // cyan-500
      category = 'Explorer';
    } else if (i <= 30) {
      tier = 'Apprentice';
      tierColor = '#10b981'; // emerald-500
      category = 'Creator';
    } else if (i <= 40) {
      tier = 'Adept';
      tierColor = '#3b82f6'; // blue-500
      category = 'Scholar';
    } else if (i <= 50) {
      tier = 'Expert';
      tierColor = '#8b5cf6'; // violet-500
      category = 'Leader';
    } else if (i <= 60) {
      tier = 'Master';
      tierColor = '#f59e0b'; // amber-500
      category = 'Warrior';
    } else if (i <= 70) {
      tier = 'Grandmaster';
      tierColor = '#ef4444'; // red-500
      category = 'Sage';
    } else if (i <= 80) {
      tier = 'Legend';
      tierColor = '#ec4899'; // pink-500
      category = 'Master';
    } else if (i <= 90) {
      tier = 'Mythic';
      tierColor = '#7c3aed'; // violet-600
      category = 'Master';
    } else {
      tier = 'Divine';
      tierColor = '#dc2626'; // red-600
      category = 'Master';
    }

    // Generate unique quotes and descriptions
    const quotes = generateQuoteForLevel(i, tier);
    const description = generateDescriptionForLevel(i, tier);
    const unlockMessage = generateUnlockMessageForLevel(i, tier);
    
    // Generate rewards based on level
    const rewards = generateRewardsForLevel(i, tier);
    
    levels.push({
      level: i,
      title: `${tier} ${i}`,
      description,
      xpRequired: baseXP,
      xpToNext,
      rewards,
      tier,
      tierColor,
      icon: getIconForLevel(i, tier),
      quote: quotes,
      unlockMessage,
      category
    });
  }

  await this.insertMany(levels);
  console.log('✅ 100 levels seeded successfully');
};

// Helper functions for generating content
function generateQuoteForLevel(level, tier) {
  const quotes = {
    'Beginner': [
      "Her büyük yolculuk tek bir adımla başlar.",
      "Öğrenmeye açık kalın, büyümeye devam edin.",
      "Küçük adımlar, büyük değişiklikler yaratır.",
      "Sabır, başarının anahtarıdır.",
      "Her gün yeni bir fırsat sunar.",
      "Cesaret, korkunun üstesinden gelmektir.",
      "Bilgi, gücün temelidir.",
      "Dostluk, hayatın en değerli hazinesidir.",
      "Hayal kurmak, yaratmanın başlangıcıdır.",
      "Azim, imkansızı mümkün kılar."
    ],
    'Novice': [
      "Deneyim, en iyi öğretmendir.",
      "Keşfetmeye devam edin, sınırlarınızı zorlayın.",
      "Her hata, yeni bir ders sunar.",
      "Yaratıcılık, ruhun dilidir.",
      "Liderlik, örnek olmakla başlar.",
      "Bilgelik, deneyimden doğar.",
      "Cesaret, korkuya rağmen hareket etmektir.",
      "İlham, harekete geçirir.",
      "Kararlılık, engelleri aşar.",
      "Umut, geleceği şekillendirir."
    ],
    'Apprentice': [
      "Ustalık, sürekli pratik ile gelir.",
      "Yenilik, gelenekle buluştuğunda doğar.",
      "Liderlik, başkalarını yükseltmektir.",
      "Bilgelik, sorular sormakla başlar.",
      "Yaratıcılık, sınırları zorlar.",
      "Cesaret, bilinmeyene adım atmaktır.",
      "Sabır, en büyük güçtür.",
      "İlham, her yerde bulunabilir.",
      "Değişim, büyümenin işaretidir.",
      "Tutku, mükemmelliği yaratır."
    ],
    'Adept': [
      "Büyük güçler, büyük sorumluluklar getirir.",
      "Bilgi paylaştıkça çoğalır.",
      "Liderlik, hizmet etmekle başlar.",
      "Yaratıcılık, sınırları tanımaz.",
      "Cesaret, başkalarına ilham verir.",
      "Bilgelik, alçakgönüllülükle el ele gider.",
      "İnovasyon, gelenekleri dönüştürür.",
      "Kararlılık, dağları oynatır.",
      "Vizyon, geleceği şekillendirir.",
      "Etki, kalıcı izler bırakır."
    ],
    'Expert': [
      "Uzmanlık, sürekli öğrenmeyi gerektirir.",
      "Mentörlük, en yüce hizmettir.",
      "İnovasyon, mükemmelliğin ötesindedir.",
      "Liderlik, vizyonu gerçeğe dönüştürür.",
      "Bilgelik, deneyimi aşar.",
      "Yaratıcılık, çözümleri keşfeder.",
      "Cesaret, değişimi yönlendirir.",
      "Etkileşim, dönüşümü sağlar.",
      "Strateji, geleceği tasarlar.",
      "Miras, kalıcı değer yaratır."
    ],
    'Master': [
      "Ustalık, öğretmekle mükemmelleşir.",
      "Liderlik, başkalarını güçlendirmektir.",
      "Bilgelik, hüküm vermeden anlamaktır.",
      "Yaratıcılık, imkansızı mümkün kılar.",
      "Cesaret, sistemi dönüştürür.",
      "Vizyon, çağları aşar.",
      "Etki, nesilleri şekillendirir.",
      "İnovasyon, paradigmaları değiştirir.",
      "Mentörlük, gelecek nesilleri hazırlar.",
      "Miras, sonsuzluk kazandırır."
    ],
    'Grandmaster': [
      "Büyük ustalar, sessizce öğretir.",
      "Liderlik, hizmet etme sanatıdır.",
      "Bilgelik, tüm varlıkları kucaklar.",
      "Yaratıcılık, evrenin diline döner.",
      "Cesaret, tarihi yeniden yazar.",
      "Vizyon, zamanı aşar.",
      "Etki, dünyayı değiştirir.",
      "İnovasyon, çağ açar.",
      "Mentörlük, ruhları uyandırır.",
      "Miras, sonsuzluğa uzanır."
    ],
    'Legend': [
      "Efsaneler, imkansızı gerçeğe dönüştürür.",
      "Liderlik, çağları aşan ilham verir.",
      "Bilgelik, evrenin sırlarını çözer.",
      "Yaratıcılık, yeni boyutlar açar.",
      "Cesaret, kaderi değiştirir.",
      "Vizyon, geleceği yaratır.",
      "Etki, tarihe yön verir.",
      "İnovasyon, çağ değiştirir.",
      "Mentörlük, ruhları dönüştürür.",
      "Miras, sonsuzlukta yaşar."
    ],
    'Mythic': [
      "Mitolojik güçler, evreni şekillendirir.",
      "Liderlik, zaman ötesi ilham kaynağıdır.",
      "Bilgelik, varlığın esrarını keşfeder.",
      "Yaratıcılık, boyutları aşar.",
      "Cesaret, kaderleri yönlendirir.",
      "Vizyon, çoklu evrenler yaratır.",
      "Etki, gerçekliği dönüştürür.",
      "İnovasyon, paradigmaları çöker.",
      "Mentörlük, ruhları aydınlatır.",
      "Miras, sonsuzlukta hükmeder."
    ],
    'Divine': [
      "İlahi güçler, yaratımın esasıdır.",
      "Liderlik, evrensel uyumu sağlar.",
      "Bilgelik, var olanın ötesine geçer.",
      "Yaratıcılık, gerçekliği yeniden tasarlar.",
      "Cesaret, kaderlerin efendisidir.",
      "Vizyon, sonsuzluğu kucaklar.",
      "Etki, var olmayı şekillendirir.",
      "İnovasyon, yaratımı yeniler.",
      "Mentörlük, varlığı dönüştürür.",
      "Miras, sonsuzlukta egemen olur."
    ]
  };
  
  const tierQuotes = quotes[tier] || quotes['Beginner'];
  const index = (level - 1) % tierQuotes.length;
  return tierQuotes[index];
}

function generateDescriptionForLevel(level, tier) {
  const descriptions = {
    'Beginner': `Sosyal ağınızı genişletmeye başlıyorsunuz. Seviye ${level}'de temel becerilerinizi geliştirin.`,
    'Novice': `Keşif ruhunuz güçleniyor. Seviye ${level}'de yeni bölgeleri keşfetmeye başlayın.`,
    'Apprentice': `Yaratıcı potansiyeliniz ortaya çıkıyor. Seviye ${level}'de özgün içerikler üretin.`,
    'Adept': `Bilge bir lider olmaya başlıyorsunuz. Seviye ${level}'de derin bilgiler edinin.`,
    'Expert': `Uzmanlığınız tanınıyor. Seviye ${level}'de liderlik becerilerinizi gösterin.`,
    'Master': `Ustalık seviyesine erişiyorsunuz. Seviye ${level}'de savaşçı ruhunuzu keşfedin.`,
    'Grandmaster': `Büyük usta seviyesindesiniz. Seviye ${level}'de bilgelik yolculuğunuza devam edin.`,
    'Legend': `Efsane seviyesine ulaştınız. Seviye ${level}'de ustaca hareket edin.`,
    'Mythic': `Mitolojik güçlere sahipsiniz. Seviye ${level}'de dünyayı şekillendirin.`,
    'Divine': `İlahi güçlere erişiyorsunuz. Seviye ${level}'de evrensel hakimiyetinizi gösterin.`
  };
  
  return descriptions[tier] || descriptions['Beginner'];
}

function generateUnlockMessageForLevel(level, tier) {
  const messages = {
    'Beginner': `🎉 Tebrikler! Seviye ${level}'e ulaştınız! Sosyal yolculuğunuzun temelleri atılıyor.`,
    'Novice': `🌟 Harika! Seviye ${level} açıldı! Keşif maceranız başlıyor.`,
    'Apprentice': `✨ Mükemmel! Seviye ${level}'e eriştin! Yaratıcı güçlerin gelişiyor.`,
    'Adept': `💫 Olağanüstü! Seviye ${level} başarıldı! Bilgelik yolculuğun ilerliyor.`,
    'Expert': `⚡ İnanılmaz! Seviye ${level}'e ulaştın! Liderlik becrilerin tanınıyor.`,
    'Master': `🔥 Efsane! Seviye ${level} fethettiniz! Usta seviyesine yaklaşıyorsunuz.`,
    'Grandmaster': `👑 Destansı! Seviye ${level}'e erişim sağladınız! Büyük usta oluyorsunuz.`,
    'Legend': `🌌 Mitolojik! Seviye ${level} açıldı! Efsane güçleriniz ortaya çıkıyor.`,
    'Mythic': `🔮 Kozmik! Seviye ${level}'e ulaştınız! Mitik güçler kontrolünüzde.`,
    'Divine': `☀️ İlahi! Seviye ${level} fethedildi! Evrensel güçleriniz tam güçte.`
  };
  
  return messages[tier] || messages['Beginner'];
}

function generateRewardsForLevel(level, tier) {
  const rewards = {
    unlockedFeatures: [],
    unlockedRegions: [],
    badges: [],
    specialAbilities: []
  };

  // Add features based on level milestones
  if (level === 5) rewards.unlockedFeatures.push('post_creation');
  if (level === 10) rewards.unlockedFeatures.push('friend_system');
  if (level === 15) rewards.unlockedFeatures.push('story_creation');
  if (level === 20) rewards.unlockedFeatures.push('guild_joining');
  if (level === 25) rewards.unlockedFeatures.push('advanced_messaging');
  if (level === 30) rewards.unlockedFeatures.push('region_exploration');
  if (level === 40) rewards.unlockedFeatures.push('guild_creation');
  if (level === 50) rewards.unlockedFeatures.push('mentorship_program');
  if (level === 60) rewards.unlockedFeatures.push('leaderboard_top');
  if (level === 70) rewards.unlockedFeatures.push('special_events');
  if (level === 80) rewards.unlockedFeatures.push('beta_features');
  if (level === 90) rewards.unlockedFeatures.push('admin_privileges');
  if (level === 100) rewards.unlockedFeatures.push('ultimate_mastery');

  // Add badges for tier milestones
  if (level % 10 === 0) {
    rewards.badges.push({
      name: `${tier} Master`,
      icon: getIconForLevel(level, tier),
      description: `${tier} seviyesinin ${level}. kademesini tamamladı`
    });
  }

  return rewards;
}

function getIconForLevel(level, tier) {
  const icons = {
    'Beginner': '🌱',
    'Novice': '🌿', 
    'Apprentice': '🌸',
    'Adept': '🌟',
    'Expert': '💎',
    'Master': '👑',
    'Grandmaster': '⚔️',
    'Legend': '🏆',
    'Mythic': '🔮',
    'Divine': '☀️'
  };
  
  return icons[tier] || '⭐';
}

const Level = mongoose.models.Level || mongoose.model('Level', levelSchema);

export default Level;