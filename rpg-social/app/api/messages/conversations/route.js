// app/api/messages/conversations/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Conversation } from '@/lib/models/Message';
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

// GET - Get user's conversations
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const conversations = await Conversation.getForUser(currentUserId, page, limit);

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(conversations.length / limit),
          hasMore: conversations.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Conversations API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST - Create new conversation
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

    const { participantId, type = 'direct', title } = await request.json();

    if (!participantId) {
      return NextResponse.json({
        success: false,
        message: 'Katılımcı ID gerekli'
      }, { status: 400 });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Check if direct conversation already exists
    if (type === 'direct') {
      const existingConversation = await Conversation.findBetweenUsers(currentUserId, participantId);
      if (existingConversation) {
        return NextResponse.json({
          success: true,
          data: existingConversation,
          message: 'Mevcut konuşma bulundu'
        });
      }
    }

    // Create new conversation
    const conversationData = {
      participants: [
        { user: currentUserId },
        { user: participantId }
      ],
      type,
      title: type === 'group' ? title : null,
      isActive: true
    };

    const conversation = new Conversation(conversationData);
    await conversation.save();

    // Populate participant data
    await conversation.populate('participants.user', 'username avatar avatarUrls characterClass level isOnline lastActiveAt');

    // Notify via Socket.IO
    if (global.io && global.userSockets) {
      const participantSocketId = global.userSockets.get(participantId);
      if (participantSocketId) {
        global.io.to(participantSocketId).emit('conversation:new', {
          conversation,
          initiator: {
            id: currentUserId,
            username: await User.findById(currentUserId).select('username')
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: conversation,
      message: 'Konuşma oluşturuldu'
    }, { status: 201 });

  } catch (error) {
    console.error('Create Conversation API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}