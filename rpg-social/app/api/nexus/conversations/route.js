// app/api/nexus/conversations/route.js - Admin conversation monitoring
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
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
    const type = url.searchParams.get('type') || 'all'; // all, group, private

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build query for conversations
    let conversationQuery = { isActive: true };
    
    if (type === 'group') {
      conversationQuery.type = 'group';
    } else if (type === 'private') {
      conversationQuery.type = 'direct';
    }

    // Get conversations with participant details and message counts
    const conversations = await Conversation.aggregate([
      { $match: conversationQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'participants.user',
          foreignField: '_id',
          as: 'participantDetails',
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
                isActive: 1,
                lastActiveAt: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { convId: '$_id' },
          pipeline: [
            { $match: { 
              $expr: { $eq: ['$conversation', '$$convId'] },
              isDeleted: false 
            }},
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessageData'
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { convId: '$_id' },
          pipeline: [
            { $match: { 
              $expr: { $eq: ['$conversation', '$$convId'] },
              isDeleted: false 
            }},
            { $count: 'total' }
          ],
          as: 'messageCountData'
        }
      },
      {
        $addFields: {
          messageCount: { $ifNull: [{ $arrayElemAt: ['$messageCountData.total', 0] }, 0] },
          lastMessage: { $arrayElemAt: ['$lastMessageData', 0] },
          participants: '$participantDetails'
        }
      },
      {
        $project: {
          name: 1,
          title: 1,
          type: 1,
          isGroup: 1,
          participants: 1,
          messageCount: 1,
          lastMessage: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $match: search ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { 'participants.username': { $regex: search, $options: 'i' } }
          ]
        } : {}
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalConversations = await Conversation.countDocuments(conversationQuery);

    // Get message statistics
    const messageStats = await Message.aggregate([
      {
        $facet: {
          totalMessages: [
            { $match: { isDeleted: false } },
            { $count: 'count' }
          ],
          todayMessages: [
            {
              $match: {
                isDeleted: false,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            },
            { $count: 'count' }
          ],
          activeConversations: [
            {
              $match: {
                isDeleted: false,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: '$conversation'
              }
            },
            { $count: 'count' }
          ],
          messagesByHour: [
            {
              $match: {
                isDeleted: false,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: { $hour: '$createdAt' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          topSenders: [
            {
              $match: {
                isDeleted: false,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: '$sender',
                messageCount: { $sum: 1 }
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
            {
              $unwind: '$user'
            },
            {
              $project: {
                username: '$user.username',
                messageCount: 1
              }
            },
            { $sort: { messageCount: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Log access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_CONVERSATIONS_ACCESS',
      'system',
      null,
      {
        page,
        limit,
        search,
        type,
        totalResults: conversations.length
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      conversations,
      pagination: {
        page,
        limit,
        total: totalConversations,
        pages: Math.ceil(totalConversations / limit)
      },
      statistics: {
        totalMessages: messageStats[0].totalMessages[0]?.count || 0,
        todayMessages: messageStats[0].todayMessages[0]?.count || 0,
        activeConversations: messageStats[0].activeConversations[0]?.count || 0,
        messagesByHour: messageStats[0].messagesByHour,
        topSenders: messageStats[0].topSenders
      }
    });

  } catch (error) {
    console.error('Nexus conversations error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch conversations'
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

    const { action, conversationIds, data } = await request.json();

    let result;
    let logAction;

    switch (action) {
      case 'disable_conversations':
        result = await Conversation.updateMany(
          { _id: { $in: conversationIds } },
          {
            $set: {
              isDisabled: true,
              disabledBy: admin._id,
              disabledAt: new Date(),
              disableReason: data.reason || 'Admin action'
            }
          }
        );
        logAction = 'NEXUS_DISABLE_CONVERSATIONS';
        break;

      case 'delete_conversations':
        // Mark messages as deleted
        await Message.updateMany(
          { conversation: { $in: conversationIds } },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: admin._id
            }
          }
        );

        // Mark conversations as deleted
        result = await Conversation.updateMany(
          { _id: { $in: conversationIds } },
          {
            $set: {
              isDeleted: true,
              deletedBy: admin._id,
              deletedAt: new Date()
            }
          }
        );
        logAction = 'NEXUS_DELETE_CONVERSATIONS';
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
      'conversation',
      conversationIds[0],
      {
        action,
        conversationIds,
        count: conversationIds.length,
        data,
        modifiedCount: result.modifiedCount
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'high'
    );

    return NextResponse.json({
      success: true,
      message: `Successfully ${action.replace('_', ' ')} ${result.modifiedCount} conversations`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Nexus conversations POST error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to perform conversation action'
    }, { status: 500 });
  }
}