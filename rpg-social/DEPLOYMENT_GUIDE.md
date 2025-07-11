# 🚀 RPG Social Deployment Guide

Bu rehber, RPG Social projesini hem Socket.IO sunucusu hem de Next.js uygulaması olarak farklı platformlara nasıl deploy edeceğinizi açıklar.

## 📋 Proje Mimarisi

Projeniz **iki farklı deployment senaryosu** gerektirir:

### 1. Socket.IO Sunucusu (server.js)
- **Gerçek zamanlı mesajlaşma** için gerekli
- **WebSocket bağlantıları** için
- **Kullanıcı durumu takibi** için
- **Typing indicators** için

### 2. Next.js Uygulaması
- **Statik dosyalar** ve **API routes**
- **Frontend React bileşenleri**
- **Veritabanı operasyonları**

## 📂 GitHub'a Yükleme

### 1. Git Repository Hazırlığı
```bash
# Eğer git repository yoksa
git init

# Mevcut dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit - RPG Social project"
```

### 2. GitHub Repository Oluştur
```bash
# GitHub'da yeni repository oluştur (rpg-social)
# Sonra local'i GitHub'a bağla:

git remote add origin https://github.com/KULLANICI_ADINIZ/rpg-social.git
git branch -M main
git push -u origin main
```

### 3. .gitignore Dosyası
Proje kök dizininde `.gitignore` oluştur:
```gitignore
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.tsbuildinfo
next-env.d.ts

# Environment files (ÖNEMLİ!)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Uploads (local files)
/public/uploads/
/uploads/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
Thumbs.db
```

### 4. Güvenlik İçin Environment Dosyası
```bash
# .env.local dosyasını GitHub'a yükleme!
# Bunun yerine .env.example oluştur:

cp .env.local .env.example
```

`.env.example` içeriğini temizle:
```bash
# .env.example
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-jwt-secret-here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXUS_MASTER_KEY=your-master-key
```

### 5. README.md Güncelle
```markdown
# RPG Social Platform

Social media platform with RPG mechanics.

## Setup
1. Clone repository
2. Copy .env.example to .env.local
3. Fill environment variables
4. Run: npm install
5. Run: npm run dev

## Deployment
See DEPLOYMENT_GUIDE.md for detailed instructions.
```

## 🔧 Deployment Hazırlıkları

### 1. Environment Variables (.env.local)
```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rpg-social

# JWT Security
JWT_SECRET=güçlü-jwt-secret-key
JWT_EXPIRES_IN=7d

# Production URL
NEXTAUTH_URL=https://yourdomain.com

# Environment
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# NEXUS Admin Panel
NEXUS_MASTER_KEY=NEXUS-QUANTUM-MASTER-2024
NEXUS_QUANTUM_SALT=quantum_salt_2024_secure
NEXUS_BIOMETRIC_SECRET=biometric_hash_secret_2024
```

### 2. Package.json Scripts
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js",
    "lint": "next lint"
  }
}
```

## 🌐 Deployment Seçenekleri

### Seçenek 1: Tek Platform (Önerilen) - Vercel + Socket.IO

#### A. Vercel'de Next.js + Socket.IO (Serverless Functions)
```bash
# 1. Proje kök dizininde
npm run build

# 2. Vercel CLI ile deploy
npm i -g vercel
vercel

# 3. Environment variables ekle (Vercel Dashboard)
# - MONGODB_URI
# - JWT_SECRET
# - NEXTAUTH_URL
# - NODE_ENV=production
# - Diğer env variables
```

**Vercel Konfigürasyonu (vercel.json):**
```json
{
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "next.config.mjs",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/socket.io/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "$1"
    }
  ]
}
```

### Seçenek 2: İki Platform - Netlify + Railway

#### A. Netlify için Next.js (Sadece Frontend + API)

**1. Netlify Build Settings:**
```bash
# Build command
npm run build

# Publish directory
.next

# Environment variables (Netlify Dashboard'da ekle)
MONGODB_URI=...
JWT_SECRET=...
NEXTAUTH_URL=https://your-netlify-app.netlify.app
NODE_ENV=production
```

**2. netlify.toml konfigürasyonu:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### B. Railway için Socket.IO Sunucusu

**1. Railway Deploy:**
```bash
# 1. Railway CLI kur
npm install -g @railway/cli

