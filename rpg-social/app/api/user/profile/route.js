// app/api/user/profile/route.js - User Profile Update API
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { verifyToken, handleApiError, successResponse } from '@/lib/middleware/auth';

export async function PUT(request) {
  try {
    await connectToDatabase();
    
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    const body = await request.json();
    const { username, email, bio } = body;

    // Validation
    if (username && username.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı en az 3 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (username && username.length > 20) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı en fazla 20 karakter olabilir' },
        { status: 400 }
      );
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Bio en fazla 500 karakter olabilir' },
        { status: 400 }
      );
    }

    // Email formatı kontrolü
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Geçerli bir e-posta adresi giriniz' },
          { status: 400 }
        );
      }
    }

    // Username benzersizlik kontrolü
    if (username && username !== currentUser.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: currentUser._id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Email benzersizlik kontrolü
    if (email && email !== currentUser.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: currentUser._id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Bu e-posta adresi zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Profil güncelleme
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    return successResponse(updatedUser, 'Profil başarıyla güncellendi');

  } catch (error) {
    console.error('Profile update error:', error);
    return handleApiError(error);
  }
}