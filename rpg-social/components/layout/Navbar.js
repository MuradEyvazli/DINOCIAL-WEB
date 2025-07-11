// components/layout/Navbar.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Shield, 
  Crown, 
  Sparkles,
  Users,
  Trophy,
  Target,
  ArrowRight,
  Star,
  Home,
  MessageCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { logout } from '@/lib/redux/slices/authSlice';
// Bildirim sistemi kaldırıldı
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  // Bildirim state'leri kaldırıldı
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize(); // Initial check
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Bildirim yükleme kodu kaldırıldı

  // Bildirim fonksiyonları kaldırıldı

  // Public pages navigation items (for /, /login, /register)
  const publicNavItems = [
    { name: 'Özellikler', href: '#features', icon: Crown },
    { name: 'Sınıflar', href: '#classes', icon: Shield },
    { name: 'Topluluk', href: '#community', icon: Users },
    { name: 'Başarımlar', href: '#achievements', icon: Trophy },
  ];

  // Authenticated pages navigation items  
  const authNavItems = [
    { name: 'Ana Sayfa', href: '/dashboard', icon: Home },
    { name: 'Guild\'lar', href: '/guilds', icon: Shield },
    { name: 'Görevler', href: '/quests', icon: Target },
    { name: 'Liderlik', href: '/leaderboard', icon: Trophy },
    { name: 'Mesajlar', href: '/messages', icon: MessageCircle },
  ];

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const handleNavigation = (href) => {
    if (href.startsWith('#')) {
      // For anchor links, scroll to section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // For routes, navigate
      router.push(href);
    }
    setIsMenuOpen(false);
  };

  // Don't render navbar while loading
  if (isLoading) {
    return null;
  }

  // Hide authenticated nav items on login/register pages
  const hideAuthNavItems = ['/login', '/register'].includes(pathname);
  
  // Choose navigation items based on authentication and current page
  const navItems = (isAuthenticated && !hideAuthNavItems) ? authNavItems : publicNavItems;

  return (
    <motion.nav 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'nav-glass border-b shadow-lg' 
          : 'bg-gradient-to-r from-white/80 via-blue-50/60 to-white/80 backdrop-blur-sm'
      } ${
        screenSize === 'mobile' ? 'h-16' : screenSize === 'tablet' ? 'h-18' : 'h-20'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-64 h-64 -top-32 -left-32 bg-gradient-to-r from-blue-200/10 to-mint-200/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 -top-48 -right-48 bg-gradient-to-r from-orange-200/10 to-blue-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className={`relative max-w-7xl mx-auto ${
        screenSize === 'mobile' ? 'px-3' : screenSize === 'tablet' ? 'px-4' : 'px-4 sm:px-6 lg:px-8'
      }`}>
        <div className={`flex items-center justify-between ${
          screenSize === 'mobile' ? 'h-16' : screenSize === 'tablet' ? 'h-18' : 'h-20'
        }`}>
          {/* Logo - Responsive */}
          <motion.div 
            className="flex items-center space-x-4 cursor-pointer group"
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')}
            whileHover={{ scale: screenSize === 'mobile' ? 1.02 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <Image 
                src="/dinocial12.png" 
                alt="Logo" 
                width={screenSize === 'mobile' ? 120 : screenSize === 'tablet' ? 135 : 150} 
                height={screenSize === 'mobile' ? 40 : screenSize === 'tablet' ? 45 : 50} 
                style={{ width: "auto", height: "auto" }}
                className={`transition-all duration-300 ${
                  screenSize === 'mobile' ? 'max-h-8' : screenSize === 'tablet' ? 'max-h-10' : 'max-h-12'
                }`}
              />
            </div>
          </motion.div>

          {/* Desktop & Tablet Navigation */}
          <div className={`hidden ${
            screenSize === 'tablet' ? 'md:flex' : 'lg:flex'
          } items-center ${
            screenSize === 'tablet' ? 'space-x-4' : 'space-x-6'
          }`}>
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`flex items-center space-x-2 text-slate-600 hover:text-primary transition-all duration-300 rounded-xl hover:bg-blue-50/50 group ${
                    screenSize === 'tablet' ? 'px-3 py-2' : 'px-4 py-3'
                  }`}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-all group-hover:shadow-md ${
                    screenSize === 'tablet' ? 'p-1.5' : 'p-2'
                  }`}>
                    <IconComponent className={`text-primary ${
                      screenSize === 'tablet' ? 'w-4 h-4' : 'w-4 h-4'
                    }`} />
                  </div>
                  <span className={`font-medium group-hover:text-primary-dark transition-colors ${
                    screenSize === 'tablet' ? 'text-sm' : 'text-sm'
                  }`}>
                    {item.name}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Right Side - Auth or User Menu - Responsive */}
          <div className={`hidden ${
            screenSize === 'tablet' ? 'md:flex' : 'lg:flex'
          } items-center ${
            screenSize === 'tablet' ? 'space-x-2' : 'space-x-4'
          }`}>
            {!isAuthenticated ? (
              // Public auth buttons - Responsive
              <>
                <motion.button
                  onClick={() => router.push('/login')}
                  className={`relative font-medium text-slate-600 hover:text-primary transition-all duration-300 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-primary/30 hover:shadow-sm ${
                    screenSize === 'tablet' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-sm'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Giriş Yap
                </motion.button>
                
                <motion.button
                  onClick={() => router.push('/register')}
                  className={`rpg-button flex items-center space-x-2 group overflow-hidden shadow-lg hover:shadow-xl ${
                    screenSize === 'tablet' ? 'text-sm px-4 py-2' : 'text-sm px-5 py-2.5'
                  }`}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="absolute top-1 right-1 w-3 h-3 text-white/60 animate-pulse" />
                    <Sparkles className="absolute bottom-1 left-1 w-2 h-2 text-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                  
                  <Shield className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Kayıt Ol</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                </motion.button>
              </>
            ) : (
              <>
                {/* User Profile Menu - Responsive */}
                <div className="relative">
                <motion.button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center text-slate-600 hover:text-slate-800 transition-all duration-300 rounded-xl hover:bg-blue-50/80 group hover:shadow-sm ${
                    screenSize === 'tablet' ? 'space-x-2 px-3 py-2' : 'space-x-3 px-4 py-3'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="Avatar"
                        width={screenSize === 'tablet' ? 28 : 32}
                        height={screenSize === 'tablet' ? 28 : 32}
                        className="rounded-full border-2 border-blue-300/50 group-hover:border-blue-400 transition-colors shadow-sm group-hover:shadow-md"
                      />
                    ) : (
                      <div className={`bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow ${
                        screenSize === 'tablet' ? 'w-7 h-7' : 'w-8 h-8'
                      }`}>
                        <User className={`text-white ${
                          screenSize === 'tablet' ? 'w-3.5 h-3.5' : 'w-4 h-4'
                        }`} />
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 bg-green-400 border-2 border-white rounded-full ${
                      screenSize === 'tablet' ? 'w-2.5 h-2.5' : 'w-3 h-3'
                    }`}></div>
                  </div>
                  <span className={`font-medium hidden md:block truncate max-w-24 ${
                    screenSize === 'tablet' ? 'text-sm' : 'text-sm'
                  }`}>{user?.username}</span>
                  <ChevronDown className={`group-hover:rotate-180 transition-transform ${
                    screenSize === 'tablet' ? 'w-3.5 h-3.5' : 'w-4 h-4'
                  }`} />
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-white backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            router.push('/profile');
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-slate-600 hover:text-slate-800 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                        >
                          <User className="w-4 h-4" />
                          <span>Profil</span>
                        </button>
                        <button
                          onClick={() => {
                            router.push('/settings');
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-slate-600 hover:text-slate-800 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Ayarlar</span>
                        </button>
                        <hr className="border-slate-200 my-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Çıkış</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Enhanced */}
          <div className={`${
            screenSize === 'tablet' ? 'md:hidden' : 'lg:hidden'
          }`}>
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/60 text-slate-600 hover:text-slate-800 hover:bg-blue-50/80 active:bg-blue-100 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${
                screenSize === 'mobile' ? 'p-2.5' : 'p-3'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className={`${
                      screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className={`${
                      screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'
                    }`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className={`${
              screenSize === 'tablet' ? 'md:hidden' : 'lg:hidden'
            } bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-lg`}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className={`max-w-7xl mx-auto ${
              screenSize === 'mobile' ? 'px-3 py-4 space-y-2' : 'px-4 py-6 space-y-4'
            }`}>
              {/* Mobile & Tablet Navigation Items */}
              {navItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center text-slate-600 hover:text-slate-800 active:bg-blue-100 hover:bg-blue-50/80 transition-all rounded-xl border border-transparent hover:border-blue-200/60 active:scale-98 hover:shadow-sm ${
                      screenSize === 'mobile' ? 'space-x-3 p-4' : 'space-x-4 p-5'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 shadow-sm group-hover:shadow-md transition-shadow ${
                      screenSize === 'mobile' ? 'p-2.5' : 'p-3'
                    }`}>
                      <IconComponent className={`text-primary ${
                        screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'
                      }`} />
                    </div>
                    <span className={`font-medium ${
                      screenSize === 'mobile' ? 'text-base' : 'text-lg'
                    }`}>{item.name}</span>
                    <div className="flex-1"></div>
                    <ChevronRight className={`text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                      screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                    }`} />
                  </motion.button>
                );
              })}
              
              {/* Mobile & Tablet Auth/User Section */}
              <div className={`border-t border-slate-200/60 ${
                screenSize === 'mobile' ? 'pt-4 mt-2 space-y-3' : 'pt-6 space-y-4'
              }`}>
                {!isAuthenticated ? (
                  <>
                    <motion.button
                      onClick={() => {
                        router.push('/login');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-center space-x-3 text-slate-600 hover:text-slate-800 active:bg-blue-100 hover:bg-blue-50/80 transition-all rounded-xl border border-blue-200/60 hover:border-blue-300 active:scale-98 hover:shadow-sm ${
                        screenSize === 'mobile' ? 'p-4' : 'p-5'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 ${
                        screenSize === 'mobile' ? '' : ''
                      }`}>
                        <Shield className={`text-primary ${
                          screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                      </div>
                      <span className={`font-medium ${
                        screenSize === 'mobile' ? 'text-base' : 'text-lg'
                      }`}>Giriş Yap</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => {
                        router.push('/register');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 active:from-blue-700 active:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:shadow-blue-500/40 font-medium active:scale-98 hover:scale-101 ${
                        screenSize === 'mobile' ? 'p-4 text-base' : 'p-5 text-lg'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative">
                        <Sparkles className={`${
                          screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                        <div className="absolute inset-0 animate-ping">
                          <Sparkles className={`opacity-30 ${
                            screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                          }`} />
                        </div>
                      </div>
                      <span>Kayıt Ol</span>
                      <ArrowRight className={`group-hover:translate-x-1 transition-transform ${
                        screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                      }`} />
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={() => {
                        router.push('/profile');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center text-slate-600 hover:text-slate-800 active:bg-blue-100 hover:bg-blue-50/80 transition-all rounded-xl border border-transparent hover:border-blue-200/60 active:scale-98 hover:shadow-sm group ${
                        screenSize === 'mobile' ? 'space-x-3 p-4' : 'space-x-4 p-5'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 shadow-sm group-hover:shadow-md transition-shadow ${
                        screenSize === 'mobile' ? 'p-2.5' : 'p-3'
                      }`}>
                        <User className={`text-primary ${
                          screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'
                        }`} />
                      </div>
                      <span className={`font-medium ${
                        screenSize === 'mobile' ? 'text-base' : 'text-lg'
                      }`}>Profil</span>
                      <div className="flex-1"></div>
                      <ChevronRight className={`text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                        screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                      }`} />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => {
                        router.push('/settings');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center text-slate-600 hover:text-slate-800 active:bg-blue-100 hover:bg-blue-50/80 transition-all rounded-xl border border-transparent hover:border-blue-200/60 active:scale-98 hover:shadow-sm group ${
                        screenSize === 'mobile' ? 'space-x-3 p-4' : 'space-x-4 p-5'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 shadow-sm group-hover:shadow-md transition-shadow ${
                        screenSize === 'mobile' ? 'p-2.5' : 'p-3'
                      }`}>
                        <Settings className={`text-primary ${
                          screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'
                        }`} />
                      </div>
                      <span className={`font-medium ${
                        screenSize === 'mobile' ? 'text-base' : 'text-lg'
                      }`}>Ayarlar</span>
                      <div className="flex-1"></div>
                      <ChevronRight className={`text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                        screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                      }`} />
                    </motion.button>
                    
                    <motion.button
                      onClick={handleLogout}
                      className={`w-full flex items-center text-red-500 hover:text-red-600 active:bg-red-100 hover:bg-red-50/80 transition-all rounded-xl border border-transparent hover:border-red-200/60 active:scale-98 hover:shadow-sm group ${
                        screenSize === 'mobile' ? 'space-x-3 p-4' : 'space-x-4 p-5'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`rounded-lg bg-gradient-to-r from-red-100 to-red-200 shadow-sm group-hover:shadow-md transition-shadow ${
                        screenSize === 'mobile' ? 'p-2.5' : 'p-3'
                      }`}>
                        <LogOut className={`text-red-600 ${
                          screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'
                        }`} />
                      </div>
                      <span className={`font-medium ${
                        screenSize === 'mobile' ? 'text-base' : 'text-lg'
                      }`}>Çıkış</span>
                      <div className="flex-1"></div>
                      <ChevronRight className={`text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                        screenSize === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
                      }`} />
                    </motion.button>
                  </>
                )}
              </div>

              {/* Mobile Features */}
              {!isAuthenticated && (
                <div className="pt-6 border-t border-slate-200">
                  <div className="flex justify-center items-center space-x-8 text-slate-500 text-sm">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span>Ücretsiz</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>Güvenli</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>50K+ Kullanıcı</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}