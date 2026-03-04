import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Listing from '@/lib/models/Listing';
import Transaction from '@/lib/models/Transaction';
import Report from '@/lib/models/Report';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    // Statistiques utilisateurs
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Statistiques annonces
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: 'ACTIVE' });
    const pendingListings = await Listing.countDocuments({ status: 'PENDING' });
    const verifiedListings = await Listing.countDocuments({ verified: true });

    // Statistiques transactions
    const totalTransactions = await Transaction.countDocuments();
    const completedTransactions = await Transaction.countDocuments({ status: 'COMPLETED' });
    const paidTransactions = await Transaction.countDocuments({ status: 'PAID' });

    // Revenus
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

    // Revenus mensuels (3 derniers mois)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          status: { $in: ['PAID', 'COMPLETED'] },
          createdAt: { $gte: threeMonthsAgo },
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
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Signalements
    const pendingReports = await Report.countDocuments({ status: 'PENDING' });

    // Activité récente
    const recentUsers = await User.find()
      .select('fullName email createdAt role')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentListings = await Listing.find()
      .select('title price type status createdAt')
      .populate('ownerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentTransactions = await Transaction.find()
      .select('amount status createdAt')
      .populate('listingId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Distribution par type d'annonce
    const listingsByType = await Listing.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        banned: bannedUsers,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        pending: pendingListings,
        verified: verifiedListings,
        byType: listingsByType,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        paid: paidTransactions,
      },
      revenue: {
        totalCommission: revenue.totalRevenue,
        totalTransactions: revenue.totalAmount,
        monthly: monthlyRevenue,
      },
      reports: {
        pending: pendingReports,
      },
      recentActivity: {
        users: recentUsers,
        listings: recentListings,
        transactions: recentTransactions,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
