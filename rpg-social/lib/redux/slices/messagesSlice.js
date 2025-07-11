// lib/redux/slices/messagesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { io } from 'socket.io-client';

// Socket.IO instance
let socket = null;

// Initialize Socket.IO connection
export const initializeSocket = createAsyncThunk(
  'messages/initializeSocket',
  async (token, { dispatch, getState }) => {
    if (socket?.connected) {
      return { connected: true };
    }

    socket = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SOCKET_URL 
      : 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Socket connected');
      dispatch(setSocketConnected(true));
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      dispatch(setSocketConnected(false));
    });

    socket.on('message:new', (message) => {
      // Only add message if it's from another user (not sender)
      const { user } = getState().auth;
      const currentUserId = user?.id || user?._id;
      
      if (message.sender?.id !== currentUserId) {
        dispatch(addMessage(message));
      }
    });

    socket.on('conversation:new', ({ conversation }) => {
      dispatch(addConversation(conversation));
    });

    socket.on('typing:start', ({ userId, username, conversationId }) => {
      dispatch(setTyping({ conversationId, userId, username, isTyping: true }));
    });

    socket.on('typing:stop', ({ userId, conversationId }) => {
      dispatch(setTyping({ conversationId, userId, isTyping: false }));
    });

    socket.on('message:read', ({ messageId, userId, readAt }) => {
      dispatch(markMessageAsRead({ messageId, userId, readAt }));
    });

    socket.on('user:status', ({ userId, status }) => {
      dispatch(updateUserStatus({ userId, status }));
    });

    socket.on('notification:message', ({ conversationId, message, unreadCount }) => {
      // Only show notification if it's from another user and user is not in active conversation
      const { user } = getState().auth;
      const { activeConversationId } = getState().messages;
      const currentUserId = user?.id || user?._id;
      
      if (message.sender?.id !== currentUserId) {
        // Always add to messages
        dispatch(addMessage(message));
        
        // Only show notification if not in the active conversation
        if (activeConversationId !== conversationId) {
          dispatch(addNotification({ 
            id: `notification_${Date.now()}_${message.id}`,
            conversationId, 
            message, 
            unreadCount: 1,
            timestamp: message.timestamp || Date.now()
          }));
        }
      }
    });

    return { connected: true };
  }
);

// Disconnect socket
export const disconnectSocket = createAsyncThunk(
  'messages/disconnectSocket',
  async (_, { dispatch }) => {
    if (socket) {
      socket.disconnect();
      socket = null;
      dispatch(setSocketConnected(false));
    }
    return { connected: false };
  }
);

// Fetch conversations
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async ({ page = 1, limit = 20 }, { getState }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/messages/conversations?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }
);

// Fetch messages for conversation
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ conversationId, page = 1, limit = 50 }, { getState }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/messages?conversationId=${conversationId}&page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return { conversationId, ...data.data };
  }
);

// Send message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content, type = 'text', replyTo, files = [] }, { getState, dispatch }) => {
    // Generate temporary ID for optimistic updates
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { user } = getState().auth;
    
    // Add optimistic message immediately
    const optimisticMessage = {
      tempId,
      conversationId,
      content: {
        text: content || '',
        type: files.length > 0 ? 'file' : type,
        files: files || []
      },
      sender: {
        id: user?.id || user?._id,
        username: user?.username,
        avatar: user?.avatar || user?.avatarUrls?.medium
      },
      timestamp: new Date().toISOString(),
      status: 'sending',
      isOptimistic: true
    };
    
    dispatch(addMessage(optimisticMessage));

    try {
      // Save to database via API 
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId, content, type: files.length > 0 ? 'file' : type, replyTo, files })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      // Real-time delivery handled by API endpoint via Socket.IO

      // Update optimistic message with real data
      const realMessage = {
        ...data.data,
        tempId, // Keep temp ID for replacement
        status: 'sent'
      };

      return realMessage;
    } catch (error) {
      // Remove optimistic message on error
      dispatch(removeOptimisticMessage({ conversationId, tempId }));
      throw error;
    }
  }
);

