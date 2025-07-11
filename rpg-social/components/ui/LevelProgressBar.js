'use client';

import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

export default function LevelProgressBar({ 
  currentLevel = 1, 
  currentXP = 0, 
  showDetails = true, 
  size = 'medium',
  className = '' 
}) {
  const { userProgression, loading } = useSelector(state => state.levels);

  // Use Redux state if available, fallback to props
  const level = userProgression?.currentLevel?.level || currentLevel;
  const xp = userProgression?.progressPercentage || 0;
  const nextLevel = userProgression?.nextLevel;
  const isMaxLevel = userProgression?.isMaxLevel || level >= 100;

  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const getTierColor = (level) => {
    if (level <= 10) return '#64748b'; // slate-500
    if (level <= 20) return '#06b6d4'; // cyan-500
    if (level <= 30) return '#10b981'; // emerald-500
    if (level <= 40) return '#3b82f6'; // blue-500
    if (level <= 50) return '#8b5cf6'; // violet-500
    if (level <= 60) return '#f59e0b'; // amber-500
    if (level <= 70) return '#ef4444'; // red-500
    if (level <= 80) return '#ec4899'; // pink-500
    if (level <= 90) return '#7c3aed'; // violet-600
    return '#dc2626'; // red-600
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

  const tierColor = getTierColor(level);
  const tierName = getTierName(level);

  return (
    <div className={`w-full ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span 
              className={`inline-flex items-center px-2 py-1 rounded-full text-white font-medium shadow-sm ${textSizeClasses[size]}`}
              style={{ background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)` }}
            >
              Seviye {level}
            </span>
            <span className={`text-slate-600 font-medium ${textSizeClasses[size]}`}>
              {tierName}
            </span>
          </div>
          
          {!isMaxLevel && (
            <span className={`text-slate-500 ${textSizeClasses[size]}`}>
              {Math.round(xp)}% → Seviye {level + 1}
            </span>
          )}
          
          {isMaxLevel && (
            <span className={`text-yellow-600 font-semibold ${textSizeClasses[size]}`}>
              MAX LEVEL
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-white/50 rounded-full overflow-hidden shadow-inner ${sizeClasses[size]}`}>
        <motion.div
          className="h-full rounded-full shadow-sm"
          style={{ background: `linear-gradient(90deg, ${tierColor} 0%, ${tierColor}cc 100%)` }}
          initial={{ width: 0 }}
          animate={{ width: isMaxLevel ? '100%' : `${xp}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      
      {showDetails && !isMaxLevel && userProgression && (
        <div className={`flex justify-between mt-1 ${textSizeClasses[size]} text-slate-500`}>
          <span className="font-medium">{userProgression.xpInCurrentLevel || 0} XP</span>
          <span>{userProgression.xpNeededForNext || 0} XP kaldı</span>
        </div>
      )}
    </div>
  );
}