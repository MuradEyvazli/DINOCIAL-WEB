// app/api/notifications/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { authenticate } from '@/lib/middleware/auth';

export async function GET(request) {
  try {
    // Authentication required
    const authResult = await new Promise((resolve, reject) => {
      const req = {
        headers: {
          authorization: request.headers.get('authorization')
        }
      };
      const res = {
        status: (code) => ({
          json: (data) => reject({ status: code, data })
        })
      };
      
      authenticate(req, res, () => {
        resolve(req.user);
      });
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const type = searchParams.get('type') || 'all';

    // Mock notifications data
    const sampleNotifications = [
      {
        id: 'notif_1',
        type: 'achievement',
        title: 'Yeni Başarım Kazandın!',
        message: '"Sosyal Kelebek" rozetini aldın.',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 'notif_2',
        type: 'quest',
        title: 'Görev Tamamlandı',
        message: '"Günlük Sosyal Görev" tamamlandı. 50 XP kazandın!',
        read: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: 'notif_3',
        type: 'social',
        title: 'Yeni Takipçi',
        message: 'DragonMaster seni takip etmeye başladı.',
        read: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    const filteredNotifications = type === 'all' 
      ? sampleNotifications 
      : sampleNotifications.filter(n => n.type === type);

    const unreadCount = sampleNotifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: filteredNotifications,
        page,
        hasMore: false,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Notifications API Error:', error);
    
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 });
  }
}

