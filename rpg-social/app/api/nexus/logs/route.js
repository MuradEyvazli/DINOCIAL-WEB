// app/api/nexus/logs/route.js - Admin system logs
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

    // Get URL parameters for filtering and pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const type = url.searchParams.get('type') || 'all';
    const severity = url.searchParams.get('severity') || 'all';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build query
    let query = {};
    
    // Apply type filter
    if (type !== 'all') {
      switch (type) {
        case 'admin':
          query.action = { $regex: /^NEXUS_/i };
          break;
        case 'user':
          query.targetType = 'user';
          break;
        case 'system':
          query.targetType = 'system';
          break;
        case 'security':
          query.action = { $regex: /LOGIN|AUTH|SECURITY|BAN/i };
          break;
      }
    }

    // Apply severity filter
    if (severity !== 'all') {
      query.severity = severity;
    }

    // Apply date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get logs with pagination
    const [logs, totalLogs] = await Promise.all([
      AdminLog.find(query)
        .populate('admin', 'username email')
        .populate('targetUser', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(query)
    ]);

    // Get log statistics
    const logStats = await AdminLog.aggregate([
      {
        $facet: {
          // Logs by severity
          bySeverity: [
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ],
          
          // Recent activity (last 24 hours)
          recentActivity: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: { $hour: '$createdAt' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Top actions
          topActions: [
            {
              $group: {
                _id: '$action',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          
          // Active admins
          activeAdmins: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: '$admin',
                actionCount: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'adminInfo'
              }
            },
            { $unwind: '$adminInfo' },
            {
              $project: {
                username: '$adminInfo.username',
                actionCount: 1
              }
            },
            { $sort: { actionCount: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    // Format the logs for response
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      action: formatActionName(log.action),
      admin: log.admin,
      targetType: log.targetType,
      targetUser: log.targetUser,
      details: log.details,
      ipAddress: log.ipAddress,
      severity: log.severity,
      createdAt: log.createdAt
    }));

    // Log this access (but don't include it in the results)
    await AdminLog.logAction(
      admin._id,
      'NEXUS_LOGS_ACCESS',
      'system',
      null,
      {
        page,
        limit,
        type,
        severity,
        totalResults: logs.length
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        pages: Math.ceil(totalLogs / limit)
      },
      statistics: {
        bySeverity: logStats[0].bySeverity,
        recentActivity: logStats[0].recentActivity,
        topActions: logStats[0].topActions,
        activeAdmins: logStats[0].activeAdmins
      }
    });

  } catch (error) {
    console.error('Nexus logs error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch system logs'
    }, { status: 500 });
  }
}

// Helper function to format action names for display
function formatActionName(action) {
  const actionMap = {
    'NEXUS_LOGIN': 'Admin Girişi',
    'NEXUS_DASHBOARD_ACCESS': 'Dashboard Erişimi',
    'NEXUS_USERS_ACCESS': 'Kullanıcı Listesi Görüntüleme',
    'NEXUS_USER_DETAIL_ACCESS': 'Kullanıcı Detayı Görüntüleme',
    'NEXUS_USER_DELETE': 'Kullanıcı Silme',
    'NEXUS_USER_UPDATE': 'Kullanıcı Güncelleme',
    'NEXUS_BAN_USERS': 'Kullanıcı Banlama',
    'NEXUS_UNBAN_USERS': 'Ban Kaldırma',
    'NEXUS_ACTIVATE_USERS': 'Kullanıcı Aktivasyonu',
    'NEXUS_DEACTIVATE_USERS': 'Kullanıcı Deaktivasyonu',
    'NEXUS_CONVERSATIONS_ACCESS': 'Mesaj İzleme',
    'NEXUS_DISABLE_CONVERSATIONS': 'Konuşma Devre Dışı Bırakma',
    'NEXUS_DELETE_CONVERSATIONS': 'Konuşma Silme',
    'NEXUS_FRIENDS_ACCESS': 'Arkadaşlık İlişkileri Görüntüleme',
    'NEXUS_REMOVE_FRIENDSHIPS': 'Arkadaşlık Kaldırma',
    'NEXUS_BLOCK_USER_FRIENDSHIPS': 'Arkadaşlık Engelleme',
    'NEXUS_CLEAR_PENDING_REQUESTS': 'Bekleyen İstekleri Temizleme',
    'NEXUS_CONTENT_ANALYTICS_ACCESS': 'İçerik Analitik Görüntüleme',
    'NEXUS_LOGS_ACCESS': 'Sistem Kayıtları Görüntüleme',
    'USER_LOGIN': 'Kullanıcı Girişi',
    'USER_LOGOUT': 'Kullanıcı Çıkışı',
    'USER_REGISTER': 'Kullanıcı Kaydı',
    'USER_UPDATE_PROFILE': 'Profil Güncelleme',
    'POST_CREATE': 'Gönderi Oluşturma',
    'POST_DELETE': 'Gönderi Silme',
    'MESSAGE_SEND': 'Mesaj Gönderme',
    'FRIEND_REQUEST': 'Arkadaşlık İsteği',
    'SECURITY_ALERT': 'Güvenlik Uyarısı',
    'FAILED_LOGIN': 'Başarısız Giriş',
    'RATE_LIMIT_EXCEEDED': 'Rate Limit Aşımı'
  };

  return actionMap[action] || action;
}