// app/api/nexus/conversations/[id]/route.js - View specific conversation messages
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

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    const conversationId = params.id;
    
    // Get URL parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Get conversation details with participants
    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'participants.user',
        select: 'username avatar email isActive lastActiveAt'
      })
      .lean();

    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: 'Conversation not found'
      }, { status: 404 });
    }

    // Get messages from this conversation
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .populate({
      path: 'sender',
      select: 'username avatar avatarUrls email'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Get total message count
    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false
    });

    // Get conversation statistics
    const messageStats = await Message.aggregate([
      {
        $match: {
          conversation: conversation._id,
          isDeleted: false
        }
      },
      {
        $facet: {
          messagesByUser: [
            {
              $group: {
                _id: '$sender',
                count: { $sum: 1 },
                lastMessage: { $max: '$createdAt' }
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
                avatar: '$user.avatar',
                messageCount: '$count',
                lastMessage: '$lastMessage'
              }
            },
            { $sort: { messageCount: -1 } }
          ],
          messagesByDate: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: 30 }
          ],
          totalAttachments: [
            {
              $match: {
                $or: [
                  { attachments: { $exists: true, $ne: [] } },
                  { images: { $exists: true, $ne: [] } }
                ]
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Log access to specific conversation
    await AdminLog.logAction(
      admin._id,
      'NEXUS_CONVERSATION_VIEW',
      'conversation',
      conversationId,
      {
        conversationName: conversation.name || conversation.title || 'Private Chat',
        participantCount: conversation.participants?.length || 0,
        messageCount: totalMessages,
        page,
        limit
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'medium'
    );

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        messageCount: totalMessages
      },
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      },
      statistics: {
        messagesByUser: messageStats[0].messagesByUser,
        messagesByDate: messageStats[0].messagesByDate,
        totalAttachments: messageStats[0].totalAttachments[0]?.count || 0,
        avgMessagesPerDay: totalMessages > 0 ? (totalMessages / Math.max(1, Math.ceil((Date.now() - new Date(conversation.createdAt)) / (1000 * 60 * 60 * 24)))) : 0
      }
    });

  } catch (error) {
    console.error('Nexus conversation view error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch conversation messages'
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

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    const conversationId = params.id;
    const { action, messageIds, reason } = await request.json();

    let result;
    let logAction;

    switch (action) {
      case 'delete_messages':
        if (!messageIds || !Array.isArray(messageIds)) {
          return NextResponse.json({
            success: false,
            message: 'Message IDs required'
          }, { status: 400 });
        }

        result = await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversation: conversationId
          },
          {
            $set: {
              isDeleted: true,
              deletedBy: admin._id,
              deletedAt: new Date(),
              deleteReason: reason || 'Admin moderation'
            }
          }
        );

        logAction = 'NEXUS_DELETE_MESSAGES';
        break;

      case 'disable_conversation':
        result = await Conversation.findByIdAndUpdate(
          conversationId,
          {
            $set: {
              isDisabled: true,
              disabledBy: admin._id,
              disabledAt: new Date(),
              disableReason: reason || 'Admin moderation'
            }
          }
        );

        logAction = 'NEXUS_DISABLE_CONVERSATION';
        break;

      case 'export_conversation':
        // In a real implementation, you'd generate and return a file
        const conversation = await Conversation.findById(conversationId);
        const messages = await Message.find({
          conversation: conversationId,
          isDeleted: false
        }).populate('sender', 'username').sort({ createdAt: 1 });

        result = {
          conversation,
          messages,
          exportedAt: new Date(),
          exportedBy: admin.username
        };

        logAction = 'NEXUS_EXPORT_CONVERSATION';
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
      conversationId,
      {
        action,
        messageIds: messageIds || [],
        reason,
        modifiedCount: result?.modifiedCount || (result ? 1 : 0)
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'high'
    );

    return NextResponse.json({
      success: true,
      message: `Successfully performed ${action.replace('_', ' ')}`,
      result: action === 'export_conversation' ? result : 'success'
    });

  } catch (error) {
    console.error('Nexus conversation action error:', error);

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