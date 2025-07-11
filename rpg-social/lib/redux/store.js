// lib/redux/store.js (Updated)
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import settingsSlice from './slices/settingsSlice';
import gameSlice from './slices/gameSlice';
import questSlice from './slices/questSlice';
import socialSlice from './slices/socialSlice';
import guildSlice from './slices/guildSlice';
import leaderboardSlice from './slices/leaderboardSlice';
import messagesSlice from './slices/messagesSlice';
import notificationSlice from './slices/notificationSlice';
import postsSlice from './slices/postsSlice';
import friendsSlice from './slices/friendsSlice';
import notificationsSlice from './slices/notificationsSlice';
import storiesSlice from './slices/storiesSlice';
import levelsSlice from './slices/levelsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    settings: settingsSlice, // Settings slice eklendi
    game: gameSlice,
    quests: questSlice,
    social: socialSlice,
    guild: guildSlice,
    leaderboard: leaderboardSlice,
    messages: messagesSlice,
    notifications: notificationSlice,
    posts: postsSlice,
    friends: friendsSlice,
    notificationsNew: notificationsSlice,
    stories: storiesSlice,
    levels: levelsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for better compatibility
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER'
        ],
        // Ignore these field paths in all actions (helpful for date objects, etc.)
        ignoredActionsPaths: [
          'meta.arg',
          'payload.timestamp',
          'payload.lastSeen',
          'payload.createdAt',
          'payload.updatedAt'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'messages.currentConversation.participants.0.lastSeen',
          'notifications.notifications.0.createdAt'
        ],
      },
    }),
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript usage (optional - uncomment if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

export default store;