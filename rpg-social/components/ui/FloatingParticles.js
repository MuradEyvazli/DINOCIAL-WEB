// components/ui/FloatingParticles.js
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FloatingParticles({ count = 20 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Client-side'da premium parçacıkları oluştur
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2, // 2-6px arası
      duration: Math.random() * 8 + 6, // 6-14 saniye arası
      delay: Math.random() * 4,
      opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5 arası
      color: i % 4, // 4 farklı renk
      blur: Math.random() * 2 + 1 // 1-3px blur
    }));
    setParticles(newParticles);
  }, [count]);

  if (particles.length === 0) {
    return null; // İlk render'da hiçbir şey gösterme
  }

  const getParticleColor = (colorIndex) => {
    const colors = [
      'rgba(99, 102, 241, 0.6)',   // Indigo
      'rgba(16, 185, 129, 0.5)',   // Emerald  
      'rgba(139, 92, 246, 0.4)',   // Purple
      'rgba(245, 158, 11, 0.3)'    // Amber
    ];
    return colors[colorIndex];
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          initial={{ 
            opacity: 0,
            scale: 0
          }}
          animate={{
            y: [0, -120, 0],
            x: [0, Math.sin(particle.id) * 80, 0],
            opacity: [0, particle.opacity, 0],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 360]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: getParticleColor(particle.color),
            filter: `blur(${particle.blur}px)`,
            boxShadow: `0 0 ${particle.size * 2}px ${getParticleColor(particle.color)}`
          }}
        />
      ))}
      
      {/* Premium glow effects */}
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={`glow-${i}`}
          className="absolute rounded-full"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
            scale: [0.5, 2, 0.5],
            x: [0, 200, -100, 0],
            y: [0, -150, 100, 0]
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            delay: i * 3,
            ease: "easeInOut"
          }}
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + i * 20}%`,
            width: `${60 + i * 20}px`,
            height: `${60 + i * 20}px`,
            background: `radial-gradient(circle, ${getParticleColor(i)} 0%, transparent 70%)`,
            filter: 'blur(20px)'
          }}
        />
      ))}
    </div>
  );
}