// app/messages/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  Send, 
  Plus, 
  Users, 
  Loader,
  ArrowLeft,
  MoreVertical,
  Smile,
  Paperclip,
  Image,
  Phone,
  Video,
  Info,
  X,
  CheckCheck,
  Check,
  Circle,
  Trash2,
  UserX,
  Sparkles,
  Heart,
  Star,
  Coffee,
  ChevronRight,
  AlertTriangle,
  Trash,
  Shield
} from 'lucide-react';
import {
  initializeSocket,
  disconnectSocket,
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation,
  searchUsers,
  setActiveConversation,
  joinConversation,
  leaveConversation,
  startTyping,
  stopTyping,
  clearSearchResults,
  deleteMessage
} from '@/lib/redux/slices/messagesSlice';

export default function MessagesPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const {
    isSocketConnected,
    conversations,
    conversationsLoading,
    messages,
    messagesLoading,
    activeConversationId,
    typing,
    searchResults,
    searchLoading,
    unreadCount
  } = useSelector((state) => state.messages);

  const [messageText, setMessageText] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize socket and fetch conversations
  useEffect(() => {
    if (isAuthenticated && token) {
      dispatch(initializeSocket(token));
      dispatch(fetchConversations({}));
      
      // Check for conversation parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const conversationId = urlParams.get('c');
      if (conversationId) {
        dispatch(setActiveConversation(conversationId));
      }
    }

    return () => {
      dispatch(disconnectSocket());
    };
  }, [dispatch, isAuthenticated, token]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchMessages({ conversationId: activeConversationId }));
      joinConversation(activeConversationId);
      
      return () => {
        leaveConversation(activeConversationId);
      };
    }
  }, [dispatch, activeConversationId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  // Search users with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        dispatch(searchUsers({ query: searchQuery }));
      } else {
        dispatch(clearSearchResults());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [dispatch, searchQuery]);

  // Handle typing indicator
  const handleTyping = () => {
    if (activeConversationId) {
      startTyping(activeConversationId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeConversationId);
      }, 1000);
    }
  };

  // Upload files to server
  const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      console.log('Uploading to /api/messages/upload...');
      
      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.success) {
        return result.data.files;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  // Handle file selection - Simplified
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // For now, just store files locally without uploading
    // We'll upload them when sending the message
    setSelectedFiles(prev => [...prev, ...files]);
    event.target.value = '';
  };

  // Handle image selection - Simplified
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    
    // For now, just store files locally without uploading
    setSelectedFiles(prev => [...prev, ...imageFiles]);
    event.target.value = '';
  };

  // Remove selected file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📄';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📆';
    if (fileType.includes('text')) return '📝';
    return '📄';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() && selectedFiles.length === 0) return;
    if (!activeConversationId) return;
    
    const content = messageText.trim();
    setMessageText('');
    setSelectedFiles([]);
    
    // Stop typing indicator
    if (activeConversationId) {
      stopTyping(activeConversationId);
    }
    
    try {
      let uploadedFiles = [];
      
      // Upload files first if any
      if (selectedFiles.length > 0) {
        console.log('Uploading files before sending message...');
        uploadedFiles = await uploadFiles(selectedFiles);
        console.log('Files uploaded successfully:', uploadedFiles);
      }
      
      const messageData = {
        conversationId: activeConversationId,
        content: content,
        type: uploadedFiles.length > 0 ? 'file' : 'text',
        files: uploadedFiles
      };
      
      console.log('Sending message with data:', messageData);
      await dispatch(sendMessage(messageData));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(content); // Restore message on error
      setSelectedFiles(selectedFiles); // Restore files on error
      alert('Mesaj gönderme hatası: ' + error.message);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const confirmDeleteMessage = async (deleteType) => {
    if (!messageToDelete) return;

    try {
      await dispatch(deleteMessage({
        messageId: messageToDelete.id || messageToDelete._id,
        deleteType
      }));
      
      // Show success notification
      const successMsg = deleteType === 'everyone' 
        ? 'Mesaj herkes için silindi' 
        : 'Mesaj sizin için silindi';
      setDeleteSuccessMessage(successMsg);
      setShowDeleteSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 3000);
      
      setShowDeleteModal(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      // Show error notification
      setDeleteSuccessMessage('Mesaj silinirken hata oluştu');
      setShowDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 3000);
    }
  };

  const canDeleteForEveryone = (message) => {
    if (!message.createdAt) return false;
    const messageTime = new Date(message.createdAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return messageTime > fiveMinutesAgo;
  };

  // Clear all chat messages
  const handleClearChat = () => {
    setShowClearChatModal(true);
  };

  const confirmClearChat = async (clearType) => {
    if (!activeConversationId) return;
    
    setIsClearingChat(true);
    try {
      const response = await fetch(`/api/messages/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeConversationId,
          clearType: clearType // 'self' or 'everyone'
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Refresh messages after clearing
        dispatch(fetchMessages({ conversationId: activeConversationId, page: 1 }));
        
        const successMsg = clearType === 'everyone' 
          ? 'Tüm sohbet herkes için temizlendi' 
          : 'Sohbet sizin için temizlendi';
        setDeleteSuccessMessage(successMsg);
        setShowDeleteSuccess(true);
        
        setTimeout(() => {
          setShowDeleteSuccess(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to clear chat');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      setDeleteSuccessMessage('Sohbet temizlenirken hata oluştu');
      setShowDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 3000);
    } finally {
      setIsClearingChat(false);
      setShowClearChatModal(false);
    }
  };

  // Start conversation with user
  const handleStartConversation = async (userId) => {
    try {
      const result = await dispatch(createConversation({
        participantId: userId,
        type: 'direct'
      }));
      
      if (result.payload) {
        dispatch(setActiveConversation(result.payload.id || result.payload._id));
        setShowUserSearch(false);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Select conversation
  const selectConversation = (conversationId) => {
    dispatch(setActiveConversation(conversationId));
    if (isMobile) {
      // On mobile, we'll show just the chat view
    }
  };

  // Get current conversation
  const activeConversation = conversations.find(c => 
    (c.id || c._id) === activeConversationId
  );

  // Get current messages
  const currentMessages = activeConversationId ? 
    (messages[activeConversationId] || []) : [];

  // Get typing users for current conversation
  const typingUsers = activeConversationId && typing[activeConversationId] ? 
    Object.values(typing[activeConversationId]).filter(t => t.isTyping) : [];

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format conversation name
  const getConversationName = (conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipant = conversation.participants?.find(p => 
      (p.user?.id || p.user?._id) !== (user?.id || user?._id)
    );
    
    return otherParticipant?.user?.username || otherParticipant?.username || 'Bilinmeyen Kullanıcı';
  };

  // Get conversation avatar
  const getConversationAvatar = (conversation) => {
    const otherParticipant = conversation.participants?.find(p => 
      (p.user?.id || p.user?._id) !== (user?.id || user?._id)
    );
    
    return otherParticipant?.user?.avatar || otherParticipant?.avatar || null;
  };

  // Get online status for conversation
  const getConversationOnlineStatus = (conversation) => {
    const otherParticipant = conversation.participants?.find(p => 
      (p.user?.id || p.user?._id) !== (user?.id || user?._id)
    );
    
    return {
      isOnline: otherParticipant?.user?.isOnline || otherParticipant?.isOnline || false,
      lastActiveAt: otherParticipant?.user?.lastActiveAt || otherParticipant?.lastActiveAt
    };
  };

  // Format last seen time
  const formatLastSeen = (lastActiveAt) => {
    if (!lastActiveAt) return 'Bilinmiyor';
    
    const now = new Date();
    const lastSeen = new Date(lastActiveAt);
    const diffMs = now - lastSeen;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Az önce';
    if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return lastSeen.toLocaleDateString('tr-TR');
  };

  // Get online users count for current conversation
  const getOnlineUsersCount = (conversation) => {
    if (!conversation?.participants) return 0;
    
    return conversation.participants.filter(participant => {
      const participantUser = participant.user || participant;
      return participantUser?.isOnline || false;
    }).length;
  };

  // Get total users count for current conversation  
  const getTotalUsersCount = (conversation) => {
    return conversation?.participants?.length || 0;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Mesajlaşma</h1>
          <p className="text-slate-600 mb-6">Mesajlaşmak için giriş yapmanız gerekiyor</p>
          <button
            onClick={() => router.push('/login')}
            className="rpg-button-primary"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-200/20 to-purple-200/20"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Header - Mobile Optimized */}
      <motion.nav 
        className={`relative z-10 backdrop-blur-xl bg-white/90 border-b border-blue-200/50 shadow-lg ${
          isMobile ? 'px-4 py-3' : 'p-6'
        }`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto">
          {isMobile ? (
            // Mobile Header Layout
            <div className="flex items-center justify-between">
              {activeConversationId ? (
                // In Chat View - Mobile
                <>
                  <div className="flex items-center space-x-3 flex-1">
                    <motion.button 
                      onClick={() => dispatch(setActiveConversation(null))}
                      className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </motion.button>
                    
                    {activeConversation && (
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                          {getConversationAvatar(activeConversation) ? (
                            <img 
                              src={getConversationAvatar(activeConversation)} 
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-slate-800 text-base truncate">
                            {getConversationName(activeConversation)}
                          </h2>
                          {(() => {
                            const status = getConversationOnlineStatus(activeConversation);
                            return (
                              <p className="text-xs text-slate-500 truncate">
                                {status.isOnline ? '🟢 Çevrimiçi' : `🔴 ${formatLastSeen(status.lastActiveAt)}`}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <motion.button 
                      onClick={() => setShowConversationInfo(!showConversationInfo)}
                      className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Info className="w-5 h-5" />
                    </motion.button>
                  </div>
                </>
              ) : (
                // Conversation List View - Mobile
                <>
                  <div className="flex items-center space-x-3">
                    <motion.button 
                      onClick={() => router.push('/dashboard')}
                      className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </motion.button>
                    
                    <div>
                      <h1 className="text-xl font-bold text-slate-800">Mesajlar</h1>
                      {unreadCount > 0 && (
                        <span className="inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                          {unreadCount} yeni
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => setShowUserSearch(true)}
                    className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </>
              )}
            </div>
          ) : (
            // Desktop Header Layout (Original)
            <div className="flex items-center justify-between">
              <motion.button 
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-slate-600 hover:text-slate-800 transition-all duration-300 group"
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                <span className="font-medium">Dashboard</span>
              </motion.button>
              
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent flex items-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.div
                    className="mr-3"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💬
                  </motion.div>
                  Mesajlar
                  {unreadCount > 0 && (
                    <motion.span 
                      className="ml-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-full px-3 py-1 shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </motion.h1>
              </div>
              
              <motion.button
                onClick={() => setShowUserSearch(true)}
                className="p-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </div>
      </motion.nav>

      <div className={`relative z-10 container mx-auto max-w-7xl ${
        isMobile ? 'h-[calc(100vh-4rem)] p-0' : 'h-[calc(100vh-6rem)] p-6'
      }`}>
        <div className={`flex h-full overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl ${
          isMobile ? 'rounded-none border-t-2' : 'rounded-3xl border-2'
        } border-blue-200/50`}>
          
          {/* Sidebar - Conversations List */}
          <motion.div 
            className={`${
              isMobile && activeConversationId ? 'hidden' : 'flex'
            } ${isMobile ? 'w-full' : 'w-full md:w-80'} bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-xl ${
              isMobile ? '' : 'border-r border-blue-200/30'
            } flex-col`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            
            {/* Header */}
            <motion.div 
              className="p-6 border-b border-blue-200/30 bg-gradient-to-r from-blue-100/50 to-purple-100/50"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.h1 
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mr-2"
                  >
                    💬
                  </motion.div>
                  Mesajlar
                  {unreadCount > 0 && (
                    <motion.span 
                      className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full px-2 py-1 shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </motion.h1>
                <motion.button
                  onClick={() => setShowUserSearch(true)}
                  className="p-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center justify-between text-sm">
                <motion.div 
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    animate={{ scale: isSocketConnected ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 1.5, repeat: isSocketConnected ? Infinity : 0 }}
                  >
                    <Circle className={`w-3 h-3 ${isSocketConnected ? 'text-green-400 fill-current' : 'text-red-400'}`} />
                  </motion.div>
                  <span className={`font-medium ${isSocketConnected ? 'text-green-600' : 'text-red-500'}`}>
                    {isSocketConnected ? '🟢 Bağlı' : '🔴 Bağlantı Yok'}
                  </span>
                </motion.div>
                {conversations.length > 0 && (
                  <motion.div 
                    className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700">
                      {conversations.reduce((total, conv) => total + getOnlineUsersCount(conv), 0)} çevrimiçi
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Conversations List */}
            <motion.div 
              className="flex-1 overflow-y-auto custom-scrollbar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {conversationsLoading ? (
                <motion.div 
                  className="flex items-center justify-center p-8"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Heart className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>
                </motion.div>
              ) : conversations.length === 0 ? (
                <motion.div 
                  className="text-center p-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl mb-4"
                  >
                    💬
                  </motion.div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Henüz konuşmanız yok</h3>
                  <p className="text-slate-600 text-sm mt-2">Yeni arkadaşlarla sohbet etmeye başlayın!</p>
                  <motion.button
                    onClick={() => setShowUserSearch(true)}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✨ Yeni Sohbet Başlat
                  </motion.button>
                </motion.div>
              ) : (
                conversations.map((conversation, index) => {
                  const conversationId = conversation.id || conversation._id;
                  const isActive = conversationId === activeConversationId;
                  
                  return (
                    <motion.div
                      key={conversationId}
                      className={`${isMobile ? 'mx-1 mb-1 p-3' : 'mx-2 mb-2 p-4'} rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 border-2 border-blue-300/50 shadow-lg' 
                          : 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-blue-200/30'
                      }`}
                      onClick={() => selectConversation(conversationId)}
                      whileHover={{ scale: isMobile ? 1.01 : 1.02, y: isMobile ? -1 : -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <motion.div 
                            className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden shadow-lg"
                            whileHover={{ scale: 1.1 }}
                          >
                            {getConversationAvatar(conversation) ? (
                              <img 
                                src={getConversationAvatar(conversation)} 
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-6 h-6 text-white" />
                            )}
                          </motion.div>
                          {/* Real-time online indicator */}
                          {(() => {
                            const status = getConversationOnlineStatus(conversation);
                            return status.isOnline && (
                              <motion.div 
                                className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            );
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <motion.h3 
                              className={`font-semibold truncate ${
                                isActive 
                                  ? 'text-slate-800' 
                                  : 'text-slate-700 group-hover:text-slate-800'
                              }`}
                              whileHover={{ x: 2 }}
                            >
                              {getConversationName(conversation)}
                            </motion.h3>
                            <span className="text-xs text-slate-500 bg-white/20 px-2 py-1 rounded-full">
                              {conversation.lastMessage?.timestamp && 
                                formatTime(conversation.lastMessage.timestamp)
                              }
                            </span>
                          </div>
                          <motion.p 
                            className="text-sm text-slate-600 truncate mt-1"
                            initial={{ opacity: 0.7 }}
                            whileHover={{ opacity: 1 }}
                          >
                            {(() => {
                              if (typeof conversation.lastMessage?.content === 'string') {
                                return `💬 ${conversation.lastMessage.content}`;
                              }
                              if (conversation.lastMessage?.content?.text) {
                                return `💬 ${conversation.lastMessage.content.text}`;
                              }
                              return '✨ Yeni sohbet başlat';
                            })()}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </motion.div>

          {/* Chat Area */}
          <motion.div 
            className={`${isMobile && !activeConversationId ? 'hidden' : 'flex'} flex-1 flex flex-col bg-gradient-to-b from-white/30 to-white/10 backdrop-blur-xl`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <motion.div 
                  className="p-6 border-b border-blue-200/30 flex items-center justify-between bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center space-x-3">
                    {isMobile && (
                      <button
                        onClick={() => dispatch(setActiveConversation(null))}
                        className="p-1 text-slate-500 hover:text-slate-800"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden shadow-lg"
                      whileHover={{ scale: 1.1 }}
                    >
                      {getConversationAvatar(activeConversation) ? (
                        <img 
                          src={getConversationAvatar(activeConversation)} 
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-white" />
                      )}
                    </motion.div>
                    
                    <div>
                      <motion.h2 
                        className="font-bold text-slate-800 text-lg"
                        whileHover={{ scale: 1.02 }}
                      >
                        {getConversationName(activeConversation)}
                      </motion.h2>
                      {(() => {
                        const status = getConversationOnlineStatus(activeConversation);
                        const onlineCount = getOnlineUsersCount(activeConversation);
                        const totalCount = getTotalUsersCount(activeConversation);
                        
                        if (activeConversation.type === 'group') {
                          return (
                            <p className="text-xs text-slate-600">
                              {onlineCount}/{totalCount} kişi çevrimiçi
                            </p>
                          );
                        } else {
                          if (status.isOnline) {
                            return (
                              <motion.p 
                                className="text-xs font-medium text-blue-600 flex items-center"
                                animate={{ opacity: [1, 0.7, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                🟢 Çevrimiçi
                              </motion.p>
                            );
                          } else {
                            return <p className="text-xs text-slate-600 flex items-center">🔴 {formatLastSeen(status.lastActiveAt)}</p>;
                          }
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <motion.button 
                      className="p-2 rounded-full bg-white/20 text-slate-600 hover:text-slate-800 hover:bg-white/30 transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Phone className="w-5 h-5" />
                    </motion.button>
                    <motion.button 
                      className="p-2 rounded-full bg-white/20 text-slate-600 hover:text-slate-800 hover:bg-white/30 transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Video className="w-5 h-5" />
                    </motion.button>
                    
                    {/* Clear Chat Button */}
                    <motion.button 
                      onClick={handleClearChat}
                      className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-all duration-300 group"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Sohbeti temizle"
                    >
                      <Trash className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </motion.button>
                    
                    <motion.button 
                      onClick={() => setShowConversationInfo(!showConversationInfo)}
                      className="p-2 rounded-full bg-white/20 text-slate-600 hover:text-slate-800 hover:bg-white/30 transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Info className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Messages Area */}
                <motion.div 
                  className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {messagesLoading[activeConversationId] ? (
                    <motion.div 
                      className="flex items-center justify-center p-8"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Heart className="w-3 h-3 text-rose-500" />
                        </div>
                      </div>
                    </motion.div>
                  ) : currentMessages.length === 0 ? (
                    <motion.div 
                      className="text-center p-8"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-4xl mb-4"
                      >
                        💬
                      </motion.div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-rose-600 to-teal-600 bg-clip-text text-transparent mb-2">Henüz mesaj yok</h3>
                      <p className="text-slate-600">İlk mesajı siz göndererek sohbeti başlatın! ✨</p>
                    </motion.div>
                  ) : (
                    currentMessages.map((message, index) => {
                      const isOwn = (message.sender?.id || message.sender?._id) === (user?.id || user?._id);
                      const showAvatar = index === 0 || 
                        (currentMessages[index - 1]?.sender?.id || currentMessages[index - 1]?.sender?._id) !== 
                        (message.sender?.id || message.sender?._id);
                      
                      // Create unique key from multiple sources
                      const messageKey = message.id || message.tempId || `msg-${index}-${message.timestamp || Date.now()}`;
                      
                      return (
                        <motion.div
                          key={messageKey}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${message.isOptimistic ? 'opacity-70' : ''} group relative`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          onMouseEnter={() => setHoveredMessage(messageKey)}
                          onMouseLeave={() => setHoveredMessage(null)}
                        >
                          <div className={`flex space-x-2 max-w-xs md:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {!isOwn && showAvatar && (
                              <motion.div 
                                className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg"
                                whileHover={{ scale: 1.1 }}
                              >
                                {message.sender?.avatar ? (
                                  <img 
                                    src={message.sender.avatar} 
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs text-white font-semibold">
                                    {message.sender?.username?.[0]?.toUpperCase() || '?'}
                                  </span>
                                )}
                              </motion.div>
                            )}
                            
                            <div className={`${!isOwn && !showAvatar ? 'ml-10' : ''}`}>
                              {!isOwn && showAvatar && (
                                <motion.p 
                                  className="text-xs font-medium text-slate-600 mb-1 px-3"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  {message.sender?.username}
                                </motion.p>
                              )}
                              
                              <motion.div 
                                className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                                  isOwn 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                                    : 'bg-white/80 text-slate-800 border border-white/20'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <div>
                                  {/* Message Text */}
                                  {((typeof message.content === 'string' && message.content) || 
                                    (message.content?.text && message.content.text.trim())) && (
                                    <motion.p 
                                      className="break-words leading-relaxed mb-2"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.2 }}
                                    >
                                      {typeof message.content === 'string' 
                                        ? message.content 
                                        : message.content?.text || '😔 Mesaj yüklenemedi'
                                      }
                                    </motion.p>
                                  )}
                                  
                                  {/* File Attachments */}
                                  {message.content?.files && message.content.files.length > 0 && (
                                    <motion.div 
                                      className="space-y-2 mt-2"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.3 }}
                                    >
                                      {message.content.files.map((file, fileIndex) => (
                                        <motion.div
                                          key={fileIndex}
                                          className={`p-2 rounded-lg ${
                                            isOwn 
                                              ? 'bg-white/20 hover:bg-white/30' 
                                              : 'bg-slate-100/80 hover:bg-slate-200/80'
                                          } transition-colors cursor-pointer`}
                                          whileHover={{ scale: 1.02 }}
                                          onClick={() => {
                                            if (file.isImage) {
                                              // Open image in new tab
                                              window.open(file.filePath, '_blank');
                                            } else {
                                              // Download file
                                              const link = document.createElement('a');
                                              link.href = file.filePath;
                                              link.download = file.originalName;
                                              link.click();
                                            }
                                          }}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg">
                                              {getFileIcon(file.fileType)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-sm font-medium truncate ${
                                                isOwn ? 'text-white' : 'text-slate-700'
                                              }`}>
                                                {file.originalName}
                                              </p>
                                              <p className={`text-xs ${
                                                isOwn ? 'text-white/80' : 'text-slate-500'
                                              }`}>
                                                {formatFileSize(file.fileSize)} • {file.isImage ? 'Resim' : 'Dosya'}
                                              </p>
                                            </div>
                                            <span className={`text-xs ${
                                              isOwn ? 'text-white/60' : 'text-slate-400'
                                            }`}>
                                              {file.isImage ? '🔍' : '⬇️'}
                                            </span>
                                          </div>
                                          
                                          {/* Image Preview */}
                                          {file.isImage && (
                                            <motion.div 
                                              className="mt-2 rounded-lg overflow-hidden"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ delay: 0.4 }}
                                            >
                                              <img 
                                                src={file.filePath} 
                                                alt={file.originalName}
                                                className="w-full max-w-xs h-auto rounded-lg"
                                                loading="lazy"
                                              />
                                            </motion.div>
                                          )}
                                        </motion.div>
                                      ))}
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                              
                              <motion.div 
                                className={`flex items-center space-x-1 mt-2 px-3 ${isOwn ? 'justify-end' : ''}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                <span className="text-xs text-slate-500 bg-white/20 px-2 py-1 rounded-full">
                                  {formatTime(message.timestamp || message.createdAt)}
                                </span>
                                {isOwn && (
                                  <motion.div 
                                    className="flex items-center"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1, repeat: message.status === 'sending' ? Infinity : 0 }}
                                  >
                                    {message.status === 'sending' && <Circle className="w-3 h-3 text-slate-500 animate-pulse" />}
                                    {message.status === 'sent' && <Check className="w-3 h-3 text-slate-500" />}
                                    {message.status === 'delivered' && <CheckCheck className="w-3 h-3 text-slate-500" />}
                                    {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                                  </motion.div>
                                )}
                              </motion.div>
                            </div>
                            
                            {/* Modern Delete Button - Better UX */}
                            <AnimatePresence>
                              {isOwn && hoveredMessage === messageKey && !message.isOptimistic && (
                                <motion.div
                                  className={`absolute ${isOwn ? '-left-12' : '-right-12'} top-1/2 transform -translate-y-1/2 flex items-center space-x-1`}
                                  initial={{ opacity: 0, x: isOwn ? 10 : -10, scale: 0.8 }}
                                  animate={{ opacity: 1, x: 0, scale: 1 }}
                                  exit={{ opacity: 0, x: isOwn ? 10 : -10, scale: 0.8 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                >
                                  {/* Delete Button */}
                                  <motion.button
                                    onClick={() => handleDeleteMessage(message)}
                                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group/delete"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Mesajı sil"
                                  >
                                    <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
                                  </motion.button>
                                  
                                  {/* Tooltip */}
                                  <motion.div
                                    className={`absolute ${isOwn ? 'left-full ml-2' : 'right-full mr-2'} top-1/2 transform -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                  >
                                    Mesajı sil
                                    <div className={`absolute top-1/2 transform -translate-y-1/2 w-1 h-1 bg-slate-800 rotate-45 ${isOwn ? '-left-0.5' : '-right-0.5'}`}></div>
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <motion.div
                      className="flex justify-start"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-xs text-white">
                            {typingUsers[0].username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-2xl">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </motion.div>

                {/* Message Input */}
                <motion.div 
                  className="p-6 border-t border-blue-200/30 bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-xl"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    {/* File Input Areas - Hidden */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      accept="image/*"
                    />
                    
                    {/* Selected Files Display */}
                    {selectedFiles.length > 0 && (
                      <motion.div 
                        className="bg-white/80 rounded-2xl p-4 border border-blue-200/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">📎 Yüklenen Dosyalar:</h4>
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <motion.div 
                              key={index}
                              className="flex items-center justify-between bg-blue-50 rounded-lg p-2"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">
                                  {getFileIcon(file.fileType || file.type)}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm text-slate-700 truncate max-w-48">
                                    {file.originalName || file.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatFileSize(file.fileSize || file.size)}
                                  </span>
                                </div>
                              </div>
                              <motion.button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex items-center space-x-4">
                    {/* File Upload Button */}
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFiles}
                      className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
                        isUploadingFiles 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-indigo-400 to-purple-400 text-white'
                      }`}
                      whileHover={!isUploadingFiles ? { scale: 1.1, rotate: 15 } : {}}
                      whileTap={!isUploadingFiles ? { scale: 0.9 } : {}}
                      title="Dosya ekle"
                    >
                      {isUploadingFiles ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Paperclip className="w-5 h-5" />
                      )}
                    </motion.button>
                    
                    {/* Image Upload Button */}
                    <motion.button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingFiles}
                      className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
                        isUploadingFiles 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white'
                      }`}
                      whileHover={!isUploadingFiles ? { scale: 1.1 } : {}}
                      whileTap={!isUploadingFiles ? { scale: 0.9 } : {}}
                      title="Resim ekle"
                    >
                      {isUploadingFiles ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Image className="w-5 h-5" />
                      )}
                    </motion.button>
                    
                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <motion.input
                        ref={messageInputRef}
                        type="text"
                        value={messageText}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                          handleTyping();
                        }}
                        placeholder="💬 Mesajınızı yazın..."
                        className="w-full bg-white/80 backdrop-blur-sm border-2 border-blue-200/50 rounded-2xl px-6 py-4 text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200/30 shadow-lg transition-all duration-300"
                        maxLength={2000}
                        initial={{ scale: 0.95 }}
                        whileFocus={{ scale: 1 }}
                      />
                      
                      {/* Character Counter */}
                      <motion.div 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-slate-400"
                        animate={{ opacity: messageText.length > 1800 ? 1 : 0 }}
                      >
                        {messageText.length}/2000
                      </motion.div>
                    </div>
                    
                    {/* Emoji Button */}
                    <motion.button
                      type="button"
                      className="p-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      whileHover={{ scale: 1.1, rotate: -15 }}
                      whileTap={{ scale: 0.9 }}
                      title="Emoji ekle"
                    >
                      <Smile className="w-5 h-5" />
                    </motion.button>
                    
                    {/* Send Button */}
                    <motion.button
                      type="submit"
                      disabled={!messageText.trim() && selectedFiles.length === 0}
                      className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
                        messageText.trim() || selectedFiles.length > 0
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      whileHover={(messageText.trim() || selectedFiles.length > 0) ? { scale: 1.1 } : {}}
                      whileTap={(messageText.trim() || selectedFiles.length > 0) ? { scale: 0.9 } : {}}
                      animate={(messageText.trim() || selectedFiles.length > 0) ? { 
                        boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.3)', '0 0 0 10px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0.3)'] 
                      } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                    </div>
                  
                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50 shadow-lg"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-700">😊 Emoji Seçin</h4>
                          <motion.button
                            onClick={() => setShowEmojiPicker(false)}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                        <div className="grid grid-cols-8 gap-2">
                          {['😂', '❤️', '😍', '😢', '😱', '😄', '😎', '🤔', '😊', '😘', '🥰', '😭', '😡', '😴', '🤗', '😏', '💯', '💪', '👍', '👎', '👏', '🙏', '✨', '🎉'].map((emoji, index) => (
                            <motion.button
                              key={emoji}
                              type="button"
                              className="p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 text-lg"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setMessageText(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Quick Emoji Reactions */}
                  <motion.div 
                    className="flex items-center justify-center space-x-2 mt-4 opacity-70"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    {['😂', '❤️', '😍', '😢', '😱', '😄', '😎', '🤔'].map((emoji, index) => (
                      <motion.button
                        key={emoji}
                        type="button"
                        className="p-2 rounded-full hover:bg-white/20 transition-all duration-200"
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMessageText(prev => prev + emoji)}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.1 + index * 0.1 }}
                      >
                        <span className="text-lg">{emoji}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                  </form>
                </motion.div>
              </>
            ) : (
              /* No Conversation Selected */
              <motion.div 
                className="flex-1 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-6"
                  >
                    💬
                  </motion.div>
                  <motion.h2 
                    className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Mesajlaşmaya başlayın
                  </motion.h2>
                  <motion.p 
                    className="text-slate-600 mb-8 text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    Soldaki listeden bir konuşma seçin veya yeni bir sohbet başlatın
                  </motion.p>
                  <motion.button
                    onClick={() => setShowUserSearch(true)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    ✨ Yeni Sohbet Başlat
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Kullanıcı Ara</h3>
                <button
                  onClick={() => {
                    setShowUserSearch(false);
                    setSearchQuery('');
                    dispatch(clearSearchResults());
                  }}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kullanıcı adı ara..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-slate-800 placeholder-slate-500 focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                  <div className="text-center py-4 text-slate-600">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Kullanıcı bulunamadı</p>
                  </div>
                ) : (
                  searchResults.map((searchUser) => (
                    <motion.div
                      key={searchUser.id}
                      className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => handleStartConversation(searchUser.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {searchUser.avatar ? (
                          <img 
                            src={searchUser.avatar} 
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold">
                            {searchUser.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">{searchUser.username}</h4>
                        <p className="text-sm text-slate-600">
                          Seviye {searchUser.level} {searchUser.characterClass?.name}
                          {searchUser.isOnline && (
                            <span className="ml-2 text-secondary">● Çevrimiçi</span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Delete Message Modal */}
      <AnimatePresence>
        {showDeleteModal && messageToDelete && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteModal(false);
                setMessageToDelete(null);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {/* Header with Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Mesajı Sil</h3>
                <p className="text-slate-600">Bu işlem geri alınamaz. Nasıl silmek istiyorsunuz?</p>
              </div>
              
              {/* Message Preview */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-tl-md px-4 py-2 max-w-xs">
                      <p className="text-sm">{messageToDelete.text}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(messageToDelete.timestamp).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Delete Options */}
              <div className="space-y-3 mb-6">
                <motion.button
                  onClick={() => confirmDeleteMessage('self')}
                  className="w-full flex items-center space-x-4 p-4 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-2xl transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <UserX className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-slate-900 font-semibold">Sadece Benim İçin Sil</div>
                    <div className="text-slate-600 text-sm">Mesaj sizin için gizlenir, karşı taraf görebilir</div>
                  </div>
                  <div className="text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.button>
                
                {canDeleteForEveryone(messageToDelete) && (
                  <motion.button
                    onClick={() => confirmDeleteMessage('everyone')}
                    className="w-full flex items-center space-x-4 p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all duration-200 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-slate-900 font-semibold">Herkes İçin Sil</div>
                      <div className="text-slate-600 text-sm">Mesaj tüm katılımcılar için kalıcı olarak silinir</div>
                    </div>
                    <div className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </motion.button>
                )}
              </div>
              
              {/* Time Limitation Warning */}
              {!canDeleteForEveryone(messageToDelete) && (
                <motion.div 
                  className="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-amber-800 font-medium text-sm">Zaman Sınırı</p>
                      <p className="text-amber-700 text-xs">Bu mesaj 5 dakikadan eski olduğu için sadece sizin için silinebilir.</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Cancel Button */}
              <motion.button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMessageToDelete(null);
                }}
                className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all duration-200 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                İptal Et
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Success Notification */}
      <AnimatePresence>
        {showDeleteSuccess && (
          <motion.div
            className="fixed top-4 right-4 z-50 max-w-sm"
            initial={{ opacity: 0, x: 400, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 backdrop-blur-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">{deleteSuccessMessage}</p>
                  <p className="text-slate-500 text-sm">İşlem başarıyla tamamlandı</p>
                </div>
                <button
                  onClick={() => setShowDeleteSuccess(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Chat Modal */}
      <AnimatePresence>
        {showClearChatModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowClearChatModal(false);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {/* Header with Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Sohbeti Temizle</h3>
                <p className="text-slate-600">Bu işlem geri alınamaz. Tüm mesajları nasıl silmek istiyorsunuz?</p>
              </div>

              {/* Warning Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-800 font-medium text-sm">Dikkat!</p>
                    <p className="text-amber-700 text-xs">Bu işlem sonrası tüm mesaj geçmişi silinecektir.</p>
                  </div>
                </div>
              </div>
              
              {/* Clear Options */}
              <div className="space-y-3 mb-6">
                <motion.button
                  onClick={() => confirmClearChat('self')}
                  disabled={isClearingChat}
                  className="w-full flex items-center space-x-4 p-4 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-2xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isClearingChat ? 1 : 1.02 }}
                  whileTap={{ scale: isClearingChat ? 1 : 0.98 }}
                >
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <UserX className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-slate-900 font-semibold">Sadece Benim İçin Temizle</div>
                    <div className="text-slate-600 text-sm">Sohbet sizin için gizlenir, karşı taraf görebilir</div>
                  </div>
                  <div className="text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={() => confirmClearChat('everyone')}
                  disabled={isClearingChat}
                  className="w-full flex items-center space-x-4 p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isClearingChat ? 1 : 1.02 }}
                  whileTap={{ scale: isClearingChat ? 1 : 0.98 }}
                >
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <Trash className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-slate-900 font-semibold">Herkes İçin Temizle</div>
                    <div className="text-slate-600 text-sm">Sohbet tüm katılımcılar için kalıcı olarak silinir</div>
                  </div>
                  <div className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.button>
              </div>
              
              {/* Cancel Button */}
              <motion.button
                onClick={() => setShowClearChatModal(false)}
                disabled={isClearingChat}
                className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isClearingChat ? 1 : 1.02 }}
                whileTap={{ scale: isClearingChat ? 1 : 0.98 }}
              >
                {isClearingChat ? 'Temizleniyor...' : 'İptal Et'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}