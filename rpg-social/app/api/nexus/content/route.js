// app/api/nexus/content/route.js - Admin content analytics
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Post from '@/lib/models/Post';
import AdminLog from '@/lib/models/AdminLog';

// Verify nexus token
const verifyNexusToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET + '_NEXUS');
  } catch (error) {
    throw new Error('Invalid nexus token');
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
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get content statistics using aggregation
    const contentStats = await Post.aggregate([
      {
        $facet: {
          // Total counts
          totalPosts: [
            { $match: { isActive: true } },
            { $count: 'count' }
          ],
          todayPosts: [
            { 
              $match: { 
                isActive: true,
                createdAt: { $gte: today }
              }
            },
            { $count: 'count' }
          ],
          
          // Likes statistics
          totalLikes: [
            { $match: { isActive: true } },
            { $unwind: '$likes' },
            { $count: 'count' }
          ],
          todayLikes: [
            { $match: { isActive: true } },
            { $unwind: '$likes' },
            { $match: { 'likes.createdAt': { $gte: today } } },
            { $count: 'count' }
          ],
          
          // Comments statistics
          totalComments: [
            { $match: { isActive: true } },
            { $unwind: '$comments' },
            { $count: 'count' }
          ],
          todayComments: [
            { $match: { isActive: true } },
            { $unwind: '$comments' },
            { $match: { 'comments.createdAt': { $gte: today } } },
            { $count: 'count' }
          ],
          
          // Region distribution
          regionDistribution: [
            { $match: { isActive: true, region: { $ne: null } } },
            {
              $group: {
                _id: '$region',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          
          // Top users by post count
          topUsers: [
            { $match: { isActive: true } },
            {
              $group: {
                _id: '$author',
                postCount: { $sum: 1 },
                totalLikes: { $sum: { $size: '$likes' } },
                totalComments: { $sum: { $size: '$comments' } }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: '$user' },
            {
              $project: {
                username: '$user.username',
                postCount: 1,
                totalLikes: 1,
                totalComments: 1,
                engagement: {
                  $add: ['$totalLikes', { $multiply: ['$totalComments', 2] }]
                }
              }
            },
            { $sort: { postCount: -1 } },
            { $limit: 10 }
          ],
          
          // Daily post trend (last 30 days)
          dailyTrend: [
            {
              $match: {
                isActive: true,
                createdAt: { $gte: lastMonth }
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
            { $sort: { _id: 1 } }
          ],
          
          // Content types distribution
          contentTypes: [
            { $match: { isActive: true } },
            {
              $group: {
                _id: '$content.type',
                count: { $sum: 1 }
              }
            }
          ],
          
          // Engagement rates
          engagementStats: [
            {
              $match: {
                isActive: true,
                createdAt: { $gte: lastWeek }
              }
            },
            {
              $project: {
                likeCount: { $size: '$likes' },
                commentCount: { $size: '$comments' },
                hasEngagement: {
                  $gt: [
                    { $add: [
                      { $size: '$likes' },
                      { $size: '$comments' }
                    ]},
                    0
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalPosts: { $sum: 1 },
                engagedPosts: {
                  $sum: { $cond: ['$hasEngagement', 1, 0] }
                },
                avgLikes: { $avg: '$likeCount' },
                avgComments: { $avg: '$commentCount' }
              }
            }
          ]
        }
      }
    ]);

    // Get the most popular region details
    const topRegion = contentStats[0].regionDistribution[0] || null;
    
    // Region name mapping
    const regionNames = {
      'humor_valley': 'Mizah Vadisi',
      'wisdom_peaks': 'Bilgelik Zirveleri',
      'achievement_arena': 'Başarı Arenası',
      'creativity_cove': 'Yaratıcılık Koyu',
      'support_sanctuary': 'Destek Tapınağı',
      'adventure_atlas': 'Macera Atlası'
    };

    // Format the response
    const formattedStats = {
      totalPosts: contentStats[0].totalPosts[0]?.count || 0,
      todayPosts: contentStats[0].todayPosts[0]?.count || 0,
      totalLikes: contentStats[0].totalLikes[0]?.count || 0,
      todayLikes: contentStats[0].todayLikes[0]?.count || 0,
      totalComments: contentStats[0].totalComments[0]?.count || 0,
      todayComments: contentStats[0].todayComments[0]?.count || 0,
      regionDistribution: contentStats[0].regionDistribution.map(region => ({
        ...region,
        _id: regionNames[region._id] || region._id
      })),
      topUsers: contentStats[0].topUsers,
      dailyTrend: contentStats[0].dailyTrend,
      contentTypes: contentStats[0].contentTypes,
      engagementStats: contentStats[0].engagementStats[0] || {
        totalPosts: 0,
        engagedPosts: 0,
        avgLikes: 0,
        avgComments: 0
      },
      topRegion: topRegion ? {
        name: regionNames[topRegion._id] || topRegion._id,
        count: topRegion.count
      } : null
    };

    // Calculate engagement rate
    if (formattedStats.engagementStats.totalPosts > 0) {
      formattedStats.engagementStats.engagementRate = Math.round(
        (formattedStats.engagementStats.engagedPosts / formattedStats.engagementStats.totalPosts) * 100
      );
    } else {
      formattedStats.engagementStats.engagementRate = 0;
    }

    // Log access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_CONTENT_ANALYTICS_ACCESS',
      'system',
      null,
      {
        timestamp: new Date()
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      ...formattedStats,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Nexus content analytics error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch content analytics'
    }, { status: 500 });
  }
}