// components/DevTools.js
'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, 
  Bell, 
  Users, 
  Trophy, 
  MessageCircle, 
  X,
  ChevronRight,
  Play
} from 'lucide-react';
import { 
  simulateFriendRequest,
  simulateNewMessage,
  simulateQuestCompleted,
  simulateAchievementUnlocked,
  simulateRandomNotification
} from '@/lib/utils/notificationSimulator';

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const devActions = [
    {
      name: 'Arkadaşlık İsteği',
      description: 'Sahte arkadaşlık isteği gönder',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      action: simulateFriendRequest
    },
    {
      name: 'Yeni Mesaj',
      description: 'Sahte mesaj bildirimi gönder',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      action: simulateNewMessage
    },
    {
      name: 'Görev Tamamlandı',
      description: 'Sahte görev tamamlama bildirimi',
      icon: Trophy,
      color: 'from-amber-500 to-amber-600',
      action: simulateQuestCompleted
    },
    {
      name: 'Başarım Açıldı',
      description: 'Sahte başarım bildirimi gönder',
      icon: Trophy,
      color: 'from-purple-500 to-purple-600',
      action: simulateAchievementUnlocked
    },
    {
      name: 'Rastgele Bildirim',
      description: 'Rastgele bir bildirim türü gönder',
      icon: Bell,
      color: 'from-pink-500 to-pink-600',
      action: simulateRandomNotification
    }
  ];

  const handleAction = (action) => {
    action();
    // Add visual feedback
    const button = document.activeElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Developer Tools"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="bug"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bug className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dev Tools Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-600/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Bug className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Developer Tools</h3>
                  <p className="text-red-300 text-xs">Test Notification System</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {devActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    key={action.name}
                    onClick={() => handleAction(action.action)}
                    className={`w-full flex items-center space-x-3 p-3 bg-gradient-to-r ${action.color} hover:shadow-lg text-white rounded-lg transition-all duration-300 group`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">{action.name}</h4>
                      <p className="text-xs text-white/80">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-red-500/20 bg-slate-800/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Development Mode</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}