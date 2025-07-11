# Liderlik Tablosu Sistemi

Bu belgede gerçek kullanıcı verilerini kullanarak oluşturduğumuz profesyonel liderlik tablosu sistemini açıklıyorum.

## 🎯 Özellikler

### ✅ Gerçek Veri Entegrasyonu
- MongoDB'den gerçek kullanıcı verilerini çeker
- Mock data yerine canlı kullanıcı istatistiklerini kullanır
- Profil fotoğrafları ve avatar desteği

### ✅ Çoklu Kategori Sıralaması
- **XP (Deneyim Puanı)**: Kullanıcıların toplam deneyim puanına göre
- **Seviye**: Karakter seviyesine göre sıralama
- **Gönderiler**: Paylaştıkları gönderi sayısına göre
- **Görevler**: Tamamladıkları görev sayısına göre
- **Etki Puanı**: Toplam etki puanına göre
- **Guild Liderleri**: Seviye ve görev kombinasyonu

### ✅ Zaman Dilimi Filtreleme
- **Tüm Zamanlar**: Genel sıralama
- **Bu Ay**: Aylık performans
- **Bu Hafta**: Haftalık sıralama
- **Bugün**: Günlük aktivite

### ✅ Arama ve Filtreleme
- Kullanıcı adına göre gerçek zamanlı arama
- Debounced search (500ms gecikme)
- Arama sonuçlarında real-time güncelleme

### ✅ Sayfalama ve Performans
- Sayfa başına 50 kullanıcı
- "Daha Fazla Yükle" butonu
- Infinite scroll desteği
- Optimized MongoDB sorguları

### ✅ Kullanıcı Sıralaması
- Giriş yapmış kullanıcıların kendi sıralamasını görme
- Gerçek zamanlı rank hesaplama
- Pozisyon değişimi takibi (TODO: Günlük değişim implementasyonu)

## 📊 API Endpoints

### GET /api/leaderboard
Liderlik tablosu verilerini getirir.

**Query Parameters:**
- `category`: 'xp' | 'level' | 'posts' | 'quests' | 'impact' | 'guilds'
- `timeframe`: 'all' | 'month' | 'week' | 'today'
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına öğe sayısı (default: 50)
- `search`: Kullanıcı adı araması

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "xp",
    "timeframe": "all",
    "rankings": [
      {
        "rank": 1,
        "user": {
          "id": "user_id",
          "username": "DragonSlayer99",
          "level": 45,
          "characterClass": {
            "icon": "⚔️",
            "name": "Savaşçı",
            "color": "from-red-500 to-orange-600"
          },
          "avatar": "profile_photo_url"
        },
        "value": 12500,
        "change": 0,
        "streak": 15,
        "badges": []
      }
    ],
    "userRank": {
      "rank": 156,
      "value": 1250,
      "change": 5
    },
    "totalUsers": 1000,
    "hasMore": true,
    "currentPage": 1,
    "totalPages": 20
  }
}
```

### POST /api/seed/users
Development ortamında test kullanıcıları oluşturur.

**Actions:**
- `seed`: 15 test kullanıcısı oluşturur
- `clear`: Tüm kullanıcıları siler

## 🏗️ Teknik Altyapı

### Database Indexes
User modelinde performans için şu indexler eklendi:
```javascript
userSchema.index({ level: -1 });
userSchema.index({ xp: -1 });
userSchema.index({ 'stats.postsCount': -1 });
userSchema.index({ 'stats.questsCompleted': -1 });
userSchema.index({ 'stats.impactScore': -1 });
```

### Redux State Management
```javascript
const leaderboardState = {
  rankings: [],           // Mevcut sıralama listesi
  userRank: null,        // Kullanıcının kendi sıralaması
  currentCategory: 'xp', // Aktif kategori
  currentTimeframe: 'all', // Aktif zaman dilimi
  searchQuery: '',       // Arama sorgusu
  totalUsers: 0,         // Toplam kullanıcı sayısı
  isLoading: false,      // Yüklenme durumu
  error: null,           // Hata mesajı
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasMore: true
  }
}
```

### Performans Optimizasyonları
- **MongoDB Aggregation**: Efficient ranking queries
- **Lean Queries**: Sadece gerekli alanları çek
- **Debounced Search**: Aşırı API çağrılarını önle
- **Pagination**: Büyük veri setlerini parçalara böl
- **Index Usage**: Hızlı sıralama için indexler

## 🎮 Kullanım Senaryoları

### 1. Test Verisi Oluşturma
```bash
# Development ortamında test kullanıcıları oluştur
curl -X POST http://localhost:3000/api/seed/users \
  -H "Content-Type: application/json" \
  -d '{"action": "seed"}'
```

### 2. Liderlik Tablosunu Görüntüle
- `/leaderboard` sayfasına git
- Kategori seç (XP, Seviye, vb.)
- Zaman dilimi belirle
- Kullanıcı ara
- Kendi sıralamayı kontrol et

### 3. Gerçek Kullanıcı Kaydı
- Normal register sistemi kullan
- XP ve level değerleri otomatik hesaplanır
- Liderlik tablosunda otomatik olarak görünür

## 🔄 Streak Hesaplama

Şu anda basit bir implementasyon:
```javascript
function calculateStreak(user) {
  const daysSinceCreation = Math.floor(
    (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.min(Math.floor(daysSinceCreation / 7), 30));
}
```

## 🚀 Gelecek Geliştirmeler

### TODO Items
1. **Günlük Sıralama Değişimi**: Daily rank change tracking
2. **Badge Sistemi**: Achievement badges implementation
3. **Gerçek Streak**: Günlük aktivite bazlı streak
4. **Notification**: Sıralama değişim bildirimleri
5. **Caching**: Redis ile performans artırımı
6. **Real-time Updates**: WebSocket ile canlı güncellemeler

### Performance Improvements
- Redis caching for frequent queries
- WebSocket for real-time updates
- CDN for avatar images
- Database connection pooling

## 📱 Responsive Design

- Desktop: Tam 3-sütunlu podium
- Tablet: Responsive grid layout
- Mobile: Stack layout with touch interactions
- Progressive Web App ready

## 🔐 Güvenlik

- JWT token validation
- Privacy settings respect
- Rate limiting (TODO)
- Input sanitization
- SQL injection protection

## 🎯 Test Senaryoları

### 1. Boş Veri Testi
- Yeni veritabanında liderlik tablosu
- Uygun empty state gösterimi

### 2. Arama Testi
- Var olan kullanıcı arama
- Var olmayan kullanıcı arama
- Boş arama sonucu handling

### 3. Kategoriler Arası Geçiş
- Farklı kategorilerde sıralama
- Zaman dilimleri arasında geçiş
- State yönetimi kontrolü

Bu sistem gerçek kullanıcı verilerini kullanarak profesyonel bir liderlik tablosu deneyimi sunar ve gelecekteki geliştirmeler için sağlam bir temel oluşturur.