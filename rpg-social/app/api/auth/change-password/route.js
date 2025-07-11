// app/api/auth/change-password/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { authenticate } from '@/lib/middleware/auth';
import { passwordChangeSchema } from '@/lib/validation/authSchemas';

export async function PUT(request) {
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

    const body = await request.json();

    // Validation
    try {
      await passwordChangeSchema.validate(body, { abortEarly: false });
    } catch (validationError) {
      const errors = validationError.inner.map(err => ({
        field: err.path,
        message: err.message
      }));

      return NextResponse.json({
        success: false,
        message: 'Validation hatası',
        errors
      }, { status: 400 });
    }

    const { currentPassword, newPassword } = body;

    // Veritabanına bağlan
    await connectToDatabase();

    // Kullanıcıyı bul (şifre dahil)
    const user = await User.findById(authResult._id).select('+password');

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Mevcut şifre kontrolü
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Mevcut şifre hatalı',
        field: 'currentPassword'
      }, { status: 400 });
    }

    // Yeni şifre eskisiyle aynı mı kontrol et
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return NextResponse.json({
        success: false,
        message: 'Yeni şifre mevcut şifrenizle aynı olamaz',
        field: 'newPassword'
      }, { status: 400 });
    }

    // Yeni şifreyi güncelle (model'de otomatik hash'lenecek)
    user.password = newPassword;
    user.updatedAt = new Date();

    await user.save();

    // Security badge kontrolü
    const securityBadge = {
      id: 'password_changer',
      name: 'Güvenlik Bilincli',
      icon: '🔐',
      description: 'Şifreni güncellediğin için güvenlik badge\'i kazandın!',
      unlockedAt: new Date()
    };

    let newBadge = null;
    if (user.addBadge(securityBadge)) {
      newBadge = securityBadge;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Şifre başarıyla güncellendi! Güvenliğin için teşekkürler.',
      ...(newBadge && { newBadge })
    }, { status: 200 });

  } catch (error) {
    console.error('Password Change API Error:', error);

    // Auth middleware hatası
    if (error.status) {
      return NextResponse.json(error.data, { status: error.status });
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return NextResponse.json({
        success: false,
        message: 'Validation hatası',
        errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
}