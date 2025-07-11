# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RPG Social** (internally named "Dinocial") is a Next.js-based social media platform that combines traditional social networking with RPG (Role-Playing Game) mechanics. Users progress through levels, complete quests, join guilds, and explore regions while engaging in social activities.

## Core Architecture

### Framework Stack
- **Next.js 15.3.3** with App Router and React 19
- **Custom Socket.IO Server** (`server.js`) for real-time features
- **MongoDB + Mongoose** for data persistence
- **Redux Toolkit** for state management with 11 specialized slices
- **Tailwind CSS 4.1.8** for styling with custom PostCSS configuration
- **Framer Motion** for animations and micro-interactions

### Custom Server Setup
The application uses a custom Node.js server (`server.js`) instead of the default Next.js server to enable Socket.IO integration:
- Handles real-time messaging, typing indicators, and user presence
- JWT authentication for WebSocket connections
- Global Socket.IO instance accessible to API routes via `global.io`
- User socket mapping for targeted real-time updates

## Essential Commands

### Development & Build
```bash
npm run dev        # Starts custom server with Socket.IO on port 3000
npm run build      # Next.js production build
npm run start      # Production server (requires NODE_ENV=production)
npm run lint       # ESLint validation
```

### Key Development Notes
- Use `npm run dev` (not `next dev`) to ensure Socket.IO functionality
- Environment requires `.env.local` with MongoDB URI, JWT secret, and Cloudinary config
- Real-time features only work with the custom server setup

## State Management Architecture

### Redux Store Structure
The application uses Redux Toolkit with 11 specialized slices:

**Core Slices:**
- `authSlice` - User authentication, profiles, XP/level system
- `gameSlice` - RPG mechanics, regions, achievements
- `questSlice` - Daily/weekly quests, progress tracking
- `settingsSlice` - User preferences, avatar management (Cloudinary)

**Social Features:**
- `postsSlice` - Content creation, likes, comments
- `messagesSlice` - Real-time messaging with Socket.IO integration
- `friendsSlice` - Social connections, friend requests
- `socialSlice` - Region-based social interactions
- `guildSlice` - Guild system, memberships

**System Slices:**
- `leaderboardSlice` - Rankings and competitive features
- `notificationsSlice` - Real-time notifications with localStorage fallback

### State Management Patterns
- Consistent loading states (`isLoading`, `isSpecificOperationLoading`)
- Comprehensive error handling with specific error types
- Optimistic updates for better UX
- Socket.IO integration for real-time updates
- localStorage fallbacks for offline functionality

## Database Models & Relationships

### Core Models
**User Model:**
- RPG elements: level (1-100), XP, character classes (6 types)
- Gaming stats: quests completed, impact score, badges
- Social features: following/followers, guild memberships
- Avatar system with Cloudinary integration (multiple sizes)
- Privacy and notification preferences

**Content Models:**
- `Post` - User-generated content with region-based organization
- `Message/Conversation` - Real-time messaging with status tracking
- `Quest/UserQuest` - Template quests and individual progress
- `Guild` - Team-based features with hierarchical roles

### Key Relationships
- User ↔ Character Classes (6 types: artist, explorer, guardian, sage, entertainer, builder)
- User ↔ Regions (exploration system with level gates)
- User ↔ Quests (daily/weekly progress tracking)
- User ↔ Guilds (membership with roles and contributions)

## API Architecture

### Authentication Patterns
- JWT-based authentication with Bearer tokens
- Multiple auth helpers: `authenticateToken()`, `getAuthenticatedUser()`, `getOptionalAuthenticatedUser()`
- Rate limiting (IP-based with configurable windows)
- Automatic user activity tracking

### Real-time Integration
Socket.IO events used throughout API routes:
- `message:new` - Chat messages
- `post:like` - Social interactions
- `notification:message` - User notifications
- Room-based messaging: `conversation:${conversationId}`

### File Upload Handling
**Avatar System (Cloudinary):**
- Multiple size variants automatically generated
- Background deletion of old assets
- Progress tracking and validation

**Message Attachments (Local):**
- Secure filename generation
- File type whitelist and size limits
- Multiple files per message support

## Gaming Mechanics Integration

### Character Progression
- XP-based leveling (calculated from social activities)
- 6 character classes with unique abilities and descriptions
- Badge/achievement system with timestamp tracking
- Region exploration with level-based unlocking

### Quest System
- Daily/weekly quest templates in database
- Individual progress tracking via `UserQuest` model
- Automatic progress updates from social actions
- Quest completion triggers XP rewards and notifications

### Social-RPG Integration
- Posts and interactions contribute to quest progress
- Region-based content organization
- Guild benefits (XP bonuses, collaborative quests)
- Impact scoring system for weighted social interactions

## Development Workflow

### Database Management
- MongoDB connection with automatic pooling
- Comprehensive indexing for performance:
  - User: `{ level: -1, xp: -1 }` for leaderboards
  - Posts: `{ createdAt: -1 }` for feeds
  - Quests: `{ user: 1, status: 1 }` for progress tracking

### Real-time Features Development
- Always test with `npm run dev` to ensure Socket.IO functionality
- Use global.io in API routes for real-time updates
- Implement optimistic updates in Redux slices for better UX
- Consider offline fallbacks for critical features

### Content Organization
- Region-based content distribution (`humor_valley`, etc.)
- Level-gated access to features and content
- Privacy controls integrated into all social features

## Special Documentation

