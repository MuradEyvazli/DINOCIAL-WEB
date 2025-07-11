// app/api/messages/clear/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { getAuthenticatedUser } from '@/lib/middleware/auth';
import { Message, Conversation } from '@/lib/models/Message';

export async function DELETE(request) {
  try {
    await connectToDatabase();
    
    // Get request body first
    const { conversationId, clearType } = await request.json();
    
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    const userId = user._id;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    if (!['self', 'everyone'].includes(clearType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid clear type' },
        { status: 400 }
      );
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is participant - handle both direct user refs and nested user objects
    const isParticipant = conversation.participants.some(participant => {
      const participantId = participant.user ? participant.user.toString() : participant.toString();
      return participantId === userId.toString();
    });

    if (!isParticipant) {
      console.log('User not participant:', {
        userId: userId.toString(),
        participants: conversation.participants.map(p => ({
          user: p.user ? p.user.toString() : p.toString(),
          raw: p
        }))
      });
      return NextResponse.json(
        { success: false, message: 'Not authorized to clear this conversation' },
        { status: 403 }
      );
    }

    if (clearType === 'self') {
      // Clear messages for the current user only (add to deletedFor array)
      await Message.updateMany(
        { conversation: conversationId },
        { $addToSet: { deletedFor: userId } }
      );
    } else if (clearType === 'everyone') {
      // Hard delete all messages in the conversation
      await Message.updateMany(
        { conversation: conversationId },
        { 
          $set: { 
            isDeleted: true,
            text: 'Bu mesaj silindi',
            deletedAt: new Date()
          }
        }
      );

      // Update conversation's lastMessage
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: null,
        lastMessageAt: new Date()
      });
    }

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`conversation:${conversationId}`).emit('chat:cleared', {
        conversationId,
        clearType,
        clearedBy: userId
      });
    }

    return NextResponse.json({
      success: true,
      message: clearType === 'everyone' 
        ? 'Chat cleared for everyone' 
        : 'Chat cleared for you',
      data: {
        conversationId,
        clearType,
        clearedBy: userId,
        clearedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Clear chat error:', error);
    
    // Handle authentication errors
    if (error.type === 'UNAUTHORIZED' || error.type === 'INVALID_TOKEN' || error.type === 'TOKEN_EXPIRED') {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message || 'Authentication failed'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}