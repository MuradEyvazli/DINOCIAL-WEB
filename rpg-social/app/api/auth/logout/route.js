// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';

export async function POST(request) {
  try {
    // Authentication middleware
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

    if (!authResult) {
      return NextResponse.json({
        success: false,
        message: 'Kimlik doğrulama başarısız'
      }, { status: 401 });
    }

    // Veritabanına bağlan
    await connectToDatabase();

    // Kullanıcının son aktivite zamanını güncelle
    const user = await User.findById(authResult._id);
    
    if (user) {
      user.lastActiveAt = new Date();
      await user.save();
    }

    // Client tarafında token'ı silmesi için başarılı response dön
    return NextResponse.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı. Görüşmek üzere!'
    }, { status: 200 });

  } catch (error) {
    console.error('Logout API Error:', error);

    // Auth middleware hatası
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

    // Çıkış yapma işlemi her durumda başarılı sayılabilir
    return NextResponse.json({
      success: true,
      message: 'Çıkış yapıldı'
    }, { status: 200 });
  }
}