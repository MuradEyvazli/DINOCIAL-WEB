// server.js - Socket.IO server setup
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store user socket mappings
const userSockets = new Map();

// Authenticate socket connection
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Make io globally accessible
  global.io = io;
  
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected (${socket.userId})`);
    
    // Store user socket mapping
    userSockets.set(socket.userId, socket.id);
    global.userSockets = userSockets;
    
    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Notify others that user came online
    socket.broadcast.emit('user:status', {
      userId: socket.userId,
      status: 'online',
      timestamp: new Date().toISOString()
    });
    
    // Handle joining conversation rooms
    socket.on('join:conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.username} joined conversation ${conversationId}`);
    });
    
    // Handle leaving conversation rooms
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.username} left conversation ${conversationId}`);
    });
    
    // Message sending is handled by API endpoint via /api/messages/send
    
    // Handle typing indicators
    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId: socket.userId,
        username: socket.username,
        conversationId
      });
    });
    
    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: socket.userId,
        username: socket.username,
        conversationId
      });
    });
    
    // Handle message read status
    socket.on('message:read', ({ conversationId, messageId }) => {
      socket.to(`conversation:${conversationId}`).emit('message:read', {
        messageId,
        userId: socket.userId,
        readAt: new Date().toISOString()
      });
    });
    
    // Handle user status updates
    socket.on('status:update', (status) => {
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        status,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle post interactions
    socket.on('post:like', (data) => {
      socket.broadcast.emit('post:like', data);
    });
    
    socket.on('post:comment', (data) => {
      socket.broadcast.emit('post:comment', data);
    });
    
    socket.on('post:new', (data) => {
      socket.broadcast.emit('post:new', data);
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.username} disconnected`);
      userSockets.delete(socket.userId);
      
      // Update user's lastActiveAt in database
      try {
        const User = require('./lib/models/User');
        await User.findByIdAndUpdate(socket.userId, {
          lastActiveAt: new Date()
        });
      } catch (error) {
        console.error('Error updating user lastActiveAt:', error);
      }
      
      // Notify others that user went offline
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    });
  });

  // Make io accessible to API routes
  global.io = io;
  global.userSockets = userSockets;

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Socket.IO server ready on http://localhost:${PORT}`);
  });
});