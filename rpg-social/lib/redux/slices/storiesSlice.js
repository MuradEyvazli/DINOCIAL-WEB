import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchStories = createAsyncThunk(
  'stories/fetchStories',
  async ({ includeOwn = false } = {}) => {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/stories', {
      headers: { Authorization: `Bearer ${token}` },
      params: { includeOwn }
    });
    return response.data;
  }
);

export const createStory = createAsyncThunk(
  'stories/createStory',
  async ({ content, type = 'text', visibility = 'friends' }) => {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/stories', {
      content,
      type,
      visibility
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
);

export const viewStory = createAsyncThunk(
  'stories/viewStory',
  async ({ storyId }) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`/api/stories/${storyId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { storyId, data: response.data };
  }
);

export const likeStory = createAsyncThunk(
  'stories/likeStory',
  async ({ storyId }) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`/api/stories/${storyId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { storyId, ...response.data };
  }
);

export const fetchStoryLikes = createAsyncThunk(
  'stories/fetchStoryLikes',
  async ({ storyId, page = 1, limit = 20 }) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/stories/${storyId}/like`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit }
    });
    return { storyId, ...response.data };
  }
);

export const fetchStoryViewers = createAsyncThunk(
  'stories/fetchStoryViewers',
  async ({ storyId, page = 1, limit = 20 }) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/stories/${storyId}/viewers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit }
    });
    return { storyId, ...response.data };
  }
);

export const deleteStory = createAsyncThunk(
  'stories/deleteStory',
  async ({ storyId }) => {
    const token = localStorage.getItem('token');
    await axios.delete(`/api/stories/${storyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return storyId;
  }
);

export const fetchMyStories = createAsyncThunk(
  'stories/fetchMyStories',
  async ({ includeExpired = false } = {}) => {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/stories/my', {
      headers: { Authorization: `Bearer ${token}` },
      params: { includeExpired }
    });
    return response.data;
  }
);