### Leaderboard System
Comprehensive ranking system documented in `LEADERBOARD_SYSTEM.md`:
- Multiple ranking categories (XP, level, posts, social impact)
- Real user data integration
- Optional authentication for public access
- Time-based filtering (daily, weekly, monthly, all-time)

### Multi-language Support
- Primary language: Turkish (TR)
- Additional support: English (EN), German (DE)
- Integrated into user preferences and UI components

## Documentation Maintenance

### CLAUDE.md Updates
This file should be updated whenever significant changes are made to the codebase:
- New features or major functionality additions
- Architecture changes or new dependencies
- API endpoint modifications or new patterns
- Database model changes or new relationships
- Development workflow changes or new commands
- Important bug fixes that affect development patterns

### Update Guidelines
- Document new patterns immediately after implementation
- Include specific file paths and line numbers for important references
- Update command examples when scripts change
- Maintain consistency with existing documentation style
- Test all documented commands and workflows before committing

## NEXUS Admin Panel

### Overview
The NEXUS Admin Panel is a comprehensive administrative interface for managing the RPG Social platform. Located at `/nexus/dashboard`, it provides full system oversight and management capabilities.

### Design & Architecture
**UI Design:**
- Clean white, black, and blue color scheme for professional appearance
- Responsive design with mobile-friendly components
- Modern card-based layout with subtle shadows and borders
- Consistent typography and spacing throughout

**Authentication:**
- JWT-based authentication with special NEXUS tokens
- Role-based access control (admin, super_admin)
- Secure logout functionality with token cleanup

### Core Features

#### 1. User Management (`/api/nexus/users`)
- **View All Users**: Paginated user list with search and filtering
- **User Details**: Individual user profiles with statistics
- **User Actions**: Ban, unban, activate, deactivate users
- **Bulk Operations**: Multi-select for batch user management
- **Delete Users**: Secure user deletion (super admin only)
- **User Statistics**: Level distribution, activity metrics

#### 2. Message Monitoring (`/api/nexus/conversations`)
- **Conversation Tracking**: View all user conversations
- **Message Statistics**: Daily message counts, activity patterns
- **Privacy Controls**: Disable or delete inappropriate conversations
- **Real-time Insights**: Who talks to whom, message frequency
- **Top Senders**: Most active users in messaging

#### 3. Friendship Management (`/api/nexus/friends`)
- **Relationship Overview**: All friendship connections
- **Friend Statistics**: Total friendships, pending requests
- **Network Analysis**: Most popular users, friendship patterns
- **Moderation Tools**: Remove inappropriate friendships
- **Growth Tracking**: Daily friendship statistics

#### 4. Content Analytics (`/api/nexus/content`)
- **Content Statistics**: Total posts, likes, comments
- **Regional Analysis**: Content distribution by regions
- **User Rankings**: Most active content creators
- **Engagement Metrics**: Like-to-post ratios, comment engagement
- **Trend Analysis**: Daily content creation patterns

#### 5. Security Management (`/api/nexus/security`)
- **Security Alerts**: Active security warnings and incidents
- **Failed Login Tracking**: Monitor unauthorized access attempts
- **Banned User Management**: Overview of banned accounts
- **Security Score**: Overall system security health
- **Threat Response**: Alert severity levels and status tracking

#### 6. System Logs (`/api/nexus/logs`)
- **Admin Activity Logs**: All administrative actions
- **System Events**: Important system operations
- **User Actions**: User-generated events and activities
- **Security Events**: Login attempts, security violations
- **Audit Trail**: Complete action history with timestamps and IP addresses

#### 7. Real-time Dashboard
- **System Health**: CPU, RAM, disk usage monitoring
- **Online Users**: Real-time user count and activity
- **Recent Activity**: Latest system events and notifications
- **Performance Metrics**: System load and response times

### Technical Implementation

#### File Structure
```
app/nexus/dashboard/page.js           # Main dashboard component
app/api/nexus/dashboard/route.js      # Dashboard data API
app/api/nexus/users/route.js          # User management API
app/api/nexus/users/[id]/route.js     # Individual user API
app/api/nexus/conversations/route.js  # Message monitoring API
app/api/nexus/friends/route.js        # Friendship tracking API
app/api/nexus/realtime/route.js       # Real-time data API
```

#### Security Features
- **Token Verification**: All API endpoints verify NEXUS tokens
- **Role Checking**: Admin/super_admin role validation
- **Action Logging**: All admin actions logged to AdminLog model
- **IP Tracking**: IP address logging for all administrative actions
- **Secure Deletion**: Soft delete with data anonymization

#### State Management
- **React State**: Local component state for UI interactions
- **Real-time Updates**: Automatic data refresh every 5 seconds
- **Loading States**: Proper loading indicators for all data fetching
- **Error Handling**: Comprehensive error handling with user feedback

#### API Integration
- **Pagination**: Efficient data loading with pagination
- **Filtering**: Advanced filtering options for all data views
- **Search**: Full-text search capabilities across all sections
- **Sorting**: Configurable sorting for data tables

### Development Notes
- **Color Scheme**: Primary blue (#2563eb), success green (#16a34a), warning yellow (#ca8a04), danger red (#dc2626)
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Performance**: Optimized database queries with aggregation pipelines
- **Accessibility**: ARIA labels and keyboard navigation support

### Admin Permissions
- **Admin**: Can view all data, moderate users and content
- **Super Admin**: Full access including user deletion and system configuration
- **Action Logging**: All administrative actions are logged for audit purposes