# 2. Login ve deploy
railway login
railway init
railway up
```

**2. Railway Environment Variables:**
```
NODE_ENV=production
PORT=3001
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
NEXTAUTH_URL=https://your-netlify-app.netlify.app
```

**3. Dockerfile (Railway için):**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

### Seçenek 3: Render (Full-Stack)

```bash
# 1. GitHub'a push
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. Render.com'da:
# - New Web Service
# - Connect GitHub repo
# - Build Command: npm install && npm run build
# - Start Command: npm start
```

## ⚙️ Socket.IO Konfigürasyonu

### Production CORS Ayarları
```javascript
// server.js içinde
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          "https://your-netlify-app.netlify.app",
          "https://yourdomain.com"
        ]
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### Client-side Socket.IO Bağlantısı
```javascript
// Frontend'de (Redux slice veya component)
import { io } from 'socket.io-client';

const socket = io(
  process.env.NODE_ENV === 'production' 
    ? 'https://your-socket-server.railway.app'  // Railway URL
    : 'http://localhost:3000'
);
```

## 🔐 Güvenlik Ayarları

### 1. Environment Variables Güvenliği
```bash
# Production'da mutlaka değiştir:
JWT_SECRET=yeni-güçlü-secret-key
NEXUS_MASTER_KEY=yeni-master-key
CLOUDINARY_API_SECRET=yeni-cloudinary-secret
```

### 2. Database Security
```bash
# MongoDB Atlas'ta:
# - IP Whitelist ekle
# - Strong password kullan
# - Database user permissions ayarla
```

### 3. CORS ve CSP Headers
```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
```

## 📊 Monitoring ve Logging

### 1. Error Tracking
```javascript
// lib/utils/logger.js
export const logger = {
  error: (message, data) => {
    console.error(`[ERROR] ${message}`, data);
    // Production'da Sentry, LogRocket vb. ekle
  },
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data);
  }
};
```

### 2. Performance Monitoring
```bash
# Package.json'a ekle
npm install --save-dev @vercel/analytics
```

## 🚀 Deploy Adımları

### Tek Platform (Vercel - Önerilen)
```bash
# 1. Build test
npm run build
npm start

# 2. Vercel deploy
vercel --prod

# 3. Environment variables ayarla
# 4. Domain bağla (opsiyonel)
```

### İki Platform (Netlify + Railway)
```bash
# 1. Netlify için
npm run build
# Netlify'da manual deploy veya GitHub connect

# 2. Railway için Socket.IO
# Railway'da GitHub repo connect
# Environment variables ayarla
# Auto-deploy aktif
```

## 🔧 Troubleshooting

### Socket.IO Bağlantı Sorunları
```javascript
// Debug için client-side
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});
```

### CORS Hataları
```javascript
// server.js'de origin'e domain ekle
origin: [
  "https://your-frontend-domain.com",
  "https://your-frontend-domain.netlify.app"
]
```

### MongoDB Bağlantı Sorunları
```bash
# Connection string kontrolü
# IP whitelist kontrolü
# Database user permissions kontrolü
```

## 📱 CDN ve Asset Optimization

### Cloudinary Ayarları
```javascript
// lib/services/cloudinary.js
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Production için
});
```

### Next.js Image Optimization
```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'your-domain.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },
};
```

## 🏁 Son Kontroller

### Deployment Checklist
- [ ] Environment variables set edildi
- [ ] Database connection test edildi
- [ ] Socket.IO connections çalışıyor
- [ ] File uploads çalışıyor (Cloudinary)
- [ ] Real-time messaging çalışıyor
- [ ] NEXUS admin panel erişilebilir
- [ ] Error handling ve logging aktif
- [ ] Performance monitoring kuruldu
- [ ] SSL sertifikası aktif
- [ ] CORS ayarları doğru
- [ ] Rate limiting çalışıyor

### Test URLs
```bash
# Frontend test
https://your-domain.com

# API test
https://your-domain.com/api/auth/me

# Socket.IO test
https://your-socket-domain.com/socket.io/

# Admin panel test
https://your-domain.com/nexus/dashboard
```

## 💡 İpuçları

1. **İlk defa deploy ediyorsanız**: Tek platform (Vercel) kullanın
2. **Yüksek trafik bekliyorsanız**: İki platform ayrımı yapın
3. **Debugging için**: Vercel Functions Logs kullanın
4. **Cost optimization**: Netlify + Railway kombinasyonu ekonomik
5. **Enterprise için**: AWS/Google Cloud düşünün

---

**Not:** Bu rehber projenizin güncel durumuna göre hazırlanmıştır. Deploy sırasında sorun yaşarsanız loglara bakın ve environment variables'ları kontrol edin.