export const uploadStoryMedia = createAsyncThunk(
  'stories/uploadMedia',
  async ({ file }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/stories/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

const initialState = {
  storiesByUser: {}, // { userId: [stories] }
  myStories: [],
  viewersByStory: {}, // { storyId: { viewers: [], pagination } }
  likesByStory: {}, // { storyId: { likes: [], pagination } }
  currentStoryIndex: 0,
  currentUserIndex: 0,
  isViewingStories: false,
  uploadProgress: 0,
  loading: false,
  createLoading: false,
  uploadLoading: false,
  likeLoading: false,
  error: null,
  lastFetch: null,
  showCreateModal: false,
  stats: {
    totalViews: 0,
    totalStories: 0,
    activeStories: 0
  }
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    setCurrentStoryIndex: (state, action) => {
      state.currentStoryIndex = action.payload;
    },
    setCurrentUserIndex: (state, action) => {
      state.currentUserIndex = action.payload;
    },
    setIsViewingStories: (state, action) => {
      state.isViewingStories = action.payload;
    },
    setShowCreateModal: (state, action) => {
      state.showCreateModal = action.payload;
    },
    markStoryAsViewed: (state, action) => {
      const { userId, storyIndex } = action.payload;
      if (state.storiesByUser[userId] && state.storiesByUser[userId][storyIndex]) {
        state.storiesByUser[userId][storyIndex].hasViewed = true;
      }
    },
    incrementStoryViews: (state, action) => {
      const { userId, storyIndex } = action.payload;
      if (state.storiesByUser[userId] && state.storiesByUser[userId][storyIndex]) {
        state.storiesByUser[userId][storyIndex].viewCount++;
      }
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    resetStories: (state) => {
      state.storiesByUser = {};
      state.myStories = [];
      state.currentStoryIndex = 0;
      state.currentUserIndex = 0;
      state.isViewingStories = false;
    },
    // Handle real-time updates
    addNewStory: (state, action) => {
      const story = action.payload;
      const userId = story.user._id;
      
      if (!state.storiesByUser[userId]) {
        state.storiesByUser[userId] = [];
      }
      
      state.storiesByUser[userId].unshift(story);
      
      if (story.isOwn) {
        state.myStories.unshift(story);
        state.stats.totalStories++;
        state.stats.activeStories++;
      }
    },
    removeStory: (state, action) => {
      const { userId, storyId } = action.payload;
      
      if (state.storiesByUser[userId]) {
        state.storiesByUser[userId] = state.storiesByUser[userId].filter(
          story => story._id !== storyId
        );
        
        if (state.storiesByUser[userId].length === 0) {
          delete state.storiesByUser[userId];
        }
      }
      
      state.myStories = state.myStories.filter(story => story._id !== storyId);
      state.stats.activeStories--;
    },
    updateStoryViews: (state, action) => {
      const { storyId, viewCount } = action.payload;
      
      // Update in storiesByUser
      Object.keys(state.storiesByUser).forEach(userId => {
        const storyIndex = state.storiesByUser[userId].findIndex(
          story => story._id === storyId
        );
        if (storyIndex !== -1) {
          state.storiesByUser[userId][storyIndex].viewCount = viewCount;
        }
      });
      
      // Update in myStories
      const myStoryIndex = state.myStories.findIndex(story => story._id === storyId);
      if (myStoryIndex !== -1) {
        state.myStories[myStoryIndex].viewCount = viewCount;
      }
    },
    updateStoryLikes: (state, action) => {
      const { storyId, likeCount, isLiked } = action.payload;
      
      // Update in storiesByUser
      Object.keys(state.storiesByUser).forEach(userId => {
        const storyIndex = state.storiesByUser[userId].findIndex(
          story => story._id === storyId
        );
        if (storyIndex !== -1) {
          state.storiesByUser[userId][storyIndex].likeCount = likeCount;
          state.storiesByUser[userId][storyIndex].hasLiked = isLiked;
        }
      });
      
      // Update in myStories
      const myStoryIndex = state.myStories.findIndex(story => story._id === storyId);
      if (myStoryIndex !== -1) {
        state.myStories[myStoryIndex].likeCount = likeCount;
        state.myStories[myStoryIndex].hasLiked = isLiked;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch stories
      .addCase(fetchStories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.loading = false;
        state.storiesByUser = action.payload.data?.storiesByUser || action.payload.storiesByUser;
        state.lastFetch = Date.now();
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create story
      .addCase(createStory.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createStory.fulfilled, (state, action) => {
        state.createLoading = false;
        state.showCreateModal = false;
        state.uploadProgress = 0;
        
        const story = action.payload.data?.story || action.payload.story;
        const userId = story.user._id || story.user;
        
        if (!state.storiesByUser[userId]) {
          state.storiesByUser[userId] = [];
        }
        
        state.storiesByUser[userId].unshift(story);
        state.myStories.unshift(story);
        state.stats.totalStories++;
        state.stats.activeStories++;
      })
      .addCase(createStory.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.error.message;
      })
      // View story
      .addCase(viewStory.fulfilled, (state, action) => {
        const { storyId } = action.payload;
        
        // Mark story as viewed
        Object.keys(state.storiesByUser).forEach(userId => {
          const story = state.storiesByUser[userId].find(s => s._id === storyId);
          if (story) {
            story.hasViewed = true;
          }
        });
      })
      // Delete story
      .addCase(deleteStory.fulfilled, (state, action) => {
        const storyId = action.payload;
        
        // Remove from all collections
        Object.keys(state.storiesByUser).forEach(userId => {
          state.storiesByUser[userId] = state.storiesByUser[userId].filter(
            story => story._id !== storyId
          );
          
          if (state.storiesByUser[userId].length === 0) {
            delete state.storiesByUser[userId];
          }
        });
        
        state.myStories = state.myStories.filter(story => story._id !== storyId);
        state.stats.activeStories--;
      })
      // Fetch my stories
      .addCase(fetchMyStories.fulfilled, (state, action) => {
        state.myStories = action.payload.stories;
        state.stats = action.payload.stats;
      })
      // Fetch story viewers
      .addCase(fetchStoryViewers.fulfilled, (state, action) => {
        const { storyId, viewers, pagination } = action.payload.data;
        state.viewersByStory[storyId] = { viewers, pagination };
      })
      // Like story
      .addCase(likeStory.pending, (state) => {
        state.likeLoading = true;
      })
      .addCase(likeStory.fulfilled, (state, action) => {
        state.likeLoading = false;
        const { storyId, data } = action.payload;
        const { isLiked, likeCount } = data;
        
        // Update in storiesByUser
        Object.keys(state.storiesByUser).forEach(userId => {
          const storyIndex = state.storiesByUser[userId].findIndex(
            story => story._id === storyId
          );
          if (storyIndex !== -1) {
            state.storiesByUser[userId][storyIndex].likeCount = likeCount;
            state.storiesByUser[userId][storyIndex].hasLiked = isLiked;
          }
        });
        
        // Update in myStories
        const myStoryIndex = state.myStories.findIndex(story => story._id === storyId);
        if (myStoryIndex !== -1) {
          state.myStories[myStoryIndex].likeCount = likeCount;
          state.myStories[myStoryIndex].hasLiked = isLiked;
        }
      })
      .addCase(likeStory.rejected, (state) => {
        state.likeLoading = false;
      })
      // Fetch story likes
      .addCase(fetchStoryLikes.fulfilled, (state, action) => {
        const { storyId, data } = action.payload;
        const { likes, pagination } = data;
        state.likesByStory[storyId] = { likes, pagination };
      })
      // Upload media
      .addCase(uploadStoryMedia.pending, (state) => {
        state.uploadLoading = true;
        state.uploadProgress = 0;
      })
      .addCase(uploadStoryMedia.fulfilled, (state) => {
        state.uploadLoading = false;
        state.uploadProgress = 100;
      })
      .addCase(uploadStoryMedia.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadProgress = 0;
        state.error = action.payload || 'Upload failed';
      });
  }
});

export const {
  setCurrentStoryIndex,
  setCurrentUserIndex,
  setIsViewingStories,
  setShowCreateModal,
  markStoryAsViewed,
  incrementStoryViews,
  setUploadProgress,
  resetStories,
  addNewStory,
  removeStory,
  updateStoryViews,
  updateStoryLikes
} = storiesSlice.actions;

export default storiesSlice.reducer;