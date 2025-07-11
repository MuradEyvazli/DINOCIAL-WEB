// scripts/seedLevels.js
const mongoose = require('mongoose');

// MongoDB URI'sini doğrudan tanımla
const MONGODB_URI = 'mongodb+srv://murad:Wattson5484@nodeexpressprojects.csweoyl.mongodb.net/rpg-social';

// Level model'i import et
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
    default: '#64748b'
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

// Helper functions
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

async function seedLevels() {
  try {
    console.log('🔌 MongoDB bağlantısı kuruluyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    const Level = mongoose.model('Level', levelSchema);

    // Mevcut seviyeleri kontrol et
    const existingLevels = await Level.countDocuments();
    if (existingLevels > 0) {
      console.log(`⚠️  ${existingLevels} seviye zaten mevcut. Önce temizleniyor...`);
      await Level.deleteMany({});
    }

    console.log('🚀 100 seviye oluşturuluyor...');
    
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
        tierColor = '#64748b';
        category = 'Social';
      } else if (i <= 20) {
        tier = 'Novice';
        tierColor = '#06b6d4';
        category = 'Explorer';
      } else if (i <= 30) {
        tier = 'Apprentice';
        tierColor = '#10b981';
        category = 'Creator';
      } else if (i <= 40) {
        tier = 'Adept';
        tierColor = '#3b82f6';
        category = 'Scholar';
      } else if (i <= 50) {
        tier = 'Expert';
        tierColor = '#8b5cf6';
        category = 'Leader';
      } else if (i <= 60) {
        tier = 'Master';
        tierColor = '#f59e0b';
        category = 'Warrior';
      } else if (i <= 70) {
        tier = 'Grandmaster';
        tierColor = '#ef4444';
        category = 'Sage';
      } else if (i <= 80) {
        tier = 'Legend';
        tierColor = '#ec4899';
        category = 'Master';
      } else if (i <= 90) {
        tier = 'Mythic';
        tierColor = '#7c3aed';
        category = 'Master';
      } else {
        tier = 'Divine';
        tierColor = '#dc2626';
        category = 'Master';
      }

      // Generate unique quotes and descriptions
      const quote = generateQuoteForLevel(i, tier);
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
        quote: quote,
        unlockMessage,
        category
      });

      if (i % 10 === 0) {
        console.log(`📊 Seviye ${i} (${tier}) hazırlandı...`);
      }
    }

    await Level.insertMany(levels);
    console.log('✅ 100 seviye başarıyla oluşturuldu!');
    
    // Verification
    const totalLevels = await Level.countDocuments();
    console.log(`🎯 Toplam seviye sayısı: ${totalLevels}`);
    
    // Show some examples
    const firstLevel = await Level.findOne({ level: 1 });
    const lastLevel = await Level.findOne({ level: 100 });
    
    console.log('\n📖 Örnek seviyeler:');
    console.log(`Seviye 1: ${firstLevel.quote}`);
    console.log(`Seviye 100: ${lastLevel.quote}`);
    
    await mongoose.disconnect();
    console.log('🔚 MongoDB bağlantısı kapatıldı');
    
  } catch (error) {
    console.error('❌ Seviye seed hatası:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Script'i çalıştır
seedLevels();