// lib/constants.js
export const CHARACTER_CLASSES = [
    {
      id: 'warrior',
      name: 'Savaşçı',
      icon: '⚔️',
      color: 'from-red-500 to-orange-500',
      description: 'Güçlü ve cesur, her meydan okumaya hazır',
      abilities: [
        'Güçlü liderlik yetenekleri',
        'Zor durumlarla başa çıkma',
        'Takım motivasyonu',
        'Problem çözme gücü'
      ]
    },
    {
      id: 'mage',
      name: 'Büyücü',
      icon: '🧙‍♂️',
      color: 'from-purple-500 to-blue-500',
      description: 'Bilgi ve yaratıcılığın ustası',
      abilities: [
        'Yaratıcı düşünce',
        'Analitik problem çözme',
        'İnovatif fikirler',
        'Stratejik planlama'
      ]
    },
    {
      id: 'archer',
      name: 'Okçu',
      icon: '🏹',
      color: 'from-green-500 to-teal-500',
      description: 'Hassas ve odaklı, hedefine her zaman ulaşır',
      abilities: [
        'Yüksek odaklanma',
        'Detay odaklı çalışma',
        'Hassas analiz',
        'Hedef belirleme'
      ]
    },
    {
      id: 'healer',
      name: 'Şifacı',
      icon: '💚',
      color: 'from-pink-500 to-rose-500',
      description: 'Destekleyici ve empatik, herkesi iyileştirir',
      abilities: [
        'Yüksek empati',
        'Destekleyici yaklaşım',
        'Çatışma çözme',
        'Topluluk oluşturma'
      ]
    },
    {
      id: 'rogue',
      name: 'Hırsız',
      icon: '🗡️',
      color: 'from-gray-500 to-slate-600',
      description: 'Çevik ve zeki, her duruma adapte olur',
      abilities: [
        'Hızlı adaptasyon',
        'Esnek düşünce',
        'Fırsat yakalama',
        'Yaratıcı çözümler'
      ]
    },
    {
      id: 'paladin',
      name: 'Paladin',
      icon: '🛡️',
      color: 'from-yellow-500 to-amber-500',
      description: 'Adaletli ve koruyucu, değerlerini savunur',
      abilities: [
        'Güçlü değerler',
        'Koruyucu yaklaşım',
        'Adalet duygusu',
        'İlkeli davranış'
      ]
    }
  ];
  
  export const REGIONS = [
    {
      id: 'humor_valley',
      name: 'Mizah Vadisi',
      icon: '😄',
      color: 'from-yellow-500 to-orange-500',
      description: 'Kahkaha ve neşenin merkezi. Burada herkes gülümser!',
      levelRequirement: 1
    },
    {
      id: 'emotion_forest',
      name: 'Duygu Ormanı',
      icon: '🌳',
      color: 'from-green-500 to-emerald-500',
      description: 'Derin duygular ve samimi paylaşımların yaşandığı yer.',
      levelRequirement: 3
    },
    {
      id: 'knowledge_peak',
      name: 'Bilgi Zirvesi',
      icon: '🗻',
      color: 'from-blue-500 to-indigo-500',
      description: 'Öğrenme ve keşfetmenin doruğu. Meraklılar burada buluşur.',
      levelRequirement: 5
    },
    {
      id: 'creativity_realm',
      name: 'Yaratıcılık Diyarı',
      icon: '🎨',
      color: 'from-purple-500 to-pink-500',
      description: 'Sanat ve yaratıcılığın sınırsız dünyası.',
      levelRequirement: 8
    },
    {
      id: 'debate_arena',
      name: 'Tartışma Arenası',
      icon: '⚔️',
      color: 'from-red-500 to-rose-500',
      description: 'Fikirler çarpışır, argümanlar keskinleşir.',
      levelRequirement: 10
    }
  ];
  
  export const QUEST_TYPES = {
    SOCIAL: 'social',
    EXPLORATION: 'exploration', 
    CREATIVITY: 'creativity',
    CHALLENGE: 'challenge'
  };
  
  export const BADGE_CATEGORIES = {
    SOCIAL: 'social',
    EXPLORATION: 'exploration',
    CREATIVITY: 'creativity',
    ACHIEVEMENT: 'achievement',
    SPECIAL: 'special'
  };
  
  export const DEFAULT_QUESTS = [
    {
      id: 'first_post',
      title: 'İlk Adım',
      description: 'İlk gönderini paylaş',
      type: 'social',
      difficulty: 'easy',
      xpReward: 25,
      requirements: [
        { type: 'post_count', target: 1, description: 'Bir gönderi paylaş' }
      ]
    },
    {
      id: 'social_butterfly',
      title: 'Sosyal Kelebek',
      description: '5 farklı kullanıcıyla etkileşim kur',
      type: 'social',
      difficulty: 'medium',
      xpReward: 50,
      requirements: [
        { type: 'unique_interactions', target: 5, description: '5 farklı kullanıcıyla etkileşim' }
      ]
    },
    {
      id: 'explorer',
      title: 'Kaşif',
      description: '3 farklı bölgeyi ziyaret et',
      type: 'exploration',
      difficulty: 'medium',
      xpReward: 75,
      requirements: [
        { type: 'regions_visited', target: 3, description: '3 bölge keşfet' }
      ]
    }
  ];