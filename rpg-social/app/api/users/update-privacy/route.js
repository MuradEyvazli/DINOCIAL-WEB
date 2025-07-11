// app/api/users/update-privacy/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    // Check if this is development environment
    if (process.env.NODE_ENV !== 'production') {
      await connectToDatabase();

      // Update all users to have public profiles
      const result = await User.updateMany(
        {},
        {
          $set: {
            'preferences.privacy.profileVisibility': 'public',
            'preferences.privacy.showStats': true,
            'preferences.privacy.showActivity': true
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} kullanıcının privacy ayarları güncellendi`,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Bu endpoint sadece development ortamında kullanılabilir'
    }, { status: 403 });

  } catch (error) {
    console.error('Update Privacy API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}