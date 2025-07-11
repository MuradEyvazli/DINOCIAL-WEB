// app/api/nexus/settings/route.js - Admin settings management
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';

// Verify nexus token
const verifyNexusToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET + '_NEXUS');
  } catch (error) {
    throw new Error('Invalid nexus token');
  }
};

// System settings model/structure
const defaultSettings = {
  general: {
    siteName: 'RPG Social',
    maintenanceMode: false,
    allowUserRegistration: true,
    maxUsersPerRegion: 1000,
    systemBannerMessage: '',
    systemBannerType: 'info' // info, warning, error
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    sessionTimeout: 24, // hours
    requireEmailVerification: true,
    enableTwoFactorAuth: false,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true
  },
  content: {
    maxPostLength: 2000,
    allowImageUploads: true,
    maxImageSize: 5, // MB
    allowVideoUploads: false,
    maxVideoSize: 50, // MB
    moderationEnabled: true,
    autoModerateContent: true,
    profanityFilterEnabled: true
  },
  social: {
    maxFriendsPerUser: 500,
    allowPrivateMessages: true,
    allowGroupMessages: true,
    maxGroupSize: 50,
    messageRetentionDays: 365,
    enablePresenceStatus: true
  },
  gaming: {
    xpPerPost: 10,
    xpPerComment: 5,
    xpPerLike: 1,
    maxLevelCap: 100,
    dailyQuestRewards: 50,
    weeklyQuestRewards: 200,
    enableGuilds: true,
    maxGuildMembers: 100
  },
  notifications: {
    enableEmailNotifications: true,
    enablePushNotifications: true,
    enableSystemNotifications: true,
    maxNotificationsPerUser: 100,
    notificationRetentionDays: 30
  }
};

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Nexus token required'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyNexusToken(token);

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    // Get current settings (stored in admin user or separate collection)
    let settings = admin.nexusSettings || defaultSettings;

    // Merge with defaults to ensure all keys exist
    settings = {
      ...defaultSettings,
      ...settings,
      general: { ...defaultSettings.general, ...settings.general },
      security: { ...defaultSettings.security, ...settings.security },
      content: { ...defaultSettings.content, ...settings.content },
      social: { ...defaultSettings.social, ...settings.social },
      gaming: { ...defaultSettings.gaming, ...settings.gaming },
      notifications: { ...defaultSettings.notifications, ...settings.notifications }
    };

    // Get system statistics for context
    const systemStats = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ 
        lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }),
      maintenanceMode: settings.general.maintenanceMode,
      serverStatus: 'online',
      lastBackup: new Date().toISOString(),
      diskUsage: 75, // Mock data
      memoryUsage: 45,
      cpuUsage: 30
    };

    // Log access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_SETTINGS_ACCESS',
      'system',
      null,
      { section: 'all' },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      settings,
      systemStats,
      adminRole: admin.role
    });

  } catch (error) {
    console.error('Nexus settings GET error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Nexus token required'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyNexusToken(token);

    await connectToDatabase();

    // Get admin profile
    const admin = await User.findById(decoded.adminId);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient privileges'
      }, { status: 403 });
    }

    const { action, settings: newSettings, section } = await request.json();

    let result;
    let logAction;

    switch (action) {
      case 'update_settings':
        // Validate settings
        if (!newSettings || !section) {
          return NextResponse.json({
            success: false,
            message: 'Invalid settings data'
          }, { status: 400 });
        }

        // Get current settings
        let currentSettings = admin.nexusSettings || defaultSettings;
        
        // Update specific section
        if (section === 'all') {
          currentSettings = { ...defaultSettings, ...newSettings };
        } else {
          currentSettings = { ...currentSettings };
          currentSettings[section] = { ...defaultSettings[section], ...newSettings[section] };
        }

        // Save to admin user
        result = await User.findByIdAndUpdate(
          admin._id,
          { nexusSettings: currentSettings },
          { new: true }
        );

        logAction = 'NEXUS_UPDATE_SETTINGS';
        break;

      case 'reset_settings':
        // Reset to defaults
        result = await User.findByIdAndUpdate(
          admin._id,
          { nexusSettings: defaultSettings },
          { new: true }
        );

        logAction = 'NEXUS_RESET_SETTINGS';
        break;

      case 'backup_settings':
        // Create backup of current settings
        const backupData = {
          timestamp: new Date(),
          settings: admin.nexusSettings || defaultSettings,
          adminId: admin._id
        };

        // In a real implementation, you'd save this to a backup collection
        result = backupData;
        logAction = 'NEXUS_BACKUP_SETTINGS';
        break;

      case 'toggle_maintenance':
        // Quick toggle maintenance mode
        let currentSettings2 = admin.nexusSettings || defaultSettings;
        currentSettings2.general.maintenanceMode = !currentSettings2.general.maintenanceMode;

        result = await User.findByIdAndUpdate(
          admin._id,
          { nexusSettings: currentSettings2 },
          { new: true }
        );

        logAction = 'NEXUS_TOGGLE_MAINTENANCE';
        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

    // Log the action
    await AdminLog.logAction(
      admin._id,
      logAction,
      'system',
      null,
      {
        action,
        section,
        settingsChanged: section,
        timestamp: new Date()
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'medium'
    );

    return NextResponse.json({
      success: true,
      message: `Settings ${action.replace('_', ' ')} successful`,
      result: result ? 'success' : 'failed'
    });

  } catch (error) {
    console.error('Nexus settings POST error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update settings'
    }, { status: 500 });
  }
}