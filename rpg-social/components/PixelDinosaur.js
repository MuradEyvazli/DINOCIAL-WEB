'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PixelDinosaur() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
  const [direction, setDirection] = useState('right');
  const [runFrame, setRunFrame] = useState(0);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const dinosaurRef = useRef(null);
  const velocity = useRef({ x: 0, y: 0 });
  const animationId = useRef(null);
  const dragHistory = useRef([]);
  const lastDragTime = useRef(Date.now());
  const isDraggingg = useRef(false);

  // Angry messages for speech bubble
  const angryMessages = [
    "Bana dokunma! 😤",
    "Beni rahat bırak! 😠",
    "Herkes beni fırlatıyor! 😡",
    "Yeter artık! 😤",
    "Dinozor değil oyuncak değilim! 😠",
    "Sakin sakin koşuyordum... 😒",
    "Niye sürekli rahatsız ediyorsun? 😑",
    "Biraz huzur istiyorum! 😤"
  ];

  // Running animation
  useEffect(() => {
    if (!isDragging && !isFalling) {
      const interval = setInterval(() => {
        setRunFrame(prev => (prev + 1) % 2);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isDragging, isFalling]);

  // Normal running movement
  useEffect(() => {
    if (!isDragging && !isFalling) {
      const moveInterval = setInterval(() => {
        setPosition(prev => {
          const speed = 3;
          const screenWidth = window.innerWidth;
          let newX = prev.x;
          
          if (direction === 'right') {
            newX += speed;
            if (newX >= screenWidth - 80) {
              setDirection('left');
              return { x: screenWidth - 80, y: 0 };
            }
          } else {
            newX -= speed;
            if (newX <= 0) {
              setDirection('right');
              return { x: 0, y: 0 };
            }
          }
          
          return { x: newX, y: 0 };
        });
      }, 16); // 60 FPS

      return () => clearInterval(moveInterval);
    }
  }, [isDragging, isFalling, direction]);

  // Physics animation when thrown
  useEffect(() => {
    if (isFalling && !isDragging) {
      const gravity = 0.6;
      const bounce = 0.4;
      const friction = 0.96;
      
      const animate = () => {
        setPosition(prev => {
          // Apply gravity to velocity
          velocity.current.y += gravity;
          
          // Apply friction to horizontal movement
          velocity.current.x *= friction;
          
          // Update position
          let newX = prev.x + velocity.current.x;
          let newY = prev.y - velocity.current.y;
          
          // Update direction based on horizontal movement
          if (velocity.current.x > 0.5) {
            setDirection('right');
          } else if (velocity.current.x < -0.5) {
            setDirection('left');
          }
          
          // Screen boundaries
          const screenWidth = window.innerWidth;
          
          // Keep within horizontal bounds
          if (newX < 0) {
            newX = 0;
            velocity.current.x = Math.abs(velocity.current.x) * bounce;
          } else if (newX > screenWidth - 80) {
            newX = screenWidth - 80;
            velocity.current.x = -Math.abs(velocity.current.x) * bounce;
          }
          
          // Ground collision
          if (newY <= 0) {
            newY = 0;
            
            // Check if should stop bouncing
            if (Math.abs(velocity.current.y) < 2 && Math.abs(velocity.current.x) < 0.5) {
              // Stop falling and land on feet
              setIsFalling(false);
              velocity.current = { x: 0, y: 0 };
              
              // Determine direction based on position
              setDirection(newX > screenWidth / 2 ? 'left' : 'right');
              
              return { x: newX, y: 0 };
            } else {
              // Bounce but reduce rotation
              velocity.current.y = -velocity.current.y * bounce;
            }
          }
          
          return { x: newX, y: newY };
        });
        
        if (isFalling) {
          animationId.current = requestAnimationFrame(animate);
        }
      };
      
      animationId.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationId.current) {
          cancelAnimationFrame(animationId.current);
        }
      };
    }
  }, [isFalling, isDragging]);

  const handleMouseDown = (e) => {
    isDraggingg.current = true;
    
    // Small delay to detect if it's a click or drag
    setTimeout(() => {
      if (!isDraggingg.current) {
        // It was just a click, show speech bubble
        const randomMessage = angryMessages[Math.floor(Math.random() * angryMessages.length)];
        setSpeechMessage(randomMessage);
        setShowSpeechBubble(true);
        
        // Hide speech bubble after 3 seconds
        setTimeout(() => {
          setShowSpeechBubble(false);
        }, 3000);
        return;
      }
      
      // It's a drag, start dragging
      setIsDragging(true);
      setIsFalling(false);
      
      // Reset drag history
      dragHistory.current = [];
      lastDragTime.current = Date.now();
      
      // Cancel any ongoing animation
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    }, 150); // 150ms delay to distinguish click from drag
    
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      isDraggingg.current = true; // Definitely dragging now
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastDragTime.current;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - 40));
      const newY = Math.max(0, window.innerHeight - e.clientY - 100);
      
      // Store drag history for velocity calculation
      if (deltaTime > 16) {
        if (dragHistory.current.length > 0) {
          const lastPos = dragHistory.current[dragHistory.current.length - 1];
          const velocityX = (newX - lastPos.x) / deltaTime * 16;
          
          // Update direction while dragging
          if (velocityX > 1) {
            setDirection('right');
          } else if (velocityX < -1) {
            setDirection('left');
          }
        }
        
        dragHistory.current.push({ x: newX, y: newY, time: currentTime });
        
        // Keep only last 5 positions
        if (dragHistory.current.length > 5) {
          dragHistory.current.shift();
        }
        
        lastDragTime.current = currentTime;
      }
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      
      // Calculate throw velocity from drag history
      if (dragHistory.current.length >= 2) {
        const recent = dragHistory.current[dragHistory.current.length - 1];
        const previous = dragHistory.current[Math.max(0, dragHistory.current.length - 3)];
        const deltaTime = recent.time - previous.time;
        
        if (deltaTime > 0) {
          const vx = (recent.x - previous.x) / deltaTime * 20;
          const vy = (recent.y - previous.y) / deltaTime * 20;
          
          velocity.current = {
            x: Math.max(-25, Math.min(25, vx)),
            y: Math.max(-25, Math.min(25, -vy))
          };
          
          if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5 || position.y > 0) {
            setIsFalling(true);
          } else if (position.y === 0) {
            setDirection(position.x > window.innerWidth / 2 ? 'left' : 'right');
          }
        } else {
          if (position.y > 0) {
            velocity.current = { x: 0, y: 0 };
            setIsFalling(true);
          } else {
            setDirection(position.x > window.innerWidth / 2 ? 'left' : 'right');
          }
        }
      } else {
        if (position.y > 0) {
          velocity.current = { x: 0, y: 0 };
          setIsFalling(true);
        } else {
          setDirection(position.x > window.innerWidth / 2 ? 'left' : 'right');
        }
      }
    }
    
    // Reset drag flag after a delay
    setTimeout(() => {
      isDraggingg.current = false;
    }, 200);
  };

  // Touch events
  const handleTouchStart = (e) => {
    isDraggingg.current = true;
    
    setTimeout(() => {
      if (!isDraggingg.current) {
        const randomMessage = angryMessages[Math.floor(Math.random() * angryMessages.length)];
        setSpeechMessage(randomMessage);
        setShowSpeechBubble(true);
        
        setTimeout(() => {
          setShowSpeechBubble(false);
        }, 3000);
        return;
      }
      
      setIsDragging(true);
      setIsFalling(false);
      
      dragHistory.current = [];
      lastDragTime.current = Date.now();
      
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    }, 150);
    
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches[0]) {
      isDraggingg.current = true;
      
      const touch = e.touches[0];
      const currentTime = Date.now();
      const deltaTime = currentTime - lastDragTime.current;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 80, touch.clientX - 40));
      const newY = Math.max(0, window.innerHeight - touch.clientY - 100);
      
      if (deltaTime > 16) {
        if (dragHistory.current.length > 0) {
          const lastPos = dragHistory.current[dragHistory.current.length - 1];
          const velocityX = (newX - lastPos.x) / deltaTime * 16;
          
          if (velocityX > 1) {
            setDirection('right');
          } else if (velocityX < -1) {
            setDirection('left');
          }
        }
        
        dragHistory.current.push({ x: newX, y: newY, time: currentTime });
        
        if (dragHistory.current.length > 5) {
          dragHistory.current.shift();
        }
        
        lastDragTime.current = currentTime;
      }
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      
      if (dragHistory.current.length >= 2) {
        const recent = dragHistory.current[dragHistory.current.length - 1];
        const previous = dragHistory.current[Math.max(0, dragHistory.current.length - 3)];
        const deltaTime = recent.time - previous.time;
        
        if (deltaTime > 0) {
          const vx = (recent.x - previous.x) / deltaTime * 20;
          const vy = (recent.y - previous.y) / deltaTime * 20;
          
          velocity.current = {
            x: Math.max(-25, Math.min(25, vx)),
            y: Math.max(-25, Math.min(25, -vy))
          };
          
          if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5 || position.y > 0) {
            setIsFalling(true);
          } else if (position.y === 0) {
            setDirection(position.x > window.innerWidth / 2 ? 'left' : 'right');
          }
        } else {
          if (position.y > 0) {
            velocity.current = { x: 0, y: 0 };
            setIsFalling(true);
          } else {
            setDirection(position.x > window.innerWidth / 2 ? 'left' : 'right');
          }
        }
      } else {
        if (position.y > 0) {
          velocity.current = { x: 0, y: 0 };
          setIsFalling(true);
        } else {
          setDirection(position.x > window.innerWidth / 2 ? 'left' : 'right');
        }
      }
    }
    
    setTimeout(() => {
      isDraggingg.current = false;
    }, 200);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div 
      className="fixed left-0 right-0 h-20 pointer-events-none"
      style={{ 
        bottom: '80px',
        zIndex: 50 
      }}
    >
      <motion.div
        ref={dinosaurRef}
        className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} pointer-events-auto`}
        style={{
          left: `${position.x}px`,
          bottom: `${position.y}px`,
          transform: `scaleX(${direction === 'right' ? -1 : 1})`,
        }}
        animate={{
          // Only rotate slightly during falling, not full 360
          rotate: isFalling && Math.abs(velocity.current.x) > 8 ? [0, 15, -15, 0] : 0,
        }}
        transition={{
          rotate: {
            duration: 0.4,
            repeat: isFalling ? Infinity : 0,
            ease: "easeInOut"
          }
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Speech Bubble - Large Cloud Style */}
        <AnimatePresence>
          {showSpeechBubble && (
            <motion.div
              className="absolute -top-24 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 20 }}
              transition={{ 
                duration: 0.5, 
                ease: "backOut",
                scale: { type: "spring", damping: 15, stiffness: 300 }
              }}
            >
              <div className="relative">
                {/* Cloud-like bubble */}
                <div className="relative bg-white border-3 border-gray-400 rounded-2xl px-6 py-4 shadow-2xl min-w-[200px] max-w-[300px]">
                  {/* Cloud bumps for more realistic cloud look */}
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-3 border-gray-400 rounded-full"></div>
                  <div className="absolute -top-1 left-8 w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-3 border-gray-400 rounded-full"></div>
                  <div className="absolute -left-2 top-2 w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
                  <div className="absolute -right-2 top-3 w-4 h-4 bg-white border-3 border-gray-400 rounded-full"></div>
                  
                  <p className="text-sm font-bold text-gray-800 text-center leading-relaxed">
                    {speechMessage}
                  </p>
                  
                  {/* Large speech bubble tail */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-8 border-l-transparent border-r-transparent border-t-gray-400"></div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 translate-y-[-3px] w-0 h-0 border-l-5 border-r-5 border-t-6 border-l-transparent border-r-transparent border-t-white"></div>
                </div>
                
                {/* Floating animation for cloud effect */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ 
                    y: [0, -2, 0, 2, 0],
                    rotate: [0, 0.5, 0, -0.5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pixel Dinosaur - Facing LEFT by default */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          className="select-none"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Main Body */}
          <rect x="7" y="10" width="12" height="7" fill="#000000" />
          
          {/* Head - LEFT facing */}
          <rect x="2" y="7" width="7" height="6" fill="#000000" />
          <rect x="1" y="8" width="3" height="4" fill="#000000" />
          
          {/* Eye - LEFT facing */}
          <rect x="4" y="9" width="2" height="2" fill="#FFFFFF" />
          {(isFalling || showSpeechBubble) && <rect x="4" y="9" width="1" height="1" fill="#FF0000" />}
          
          {/* Tail - RIGHT side */}
          <rect x="18" y="11" width="5" height="5" fill="#000000" />
          <rect x="22" y="12" width="2" height="3" fill="#000000" />
          
          {/* Back spikes */}
          <rect x="9" y="9" width="2" height="1" fill="#000000" />
          <rect x="12" y="9" width="2" height="1" fill="#000000" />
          <rect x="15" y="9" width="2" height="1" fill="#000000" />
          
          {/* Arms */}
          {isFalling ? (
            // Arms up when falling
            <>
              <rect x="6" y="11" width="2" height="3" fill="#000000" />
              <rect x="6" y="10" width="2" height="2" fill="#000000" />
              <rect x="14" y="11" width="2" height="3" fill="#000000" />
              <rect x="16" y="10" width="2" height="2" fill="#000000" />
            </>
          ) : (
            // Normal arms
            <>
              <rect x="8" y="13" width="2" height="2" fill="#000000" />
              <rect x="14" y="13" width="2" height="2" fill="#000000" />
            </>
          )}
          
          {/* Legs - walking animation */}
          {!isFalling && runFrame === 0 ? (
            <>
              {/* Left leg forward, right leg back */}
              <rect x="9" y="17" width="3" height="4" fill="#000000" />
              <rect x="13" y="17" width="3" height="4" fill="#000000" />
            </>
          ) : !isFalling && runFrame === 1 ? (
            <>
              {/* Right leg forward, left leg back */}
              <rect x="7" y="17" width="3" height="4" fill="#000000" />
              <rect x="15" y="17" width="3" height="4" fill="#000000" />
            </>
          ) : (
            // Legs during falling - normal standing position
            <>
              <rect x="9" y="17" width="3" height="4" fill="#000000" />
              <rect x="13" y="17" width="3" height="4" fill="#000000" />
            </>
          )}
        </svg>
        
        {/* Shadow - Fixed positioning */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 bg-black/20 rounded-full"
          style={{ 
            width: '60px',
            height: '8px',
            filter: 'blur(4px)',
            bottom: position.y > 0 ? `-${position.y * 0.1 + 8}px` : '-8px'
          }}
          animate={{
            opacity: position.y > 100 ? 0.05 : 0.2,
            scale: position.y > 0 ? Math.max(0.3, 1 - position.y * 0.01) : 1
          }}
        />
      </motion.div>
      
      {/* Instructions */}
      {!isDragging && !isFalling && !showSpeechBubble && (
        <motion.div 
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Dinozoru sürükleyip fırlat veya tıkla! 🦕
        </motion.div>
      )}
    </div>
  );
}