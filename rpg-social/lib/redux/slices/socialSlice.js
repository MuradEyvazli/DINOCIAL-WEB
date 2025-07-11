// lib/redux/slices/socialSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchPosts = createAsyncThunk(
  'social/fetchPosts',
  async ({ region, page = 1, limit = 10 }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`/api/posts?region=${region}&page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPost = createAsyncThunk(
  'social/createPost',
  async ({ content, region }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ content, region }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addInteraction = createAsyncThunk(
  'social/addInteraction',
  async ({ postId, type, value = 1 }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`/api/posts/${postId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ type, value }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'social/addComment',
  async ({ postId, content }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  posts: [],
  currentRegionPosts: [],
  userPosts: [],
  currentPage: 1,
  hasMorePosts: true,
  isLoading: false,
  isCreatingPost: false,
  error: null,
  interactions: {},
  comments: {},
  feed: {
    humor_valley: [],
    emotion_forest: [],
    knowledge_peak: [],
    creativity_realm: [],
    debate_arena: [],
  },
};

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    setCurrentRegionPosts: (state, action) => {
      const { region, posts } = action.payload;
      state.feed[region] = posts;
      state.currentRegionPosts = posts;
    },
    
    addPostToFeed: (state, action) => {
      const post = action.payload;
      state.posts.unshift(post);
      
      if (state.feed[post.region]) {
        state.feed[post.region].unshift(post);
      }
      
      if (post.region === state.currentRegion) {
        state.currentRegionPosts.unshift(post);
      }
    },
    
    updatePostInteraction: (state, action) => {
      const { postId, type, value, userId } = action.payload;
      
      // Update in all relevant arrays
      [state.posts, state.currentRegionPosts, state.userPosts].forEach(postArray => {
        const post = postArray.find(p => p.id === postId);
        if (post) {
          if (!post.interactions) post.interactions = [];
          
          // Remove existing interaction from this user for this type
          post.interactions = post.interactions.filter(
            i => !(i.userId === userId && i.type === type)
          );
          
          // Add new interaction if value > 0
          if (value > 0) {
            post.interactions.push({
              id: `${postId}_${userId}_${type}`,
              userId,
              type,
              value,
              createdAt: new Date().toISOString(),
            });
          }
          
          // Recalculate impact score
          post.impactScore = calculateImpactScore(post.interactions);
        }
      });
      
      // Also update in region feed
      Object.keys(state.feed).forEach(region => {
        const post = state.feed[region].find(p => p.id === postId);
        if (post) {
          if (!post.interactions) post.interactions = [];
          
          post.interactions = post.interactions.filter(
            i => !(i.userId === userId && i.type === type)
          );
          
          if (value > 0) {
            post.interactions.push({
              id: `${postId}_${userId}_${type}`,
              userId,
              type,
              value,
              createdAt: new Date().toISOString(),
            });
          }
          
          post.impactScore = calculateImpactScore(post.interactions);
        }
      });
    },
    
    addCommentToPost: (state, action) => {
      const { postId, comment } = action.payload;
      
      [state.posts, state.currentRegionPosts, state.userPosts].forEach(postArray => {
        const post = postArray.find(p => p.id === postId);
        if (post) {
          if (!post.comments) post.comments = [];
          post.comments.push(comment);
        }
      });
      
      Object.keys(state.feed).forEach(region => {
        const post = state.feed[region].find(p => p.id === postId);
        if (post) {
          if (!post.comments) post.comments = [];
          post.comments.push(comment);
        }
      });
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetFeed: (state) => {
      state.posts = [];
      state.currentRegionPosts = [];
      state.currentPage = 1;
      state.hasMorePosts = true;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { posts, page, hasMore, region } = action.payload;
        
        if (page === 1) {
          state.posts = posts;
          state.feed[region] = posts;
          state.currentRegionPosts = posts;
        } else {
          // Safely add posts, checking if arrays exist
          if (Array.isArray(posts)) {
            state.posts.push(...posts);
            if (!state.feed[region]) {
              state.feed[region] = [];
            }
            state.feed[region].push(...posts);
            state.currentRegionPosts.push(...posts);
          }
        }
        
        state.currentPage = page;
        state.hasMorePosts = hasMore;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.isCreatingPost = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isCreatingPost = false;
        const post = action.payload;
        
        state.posts.unshift(post);
        state.userPosts.unshift(post);
        
        if (state.feed[post.region]) {
          state.feed[post.region].unshift(post);
        }
        
        if (post.region === state.currentRegion) {
          state.currentRegionPosts.unshift(post);
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isCreatingPost = false;
        state.error = action.payload;
      })
      
      // Add Interaction
      .addCase(addInteraction.fulfilled, (state, action) => {
        const { postId, interaction } = action.payload;
        socialSlice.caseReducers.updatePostInteraction(state, {
          payload: {
            postId,
            type: interaction.type,
            value: interaction.value,
            userId: interaction.userId,
          },
        });
      })
      
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        socialSlice.caseReducers.addCommentToPost(state, {
          payload: { postId, comment },
        });
      });
  },
});

// Helper function to calculate impact score
const calculateImpactScore = (interactions) => {
  if (!interactions || interactions.length === 0) return 0;
  
  const weights = {
    power: 1,
    wisdom: 1.2,
    creativity: 1.5,
    support: 0.8,
  };
  
  return interactions.reduce((total, interaction) => {
    const weight = weights[interaction.type] || 1;
    return total + (interaction.value * weight);
  }, 0);
};

export const {
  setCurrentRegionPosts,
  addPostToFeed,
  updatePostInteraction,
  addCommentToPost,
  clearError,
  resetFeed,
} = socialSlice.actions;

export default socialSlice.reducer;