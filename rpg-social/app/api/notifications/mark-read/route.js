// app/api/notifications/mark-read/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { authenticate } from '@/lib/middleware/auth';

export async function POST(request) {
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

    const body = await request.json();
    const { notificationIds } = body;

    // In real app, mark notifications as read in database
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'Bildirimler okundu olarak işaretlendi',
      data: { markedCount: notificationIds.length }
    });

  } catch (error) {
    console.error('Mark Read API Error:', error);
    
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

    return NextResponse.json({
      success: false,
      message: 'İşaretleme hatası'
    }, { status: 500 });
  }
}

