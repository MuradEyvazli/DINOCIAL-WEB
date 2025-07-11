

// app/api/user/privacy/route.js - Updated
import { NextResponse } from 'next/server';
import { withAuthAndRateLimit, successResponse } from '@/lib/middleware/auth';
import User from '@/lib/models/User';
import connectToDatabase from '@/lib/db/mongodb';

export const PUT = withAuthAndRateLimit(30, 60 * 1000)(async (request, { user }) => {
  try {
    console.log('🔒 Privacy update başlatıldı, User ID:', user._id);
    
    await connectToDatabase();
    
    const body = await request.json();
    const { profileVisibility, showStats, showActivity, allowDirectMessages, showOnlineStatus } = body;

    const updateData = {};

    if (profileVisibility !== undefined) {
      if (!['public', 'friends', 'private'].includes(profileVisibility)) {
        return NextResponse.json(
          { success: false, message: 'Geçersiz profil görünürlüğü değeri' },
          { status: 400 }
        );
      }
      updateData['preferences.privacy.profileVisibility'] = profileVisibility;
    }

    if (showStats !== undefined) {
      updateData['preferences.privacy.showStats'] = Boolean(showStats);
    }

    if (showActivity !== undefined) {
      updateData['preferences.privacy.showActivity'] = Boolean(showActivity);
    }

    if (allowDirectMessages !== undefined) {
      updateData['preferences.privacy.allowDirectMessages'] = Boolean(allowDirectMessages);
    }

    if (showOnlineStatus !== undefined) {
      updateData['preferences.privacy.showOnlineStatus'] = Boolean(showOnlineStatus);
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Gizlilik ayarları güncellendi:', user.username);

    return successResponse(updatedUser.preferences?.privacy, 'Gizlilik ayarları başarıyla güncellendi');

  } catch (error) {
    console.error('❌ Privacy update error:', error);
    const { handleApiError } = await import('@/lib/middleware/auth');
    return handleApiError(error);
  }
});

export const GET = withAuthAndRateLimit(60, 60 * 1000)(async (request, { user }) => {
  try {
    await connectToDatabase();
    
    const currentUser = await User.findById(user._id).select('preferences.privacy');
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const privacyData = currentUser.preferences?.privacy || {
      profileVisibility: 'public',
      showStats: true,
      showActivity: true,
      allowDirectMessages: true,
      showOnlineStatus: true
    };

    return successResponse(privacyData, 'Gizlilik ayarları getirildi');

  } catch (error) {
    console.error('❌ Get privacy error:', error);
    const { handleApiError } = await import('@/lib/middleware/auth');
    return handleApiError(error);
  }
});

