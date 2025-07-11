// app/page.js
'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Crown, 
  Gamepad2, 
  Users, 
  Trophy, 
  Target,
  ArrowRight,
  Star,
  Play,
  ChevronDown
} from 'lucide-react';
import FloatingParticles from '../components/ui/FloatingParticles';
import Image from 'next/image';
import PixelDinosaur from '../components/PixelDinosaur';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-orange-200/15 to-blue-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 text-center">
          {/* Logo */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-60"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0.9, 0.6]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <Image 
                src="/DinocialWhite.png" 
                alt="Logo" 
                width={120} 
                height={120} 
                priority
                className="relative rounded-full border-4 border-blue-300/50 shadow-2xl" 
              />
            </div>
          </motion.div>

          {/* Animated DINOCIAL Text */}
          <div className="mb-8 overflow-hidden">
            <motion.h1 
              className="text-6xl font-bold text-gradient inline-block"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ 
                duration: 1.2, 
                delay: 0.5,
                ease: "easeOut"
              }}
            >
              DINOCIAL
            </motion.h1>
          </div>

          {/* Subtitle with typewriter effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="mb-8"
          >
            <motion.p 
              className="text-xl text-slate-600 font-medium"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 1.7,
                ease: "easeOut"
              }}
            >
              Social RPG Platform
            </motion.p>
          </motion.div>

          {/* Loading Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.6 }}
            className="space-y-4"
          >
            {/* Loading Dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Loading Text */}
            <motion.p 
              className="text-slate-500 text-sm"
              initial={{ x: 150, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 2.5,
                ease: "easeOut"
              }}
            >
              Maceran hazırlanıyor...
            </motion.p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3, duration: 0.5 }}
            className="mt-8 max-w-xs mx-auto"
          >
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 2.5,
                  delay: 3.2,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <Crown className="w-7 h-7" />,
      title: "Karakter Sınıfları",
      description: "5 benzersiz sınıf, her biri özel yetenekleri ve büyülü bonuslarıyla",
      color: "from-violet-500 to-purple-600"
    },
    {
      icon: <Gamepad2 className="w-7 h-7" />,
      title: "İmmersive Dünya",
      description: "Keşfedilecek 5 büyülü bölge, her biri kendi hikayesi ve sırlarıyla",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: "Epic Görevler",
      description: "Günlük maceralarda XP kazan, seviyeleri aş ve efsanevi ödüller kazan",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Sosyal Guild'lar",
      description: "Güçlü ittifaklar kur, gerçek zamanlı savaşlar ve sosyal deneyimler",
      color: "from-rose-500 to-pink-600"
    }
  ];

  const stats = [
    { number: "50K+", label: "Aktif Kahramanlar" },
    { number: "1M+", label: "Tamamlanan Görev" },
    { number: "100+", label: "Efsanevi Ödüller" },
    { number: "24/7", label: "Aktif Dünya" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white relative overflow-hidden">
      {/* Pixel Dinosaur */}
      <PixelDinosaur />
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 opacity-40">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            left: `${mousePosition.x - 40}%`,
            top: `${mousePosition.y - 40}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
            right: `${100 - mousePosition.x - 30}%`,
            bottom: `${100 - mousePosition.y - 30}%`,
            transform: 'translate(50%, 50%)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>

      {/* Floating Particles */}
      <FloatingParticles count={25} />

      <div className="relative z-10">
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center justify-center px-6 relative">
          <div className="max-w-6xl mx-auto text-center relative" style={{ zIndex: 10 }}>
            <motion.div
              style={{ y: y1 }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-6 py-3 mb-8">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-primary-dark font-medium">Yeni Bir Sosyal Medya Evreni</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8">
                <span className="block text-slate-800 text-shadow-sm">Sosyal Medya</span>
                <span className="block text-gradient">
                  Efsanesi
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Gerçek RPG mekaniği ile sosyal medyayı birleştiren benzersiz platform. 
                <span className="text-gradient-static font-semibold"> Karakterini oluştur, guild'ları keşfet ve efsaneni yaz.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <motion.button 
                  onClick={() => router.push('/register')}
                  className="rpg-button text-lg px-8 py-4 flex items-center space-x-3 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-6 h-6" />
                  <span>Karakterini Yarat</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button 
                  className="rpg-button-secondary text-lg px-8 py-4 flex items-center space-x-3 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" />
                  <span>Demo İzle</span>
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              className="mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <ChevronDown className="w-6 h-6 text-slate-500 mx-auto animate-bounce" />
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <motion.section 
          className="py-20 px-6"
          style={{ y: y2 }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-gradient-static mb-2">
                    {stat.number}
                  </div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
                Efsanevi <span className="text-gradient-static">Özellikler</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Her detayı özenle tasarlanmış, benzersiz sosyal medya deneyimi için gelişmiş özellikler
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="feature-card group cursor-pointer"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start space-x-6">
                    <div className={`icon-container bg-gradient-to-br ${feature.color} group-hover:shadow-2xl`}>
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-gradient-static transition-all">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        {feature.description}
                      </p>
                      
                      <div className="mt-6">
                        <div className="inline-flex items-center text-primary font-semibold group-hover:text-primary-dark transition-colors">
                          Keşfet
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Game Preview Section */}
        <section id="classes" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="glass-card p-12 lg:p-20 text-center relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-xl transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-8">
                  Hayal Et, <span className="text-gradient-static">Keşfet, Fethet</span>
                </h2>
                
                <p className="text-xl text-slate-600 mb-16 max-w-4xl mx-auto">
                  Gerçek RPG mekaniği ile desteklenen sosyal platform. Her etkileşim bir macera, her gönderi bir quest.
                </p>
                
                <div className="grid md:grid-cols-3 gap-12">
                  <motion.div 
                    className="text-center group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-500">
                      <Crown className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">Yaratıcılık Kralı</h3>
                    <p className="text-slate-600">Sanatçı sınıfı olarak yaratıcı içerikler paylaş ve efsanevi bonuslar kazan</p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-emerald-500/25 transition-all duration-500">
                      <Gamepad2 className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">Keşif Efendisi</h3>
                    <p className="text-slate-600">Yeni dünyaları keşfet, gizli quesleri bul ve sırları ortaya çıkar</p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-amber-500/25 transition-all duration-500">
                      <Trophy className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">Arena Şampiyonu</h3>
                    <p className="text-slate-600">Mini oyunlarda rakiplerini yen ve turnuva şampiyonu unvanını kazan</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Community Section */}
        <section id="community" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
                Güçlü <span className="text-gradient-static">Topluluk</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                50.000+ kahraman arasında yerini al, guild'lar kur ve efsanevi dostluklar edin
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Guild Sistemi",
                  description: "Güçlü ittifaklar kur ve birlikte büyük başarılara imza at",
                  icon: <Shield className="w-8 h-8" />,
                  color: "from-purple-500 to-pink-500"
                },
                {
                  title: "Gerçek Zamanlı Chat",
                  description: "Anlık mesajlaşma ile arkadaşlarınla sürekli iletişimde kal",
                  icon: <Users className="w-8 h-8" />,
                  color: "from-emerald-500 to-teal-500"
                },
                {
                  title: "Turnuvalar",
                  description: "Haftalık turnuvalarda yarış ve en büyük ödülleri kazan",
                  icon: <Trophy className="w-8 h-8" />,
                  color: "from-amber-500 to-orange-500"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="glass-card p-8 text-center group hover:scale-105 transition-all duration-300"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl transition-all duration-300`}>
                    <div className="text-white">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Achievements Section */}
        <section id="achievements" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
                Efsanevi <span className="text-gradient-static">Başarımlar</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Her hareketin bir anlamı var. Başarımları topla, rozet kazan ve efsaneni kanıtla
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "İlk Adım", desc: "İlk gönderini paylaş", reward: "100 XP", color: "from-blue-500 to-cyan-500" },
                { title: "Sosyal Kelebek", desc: "50 arkadaş edin", reward: "Özel Rozet", color: "from-purple-500 to-pink-500" },
                { title: "Quest Master", desc: "100 görev tamamla", reward: "Efsanevi Unvan", color: "from-amber-500 to-orange-500" },
                { title: "Guild Lideri", desc: "Bir guild'e liderlik et", reward: "Kraliyet Tacı", color: "from-emerald-500 to-teal-500" }
              ].map((achievement, index) => (
                <motion.div
                  key={index}
                  className="glass-card p-6 text-center group relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`absolute inset-0 bg-gradient-to-r ${achievement.color} opacity-10`} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 bg-gradient-to-r ${achievement.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{achievement.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{achievement.desc}</p>
                    <div className={`inline-block px-3 py-1 bg-gradient-to-r ${achievement.color} rounded-full text-white text-xs font-semibold`}>
                      {achievement.reward}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-7xl font-bold text-slate-800 mb-8">
                Efsanen <span className="text-gradient-static">Şimdi Başlıyor</span>
              </h2>
              
              <p className="text-xl text-slate-600 mb-16 max-w-3xl mx-auto">
                50.000+ kahraman zaten kendi hikayelerini yazıyor. Sen de onlara katıl ve 
                <span className="text-gradient-static font-semibold"> sosyal medyanın geleceğini keşfet.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <motion.button 
                  onClick={() => router.push('/register')}
                  className="rpg-button text-xl px-12 py-6 flex items-center space-x-3 group relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-6 h-6" />
                  <span>Efsanevi Yolculuğu Başlat</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button 
                  onClick={() => router.push('/login')}
                  className="rpg-button-secondary text-xl px-12 py-6 flex items-center space-x-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-6 h-6" />
                  <span>Macerana Devam Et</span>
                </motion.button>
              </div>
              
              <div className="mt-12 flex justify-center items-center space-x-8 text-slate-600">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-amber-500 fill-current" />
                  <span>Ücretsiz Başla</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span>Güvenli Platform</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>50K+ Aktif Kullanıcı</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => router.push('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image src="/DinocialBlack.png" alt="Logo" width={160} height={160} priority />
          </motion.div>
              
              <div className="text-center md:text-right">
                <p className="text-slate-600 mb-2">
                  © 2025 DINOCIAL. Tüm hakları saklıdır.
                </p>
                <p className="text-slate-500 text-sm">
                  Maceran burada başlıyor, efsanen burada yazılıyor.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}