const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(401).json({ error: 'Accès non autorisé' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role },
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, verifiedUsers, pendingListings, totalListings, totalTransactions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Listing.countDocuments({ status: 'PENDING' }),
      Listing.countDocuments(),
      Transaction.countDocuments({ status: 'COMPLETED' }),
    ]);

    const revenueResult = await Transaction.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]);

    const recentUsers = await User.find()
      .select('fullName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        verifiedUsers,
        pendingListings,
        totalListings,
        totalTransactions,
        totalRevenue: revenueResult[0]?.total || 0,
        commissionRate: parseFloat(process.env.COMMISSION_RATE) || 7,
      },
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/listings
router.get('/listings', adminAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'PENDING' })
      .populate('ownerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    res.json({ listings: listings.map(l => ({ ...l.toObject(), owner: l.ownerId })) });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/listings/:id/approve
router.put('/listings/:id/approve', adminAuth, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'ACTIVE', verified: true, verifiedAt: new Date(), verifiedBy: req.userId },
      { new: true, runValidators: false }
    );

    if (!listing) return res.status(404).json({ error: 'Annonce non trouvée' });

    await Notification.create({
      userId: listing.ownerId,
      type: 'LISTING_APPROVED',
      title: '✅ Annonce approuvée',
      message: `Votre annonce "${listing.title}" a été approuvée`,
      data: { listingId: listing._id },
    });

    res.json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/listings/:id/reject
router.put('/listings/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED', verified: false, rejectionReason: reason || 'Non conforme' },
      { new: true, runValidators: false }
    );

    if (!listing) return res.status(404).json({ error: 'Annonce non trouvée' });

    await Notification.create({
      userId: listing.ownerId,
      type: 'LISTING_REJECTED',
      title: '❌ Annonce rejetée',
      message: `Votre annonce "${listing.title}" a été rejetée. Raison: ${reason}`,
      data: { listingId: listing._id, reason },
    });

    res.json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({ error: 'Impossible de bannir un admin' });
    }

    user.isBanned = true;
    user.banReason = req.body.reason || 'Violation des conditions';
    await user.save();

    res.json({ success: true, user: { _id: user._id, isBanned: user.isBanned } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: null },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json({ success: true, user: { _id: user._id, isBanned: user.isBanned } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
