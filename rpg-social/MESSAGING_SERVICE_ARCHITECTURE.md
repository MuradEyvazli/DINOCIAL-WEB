# RPG Social - Mesajlaşma Servisi Mimarisi

## 🔧 Mevcut Mimari

Şu anda mesajlaşma sistemi ana uygulama ile entegre çalışıyor:
- Next.js custom server (`server.js`) üzerinde Socket.IO çalışıyor
- JWT authentication ile güvenlik sağlanıyor
- Real-time mesajlaşma, typing indicators, online durumları destekleniyor

## 📊 Neden Ayrı Servis Gerekebilir?

### Avantajları:
1. **Bağımsız Ölçeklendirme**: Mesajlaşma trafiği arttıkça sadece bu servisi scale edebilirsiniz
2. **Performans**: Ana uygulama yükünü azaltır
3. **Uptime**: Ana uygulama güncellemelerinde mesajlaşma kesintiye uğramaz
4. **Microservice Architecture**: Modern ve maintain edilebilir

### Dezavantajları:
1. **Ekstra Maliyet**: İki ayrı servis demek iki ayrı hosting maliyeti
2. **Kompleksite**: Servisler arası iletişim ve senkronizasyon
3. **Deployment**: İki ayrı deployment süreci

## 🚀 Ayrı Mesajlaşma Servisi Deployment Planı

### Opsiyon 1: Mevcut Yapıyı Koru (Önerilen)
Şu anki entegre yapı küçük-orta ölçekli projeler için idealdir:

```yaml
# render.yaml (mevcut)
services:
  - type: web
    name: rpg-social
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start
```

### Opsiyon 2: Ayrı Socket.IO Servisi
Yüksek trafik beklentisi varsa:

#### 1. Yeni Messaging Service Oluştur
```javascript
// messaging-service/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.MAIN_APP_URL,
    credentials: true
  }
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  socket.join(`user:${socket.userId}`);
  
  socket.on('join:conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });
  
  socket.on('message:send', async (data) => {
    // Message handling logic
    io.to(`conversation:${data.conversationId}`).emit('message:new', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Messaging service running on port ${PORT}`);
});
```

#### 2. Render Deployment Config
```yaml
# messaging-service/render.yaml
services:
  - type: web
    name: rpg-social-messaging
    runtime: node
    plan: starter
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: JWT_SECRET
        sync: false # Same as main app
      - key: MAIN_APP_URL
        value: https://rpg-social.onrender.com
      - key: MONGODB_URI
        sync: false # Same as main app
```

#### 3. Ana Uygulamada Client Güncelleme
```javascript
// lib/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_MESSAGING_SERVICE_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  autoConnect: false
});
```

## 🔄 Hybrid Yaklaşım (Önerilen)

### Başlangıç Stratejisi:
1. **Faz 1**: Mevcut entegre yapı ile başla
2. **Faz 2**: Trafik artarsa Socket.IO'yu ayrı servise taşı
3. **Faz 3**: Gerekirse diğer servisleri de ayır (notifications, file uploads)

### Monitoring Metrikleri:
- Socket.IO concurrent connections > 1000
- Message throughput > 100 msg/sec
- CPU usage > 80% consistently
- Memory usage > 80% of allocated

## 📝 Deployment Checklist

### Entegre Yapı (Mevcut):
- [x] Single render.yaml configuration
- [x] Unified authentication
- [x] Shared database connection
- [x] Single deployment process

### Ayrı Servis (Gelecek):
- [ ] Separate messaging service codebase
- [ ] Independent scaling configuration
- [ ] Service-to-service authentication
- [ ] Message queue implementation (Redis/RabbitMQ)
- [ ] Load balancer configuration
- [ ] Cross-service monitoring

## 🎯 Karar Verme Kriterleri

### Entegre Yapıda Kalın Eğer:
- Kullanıcı sayısı < 10,000
- Concurrent connections < 500
- Message volume < 50/sec
- Budget conscious
- Rapid development priority

### Ayrı Servise Geçin Eğer:
- Kullanıcı sayısı > 50,000
- Concurrent connections > 2000
- Message volume > 200/sec
- Enterprise requirements
- 99.9% uptime SLA

## 💡 Best Practices

1. **Connection Management**:
   - Implement connection pooling
   - Use Redis adapter for multi-instance
   - Implement reconnection logic

2. **Security**:
   - Rate limiting per user
   - Message validation
   - End-to-end encryption (optional)

3. **Performance**:
   - Message batching
   - Compression
   - CDN for media files

4. **Monitoring**:
   - Socket.IO metrics dashboard
   - Error tracking (Sentry)
   - Performance monitoring (New Relic)

## 🚨 Önemli Notlar

1. **Mevcut yapı production-ready**: Binlerce kullanıcıyı destekleyebilir
2. **Premature optimization kaçının**: Gerçek metrics olmadan ayrı servise geçmeyin
3. **Incremental migration**: Gerekirse kademeli geçiş yapın
4. **Cost consideration**: İki servis = iki kat hosting maliyeti

---

**Sonuç**: Mevcut entegre yapınız çoğu use case için yeterlidir. Real metrics'lere göre karar verin.