// app/api/nexus/friends/route.js - Admin friendship monitoring
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
    const status = url.searchParams.get('status') || 'all'; // all, accepted, pending, blocked
    const search = url.searchParams.get('search') || '';

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get friendship relationships using aggregation
    const matchStage = {};
    
    if (status !== 'all') {
      matchStage['friendsList.status'] = status;
    }

    // Build aggregation pipeline to get follow relationships (since friends system uses followers)
    const friendships = await User.aggregate([
      { $match: { 'following.0': { $exists: true } } },
      { $unwind: '$following' },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'follower',
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
                avatarUrls: 1,
                level: 1,
                isActive: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'following.user',
          foreignField: '_id',
          as: 'followed',
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
                avatarUrls: 1,
                level: 1,
                isActive: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          requester: { $arrayElemAt: ['$follower', 0] },
          recipient: { $arrayElemAt: ['$followed', 0] },
          status: 'accepted',
          createdAt: '$following.followedAt'
        }
      },
      {
        $project: {
          requester: 1,
          recipient: 1,
          status: 1,
          createdAt: 1
        }
      },
      {
        $match: search ? {
          $or: [
            { 'requester.username': { $regex: search, $options: 'i' } },
            { 'recipient.username': { $regex: search, $options: 'i' } }
          ]
        } : {}
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get follow/friendship statistics
    const friendshipStats = await User.aggregate([
      {
        $facet: {
          totalFriendships: [
            { $unwind: '$following' },
            { $count: 'count' }
          ],
          pendingRequests: [
            // Since followers system doesn't have pending, return 0
            { $limit: 0 },
            { $count: 'count' }
          ],
          blockedUsers: [
            // Since followers system doesn't have blocked, return 0
            { $limit: 0 },
            { $count: 'count' }
          ],
          topUsers: [
            { $unwind: '$followers' },
            {
              $group: {
                _id: '$_id',
                followerCount: { $sum: 1 },
                username: { $first: '$username' },
                level: { $first: '$level' }
              }
            },
            { $sort: { followerCount: -1 } },
            { $limit: 10 }
          ],
          dailyStats: [
            { $unwind: '$following' },
            {
              $match: {
                'following.followedAt': {
                  $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$following.followedAt'
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          friendshipsByLevel: [
            { $unwind: '$following' },
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
                averageFriends: { $avg: 1 },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    // Get total count for pagination
    const totalFriendships = await User.aggregate([
      { $unwind: '$following' },
      { $count: 'total' }
    ]);

    const total = totalFriendships[0]?.total || 0;
    
    // Get most popular user (most followers)
    const mostPopularUser = await User.aggregate([
      { $unwind: '$followers' },
      {
        $group: {
          _id: '$_id',
          followerCount: { $sum: 1 },
          username: { $first: '$username' }
        }
      },
      { $sort: { followerCount: -1 } },
      { $limit: 1 }
    ]);

    // Log access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_FRIENDS_ACCESS',
      'system',
      null,
      {
        page,
        limit,
        status,
        search,
        totalResults: friendships.length
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      relationships: friendships,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: {
        totalFriendships: friendshipStats[0].totalFriendships[0]?.count || 0,
        pendingRequests: friendshipStats[0].pendingRequests[0]?.count || 0,
        blockedUsers: friendshipStats[0].blockedUsers[0]?.count || 0,
        topUsers: friendshipStats[0].topUsers,
        dailyStats: friendshipStats[0].dailyStats,
        friendshipsByLevel: friendshipStats[0].friendshipsByLevel,
        mostPopularUser: mostPopularUser[0]?.username || null
      }
    });

  } catch (error) {
    console.error('Nexus friends error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch friendship data'
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

    const { action, friendshipIds, userIds, data } = await request.json();

    let result = { modifiedCount: 0 };
    let logAction;

    switch (action) {
      case 'remove_friendships':
        // Remove specific friendships
        if (friendshipIds && friendshipIds.length > 0) {
          for (const friendshipId of friendshipIds) {
            const [userId1, userId2] = friendshipId.split('_');
            
            // Remove from both users' friend lists
            await User.updateOne(
              { _id: userId1 },
              { $pull: { friendsList: { user: userId2 } } }
            );
            
            await User.updateOne(
              { _id: userId2 },
              { $pull: { friendsList: { user: userId1 } } }
            );
            
            result.modifiedCount++;
          }
        }
        logAction = 'NEXUS_REMOVE_FRIENDSHIPS';
        break;

      case 'block_user_friendships':
        // Block all friendships for specific users
        if (userIds && userIds.length > 0) {
          for (const userId of userIds) {
            // Update all friendships to blocked status
            await User.updateMany(
              { 'friendsList.user': userId },
              { $set: { 'friendsList.$.status': 'blocked' } }
            );
            
            await User.updateOne(
              { _id: userId },
              { $set: { 'friendsList.$[].status': 'blocked' } }
            );
            
            result.modifiedCount++;
          }
        }
        logAction = 'NEXUS_BLOCK_USER_FRIENDSHIPS';
        break;

      case 'clear_pending_requests':
        // Clear all pending friend requests
        result = await User.updateMany(
          { 'friendsList.status': 'pending' },
          { $pull: { friendsList: { status: 'pending' } } }
        );
        logAction = 'NEXUS_CLEAR_PENDING_REQUESTS';
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
      'system',
      userIds?.[0] || null,
      {
        action,
        friendshipIds,
        userIds,
        count: friendshipIds?.length || userIds?.length || 0,
        data,
        modifiedCount: result.modifiedCount
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'medium'
    );

    return NextResponse.json({
      success: true,
      message: `Successfully ${action.replace('_', ' ')} ${result.modifiedCount} items`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Nexus friends POST error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to perform friendship action'
    }, { status: 500 });
  }
}