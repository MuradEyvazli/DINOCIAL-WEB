import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createNotification } from './notificationsSlice';


// Search for users
export const searchUsers = createAsyncThunk(
  'friends/searchUsers',
  async ({ query }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const url = new URL('/api/users/search', window.location.origin);
      url.searchParams.append('q', query);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Arama hatası');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Send friend request
export const sendFriendRequest = createAsyncThunk(
  'friends/sendFriendRequest',
  async ({ userId, message }, { rejectWithValue, dispatch, getState }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, message })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Arkadaşlık isteği gönderilemedi');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      // Create notification for the action
      const currentUser = getState().auth.user;
      if (currentUser && data.data.recipient) {
        dispatch(createNotification({
          type: 'friend_request',
          title: 'Arkadaşlık İsteği Gönderildi',
          message: `${data.data.recipient.username} kullanıcısına arkadaşlık isteği gönderildi`,
          data: {
            recipientId: data.data.recipient._id,
            recipientName: data.data.recipient.username,
            requestId: data.data._id
          },
          showBrowser: false // Don't show browser notification for own actions
        }));
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Accept friend request
export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptFriendRequest',
  async ({ requestId }, { rejectWithValue, dispatch, getState }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'accept' })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Arkadaşlık isteği kabul edilemedi');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      // Create notification for the action
      const currentUser = getState().auth.user;
      if (currentUser && data.data.sender) {
        dispatch(createNotification({
          type: 'friend_request_accepted',
          title: 'Arkadaşlık İsteği Kabul Edildi',
          message: `${data.data.sender.username} ile artık arkadaşsınız!`,
          data: {
            friendId: data.data.sender._id,
            friendName: data.data.sender.username
          }
        }));
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Reject friend request
export const rejectFriendRequest = createAsyncThunk(
  'friends/rejectFriendRequest',
  async ({ requestId }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject' })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Arkadaşlık isteği reddedilemedi');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      // Create notification
      if (data.data.sender) {
        dispatch(createNotification({
          type: 'friend_request_rejected',
          title: 'Arkadaşlık İsteği Reddedildi',
          message: `${data.data.sender.username} kullanıcısının arkadaşlık isteği reddedildi`,
          data: {
            senderId: data.data.sender._id,
            senderName: data.data.sender.username
          },
          showBrowser: false
        }));
      }

      return { requestId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Remove friend
export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async ({ friendId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/friends/${friendId}`, {
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

      return { friendId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Follow user
export const followUser = createAsyncThunk(
  'friends/followUser',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Kullanıcı takip edilemedi');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Unfollow user
export const unfollowUser = createAsyncThunk(
  'friends/unfollowUser',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch(`/api/users/follow/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Kullanıcı takipten çıkarılamadı');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      return { userId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Get user's friends
export const getUserFriends = createAsyncThunk(
  'friends/getUserFriends',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Arkadaşlar alınamıyor');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Get friend requests
export const getFriendRequests = createAsyncThunk(
  'friends/getFriendRequests',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch('/api/friends/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Arkadaşlık istekleri alınamıyor');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Get following/followers
export const getFollowData = createAsyncThunk(
  'friends/getFollowData',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Giriş yapılmamış');
      }
      
      const response = await fetch('/api/users/follow/data', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Takip verileri alınamıyor');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState: {
    // Search
    searchResults: [],
    searchLoading: false,
    searchError: null,
    searchQuery: '',
    
    // Friends
    friends: [],
    friendsLoading: false,
    friendsError: null,
    
    // Friend Requests
    incomingRequests: [],
    outgoingRequests: [],
    requestsLoading: false,
    requestsError: null,
    
    // Following/Followers
    following: [],
    followers: [],
    followLoading: false,
    followError: null,
    
    // UI State
    selectedUser: null,
    showFriendRequests: false,
    
    // Stats
    stats: {
      friendsCount: 0,
      followingCount: 0,
      followersCount: 0,
      pendingRequestsCount: 0
    }
  },
  
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
      state.searchError = null;
    },
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    
    toggleFriendRequests: (state) => {
      state.showFriendRequests = !state.showFriendRequests;
    },
    
    clearErrors: (state) => {
      state.searchError = null;
      state.friendsError = null;
      state.requestsError = null;
      state.followError = null;
    },
    
    // Real-time updates
    addIncomingRequest: (state, action) => {
      const request = action.payload;
      if (!state.incomingRequests.find(req => req._id === request._id)) {
        state.incomingRequests.push(request);
        state.stats.pendingRequestsCount += 1;
      }
    },
    
    removeIncomingRequest: (state, action) => {
      const requestId = action.payload;
      state.incomingRequests = state.incomingRequests.filter(req => req._id !== requestId);
      state.stats.pendingRequestsCount = Math.max(0, state.stats.pendingRequestsCount - 1);
    },
    
    addFriend: (state, action) => {
      const friend = action.payload;
      if (!state.friends.find(f => f._id === friend._id)) {
        state.friends.push(friend);
        state.stats.friendsCount += 1;
      }
    },
    
    removeFriendFromState: (state, action) => {
      const friendId = action.payload;
      state.friends = state.friends.filter(friend => friend._id !== friendId);
      state.stats.friendsCount = Math.max(0, state.stats.friendsCount - 1);
    }
  },
  
  extraReducers: (builder) => {
    // Search Users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.users || [];
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });

    // Send Friend Request
    builder
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.outgoingRequests.push(action.payload);
        // Update search results to show request sent
        const userId = action.payload?.recipient?._id;
        if (userId) {
          const userIndex = state.searchResults.findIndex(user => user._id === userId);
          if (userIndex !== -1) {
            state.searchResults[userIndex].friendRequestSent = true;
          }
        }
      });

    // Accept Friend Request
    builder
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const response = action.payload;
        if (response && response.requestId) {
          // Remove from incoming requests using the requestId
          state.incomingRequests = state.incomingRequests.filter(req => req._id !== response.requestId);
          state.stats.pendingRequestsCount = Math.max(0, state.stats.pendingRequestsCount - 1);
          
          // Add new friend to friends list
          if (response.friend) {
            const newFriend = {
              _id: response.friend._id,
              username: response.friend.username,
              avatar: response.friend.avatar,
              characterClass: response.friend.characterClass,
              level: response.friend.level,
              stats: response.friend.stats,
              bio: response.friend.bio,
              friendshipDate: response.friend.friendshipDate
            };
            
            if (!state.friends.find(f => f._id === newFriend._id)) {
              state.friends.push(newFriend);
              state.stats.friendsCount += 1;
            }
          }
        }
      });

    // Reject Friend Request
    builder
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        const { requestId } = action.payload;
        state.incomingRequests = state.incomingRequests.filter(req => req._id !== requestId);
        state.stats.pendingRequestsCount = Math.max(0, state.stats.pendingRequestsCount - 1);
      });

    // Remove Friend
    builder
      .addCase(removeFriend.fulfilled, (state, action) => {
        const { friendId } = action.payload;
        state.friends = state.friends.filter(friend => friend._id !== friendId);
        state.stats.friendsCount = Math.max(0, state.stats.friendsCount - 1);
      });

    // Follow User
    builder
      .addCase(followUser.fulfilled, (state, action) => {
        const user = action.payload;
        if (user && user._id) {
          state.following.push(user);
          state.stats.followingCount += 1;
          
          // Update search results
          const userIndex = state.searchResults.findIndex(u => u._id === user._id);
          if (userIndex !== -1) {
            state.searchResults[userIndex].isFollowing = true;
          }
        }
      });

    // Unfollow User
    builder
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { userId } = action.payload || {};
        if (userId) {
          state.following = state.following.filter(user => user._id !== userId);
          state.stats.followingCount = Math.max(0, state.stats.followingCount - 1);
          
          // Update search results
          const userIndex = state.searchResults.findIndex(u => u._id === userId);
          if (userIndex !== -1) {
            state.searchResults[userIndex].isFollowing = false;
          }
        }
      });

    // Get User Friends
    builder
      .addCase(getUserFriends.pending, (state) => {
        state.friendsLoading = true;
        state.friendsError = null;
      })
      .addCase(getUserFriends.fulfilled, (state, action) => {
        state.friendsLoading = false;
        state.friends = action.payload.friends || [];
        state.stats.friendsCount = action.payload.friends?.length || 0;
      })
      .addCase(getUserFriends.rejected, (state, action) => {
        state.friendsLoading = false;
        state.friendsError = action.payload;
      });

    // Get Friend Requests
    builder
      .addCase(getFriendRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(getFriendRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        const { incoming, outgoing } = action.payload || {};
        state.incomingRequests = incoming || [];
        state.outgoingRequests = outgoing || [];
        state.stats.pendingRequestsCount = incoming?.length || 0;
      })
      .addCase(getFriendRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload;
      });

    // Get Follow Data
    builder
      .addCase(getFollowData.pending, (state) => {
        state.followLoading = true;
        state.followError = null;
      })
      .addCase(getFollowData.fulfilled, (state, action) => {
        state.followLoading = false;
        const { following, followers } = action.payload || {};
        state.following = following || [];
        state.followers = followers || [];
        state.stats.followingCount = following?.length || 0;
        state.stats.followersCount = followers?.length || 0;
      })
      .addCase(getFollowData.rejected, (state, action) => {
        state.followLoading = false;
        state.followError = action.payload;
      });
  }
});

export const {
  clearSearchResults,
  setSearchQuery,
  setSelectedUser,
  toggleFriendRequests,
  clearErrors,
  addIncomingRequest,
  removeIncomingRequest,
  addFriend,
  removeFriendFromState
} = friendsSlice.actions;


export default friendsSlice.reducer;