// app/map/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Lock, 
  Star, 
  Users, 
  MapPin, 
  Compass, 
  Globe, 
  Award,
  TrendingUp,
  Eye,
  Clock,
  Zap,
  Crown,
  Shield,
  Search,
  Filter,
  RotateCcw,
  Navigation,
  Target,
  Layers,
  Activity
} from 'lucide-react';
import { REGIONS } from '@/lib/constants';
import { setCurrentRegion } from '@/lib/redux/slices/gameSlice';
import { loadUser } from '@/lib/redux/slices/authSlice';

export default function MapPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useSelector((state) => state.auth);
  const { currentRegion, unlockedRegions, visitedRegions } = useSelector((state) => state.game);
  
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [mapView, setMapView] = useState('world'); // world, region, satellite
  const [showPaths, setShowPaths] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unlocked, visited, locked
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const mapRef = useRef(null);

  useEffect(() => {
    setIsMapLoaded(true);
  }, []);

  // Debug user data on mount and changes
  useEffect(() => {
    console.log('=== MAP PAGE DEBUG ===');
    console.log('User data:', {
      hasUser: !!user,
      userId: user?._id,
      username: user?.username,
      level: user?.level,
      xp: user?.xp,
      calculatedLevel: user?.calculatedLevel,
      characterClass: user?.characterClass,
      visitedRegions: user?.visitedRegions,
      unlockedRegions: user?.unlockedRegions
    });
    
    // Test region unlock logic with each region
    if (user) {
      console.log('=== REGION UNLOCK TESTS ===');
      REGIONS.forEach(region => {
        const userLevel = user?.level || user?.calculatedLevel || 1;
        const isUnlocked = userLevel >= region.levelRequirement;
        console.log(`${region.name}: User Level ${userLevel} vs Required ${region.levelRequirement} = ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}`);
      });
    }
    
    if (!user) {
      console.warn('Map Page - No user data available');
      return;
    }
    
    // Check if user has invalid level data
    if (!user.level || user.level < 1) {
      console.warn('User has invalid level, attempting to fix...');
      
      // Call the debug endpoint to check user data
      fetch('/api/debug/fix-user-levels', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(res => res.json())
      .then(data => {
        console.log('Debug data:', data);
        if (data.success && data.data) {
          console.log('User debug info:', data.data);
          
          // If level is still invalid, try to fix it
          if (!data.data.hasValidLevel) {
            return fetch('/api/debug/fix-user-levels', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
          }
        }
      })
      .then(res => res?.json())
      .then(data => {
        if (data) {
          console.log('Fix result:', data);
          // Reload user data
          dispatch(loadUser());
        }
      })
      .catch(err => console.error('Debug/fix error:', err));
    }
    
    // Sync user's regions with game state if needed
    if (user && user.visitedRegions && visitedRegions.length === 1) {
      // If game state only has default region but user has more, sync them
      console.log('Syncing user regions with game state');
      // Note: This would require a new action in gameSlice to sync regions
    }
  }, [user, visitedRegions, dispatch]);

  const isRegionUnlocked = (region) => {
    // Debug logging
    console.log('isRegionUnlocked check:', {
      regionName: region.name,
      regionLevelReq: region.levelRequirement,
      userLevel: user?.level,
      userXP: user?.xp,
      hasUser: !!user
    });
    
    // Ensure user exists and has a valid level
    if (!user || user.level === undefined || user.level === null) {
      console.warn('User or user.level is undefined/null');
      return false;
    }
    
    // Ensure level is a valid number (fallback to 1 if 0 or invalid)
    const userLevel = parseInt(user.level) || parseInt(user.calculatedLevel) || 1;
    
    return userLevel >= region.levelRequirement;
  };

  const isRegionVisited = (regionId) => {
    return visitedRegions.includes(regionId);
  };

  const handleRegionClick = (region) => {
    if (isRegionUnlocked(region)) {
      setSelectedRegion(region);
    }
  };

  const handleEnterRegion = () => {
    if (selectedRegion) {
      dispatch(setCurrentRegion(selectedRegion.id));
      router.push(`/dashboard?region=${selectedRegion.id}`);
    }
  };

  const getRegionStatus = (region) => {
    if (!isRegionUnlocked(region)) return 'locked';
    if (region.id === currentRegion) return 'current';
    if (isRegionVisited(region.id)) return 'visited';
    return 'available';
  };

  const getRegionStyles = (region) => {
    const status = getRegionStatus(region);
    const baseStyles = "absolute transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl border-3 flex items-center justify-center text-3xl cursor-pointer transition-all duration-500 hover:scale-110";
    
    switch (status) {
      case 'locked':
        return `${baseStyles} bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 text-slate-500 cursor-not-allowed opacity-60 hover:scale-100`;
      case 'current':
        return `${baseStyles} bg-gradient-to-br from-blue-500 to-purple-600 border-blue-300 shadow-xl shadow-blue-500/30 scale-110 animate-pulse`;
      case 'visited':
        return `${baseStyles} bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 shadow-lg shadow-emerald-500/20`;
      case 'available':
        return `${baseStyles} bg-gradient-to-br from-blue-400 to-indigo-500 border-blue-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30`;
      default:
        return baseStyles;
    }
  };

  const filteredRegions = REGIONS.filter(region => {
    const matchesSearch = region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         region.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'unlocked' && isRegionUnlocked(region)) ||
                         (filterType === 'visited' && isRegionVisited(region.id)) ||
                         (filterType === 'locked' && !isRegionUnlocked(region));
    
    return matchesSearch && matchesFilter;
  });

  // Enhanced region positions with more dynamic layout
  const regionPositions = {
    humor_valley: { top: '65%', left: '15%' },
    emotion_forest: { top: '35%', left: '25%' },
    knowledge_peak: { top: '20%', left: '55%' },
    creativity_realm: { top: '40%', left: '75%' },
    debate_arena: { top: '70%', left: '65%' },
  };

  const getExplorationProgress = () => {
    const unlockedCount = REGIONS.filter(region => isRegionUnlocked(region)).length;
    const visitedCount = visitedRegions.length;
    return {
      unlocked: (unlockedCount / REGIONS.length) * 100,
      visited: (visitedCount / REGIONS.length) * 100
    };
  };

  const progress = getExplorationProgress();

  // Test function to manually check and fix level issues
  const testAndFixLevelIssues = async () => {
    if (!user) return;
    
    console.log('=== TESTING LEVEL ISSUES ===');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/fix-user-levels', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Debug API Response:', data);
      
      if (data.success && data.data.fixed) {
        console.log('Level was fixed! Refreshing user data...');
        // Force refresh user data
        window.location.reload();
      }
    } catch (error) {
      console.error('Debug test failed:', error);
    }
  };

  // Auto-test on mount if user level seems invalid
  useEffect(() => {
    if (user && (!user.level || user.level < 1)) {
      console.warn('Invalid user level detected, auto-testing fix...');
      testAndFixLevelIssues();
    }
  }, [user]);

  // Show loading state if auth is still loading
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Harita yükleniyor...</p>
          {!isAuthenticated && <p className="text-sm text-slate-500 mt-2">Kimlik doğrulanıyor...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <nav className="glass-card mx-4 mt-4 p-4 border border-white/20">
        <div className="flex items-center justify-between">
          <motion.button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-slate-600 hover:text-blue-600 transition-colors group"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:text-blue-600 transition-colors" />
            <span className="font-medium">Dashboard</span>
          </motion.button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-center">
              <Globe className="w-8 h-8 text-blue-500 mr-3" />
              Dünya Haritası
            </h1>
            <p className="text-sm text-slate-500 mt-1">Keşfet, İlerle, Hakim Ol</p>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={testAndFixLevelIssues}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                title="Debug: Test and fix level issues"
              >
                🔧 Debug Level
              </button>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-slate-800 font-semibold">{user?.username}</div>
            <div className="text-slate-500 text-sm flex items-center justify-end">
              <Crown className="w-4 h-4 mr-1 text-amber-500" />
              Seviye {user?.level || user?.calculatedLevel || 1}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Enhanced Map Area */}
          <div className="lg:col-span-3">
            {/* Map Controls */}
            <motion.div 
              className="glass-card p-4 mb-4 border border-white/20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Bölge ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-2 bg-white/70 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-white/70 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Bölgeler</option>
                    <option value="unlocked">Açılmış</option>
                    <option value="visited">Ziyaret Edilmiş</option>
                    <option value="locked">Kilitli</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setShowPaths(!showPaths)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showPaths 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/70 text-slate-600 hover:bg-blue-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Navigation className="w-4 h-4 mr-1 inline" />
                    Yollar
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setMapView(mapView === 'world' ? 'satellite' : 'world')}
                    className="px-3 py-2 bg-white/70 text-slate-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Layers className="w-4 h-4 mr-1 inline" />
                    {mapView === 'world' ? 'Uydu' : 'Dünya'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Main Map */}
            <motion.div 
              ref={mapRef}
              className="glass-card p-8 relative overflow-hidden border border-white/20"
              style={{ minHeight: '600px' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Dynamic Map Background */}
              <div 
                className={`absolute inset-4 rounded-xl transition-all duration-1000 ${
                  mapView === 'satellite' 
                    ? 'opacity-30' 
                    : 'opacity-20'
                }`}
                style={{
                  backgroundImage: mapView === 'satellite' 
                    ? `
                      linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 25%, rgba(245, 158, 11, 0.1) 50%, rgba(139, 92, 246, 0.1) 75%, rgba(239, 68, 68, 0.1) 100%),
                      radial-gradient(circle at 20% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 35% 40%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 60% 20%, rgba(245, 158, 11, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 75% 60%, rgba(239, 68, 68, 0.2) 0%, transparent 50%)
                    `
                    : `
                      radial-gradient(circle at 20% 70%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 35% 40%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 60% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 75% 60%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)
                    `,
                }}
              />

              {/* Animated Grid Overlay */}
              <div className="absolute inset-4 opacity-10">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" className="text-slate-300" />
                </svg>
              </div>

              {/* Connecting Paths */}
              {showPaths && (
                <svg className="absolute inset-4 w-full h-full" style={{ zIndex: 1 }}>
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
                      <stop offset="50%" stopColor="rgba(139, 92, 246, 0.6)" />
                      <stop offset="100%" stopColor="rgba(16, 185, 129, 0.6)" />
                    </linearGradient>
                    
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Enhanced Path Network */}
                  <motion.path 
                    d="M 15% 65% Q 20% 50% 25% 35%" 
                    stroke="url(#pathGradient)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="15,10"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                  <motion.path 
                    d="M 25% 35% Q 40% 25% 55% 20%" 
                    stroke="url(#pathGradient)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="15,10"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 1 }}
                  />
                  <motion.path 
                    d="M 55% 20% Q 65% 30% 75% 40%" 
                    stroke="url(#pathGradient)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="15,10"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 1.5 }}
                  />
                  <motion.path 
                    d="M 75% 40% Q 70% 55% 65% 70%" 
                    stroke="url(#pathGradient)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="15,10"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 2 }}
                  />
                  <motion.path 
                    d="M 65% 70% Q 40% 68% 15% 65%" 
                    stroke="url(#pathGradient)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="15,10"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 2.5 }}
                  />
                </svg>
              )}

              {/* Region Nodes */}
              {filteredRegions.map((region, index) => (
                <motion.div
                  key={region.id}
                  className={getRegionStyles(region)}
                  style={{
                    top: regionPositions[region.id]?.top || '50%',
                    left: regionPositions[region.id]?.left || '50%',
                    zIndex: region.id === currentRegion ? 15 : selectedRegion?.id === region.id ? 12 : 8,
                  }}
                  initial={{ opacity: 0, scale: 0, rotate: 180 }}
                  animate={{ 
                    opacity: 1, 
                    scale: selectedRegion?.id === region.id ? 1.15 : 1, 
                    rotate: 0 
                  }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 120 
                  }}
                  onClick={() => handleRegionClick(region)}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  whileHover={{ 
                    scale: isRegionUnlocked(region) ? 1.2 : 1,
                    rotate: isRegionUnlocked(region) ? 5 : 0
                  }}
                  whileTap={{ scale: isRegionUnlocked(region) ? 0.9 : 1 }}
                >
                  {!isRegionUnlocked(region) ? (
                    <Lock className="w-8 h-8 text-slate-500" />
                  ) : (
                    <span className="drop-shadow-lg">{region.icon}</span>
                  )}
                  
                  {/* Enhanced Status Indicators */}
                  {isRegionVisited(region.id) && region.id !== currentRegion && (
                    <motion.div 
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Star className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  
                  {region.id === currentRegion && (
                    <motion.div 
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Crown className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  {/* Level Requirement Badge */}
                  <motion.div
                    className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white/90 text-slate-700 text-xs font-bold px-2 py-1 rounded-full border border-slate-200 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Lv.{region.levelRequirement}
                  </motion.div>
                </motion.div>
              ))}

              {/* Enhanced Hover Tooltip */}
              <AnimatePresence>
                {hoveredRegion && (
                  <motion.div
                    className="absolute z-30 glass-card p-4 pointer-events-none border border-white/30 shadow-xl max-w-xs"
                    style={{
                      top: regionPositions[hoveredRegion.id]?.top || '50%',
                      left: regionPositions[hoveredRegion.id]?.left || '50%',
                      transform: 'translate(-50%, -130%)',
                    }}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${hoveredRegion.color} flex items-center justify-center text-xl mr-3`}>
                        {hoveredRegion.icon}
                      </div>
                      <div>
                        <h3 className="text-slate-800 font-bold text-lg">{hoveredRegion.name}</h3>
                        <p className="text-slate-500 text-xs">Seviye {hoveredRegion.levelRequirement} gerekli</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{hoveredRegion.description}</p>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center space-x-3">
                        {isRegionVisited(hoveredRegion.id) && (
                          <div className="flex items-center text-emerald-600">
                            <Star className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Ziyaret Edildi</span>
                          </div>
                        )}
                        
                        {hoveredRegion.id === currentRegion && (
                          <div className="flex items-center text-amber-600">
                            <Crown className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Mevcut Konum</span>
                          </div>
                        )}
                      </div>
                      
                      {!isRegionUnlocked(hoveredRegion) && (
                        <div className="flex items-center text-red-500">
                          <Lock className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Kilitli</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Particles Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [-20, -100],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: Math.random() * 3 + 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Enhanced Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Region Details Panel */}
            <motion.div 
              className="glass-card p-6 border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Bölge Detayları</h2>
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              
              <AnimatePresence mode="wait">
                {selectedRegion ? (
                  <motion.div
                    key={selectedRegion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedRegion.color} flex items-center justify-center text-4xl mb-4 mx-auto shadow-lg`}>
                      {selectedRegion.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
                      {selectedRegion.name}
                    </h3>
                    
                    <p className="text-slate-600 text-sm mb-6 text-center leading-relaxed">
                      {selectedRegion.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 text-slate-500 mr-2" />
                          <span className="text-slate-600 text-sm">Seviye Gereksinimi</span>
                        </div>
                        <span className="text-slate-800 font-semibold">{selectedRegion.levelRequirement}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <Activity className="w-4 h-4 text-slate-500 mr-2" />
                          <span className="text-slate-600 text-sm">Durum</span>
                        </div>
                        <span className={`font-semibold text-sm ${
                          getRegionStatus(selectedRegion) === 'current' ? 'text-amber-600' :
                          getRegionStatus(selectedRegion) === 'visited' ? 'text-emerald-600' :
                          getRegionStatus(selectedRegion) === 'available' ? 'text-blue-600' :
                          'text-red-500'
                        }`}>
                          {getRegionStatus(selectedRegion) === 'current' ? 'Mevcut Konum' :
                           getRegionStatus(selectedRegion) === 'visited' ? 'Ziyaret Edildi' :
                           getRegionStatus(selectedRegion) === 'available' ? 'Erişilebilir' :
                           'Kilitli'}
                        </span>
                      </div>
                    </div>
                    
                    {isRegionUnlocked(selectedRegion) && selectedRegion.id !== currentRegion && (
                      <motion.button 
                        onClick={handleEnterRegion}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Navigation className="w-5 h-5 inline mr-2" />
                        Bölgeye Git
                      </motion.button>
                    )}
                    
                    {selectedRegion.id === currentRegion && (
                      <motion.button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Crown className="w-5 h-5 inline mr-2" />
                        Dashboard&apos;a Dön
                      </motion.button>
                    )}
                    
                    {!isRegionUnlocked(selectedRegion) && (
                      <div className="text-center py-4">
                        <Lock className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-500 text-sm font-medium">
                          Bu bölgeye erişmek için seviye {selectedRegion.levelRequirement} olmanız gerekiyor
                        </p>
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-600 text-xs">
                            Mevcut seviye: {user?.level || 1} | Gereken: {selectedRegion.levelRequirement}
                          </p>
                          <p className="text-red-600 text-xs mt-1">
                            Kalan seviye: {Math.max(0, selectedRegion.levelRequirement - (user?.level || 1))}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">
                      Bir bölgeye tıklayın ve detaylarını keşfedin
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Progress Panel */}
            <motion.div 
              className="glass-card p-6 border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Keşif İlerlemesi</h3>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Ziyaret Edilen Bölgeler</span>
                    <span className="text-slate-800 font-semibold">{visitedRegions.length}/{REGIONS.length}</span>
                  </div>
                  
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.visited}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </div>
                  
                  <div className="text-center mt-2">
                    <span className="text-emerald-600 font-semibold text-sm">
                      {Math.round(progress.visited)}% Tamamlandı
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Açılmış Bölgeler</span>
                    <span className="text-slate-800 font-semibold">
                      {REGIONS.filter(r => isRegionUnlocked(r)).length}/{REGIONS.length}
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.unlocked}%` }}
                      transition={{ duration: 1, delay: 1 }}
                    />
                  </div>
                  
                  <div className="text-center mt-2">
                    <span className="text-blue-600 font-semibold text-sm">
                      {Math.round(progress.unlocked)}% Erişilebilir
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              className="glass-card p-6 border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Award className="w-5 h-5 text-amber-500 mr-2" />
                Hızlı İstatistikler
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{user?.level || user?.calculatedLevel || 1}</div>
                  <div className="text-xs text-blue-500 font-medium">Seviyeniz</div>
                </div>
                
                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-600">{visitedRegions.length}</div>
                  <div className="text-xs text-emerald-500 font-medium">Keşfedilen</div>
                </div>
                
                <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-2xl font-bold text-amber-600">
                    {REGIONS.filter(r => isRegionUnlocked(r)).length}
                  </div>
                  <div className="text-xs text-amber-500 font-medium">Erişilebilir</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">
                    {REGIONS.length - REGIONS.filter(r => isRegionUnlocked(r)).length}
                  </div>
                  <div className="text-xs text-purple-500 font-medium">Kilitli</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}