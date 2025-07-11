// app/api/messages/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Message, Conversation } from '@/lib/models/Message';
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

// GET - Get messages for a conversation
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        message: 'Konu_ma ID gerekli'
      }, { status: 400 });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: 'Konu_ma bulunamad1'
      }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      p => p.user.toString() === currentUserId
    );
    if (!isParticipant) {
      return NextResponse.json({
        success: false,
        message: 'Bu konu_maya eri_im yetkiniz yok'
      }, { status: 403 });
    }

    // Get messages for the conversation
    const messages = await Message.getForConversation(conversationId, currentUserId, page, limit);

    // Mark messages as read for current user
    await Promise.all(
      messages.map(async (message) => {
        if (message.sender._id.toString() !== currentUserId) {
          message.markAsRead(currentUserId);
          await message.save();
        }
      })
    );

    // Update user's last seen in conversation
    conversation.updateLastSeen(currentUserId);
    await conversation.save();

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          currentPage: page,
          hasMore: messages.length === limit,
          total: await Message.countDocuments({ 
            conversation: conversationId, 
            isDeleted: false 
          })
        }
      }
    });

  } catch (error) {
    console.error('Messages API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatas1',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Delete a message
export async function DELETE(request) {
  try {
    await connectToDatabase();
    
    const currentUserId = await getCurrentUser(request);
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const deleteType = searchParams.get('deleteType'); // 'self' or 'everyone'

    if (!messageId || !deleteType) {
      return NextResponse.json({
        success: false,
        message: 'Mesaj ID ve silme tipi gerekli'
      }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({
        success: false,
        message: 'Mesaj bulunamadı'
      }, { status: 404 });
    }

    // Check if user is the sender for self delete or everyone delete
    if (message.sender.toString() !== currentUserId) {
      return NextResponse.json({
        success: false,
        message: 'Bu mesajı silme yetkiniz yok'
      }, { status: 403 });
    }

    if (deleteType === 'self') {
      // Add current user to deletedFor array (soft delete for this user only)
      if (!message.deletedFor.includes(currentUserId)) {
        message.deletedFor.push(currentUserId);
        await message.save();
      }
    } else if (deleteType === 'everyone') {
      // Check if message was sent in last 5 minutes (can only delete for everyone within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (message.createdAt < fiveMinutesAgo) {
        return NextResponse.json({
          success: false,
          message: 'Bu mesaj herkesten silinmek için çok eski (5 dakika sınırı)'
        }, { status: 400 });
      }
      
      // Mark as deleted for everyone
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();
    }

    // Update conversation's lastMessage if this was the last message
    const conversation = await Conversation.findById(message.conversation);
    if (conversation && conversation.lastMessage?.toString() === messageId) {
      // Find the most recent non-deleted message
      const lastMessage = await Message.findOne({
        conversation: message.conversation,
        isDeleted: false
      }).sort({ createdAt: -1 });
      
      conversation.lastMessage = lastMessage?._id || null;
      await conversation.save();
    }

    return NextResponse.json({
      success: true,
      message: deleteType === 'self' ? 'Mesaj sizin için silindi' : 'Mesaj herkes için silindi',
      data: { messageId, deleteType }
    });

  } catch (error) {
    console.error('Delete Message API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}