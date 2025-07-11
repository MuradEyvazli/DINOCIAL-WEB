// app/api/nexus/realtime/route.js - Real-time system metrics
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { Message } from '@/lib/models/Message';
import os from 'os';

// Verify nexus token
const verifyNexusToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET + '_NEXUS');
  } catch (error) {
    throw new Error('Invalid nexus token');
  }
};

// Get system performance metrics
const getSystemPerformance = () => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);

    const loadAverage = os.loadavg();
    const cpuUsage = Math.round(loadAverage[0] * 10); // Approximate CPU usage

    const uptime = os.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);

    return {
      memory: {
        total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100, // GB
        used: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100, // GB
        free: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100, // GB
        usagePercent: memUsagePercent
      },
      cpu: {
        usage: Math.min(cpuUsage, 100), // Cap at 100%
        loadAverage: loadAverage
      },
      uptime: {
        seconds: uptime,
        hours: uptimeHours,
        days: uptimeDays,
        formatted: `${uptimeDays}d ${uptimeHours % 24}h`
      },
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version
    };
  } catch (error) {
    console.error('System performance error:', error);
    return {
      memory: { total: 0, used: 0, free: 0, usagePercent: 0 },
      cpu: { usage: 0, loadAverage: [0, 0, 0] },
      uptime: { seconds: 0, hours: 0, days: 0, formatted: '0d 0h' },
      platform: 'unknown',
      arch: 'unknown',
      nodeVersion: process.version
    };
  }
};

// Get real-time application metrics
const getApplicationMetrics = async () => {
  try {
    await connectToDatabase();

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Parallel queries for real-time metrics
    const [
      onlineUsers,
      recentMessages,
      hourlyActiveUsers,
      dailyActiveUsers,
      recentRegistrations
    ] = await Promise.all([
      // Users active in last 5 minutes (considered online)
      User.countDocuments({
        isActive: true,
        lastActiveAt: { $gte: fiveMinutesAgo }
      }),

      // Messages sent in last hour
      Message.countDocuments({
        isDeleted: false,
        createdAt: { $gte: oneHourAgo }
      }),

      // Users active in last hour
      User.countDocuments({
        isActive: true,
        lastActiveAt: { $gte: oneHourAgo }
      }),

      // Users active in last 24 hours
      User.countDocuments({
        isActive: true,
        lastActiveAt: { $gte: oneDayAgo }
      }),

      // New registrations in last 24 hours
      User.countDocuments({
        isActive: true,
        createdAt: { $gte: oneDayAgo }
      })
    ]);

    // Calculate messaging rate (messages per minute in last hour)
    const messagingRate = Math.round(recentMessages / 60);

    // Database connection status
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbStatus] || 'unknown';

    return {
      onlineUsers,
      recentMessages,
      messagingRate,
      hourlyActiveUsers,
      dailyActiveUsers,
      recentRegistrations,
      database: {
        status: dbStatusText,
        readyState: dbStatus
      },
      activeConnections: onlineUsers, // For compatibility
      timestamp: now
    };
  } catch (error) {
    console.error('Application metrics error:', error);
    return {
      onlineUsers: 0,
      recentMessages: 0,
      messagingRate: 0,
      hourlyActiveUsers: 0,
      dailyActiveUsers: 0,
      recentRegistrations: 0,
      database: { status: 'error', readyState: 0 },
      activeConnections: 0,
      timestamp: new Date()
    };
  }
};

// Get security metrics
const getSecurityMetrics = async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for suspicious activity (high frequency actions)
    const suspiciousLogins = await User.countDocuments({
      'moderationInfo.warnings': { $exists: true, $not: { $size: 0 } },
      lastLoginAt: { $gte: oneDayAgo }
    });

    const bannedUsers = await User.countDocuments({
      'moderationInfo.isBanned': true
    });

    return {
      suspiciousActivity: suspiciousLogins,
      bannedUsers,
      lastSecurityScan: now,
      threatLevel: suspiciousLogins > 10 ? 'high' : suspiciousLogins > 5 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Security metrics error:', error);
    return {
      suspiciousActivity: 0,
      bannedUsers: 0,
      lastSecurityScan: new Date(),
      threatLevel: 'unknown'
    };
  }
};

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Nexus token required'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyNexusToken(token);

    // Verify admin privileges
    await connectToDatabase();
    const admin = await User.findById(decoded.adminId).select('role').lean();
    
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    // Get all metrics in parallel
    const [systemPerf, appMetrics, securityMetrics] = await Promise.all([
      getSystemPerformance(),
      getApplicationMetrics(),
      getSecurityMetrics()
    ]);

    // Calculate overall system load (weighted average)
    const systemLoad = Math.round(
      (systemPerf.cpu.usage * 0.4 + 
       systemPerf.memory.usagePercent * 0.4 + 
       Math.min(appMetrics.messagingRate * 2, 100) * 0.2)
    );

    const response = {
      success: true,
      timestamp: new Date(),
      
      // For dashboard compatibility
      onlineUsers: appMetrics.onlineUsers,
      activeConnections: appMetrics.activeConnections,
      systemLoad,
      
      // Detailed metrics
      system: systemPerf,
      application: appMetrics,
      security: securityMetrics,
      
      // Health indicators
      health: {
        overall: systemLoad < 70 ? 'healthy' : systemLoad < 90 ? 'warning' : 'critical',
        database: appMetrics.database.status === 'connected' ? 'healthy' : 'error',
        memory: systemPerf.memory.usagePercent < 80 ? 'healthy' : 'warning',
        cpu: systemPerf.cpu.usage < 80 ? 'healthy' : 'warning'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Nexus realtime error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Real-time data unavailable',
      onlineUsers: 0,
      activeConnections: 0,
      systemLoad: 0
    }, { status: 500 });
  }
}