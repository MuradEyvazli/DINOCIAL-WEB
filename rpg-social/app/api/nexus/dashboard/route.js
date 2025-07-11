// app/api/nexus/dashboard/route.js - Admin dashboard data
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { Message, Conversation } from '@/lib/models/Message';
import Post from '@/lib/models/Post';
import Guild from '@/lib/models/Guild';
import AdminLog from '@/lib/models/AdminLog';

// Verify nexus token
const verifyNexusToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET + '_NEXUS');
  } catch (error) {
    throw new Error('Invalid nexus token');
  }
};

// Get system statistics
const getSystemStats = async () => {
  try {
    await connectToDatabase();

    // Get current date ranges
    const now = new Date();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalUsers,
      weeklyUsers,
      totalPosts,
      weeklyPosts,
      totalGuilds,
      totalMessages,
      activeUsersToday,
      recentActivity
    ] = await Promise.all([
      // Total users
      User.countDocuments({ isActive: true }),
      
      // Weekly new users
      User.countDocuments({ 
        isActive: true,
        createdAt: { $gte: startOfWeek }
      }),
      
      // Total posts
      Post.countDocuments({ isDeleted: { $ne: true } }),
      
      // Weekly posts
      Post.countDocuments({ 
        isDeleted: { $ne: true },
        createdAt: { $gte: startOfWeek }
      }),
      
      // Total guilds
      Guild.countDocuments({ isActive: true }),
      
      // Total messages
      Message.countDocuments({ isDeleted: false }),
      
      // Active users today (logged in within last 24 hours)
      User.countDocuments({
        isActive: true,
        lastActiveAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }),
      
      // Recent admin activities
      AdminLog.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('admin', 'username')
    ]);

    // Calculate growth percentages
    const previousWeekUsers = await User.countDocuments({
      isActive: true,
      createdAt: { 
        $gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
        $lt: startOfWeek
      }
    });

    const previousWeekPosts = await Post.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { 
        $gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
        $lt: startOfWeek
      }
    });

    const userGrowth = previousWeekUsers > 0 
      ? Math.round(((weeklyUsers - previousWeekUsers) / previousWeekUsers) * 100)
      : 100;

    const postGrowth = previousWeekPosts > 0
      ? Math.round(((weeklyPosts - previousWeekPosts) / previousWeekPosts) * 100)
      : 100;

    // User level distribution
    const levelDistribution = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$level', 10] }, then: '1-10' },
                { case: { $lte: ['$level', 25] }, then: '11-25' },
                { case: { $lte: ['$level', 50] }, then: '26-50' },
                { case: { $lte: ['$level', 75] }, then: '51-75' }
              ],
              default: '76-100'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Character class distribution
    const classDistribution = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$characterClass.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Most active regions
    const regionActivity = await Post.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$region',
          postCount: { $sum: 1 }
        }
      },
      { $sort: { postCount: -1 } },
      { $limit: 5 }
    ]);

    return {
      totalUsers,
      activeUsers: activeUsersToday,
      userGrowth,
      totalPosts,
      postGrowth,
      totalGuilds,
      totalMessages,
      weeklyNewUsers: weeklyUsers,
      weeklyNewPosts: weeklyPosts,
      levelDistribution,
      classDistribution,
      regionActivity,
      recentActivity: recentActivity.map(activity => ({
        id: activity._id,
        action: activity.action,
        admin: activity.admin?.username || 'System',
        targetType: activity.targetType,
        timestamp: activity.createdAt,
        severity: activity.severity
      }))
    };
  } catch (error) {
    console.error('System stats error:', error);
    throw error;
  }
};

// Get user activity metrics
const getUserMetrics = async () => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const metrics = await User.aggregate([
      {
        $facet: {
          // Online users (active in last 5 minutes)
          onlineUsers: [
            {
              $match: {
                isActive: true,
                lastActiveAt: { $gte: new Date(now.getTime() - 5 * 60 * 1000) }
              }
            },
            { $count: 'count' }
          ],
          
          // Daily active users
          dailyActive: [
            {
              $match: {
                isActive: true,
                lastActiveAt: { $gte: last24h }
              }
            },
            { $count: 'count' }
          ],
          
          // Weekly active users
          weeklyActive: [
            {
              $match: {
                isActive: true,
                lastActiveAt: { $gte: last7d }
              }
            },
            { $count: 'count' }
          ],
          
          // Banned users
          bannedUsers: [
            {
              $match: {
                'moderationInfo.isBanned': true
              }
            },
            { $count: 'count' }
          ],
          
          // Users by registration date (last 30 days)
          registrationTrend: [
            {
              $match: {
                createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt'
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
          ]
        }
      }
    ]);

    return {
      onlineUsers: metrics[0].onlineUsers[0]?.count || 0,
      dailyActive: metrics[0].dailyActive[0]?.count || 0,
      weeklyActive: metrics[0].weeklyActive[0]?.count || 0,
      bannedUsers: metrics[0].bannedUsers[0]?.count || 0,
      registrationTrend: metrics[0].registrationTrend
    };
  } catch (error) {
    console.error('User metrics error:', error);
    throw error;
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

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId)
      .select('username email role nexusProfile lastActiveAt')
      .lean();

    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    // Get system statistics and user metrics in parallel
    const [systemStats, userMetrics] = await Promise.all([
      getSystemStats(),
      getUserMetrics()
    ]);
    
    // Get additional security metrics
    const failedLogins = await AdminLog.countDocuments({
      action: 'FAILED_LOGIN',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    // Calculate a simple security score
    let securityScore = 100;
    if (failedLogins > 50) securityScore -= 20;
    else if (failedLogins > 20) securityScore -= 10;
    else if (failedLogins > 10) securityScore -= 5;
    
    if (userMetrics.bannedUsers > 50) securityScore -= 10;
    else if (userMetrics.bannedUsers > 20) securityScore -= 5;
    
    securityScore = Math.max(0, securityScore);

    // Log dashboard access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_DASHBOARD_ACCESS',
      'system',
      null,
      {
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      adminProfile: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        nexusLevel: admin.role === 'super_admin' ? 'OMEGA' : 'ALPHA',
        lastAccess: admin.nexusProfile?.lastAccess,
        accessCount: admin.nexusProfile?.accessCount || 0
      },
      systemStats: {
        ...systemStats,
        ...userMetrics,
        failedLogins,
        securityScore,
        bannedUsers: userMetrics.bannedUsers
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Nexus dashboard error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Dashboard data loading failed'
    }, { status: 500 });
  }
}