// app/api/nexus/security/route.js - Admin security management
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

    // Get security-related statistics
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get failed login attempts
    const failedLogins = await AdminLog.countDocuments({
      action: 'FAILED_LOGIN',
      createdAt: { $gte: last24Hours }
    });

    // Get security alerts from logs
    const securityAlerts = await AdminLog.find({
      $or: [
        { action: { $regex: /SECURITY|BAN|SUSPICIOUS|VIOLATION/i } },
        { severity: 'high' }
      ],
      createdAt: { $gte: last7Days }
    })
    .populate('admin', 'username')
    .populate('targetUser', 'username')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

    // Format security alerts
    const formattedAlerts = securityAlerts.map(log => ({
      _id: log._id,
      type: getAlertType(log.action),
      description: getAlertDescription(log),
      severity: log.severity,
      status: log.createdAt > last24Hours ? 'active' : 'resolved',
      createdAt: log.createdAt,
      details: log.details,
      targetUser: log.targetUser,
      admin: log.admin,
      ipAddress: log.ipAddress
    }));

    // Get currently active threats
    const activeThreats = formattedAlerts.filter(alert => alert.status === 'active');

    // Get banned users count
    const bannedUsers = await User.countDocuments({
      'moderationInfo.isBanned': true
    });

    // Get rate limit violations
    const rateLimitViolations = await AdminLog.countDocuments({
      action: 'RATE_LIMIT_EXCEEDED',
      createdAt: { $gte: last24Hours }
    });

    // Get suspicious activities
    const suspiciousActivities = await AdminLog.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          $or: [
            { action: { $regex: /FAILED_LOGIN/i } },
            { action: { $regex: /UNAUTHORIZED/i } },
            { action: { $regex: /SUSPICIOUS/i } }
          ]
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastSeen: { $max: '$createdAt' }
        }
      },
      {
        $match: {
          count: { $gte: 5 } // IPs with 5+ suspicious activities
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Calculate security score (0-100)
    let securityScore = 100;
    
    // Deduct points for various security issues
    if (failedLogins > 50) securityScore -= 10;
    else if (failedLogins > 20) securityScore -= 5;
    
    if (activeThreats.length > 10) securityScore -= 15;
    else if (activeThreats.length > 5) securityScore -= 10;
    else if (activeThreats.length > 0) securityScore -= 5;
    
    if (rateLimitViolations > 100) securityScore -= 10;
    else if (rateLimitViolations > 50) securityScore -= 5;
    
    if (suspiciousActivities.length > 5) securityScore -= 10;
    else if (suspiciousActivities.length > 0) securityScore -= 5;
    
    // Ensure score doesn't go below 0
    securityScore = Math.max(0, securityScore);

    // Get security trends
    const securityTrends = await AdminLog.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          severity: { $in: ['medium', 'high'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Log access
    await AdminLog.logAction(
      admin._id,
      'NEXUS_SECURITY_ACCESS',
      'system',
      null,
      {
        timestamp: new Date(),
        activeAlerts: activeThreats.length
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      'low'
    );

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
      statistics: {
        failedLogins,
        bannedUsers,
        rateLimitViolations,
        activeThreats: activeThreats.length,
        securityScore,
        suspiciousIPs: suspiciousActivities.length
      },
      suspiciousActivities,
      securityTrends,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Nexus security error:', error);

    if (error.message === 'Invalid nexus token') {
      return NextResponse.json({
        success: false,
        message: 'Nexus token expired or invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch security data'
    }, { status: 500 });
  }
}

// Helper function to determine alert type
function getAlertType(action) {
  if (action.includes('BAN')) return 'Kullanıcı Banlama';
  if (action.includes('FAILED_LOGIN')) return 'Başarısız Giriş';
  if (action.includes('RATE_LIMIT')) return 'Rate Limit Aşımı';
  if (action.includes('SUSPICIOUS')) return 'Şüpheli Aktivite';
  if (action.includes('VIOLATION')) return 'Kural İhlali';
  if (action.includes('UNAUTHORIZED')) return 'Yetkisiz Erişim';
  if (action.includes('DELETE')) return 'Veri Silme';
  return 'Güvenlik Olayı';
}

// Helper function to generate alert description
function getAlertDescription(log) {
  const { action, details, targetUser, admin } = log;
  
  switch (action) {
    case 'NEXUS_USER_DELETE':
      return `${admin?.username || 'Admin'} tarafından ${targetUser?.username || 'bir kullanıcı'} silindi`;
    case 'NEXUS_BAN_USERS':
      return `${details?.count || 1} kullanıcı banlandı`;
    case 'FAILED_LOGIN':
      return `${log.ipAddress} IP adresinden başarısız giriş denemesi`;
    case 'RATE_LIMIT_EXCEEDED':
      return `${log.ipAddress} IP adresi rate limit'i aştı`;
    case 'SUSPICIOUS_ACTIVITY':
      return details?.description || 'Şüpheli aktivite tespit edildi';
    default:
      return `${action} işlemi gerçekleştirildi`;
  }
}