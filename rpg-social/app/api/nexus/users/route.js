// app/api/nexus/users/route.js - Admin user management
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
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

    // Get URL parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const search = url.searchParams.get('search') || '';
    const filter = url.searchParams.get('filter') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = {};
    
    // Apply search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Apply status filter
    if (filter === 'active') {
      query.isActive = true;
    } else if (filter === 'banned') {
      query['moderationInfo.isBanned'] = true;
    } else if (filter === 'online') {
      query.isActive = true;
      query.lastActiveAt = { 
        $gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      };
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('username email avatar level xp isActive createdAt lastActiveAt moderationInfo profile.firstName profile.lastName characterClass')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Get additional statistics
    const stats = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: 'count' }],
          activeUsers: [
            { $match: { isActive: true } },
            { $count: 'count' }
          ],
          bannedUsers: [
            { $match: { 'moderationInfo.isBanned': true } },
            { $count: 'count' }
          ],
          onlineUsers: [
            {
              $match: {
                isActive: true,
                lastActiveAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
              }
            },
            { $count: 'count' }
          ],
          levelDistribution: [
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
            }
          ]
        }
      }
    ]);

    // Log access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_USERS_ACCESS',
      'system',
      null,
      {
        page,
        limit,
        search,
        filter,
        totalResults: users.length
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      },
      statistics: {
        total: stats[0].totalUsers[0]?.count || 0,
        active: stats[0].activeUsers[0]?.count || 0,
        banned: stats[0].bannedUsers[0]?.count || 0,
        online: stats[0].onlineUsers[0]?.count || 0,
        levelDistribution: stats[0].levelDistribution
      }
    });

  } catch (error) {
    console.error('Nexus users GET error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch users'
    }, { status: 500 });
  }
}

export async function POST(request) {
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

    const { action, userIds, data } = await request.json();

    let result;
    let logAction;

    switch (action) {
      case 'ban_users':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          {
            $set: {
              'moderationInfo.isBanned': true,
              'moderationInfo.banReason': data.reason || 'Admin action',
              'moderationInfo.bannedBy': admin._id,
              'moderationInfo.bannedAt': new Date()
            }
          }
        );
        logAction = 'NEXUS_BAN_USERS';
        break;

      case 'unban_users':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          {
            $set: {
              'moderationInfo.isBanned': false,
              'moderationInfo.unbannedBy': admin._id,
              'moderationInfo.unbannedAt': new Date()
            }
          }
        );
        logAction = 'NEXUS_UNBAN_USERS';
        break;

      case 'activate_users':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: true } }
        );
        logAction = 'NEXUS_ACTIVATE_USERS';
        break;

      case 'deactivate_users':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: false } }
        );
        logAction = 'NEXUS_DEACTIVATE_USERS';
        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

    // Log the action
    await AdminLog.logAction(
      admin._id,
      logAction,
      'user',
      userIds[0],
      {
        action,
        userIds,
        count: userIds.length,
        data,
        modifiedCount: result.modifiedCount
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'medium'
    );

    return NextResponse.json({
      success: true,
      message: `Successfully ${action.replace('_', ' ')} ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Nexus users POST error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to perform user action'
    }, { status: 500 });
  }
}