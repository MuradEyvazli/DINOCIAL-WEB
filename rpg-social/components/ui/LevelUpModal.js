'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { setShowLevelUpModal } from '@/lib/redux/slices/levelsSlice';
import { X, Sparkles, Trophy, Star } from 'lucide-react';

export default function LevelUpModal() {
  const dispatch = useDispatch();
  const { showLevelUpModal, lastLevelUp } = useSelector(state => state.levels);

  if (!showLevelUpModal || !lastLevelUp) return null;

  const {
    oldLevel,
    newLevel,
    newXP,
    progression,
    unlockedRewards = [],
    levelData
  } = lastLevelUp;

  const getTierColor = (level) => {
    if (level <= 10) return '#64748b';
    if (level <= 20) return '#06b6d4';
    if (level <= 30) return '#10b981';
    if (level <= 40) return '#3b82f6';
    if (level <= 50) return '#8b5cf6';
    if (level <= 60) return '#f59e0b';
    if (level <= 70) return '#ef4444';
    if (level <= 80) return '#ec4899';
    if (level <= 90) return '#7c3aed';
    return '#dc2626';
  };

  const getTierName = (level) => {
    if (level <= 10) return 'Beginner';
    if (level <= 20) return 'Novice';
    if (level <= 30) return 'Apprentice';
    if (level <= 40) return 'Adept';
    if (level <= 50) return 'Expert';
    if (level <= 60) return 'Master';
    if (level <= 70) return 'Grandmaster';
    if (level <= 80) return 'Legend';
    if (level <= 90) return 'Mythic';
    return 'Divine';
  };

  const getTierIcon = (level) => {
    if (level <= 10) return '🌱';
    if (level <= 20) return '🌿';
    if (level <= 30) return '🌸';
    if (level <= 40) return '🌟';
    if (level <= 50) return '💎';
    if (level <= 60) return '👑';
    if (level <= 70) return '⚔️';
    if (level <= 80) return '🏆';
    if (level <= 90) return '🔮';
    return '☀️';
  };

  const tierColor = getTierColor(newLevel);
  const tierName = getTierName(newLevel);
  const tierIcon = getTierIcon(newLevel);

  const handleClose = () => {
    dispatch(setShowLevelUpModal(false));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass-card max-w-md w-full mx-4 overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="relative p-8 text-white text-center"
            style={{ background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)` }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 15 }}
              className="text-6xl mb-4"
            >
              {tierIcon}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2"
            >
              Seviye Atladı!
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4"
            >
              <span className="text-lg opacity-80">Seviye {oldLevel}</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <span className="text-2xl font-bold">Seviye {newLevel}</span>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/90 mt-2"
            >
              {tierName} seviyesine ulaştınız!
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Level Quote */}
            {levelData?.quote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-50 rounded-lg p-4 mb-6"
              >
                <p className="text-gray-700 italic text-center">
                  "{levelData.quote}"
                </p>
              </motion.div>
            )}

            {/* Unlocked Rewards */}
            {unlockedRewards && unlockedRewards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Yeni Ödüller
                </h3>
                
                <div className="space-y-2">
                  {unlockedRewards.map((reward, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {reward.type === 'feature' && <Star className="w-5 h-5 text-yellow-600" />}
                        {reward.type === 'badge' && <span className="text-lg">{reward.icon || '🏆'}</span>}
                        {reward.type === 'ability' && <span className="text-lg">{reward.icon || '⚡'}</span>}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {reward.name || reward}
                        </p>
                        {reward.description && (
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Devam Et
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}