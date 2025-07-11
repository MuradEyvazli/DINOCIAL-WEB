// app/api/nexus/users/[id]/route.js - Individual user management
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Post from '@/lib/models/Post';
import { Message, Conversation } from '@/lib/models/Message';
import AdminLog from '@/lib/models/AdminLog';

// Verify nexus token
const verifyNexusToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET + '_NEXUS');
  } catch (error) {
    throw new Error('Invalid nexus token');
  }
};

export async function GET(request, { params }) {
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
    const { id: userId } = params;

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    // Get detailed user information
    const user = await User.findById(userId)
      .populate('guild.guild', 'name')
      .lean();

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Get user statistics
    const [userPosts, userMessages, userFriends] = await Promise.all([
      Post.countDocuments({ author: userId, isDeleted: { $ne: true } }),
      Message.countDocuments({ sender: userId, isDeleted: false }),
      User.countDocuments({
        $or: [
          { 'friendsList.user': userId },
          { 'friendRequests.from': userId }
        ]
      })
    ]);

    // Get recent activity
    const recentActivity = await Promise.all([
      Post.find({ author: userId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('content createdAt region likes comments')
        .lean(),
      Message.find({ sender: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('content createdAt')
        .lean()
    ]);

    // Log user detail access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_USER_DETAIL_ACCESS',
      'user',
      userId,
      {
        targetUsername: user.username,
        timestamp: new Date()
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        statistics: {
          posts: userPosts,
          messages: userMessages,
          friends: userFriends
        },
        recentActivity: {
          posts: recentActivity[0],
          messages: recentActivity[1]
        }
      }
    });

  } catch (error) {
    console.error('Nexus user detail error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user details'
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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
    const { id: userId } = params;

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({
        success: false,
        message: 'Super admin privileges required for user deletion'
      }, { status: 403 });
    }

    // Get user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Prevent deleting other admins
    if (['admin', 'super_admin'].includes(userToDelete.role)) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete admin users'
      }, { status: 403 });
    }

    // Start transaction for safe deletion
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Mark user as deleted instead of hard delete for data integrity
        await User.findByIdAndUpdate(userId, {
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: admin._id,
          // Anonymize sensitive data
          email: `deleted_${userId}@deleted.local`,
          username: `deleted_${userId}`,
          'profile.firstName': 'Deleted',
          'profile.lastName': 'User'
        }, { session });

        // Mark user's posts as deleted
        await Post.updateMany(
          { author: userId },
          { 
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: admin._id
          },
          { session }
        );

        // Mark user's messages as deleted
        await Message.updateMany(
          { sender: userId },
          { 
            isDeleted: true,
            deletedAt: new Date()
          },
          { session }
        );

        // Remove user from conversations
        await Conversation.updateMany(
          { participants: userId },
          { $pull: { participants: userId } },
          { session }
        );

        // Remove from friends lists
        await User.updateMany(
          { 'friendsList.user': userId },
          { $pull: { friendsList: { user: userId } } },
          { session }
        );

        // Remove friend requests
        await User.updateMany(
          { 
            $or: [
              { 'friendRequests.from': userId },
              { 'friendRequests.to': userId }
            ]
          },
          { 
            $pull: { 
              friendRequests: {
                $or: [{ from: userId }, { to: userId }]
              }
            }
          },
          { session }
        );
      });

      // Log the deletion
      await AdminLog.logAction(
        admin._id,
        'NEXUS_USER_DELETE',
        'user',
        userId,
        {
          deletedUsername: userToDelete.username,
          deletedEmail: userToDelete.email,
          deletionReason: 'Admin deletion',
          timestamp: new Date()
        },
        request.headers.get('x-forwarded-for') || 'unknown',
        'high'
      );

      return NextResponse.json({
        success: true,
        message: `User ${userToDelete.username} successfully deleted`
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Nexus user delete error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to delete user'
    }, { status: 500 });
  }
}

export async function POST(request, { params }) {
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
    const { id: userId } = params;

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    const { action, reason = 'Admin action' } = await request.json();

    const userToModerate = await User.findById(userId);
    if (!userToModerate) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Prevent moderating other admins
    if (['admin', 'super_admin'].includes(userToModerate.role)) {
      return NextResponse.json({
        success: false,
        message: 'Cannot moderate admin users'
      }, { status: 403 });
    }

    let result;
    let logAction;
    let updateData = {};

    switch (action) {
      case 'ban_user':
        updateData = {
          'moderationInfo.isBanned': true,
          'moderationInfo.banReason': reason,
          'moderationInfo.bannedAt': new Date(),
          'moderationInfo.bannedBy': admin._id
        };
        logAction = 'NEXUS_USER_BAN';
        break;

      case 'unban_user':
        updateData = {
          'moderationInfo.isBanned': false,
          'moderationInfo.banReason': null,
          'moderationInfo.bannedAt': null,
          'moderationInfo.bannedBy': null,
          'moderationInfo.unbannedAt': new Date(),
          'moderationInfo.unbannedBy': admin._id
        };
        logAction = 'NEXUS_USER_UNBAN';
        break;

      case 'activate_user':
        updateData = {
          'isActive': true
        };
        logAction = 'NEXUS_USER_ACTIVATE';
        break;

      case 'deactivate_user':
        updateData = {
          'isActive': false
        };
        logAction = 'NEXUS_USER_DEACTIVATE';
        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

    // Update user
    result = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    // Log the action
    await AdminLog.logAction(
      admin._id,
      logAction,
      'user',
      userId,
      {
        targetUsername: userToModerate.username,
        targetEmail: userToModerate.email,
        action,
        reason,
        timestamp: new Date()
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'high'
    );

    return NextResponse.json({
      success: true,
      message: `User successfully ${action.replace('_', ' ')}`
    });

  } catch (error) {
    console.error('Nexus user action error:', error);

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

export async function PATCH(request, { params }) {
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
    const { id: userId } = params;

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    const updateData = await request.json();
    const allowedUpdates = [
      'isActive',
      'moderationInfo.isBanned',
      'moderationInfo.banReason',
      'level',
      'xp',
      'role'
    ];

    // Filter allowed updates
    const filteredUpdates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updateData[key];
      }
    });

    // Special handling for moderation actions
    if (updateData.moderationInfo?.isBanned !== undefined) {
      if (updateData.moderationInfo.isBanned) {
        filteredUpdates['moderationInfo.bannedBy'] = admin._id;
        filteredUpdates['moderationInfo.bannedAt'] = new Date();
      } else {
        filteredUpdates['moderationInfo.unbannedBy'] = admin._id;
        filteredUpdates['moderationInfo.unbannedAt'] = new Date();
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('username email isActive moderationInfo level xp role');

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Log the update
    await AdminLog.logAction(
      admin._id,
      'NEXUS_USER_UPDATE',
      'user',
      userId,
      {
        targetUsername: updatedUser.username,
        updates: filteredUpdates,
        timestamp: new Date()
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'medium'
    );

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Nexus user update error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update user'
    }, { status: 500 });
  }
}