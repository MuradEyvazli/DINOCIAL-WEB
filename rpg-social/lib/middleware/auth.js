// lib/middleware/auth.js - Clean version without conflicts
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

// Error types
export const ERROR_TYPES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE'
};

// Custom error class
export class ApiError extends Error {
  constructor(type, message, statusCode = 500) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// JWT Token oluştur - Both id and userId for compatibility
export const generateToken = (userId) => {
  return jwt.sign({ id: userId, userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// JWT Token'ı doğrula
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Geçersiz token');
  }
};

// Authentication for Next.js App Router
export const authenticateToken = async (request) => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(ERROR_TYPES.UNAUTHORIZED, 'Token gerekli', 401);
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(ERROR_TYPES.TOKEN_EXPIRED, 'Token süresi dolmuş', 401);
    }
    throw new ApiError(ERROR_TYPES.INVALID_TOKEN, 'Geçersiz token', 401);
  }
};

// Get authenticated user for Next.js App Router
export const getAuthenticatedUser = async (request) => {
  try {
    await connectToDatabase();
    
    const decoded = await authenticateToken(request);
    // Support both id and userId for backward compatibility
    const userId = decoded.id || decoded.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new ApiError(ERROR_TYPES.NOT_FOUND, 'Kullanıcı bulunamadı', 404);
    }
    
    if (!user.isActive) {
      throw new ApiError(ERROR_TYPES.ACCOUNT_INACTIVE, 'Hesap deaktif durumda', 403);
    }
    
    // Update last active time safely
    try {
      if (typeof user.updateLastActive === 'function') {
        user.updateLastActive();
        await user.save();
      } else {
        user.lastActiveAt = new Date();
        await user.save();
      }
    } catch (updateError) {
      console.warn('Failed to update last active in getAuthenticatedUser:', updateError);
      // Don't fail auth for this
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Optional auth for Next.js App Router
export const getOptionalAuthenticatedUser = async (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      await connectToDatabase();
      
      const userId = decoded.id || decoded.userId;
      const user = await User.findById(userId).select('-password');
      
      if (user && user.isActive) {
        try {
          if (typeof user.updateLastActive === 'function') {
            user.updateLastActive();
            await user.save();
          } else {
            user.lastActiveAt = new Date();
            await user.save();
          }
        } catch (updateError) {
          console.warn('Failed to update last active in optional auth:', updateError);
        }
        return user;
      }
      
      return null;
    } catch (tokenError) {
      console.log('Optional auth token error:', tokenError.message);
      return null;
    }
  } catch (error) {
    console.error('Optional auth error:', error);
    return null;
  }
};

// Check if user owns resource
export const checkResourceOwnership = (user, resourceUserId) => {
  if (user._id.toString() !== resourceUserId.toString()) {
    throw new ApiError(ERROR_TYPES.FORBIDDEN, 'Bu kaynağa erişim yetkiniz yok', 403);
  }
};

// Admin check for App Router
export const requireAdminUser = (user) => {
  if (user.role !== 'admin') {
    throw new ApiError(ERROR_TYPES.FORBIDDEN, 'Admin yetkisi gerekli', 403);
  }
};

// Rate limiting
const requestCounts = new Map();
const rateLimitMap = new Map(); // For legacy compatibility

export const rateLimitMiddleware = (maxRequests = 100, windowMs = 60 * 1000) => {
  return (request) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
              request.headers.get('x-real-ip') || 
              request.ip ||
              'unknown';
    
    const now = Date.now();
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime < now) {
        requestCounts.delete(key);
      }
    }
    
    // Get or create current count
    let current = requestCounts.get(ip);
    
    if (!current || current.resetTime < now) {
      current = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    current.count++;
    requestCounts.set(ip, current);
    
    if (current.count > maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      throw new ApiError(
        'RATE_LIMIT_EXCEEDED', 
        `Çok fazla istek. ${retryAfter} saniye sonra tekrar deneyin.`, 
        429
      );
    }
    
    return {
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    };
  };
};

// Error handler for Next.js App Router
export const handleApiError = (error) => {
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    type: error.type || 'Unknown',
    statusCode: error.statusCode || 500
  });

  // Handle ApiError
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: {
        type: error.type,
        message: error.message
      }
    }, { status: error.statusCode });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return NextResponse.json({
      success: false,
      error: {
        type: ERROR_TYPES.INVALID_TOKEN,
        message: 'Geçersiz token formatı'
      }
    }, { status: 401 });
  }

  if (error.name === 'TokenExpiredError') {
    return NextResponse.json({
      success: false,
      error: {
        type: ERROR_TYPES.TOKEN_EXPIRED,
        message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
      }
    }, { status: 401 });
  }

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));

    return NextResponse.json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Veri doğrulama hatası',
        details
      }
    }, { status: 400 });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const message = field === 'email' 
      ? 'Bu e-posta adresi zaten kullanılıyor'
      : field === 'username'
      ? 'Bu kullanıcı adı zaten kullanılıyor'
      : 'Bu değer zaten kullanılıyor';

    return NextResponse.json({
      success: false,
      error: {
        type: 'CONFLICT',
        message,
        details: { field, value: error.keyValue[field] }
      }
    }, { status: 409 });
  }

  // Default internal server error
  return NextResponse.json({
    success: false,
    error: {
      type: 'INTERNAL_SERVER_ERROR',
      message: 'Sunucu hatası'
    }
  }, { status: 500 });
};

