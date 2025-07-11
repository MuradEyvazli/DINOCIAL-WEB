// lib/redux/slices/postsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { io } from 'socket.io-client';

// Socket.IO instance for real-time updates
let socket = null;

// Initialize Socket.IO for posts
export const initializePostsSocket = createAsyncThunk(
  'posts/initializeSocket',
  async (token, { dispatch }) => {
    if (socket?.connected) {
      return { connected: true };
    }

    socket = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SOCKET_URL 
      : 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Listen for real-time post updates
    socket.on('post:new', (data) => {
      dispatch(addNewPost(data.post));
    });

    socket.on('post:like', (data) => {
      dispatch(updatePostLike(data));
    });

    socket.on('post:comment', (data) => {
      dispatch(updatePostComments(data));
    });

    socket.on('post:comment:delete', (data) => {
      dispatch(removePostComment(data));
    });

    return { connected: true };
  }
);

// Fetch posts for feed
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ page = 1, limit = 10, userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const url = new URL('/api/posts', window.location.origin);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', limit);
      if (userId) url.searchParams.append('userId', userId);

      const response = await fetch(url, {
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
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create new post
export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ content, type = 'text', visibility = 'public', region, tags, metadata }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          type,
          visibility,
          region,
          tags,
          metadata
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      // Update quest progress for creating posts
      try {
        await fetch('/api/quests/progress', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'create_post',
            value: 1 
          })
        });
      } catch (questError) {
        console.log('Quest progress update failed:', questError);
      }

      // Gain XP for creating post
      try {
        await fetch('/api/levels/progression', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            xpGained: 50,
            reason: 'Gönderi paylaşımı'
          })
        });
      } catch (xpError) {
        console.log('XP gain failed:', xpError);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Toggle like on post
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async ({ postId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      // Update quest progress for liking posts (only if liked, not unliked)
      if (data.data.isLiked) {
        try {
          await fetch('/api/quests/progress', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              action: 'like_posts',
              value: 1 
            })
          });
        } catch (questError) {
          console.log('Quest progress update failed:', questError);
        }
      }

      return { postId, ...data.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add comment to post
export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      // Update quest progress for commenting
      try {
        await fetch('/api/quests/progress', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'comment_posts',
            value: 1 
          })
        });
      } catch (questError) {
        console.log('Quest progress update failed:', questError);
      }

      return { postId, ...data.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete comment from post
export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
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

      return { postId, commentId, ...data.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete post
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async ({ postId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
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

      return { postId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    // Posts data
    posts: [],
    loading: false,
    error: null,
    
    // Pagination
    currentPage: 1,
    hasMore: true,
    totalPosts: 0,
    
    // UI state
    showCreateModal: false,
    createLoading: false,
    createError: null,
    
    // Filter/sort options
    filter: 'all', // 'all', 'following', 'region'
    sortBy: 'newest' // 'newest', 'popular'
  },
  reducers: {
    setShowCreateModal: (state, action) => {
      state.showCreateModal = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
      state.createError = null;
    },
    
    setFilter: (state, action) => {
      state.filter = action.payload;
      state.posts = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
      state.posts = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    
    // Real-time updates
    addNewPost: (state, action) => {
      const newPost = action.payload;
      // Check if post already exists to prevent duplicates
      const exists = state.posts.some(p => 
        (p._id === newPost._id) || (p.id === newPost.id)
      );
      if (!exists) {
        state.posts.unshift(newPost);
        state.totalPosts += 1;
      }
    },
    
    updatePostLike: (state, action) => {
      const { postId, isLiked, likesCount } = action.payload;
      const post = state.posts.find(p => p._id === postId);
      if (post) {
        post.isLikedBy = isLiked;
        post.likesCount = likesCount;
      }
    },
    
    updatePostComments: (state, action) => {
      const { postId, comment, commentsCount } = action.payload;
      const post = state.posts.find(p => p._id === postId);
      if (post) {
        if (comment) {
          post.comments.push(comment);
        }
        post.commentsCount = commentsCount;
      }
    },
    
    removePostComment: (state, action) => {
      const { postId, commentId, commentsCount } = action.payload;
      const post = state.posts.find(p => p._id === postId);
      if (post) {
        post.comments = post.comments.filter(c => c._id !== commentId);
        post.commentsCount = commentsCount;
      }
    },
    
    // Post save/bookmark
    toggleSavePost: (state, action) => {
      const { postId, isSaved } = action.payload;
      const post = state.posts.find(p => p._id === postId);
      if (post) {
        post.isSaved = isSaved;
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, pagination } = action.payload;
        
        if (pagination.currentPage === 1) {
          // For first page, replace all posts
          state.posts = posts;
        } else {
          // For subsequent pages, add only new posts (prevent duplicates)
          const existingIds = new Set(state.posts.map(p => p._id || p.id));
          const newPosts = posts.filter(post => 
            !existingIds.has(post._id || post.id)
          );
          state.posts.push(...newPosts);
        }
        
        state.currentPage = pagination.currentPage;
        state.hasMore = pagination.hasMore;
        state.totalPosts = pagination.total;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Post
    builder
      .addCase(createPost.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createLoading = false;
        const newPost = action.payload;
        // Check if post already exists to prevent duplicates
        const exists = state.posts.some(p => 
          (p._id === newPost._id) || (p.id === newPost.id)
        );
        if (!exists) {
          state.posts.unshift(newPost);
          state.totalPosts += 1;
        }
        state.showCreateModal = false;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      });

    // Toggle Like
    builder
      .addCase(toggleLike.pending, (state, action) => {
        // Optimistic update - immediately update UI
        const { postId } = action.meta.arg;
        const post = state.posts.find(p => p._id === postId);
        if (post) {
          post.isLikedBy = !post.isLikedBy;
          post.likesCount = post.isLikedBy ? post.likesCount + 1 : post.likesCount - 1;
        }
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, isLiked, likesCount } = action.payload;
        const post = state.posts.find(p => p._id === postId);
        if (post) {
          post.isLikedBy = isLiked;
          post.likesCount = likesCount;
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        // Revert optimistic update on error
        const { postId } = action.meta.arg;
        const post = state.posts.find(p => p._id === postId);
        if (post) {
          post.isLikedBy = !post.isLikedBy;
          post.likesCount = post.isLikedBy ? post.likesCount + 1 : post.likesCount - 1;
        }
      });

    // Add Comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment, commentsCount } = action.payload;
        const post = state.posts.find(p => p._id === postId);
        if (post) {
          post.comments.push(comment);
          post.commentsCount = commentsCount;
        }
      });

    // Delete Comment
    builder
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, commentId, commentsCount } = action.payload;
        const post = state.posts.find(p => p._id === postId);
        if (post) {
          post.comments = post.comments.filter(c => c._id !== commentId);
          post.commentsCount = commentsCount;
        }
      });

    // Delete Post
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        state.posts = state.posts.filter(p => p._id !== postId);
        state.totalPosts -= 1;
      });
  }
});

export const {
  setShowCreateModal,
  clearError,
  setFilter,
  setSortBy,
  addNewPost,
  updatePostLike,
  updatePostComments,
  removePostComment,
  toggleSavePost
} = postsSlice.actions;

export default postsSlice.reducer;