// Create conversation
export const createConversation = createAsyncThunk(
  'messages/createConversation',
  async ({ participantId, type = 'direct', title }, { getState }) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/messages/conversations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ participantId, type, title })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }
);

// Search users
export const searchUsers = createAsyncThunk(
  'messages/searchUsers',
  async ({ query, page = 1, limit = 10 }, { getState }) => {
    if (!query || query.trim().length < 2) {
      return { users: [], pagination: {}, query: '' };
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }
);

// Socket actions
export const joinConversation = (conversationId) => {
  if (socket?.connected) {
    socket.emit('join:conversation', conversationId);
  }
};

export const leaveConversation = (conversationId) => {
  if (socket?.connected) {
    socket.emit('leave:conversation', conversationId);
  }
};

export const startTyping = (conversationId) => {
  if (socket?.connected) {
    socket.emit('typing:start', { conversationId });
  }
};

export const stopTyping = (conversationId) => {
  if (socket?.connected) {
    socket.emit('typing:stop', { conversationId });
  }
};

export const markAsRead = (conversationId, messageId) => {
  if (socket?.connected) {
    socket.emit('message:read', { conversationId, messageId });
  }
};

// Delete message
export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async ({ messageId, deleteType }, { getState }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/messages?messageId=${messageId}&deleteType=${deleteType}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return { messageId, deleteType };
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState: {
    // Socket connection
    isSocketConnected: false,
    
    // Conversations
    conversations: [],
    conversationsLoading: false,
    conversationsError: null,
    
    // Messages
    messages: {}, // { conversationId: [messages] }
    messagesLoading: {},
    messagesError: {},
    
    // Current conversation
    activeConversationId: null,
    
    // Typing indicators
    typing: {}, // { conversationId: { userId: { username, isTyping } } }
    
    // User search
    searchResults: [],
    searchLoading: false,
    searchError: null,
    searchQuery: '',
    
    // Notifications
    unreadCount: 0,
    notifications: []
  },
  reducers: {
    setSocketConnected: (state, action) => {
      state.isSocketConnected = action.payload;
    },
    
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },
    
    addMessage: (state, action) => {
      const message = action.payload;
      const conversationId = message.conversationId;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Avoid duplicates - check by both id and temporary id
      const exists = state.messages[conversationId].some(m => 
        (m.id === message.id) || 
        (m.tempId && message.tempId && m.tempId === message.tempId) ||
        (m.content?.text === message.content?.text && 
         Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000) // 5 seconds tolerance
      );
      
      if (!exists) {
        // Generate unique ID if missing
        if (!message.id && !message.tempId) {
          message.tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        state.messages[conversationId].push(message);
        
        // Update conversation's last message
        const conversation = state.conversations.find(c => (c.id || c._id) === conversationId);
        if (conversation) {
          conversation.lastMessage = {
            content: typeof message.content === 'string' 
              ? message.content 
              : message.content?.text || 'Yeni mesaj',
            timestamp: message.timestamp,
            sender: message.sender
          };
        }
      }
    },
    
    addConversation: (state, action) => {
      const conversation = action.payload;
      const exists = state.conversations.some(c => c.id === conversation.id);
      if (!exists) {
        state.conversations.unshift(conversation);
      }
    },
    
    setTyping: (state, action) => {
      const { conversationId, userId, username, isTyping } = action.payload;
      
      if (!state.typing[conversationId]) {
        state.typing[conversationId] = {};
      }
      
      if (isTyping) {
        state.typing[conversationId][userId] = { username, isTyping: true };
      } else {
        delete state.typing[conversationId][userId];
      }
    },
    
    markMessageAsRead: (state, action) => {
      const { messageId, userId, readAt } = action.payload;
      
      Object.values(state.messages).forEach(conversationMessages => {
        const message = conversationMessages.find(m => m.id === messageId);
        if (message) {
          if (!message.readBy) message.readBy = [];
          const readStatus = message.readBy.find(r => r.userId === userId);
          if (readStatus) {
            readStatus.readAt = readAt;
          } else {
            message.readBy.push({ userId, readAt });
          }
        }
      });
    },
    
    updateUserStatus: (state, action) => {
      const { userId, status } = action.payload;
      
      state.conversations.forEach(conversation => {
        conversation.participants.forEach(participant => {
          if (participant.id === userId) {
            participant.isOnline = status === 'online';
            participant.lastActiveAt = new Date().toISOString();
          }
        });
      });
    },
    
    addNotification: (state, action) => {
      const notification = action.payload;
      state.notifications.unshift(notification);
      state.unreadCount += notification.unreadCount || 1;
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
      state.searchError = null;
    },
    
    removeOptimisticMessage: (state, action) => {
      const { conversationId, tempId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(
          m => m.tempId !== tempId
        );
      }
    },
    
    updateOptimisticMessage: (state, action) => {
      const { conversationId, tempId, updates } = action.payload;
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(
          m => m.tempId === tempId
        );
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex] = {
            ...state.messages[conversationId][messageIndex],
            ...updates
          };
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Initialize Socket
    builder
      .addCase(initializeSocket.pending, (state) => {
        state.isSocketConnected = false;
      })
      .addCase(initializeSocket.fulfilled, (state) => {
        state.isSocketConnected = true;
      })
      .addCase(initializeSocket.rejected, (state) => {
        state.isSocketConnected = false;
      });

    // Fetch Conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.conversationsError = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload.conversations;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsLoading = false;
        state.conversationsError = action.error.message;
      });

    // Fetch Messages
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const conversationId = action.meta.arg.conversationId;
        state.messagesLoading[conversationId] = true;
        state.messagesError[conversationId] = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        state.messagesLoading[conversationId] = false;
        state.messages[conversationId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const conversationId = action.meta.arg.conversationId;
        state.messagesLoading[conversationId] = false;
        state.messagesError[conversationId] = action.error.message;
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        // Optimistic update already handled in action
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const conversationId = message.conversationId;
        
        // Replace optimistic message with real message
        if (state.messages[conversationId] && message.tempId) {
          const messageIndex = state.messages[conversationId].findIndex(
            m => m.tempId === message.tempId
          );
          if (messageIndex !== -1) {
            state.messages[conversationId][messageIndex] = {
              ...message,
              isOptimistic: false
            };
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        // Optimistic message removal handled in action
      });

    // Create Conversation
    builder
      .addCase(createConversation.fulfilled, (state, action) => {
        const conversation = action.payload;
        const exists = state.conversations.some(c => c.id === conversation.id);
        if (!exists) {
          state.conversations.unshift(conversation);
        }
      });

    // Search Users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.users;
        state.searchQuery = action.payload.query;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.error.message;
      });

    // Delete Message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId, deleteType } = action.payload;
        
        // Find and update the message in all conversations
        Object.keys(state.messages).forEach(conversationId => {
          const messageIndex = state.messages[conversationId].findIndex(
            m => m.id === messageId || m._id === messageId
          );
          
          if (messageIndex !== -1) {
            if (deleteType === 'everyone') {
              // Remove message completely for everyone
              state.messages[conversationId].splice(messageIndex, 1);
            } else {
              // Mark as deleted for current user only
              state.messages[conversationId][messageIndex].deletedForMe = true;
            }
          }
        });
        
        // Update conversation's lastMessage if needed
        state.conversations.forEach(conversation => {
          if (conversation.lastMessage?.id === messageId || conversation.lastMessage?._id === messageId) {
            // Find the most recent non-deleted message for this conversation
            const conversationMessages = state.messages[conversation.id] || [];
            const lastVisibleMessage = conversationMessages
              .filter(m => !m.deletedForMe && !m.isDeleted)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            
            conversation.lastMessage = lastVisibleMessage || null;
          }
        });
      });
  }
});

export const {
  setSocketConnected,
  setActiveConversation,
  addMessage,
  addConversation,
  setTyping,
  markMessageAsRead,
  updateUserStatus,
  addNotification,
  clearNotifications,
  clearSearchResults,
  removeOptimisticMessage,
  updateOptimisticMessage
} = messagesSlice.actions;

export default messagesSlice.reducer;