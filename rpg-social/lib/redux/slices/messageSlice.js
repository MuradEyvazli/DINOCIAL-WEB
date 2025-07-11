// lib/redux/slices/messageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Mock data for now
      return {
        conversations: [],
        totalUnread: 0
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async ({ conversationId, page = 1 }, { getState, rejectWithValue }) => {
    try {
      // Mock data for now
      return {
        messages: [],
        hasMore: false
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async ({ conversationId, content, type = 'text' }, { getState, rejectWithValue }) => {
    try {
      // Mock data for now
      return {
        id: Date.now().toString(),
        conversationId,
        content,
        type,
        senderId: 'current_user',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'message/markAsRead',
  async (conversationId, { getState, rejectWithValue }) => {
    try {
      // Mock success response
      return { conversationId, success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  onlineUsers: {},
  typingUsers: {},
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    hasMore: true
  }
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action) => {
      const message = action.payload;
      state.messages.push(message);
      
      // Update last message in conversation
      const conversation = state.conversations.find(c => c.id === message.conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.updatedAt = message.timestamp;
        
        // Increment unread count if not from current user
        if (message.senderId !== 'current_user') {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          state.unreadCount += 1;
        }
      }
    },
    updateTypingStatus: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      
      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId);
      }
    },
    updateOnlineStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      state.onlineUsers[userId] = isOnline;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversations = [], totalUnread = 0 } = action.payload || {};
        state.conversations = conversations;
        state.unreadCount = totalUnread;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch conversations';
      })
      
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { messages = [], hasMore = false } = action.payload || {};
        
        if (state.pagination.currentPage === 1) {
          state.messages = messages;
        } else {
          state.messages = [...messages, ...state.messages];
        }
        
        state.pagination.hasMore = hasMore;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch messages';
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        state.messages.push(message);
        
        // Update conversation
        const conversation = state.conversations.find(c => c.id === message.conversationId);
        if (conversation) {
          conversation.lastMessage = message;
          conversation.updatedAt = message.timestamp;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to send message';
      })
      
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        
        // Reset unread count for conversation
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation && conversation.unreadCount > 0) {
          state.unreadCount = Math.max(0, state.unreadCount - conversation.unreadCount);
          conversation.unreadCount = 0;
        }
        
        // Mark messages as read
        state.messages.forEach(message => {
          if (message.conversationId === conversationId && message.senderId !== 'current_user') {
            message.status = 'read';
          }
        });
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark as read';
      });
  },
});

export const {
  setCurrentConversation,
  addMessage,
  updateTypingStatus,
  updateOnlineStatus,
  clearCurrentConversation,
  clearError
} = messageSlice.actions;

export default messageSlice.reducer;