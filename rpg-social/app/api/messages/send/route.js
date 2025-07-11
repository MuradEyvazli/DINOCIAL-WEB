// app/api/messages/send/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Conversation, Message } from '@/lib/models/Message';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Get current user from JWT token
async function getCurrentUser(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { conversationId, content, type = 'text', replyTo, files } = await request.json();

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        message: 'Konuşma ID gerekli'
      }, { status: 400 });
    }

    // Validate that we have either text content or files
    if (!content?.trim() && (!files || files.length === 0)) {
      return NextResponse.json({
        success: false,
        message: 'Mesaj içeriği veya dosya gerekli'
      }, { status: 400 });
    }

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: 'Konuşma bulunamadı'
      }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      p => p.user.toString() === currentUserId
    );
    if (!isParticipant) {
      return NextResponse.json({
        success: false,
        message: 'Bu konuşmaya mesaj gönderme yetkiniz yok'
      }, { status: 403 });
    }

    // Create message
    const messageType = files && files.length > 0 ? 'file' : (type || 'text');
    const messageData = {
      conversation: conversationId,
      sender: currentUserId,
      content: {
        text: content?.trim() || '',
        type: messageType,
        files: files || []
      },
      replyTo: replyTo || null
    };
    

    const message = new Message(messageData);
    await message.save();

    // Populate sender data
    await message.populate('sender', 'username avatar avatarUrls characterClass level');
    if (replyTo) {
      await message.populate('replyTo', 'content.text sender');
    }

    // Update conversation's last seen for sender
    conversation.updateLastSeen(currentUserId);
    await conversation.save();

    // Notify other participants via Socket.IO
    if (global.io) {
      const messageData = {
        id: message._id.toString(),
        conversationId: message.conversation.toString(),
        content: {
          text: message.content.text,
          type: message.content.type,
          files: message.content.files || []
        },
        sender: {
          id: message.sender._id.toString(),
          username: message.sender.username,
          avatar: message.sender.avatarUrls?.medium || message.sender.avatar,
          characterClass: message.sender.characterClass
        },
        replyTo: message.replyTo,
        timestamp: message.createdAt,
        status: 'sent'
      };

      // Send to conversation room
      global.io.to(`conversation:${conversationId}`).emit('message:new', messageData);
      
      // Send push notification to offline users
      conversation.participants.forEach(participant => {
        const participantId = participant.user.toString();
        if (participantId !== currentUserId) {
          const socketId = global.userSockets?.get(participantId);
          if (socketId) {
            global.io.to(socketId).emit('notification:message', {
              conversationId,
              message: messageData,
              unreadCount: 1 // This should be calculated properly
            });
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message._id.toString(),
        conversationId: message.conversation.toString(),
        content: {
          text: message.content.text,
          type: message.content.type,
          files: message.content.files || []
        },
        sender: {
          id: message.sender._id.toString(),
          username: message.sender.username,
          avatar: message.sender.avatarUrls?.medium || message.sender.avatar,
          characterClass: message.sender.characterClass
        },
        replyTo: message.replyTo,
        timestamp: message.createdAt,
        status: 'sent'
      },
      message: 'Mesaj gönderildi'
    }, { status: 201 });

  } catch (error) {
    console.error('Send Message API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Mesaj gönderme hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}