import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Listing from '@/lib/models/Listing';
import Transaction from '@/lib/models/Transaction';
import Report from '@/lib/models/Report';
import AdminLog from '@/lib/models/AdminLog';
import { authenticateRequest } from '@/lib/auth';
import { checkAdminPermission, hasPermission } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier les permissions
    if (!['SUPER_ADMIN', 'ADMIN_MODERATOR', 'ADMIN_FINANCE'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    // Statistiques utilisateurs
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ 
      emailVerified: true, 
      phoneVerified: true,
      identityVerified: true 
    });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Statistiques annonces
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: 'ACTIVE' });
    const pendingListings = await Listing.countDocuments({ status: 'PENDING' });
    const rejectedListings = await Listing.countDocuments({ status: 'PENDING', verified: false });
    const verifiedListings = await Listing.countDocuments({ verified: true });

    // Statistiques transactions
    const totalTransactions = await Transaction.countDocuments();
    const completedTransactions = await Transaction.countDocuments({ 
      status: { $in: ['PAID', 'COMPLETED'] } 
    });

    // Revenus (commission 7%)
    const revenueData = await Transaction.aggregate([
      { $match: { status: { $in: ['PAID', 'COMPLETED'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$commissionAmount' },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, totalAmount: 0 };

    // Revenus mensuels (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          status: { $in: ['PAID', 'COMPLETED'] },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Croissance utilisateurs (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Signalements
    const pendingReports = await Report.countDocuments({ status: 'PENDING' });
    const resolvedReports = await Report.countDocuments({ status: 'RESOLVED' });

    // Distribution par type d'annonce
    const listingsByType = await Listing.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    // Distribution par catégorie
    const listingsByCategory = await Listing.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Activité récente
    const recentUsers = await User.find()
      .select('fullName email role createdAt emailVerified')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentListings = await Listing.find()
      .select('title price type status createdAt')
      .populate('ownerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentTransactions = await Transaction.find()
      .select('amount commissionAmount status createdAt')
      .populate('listingId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Logs admin récents (si SUPER_ADMIN)
    let recentAdminLogs = [];
    if (auth.role === 'SUPER_ADMIN') {
      recentAdminLogs = await AdminLog.find()
        .populate('adminId', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        banned: bannedUsers,
        newToday: newUsersToday,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        pending: pendingListings,
        rejected: rejectedListings,
        verified: verifiedListings,
        byType: listingsByType,
        byCategory: listingsByCategory,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
      },
      revenue: {
        totalCommission: revenue.totalRevenue,
        totalTransactions: revenue.totalAmount,
        monthly: monthlyRevenue,
      },
      reports: {
        pending: pendingReports,
        resolved: resolvedReports,
      },
      growth: {
        users: userGrowth,
      },
      recentActivity: {
        users: recentUsers,
        listings: recentListings,
        transactions: recentTransactions,
      },
      adminLogs: recentAdminLogs,
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