// Success response helper
export const successResponse = (data, message = 'İşlem başarılı', statusCode = 200) => {
  return NextResponse.json({
    success: true,
    message,
    data
  }, { status: statusCode });
};

// Wrapper for API routes with authentication
export const withAuth = (handler) => {
  return async (request, context) => {
    try {
      const user = await getAuthenticatedUser(request);
      return await handler(request, { ...context, user });
    } catch (error) {
      return handleApiError(error);
    }
  };
};

// Wrapper for API routes with optional authentication
export const withOptionalAuth = (handler) => {
  return async (request, context) => {
    try {
      const user = await getOptionalAuthenticatedUser(request);
      return await handler(request, { ...context, user });
    } catch (error) {
      return handleApiError(error);
    }
  };
};

// Wrapper for API routes with rate limiting
export const withRateLimit = (maxRequests = 100, windowMs = 60 * 1000) => {
  return (handler) => {
    return async (request, context) => {
      try {
        const rateLimit = rateLimitMiddleware(maxRequests, windowMs);
        const rateLimitInfo = rateLimit(request);
        
        const response = await handler(request, { ...context, rateLimitInfo });
        
        // Add rate limit headers
        if (response instanceof NextResponse) {
          response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
          response.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());
        }
        
        return response;
      } catch (error) {
        return handleApiError(error);
      }
    };
  };
};

// Combined auth + rate limit wrapper
export const withAuthAndRateLimit = (maxRequests = 60, windowMs = 60 * 1000) => {
  return (handler) => {
    return async (request, context) => {
      try {
        const rateLimit = rateLimitMiddleware(maxRequests, windowMs);
        const rateLimitInfo = rateLimit(request);
        
        const user = await getAuthenticatedUser(request);
        
        const response = await handler(request, { ...context, user, rateLimitInfo });
        
        // Add rate limit headers
        if (response instanceof NextResponse) {
          response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
          response.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());
        }
        
        return response;
      } catch (error) {
        return handleApiError(error);
      }
    };
  };
};

// Legacy Express-style middleware for backward compatibility
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Token gerekli.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    await connectToDatabase();
    
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token geçersiz. Kullanıcı bulunamadı.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hesap deaktif edilmiş.'
      });
    }

    req.user = user;
    
    // Update last active safely
    try {
      if (typeof user.updateLastActive === 'function') {
        user.updateLastActive();
        await user.save();
      } else {
        user.lastActiveAt = new Date();
        await user.save();
      }
    } catch (updateError) {
      console.warn('Failed to update last active:', updateError);
      // Don't fail auth for this
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token formatı.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Kimlik doğrulama hatası.'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      await connectToDatabase();
      
      const userId = decoded.id || decoded.userId;
      const user = await User.findById(userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        try {
          if (typeof user.updateLastActive === 'function') {
            user.updateLastActive();
            await user.save();
          } else {
            user.lastActiveAt = new Date();
            await user.save();
          }
        } catch (updateError) {
          console.warn('Failed to update last active in legacy optionalAuth:', updateError);
        }
      }
    } catch (tokenError) {
      console.log('Optional auth token error:', tokenError.message);
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli.'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin yetkisi gerekli.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yetkilendirme hatası.'
    });
  }
};

export const rateLimit = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const forwarded = req.headers?.['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : 
              req.headers?.['x-real-ip'] || 
              req.connection?.remoteAddress || 
              req.socket?.remoteAddress ||
              'unknown';
              
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userLimit = rateLimitMap.get(ip);
    
    if (now > userLimit.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
      return res ? res.status(429).json({
        success: false,
        message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
        retryAfter: retryAfter
      }) : next(new Error('Rate limit exceeded'));
    }
    
    userLimit.count++;
    next();
  };
};

// Default export
export default {
  generateToken,
  verifyToken,
  getAuthenticatedUser,
  getOptionalAuthenticatedUser,
  checkResourceOwnership,
  requireAdminUser,
  rateLimitMiddleware,
  handleApiError,
  successResponse,
  withAuth,
  withOptionalAuth,
  withRateLimit,
  withAuthAndRateLimit,
  // Legacy exports
  authenticate,
  optionalAuth,
  requireAdmin,
  rateLimit
};