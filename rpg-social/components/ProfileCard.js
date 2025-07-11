'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ProfileModal from './ProfileModal';

export default function ProfileCard({ 
  user, 
  currentUser, 
  size = 'md', 
  showLevel = true,
  showUsername = true,
  className = '',
  onClick = null // Custom onClick handler
}) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // Size configurations
  const sizeConfig = {
    xs: {
      avatar: 'w-6 h-6',
      text: 'text-xs',
      level: 'text-xs px-1.5 py-0.5',
      icon: 'text-sm'
    },
    sm: {
      avatar: 'w-8 h-8',
      text: 'text-sm',
      level: 'text-xs px-2 py-1',
      icon: 'text-base'
    },
    md: {
      avatar: 'w-12 h-12',
      text: 'text-base',
      level: 'text-xs px-2 py-1',
      icon: 'text-xl'
    },
    lg: {
      avatar: 'w-16 h-16',
      text: 'text-lg',
      level: 'text-sm px-3 py-1',
      icon: 'text-2xl'
    },
    xl: {
      avatar: 'w-24 h-24',
      text: 'text-xl',
      level: 'text-base px-3 py-1',
      icon: 'text-4xl'
    }
  };

  const config = sizeConfig[size];

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(user);
    } else {
      // Default behavior: show modal for preview
      setShowModal(true);
    }
  };

  const handleAvatarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  const handleUsernameClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/user/${user._id || user.id}`);
  };

  if (!user) return null;

  return (
    <>
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Clickable Avatar */}
        <motion.div 
          className="relative cursor-pointer group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAvatarClick}
        >
          <div className={`${config.avatar} rounded-full bg-gradient-to-r ${user.characterClass?.color || 'from-blue-400 to-blue-600'} flex items-center justify-center border-2 border-white/20 overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300`}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={`${user.username} profil fotoğrafı`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`${config.icon} drop-shadow-sm`}>
                {user.characterClass?.icon || '👤'}
              </span>
            )}
          </div>
          
          {/* Level Badge */}
          {showLevel && (
            <div className={`absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full ${config.level} font-bold shadow-lg border-2 border-white flex items-center justify-center`}>
              {user.level || 1}
            </div>
          )}
          
          {/* Hover Effect */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </motion.div>

        {/* User Info */}
        {showUsername && (
          <div className="flex-1 min-w-0">
            <motion.button
              className={`${config.text} font-medium text-slate-800 hover:text-blue-600 transition-colors duration-200 truncate block text-left`}
              whileHover={{ scale: 1.02 }}
              onClick={handleUsernameClick}
            >
              {user.username}
            </motion.button>
            
            {user.characterClass?.name && (
              <p className={`${config.text === 'text-xs' ? 'text-xs' : 'text-sm'} text-slate-500 truncate`}>
                {user.characterClass.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={user._id || user.id}
        profileData={user}
        currentUser={currentUser}
      />
    </>
  );
}

// Utility component for just the clickable avatar
export function ClickableAvatar({ 
  user, 
  currentUser, 
  size = 'md', 
  showLevel = true,
  onClick = null,
  className = ''
}) {
  return (
    <ProfileCard
      user={user}
      currentUser={currentUser}
      size={size}
      showLevel={showLevel}
      showUsername={false}
      onClick={onClick}
      className={className}
    />
  );
}

// Utility component for username only
export function ClickableUsername({ 
  user, 
  currentUser, 
  size = 'md',
  onClick = null,
  className = ''
}) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const sizeConfig = {
    xs: 'text-xs',
    sm: 'text-sm', 
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(user);
    } else {
      router.push(`/user/${user._id || user.id}`);
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <div className={`group ${className}`}>
        <motion.button
          className={`${sizeConfig[size]} font-medium text-slate-800 hover:text-blue-600 transition-colors duration-200`}
          whileHover={{ scale: 1.02 }}
          onClick={handleClick}
          onContextMenu={handlePreview} // Right-click for preview
        >
          {user.username}
        </motion.button>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={user._id || user.id}
        profileData={user}
        currentUser={currentUser}
      />
    </>
  );
}