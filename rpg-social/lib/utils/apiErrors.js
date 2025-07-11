// lib/utils/apiErrors.js
import { NextResponse } from 'next/server';

// Error types
export const ERROR_TYPES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN'
};

// Error messages in Turkish
export const ERROR_MESSAGES = {
  [ERROR_TYPES.UNAUTHORIZED]: 'Yetkilendirme gerekli',
  [ERROR_TYPES.FORBIDDEN]: 'Bu işlem için yetkiniz yok',
  [ERROR_TYPES.NOT_FOUND]: 'Kaynak bulunamadı',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Veri doğrulama hatası',
  [ERROR_TYPES.CONFLICT]: 'Kaynak çakışması',
  [ERROR_TYPES.INTERNAL_SERVER_ERROR]: 'Sunucu hatası',
  [ERROR_TYPES.BAD_REQUEST]: 'Geçersiz istek',
  [ERROR_TYPES.TOKEN_EXPIRED]: 'Token süresi dolmuş',
  [ERROR_TYPES.INVALID_TOKEN]: 'Geçersiz token'
};

// HTTP status codes
export const STATUS_CODES = {
  [ERROR_TYPES.UNAUTHORIZED]: 401,
  [ERROR_TYPES.FORBIDDEN]: 403,
  [ERROR_TYPES.NOT_FOUND]: 404,
  [ERROR_TYPES.VALIDATION_ERROR]: 400,
  [ERROR_TYPES.CONFLICT]: 409,
  [ERROR_TYPES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_TYPES.BAD_REQUEST]: 400,
  [ERROR_TYPES.TOKEN_EXPIRED]: 401,
  [ERROR_TYPES.INVALID_TOKEN]: 401
};

// Custom error class
export class ApiError extends Error {
  constructor(type, message = null, details = null) {
    super(message || ERROR_MESSAGES[type]);
    this.type = type;
    this.statusCode = STATUS_CODES[type];
    this.details = details;
    this.name = 'ApiError';
  }
}

// Error handler function
export const handleApiError = (error) => {
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    type: error.type || 'Unknown'
  });

  // Handle different error types
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: {
        type: error.type,
        message: error.message,
        details: error.details
      }
    }, { status: error.statusCode });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return NextResponse.json({
      success: false,
      error: {
        type: ERROR_TYPES.INVALID_TOKEN,
        message: ERROR_MESSAGES[ERROR_TYPES.INVALID_TOKEN]
      }
    }, { status: 401 });
  }

  if (error.name === 'TokenExpiredError') {
    return NextResponse.json({
      success: false,
      error: {
        type: ERROR_TYPES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES[ERROR_TYPES.TOKEN_EXPIRED]
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
        type: ERROR_TYPES.VALIDATION_ERROR,
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
        type: ERROR_TYPES.CONFLICT,
        message,
        details: { field, value: error.keyValue[field] }
      }
    }, { status: 409 });
  }

  // Default internal server error
  return NextResponse.json({
    success: false,
    error: {
      type: ERROR_TYPES.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES[ERROR_TYPES.INTERNAL_SERVER_ERROR]
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

// Validation response helper
export const validationErrorResponse = (errors) => {
  return NextResponse.json({
    success: false,
    error: {
      type: ERROR_TYPES.VALIDATION_ERROR,
      message: 'Veri doğrulama hatası',
      details: errors
    }
  }, { status: 400 });
};

// Authorization helpers
export const unauthorizedResponse = (message = null) => {
  return NextResponse.json({
    success: false,
    error: {
      type: ERROR_TYPES.UNAUTHORIZED,
      message: message || ERROR_MESSAGES[ERROR_TYPES.UNAUTHORIZED]
    }
  }, { status: 401 });
};

export const forbiddenResponse = (message = null) => {
  return NextResponse.json({
    success: false,
    error: {
      type: ERROR_TYPES.FORBIDDEN,
      message: message || ERROR_MESSAGES[ERROR_TYPES.FORBIDDEN]
    }
  }, { status: 403 });
};

export const notFoundResponse = (message = null) => {
  return NextResponse.json({
    success: false,
    error: {
      type: ERROR_TYPES.NOT_FOUND,
      message: message || ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND]
    }
  }, { status: 404 });
};

export const conflictResponse = (message = null) => {
  return NextResponse.json({
    success: false,
    error: {
      type: ERROR_TYPES.CONFLICT,
      message: message || ERROR_MESSAGES[ERROR_TYPES.CONFLICT]
    }
  }, { status: 409 });
};

// Wrapper for API routes to handle errors automatically
export const withErrorHandler = (handler) => {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

// Rate limiting helper (simple in-memory store - for production use Redis)
const requestCounts = new Map();

export const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  return (request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (data.timestamp < windowStart) {
        requestCounts.delete(key);
      }
    }
    
    // Check current IP
    const current = requestCounts.get(ip) || { count: 0, timestamp: now };
    
    if (current.timestamp < windowStart) {
      current.count = 1;
      current.timestamp = now;
    } else {
      current.count++;
    }
    
    requestCounts.set(ip, current);
    
    if (current.count > maxRequests) {
      throw new ApiError(ERROR_TYPES.BAD_REQUEST, 'Çok fazla istek gönderildi');
    }
  };
};