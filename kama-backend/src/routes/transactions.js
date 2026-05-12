const express = require('express');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();
const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE) || 7;

// GET /api/transactions
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;

    let filter = {};
    if (role === 'buyer') filter.buyerId = req.userId;
    else if (role === 'seller') filter.sellerId = req.userId;
    else filter.$or = [{ buyerId: req.userId }, { sellerId: req.userId }];
    
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(filter)
      .populate('listingId', 'title images price')
      .populate('buyerId', 'fullName email')
      .populate('sellerId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/transactions
router.post('/', auth, async (req, res) => {
  try {
    const { listingId, paymentMethod, notes } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Annonce non disponible' });
    }

    if (listing.ownerId === req.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas acheter votre propre annonce' });
    }

    const { commissionAmount, sellerReceives, commissionRate } = Transaction.calculateCommission(
      listing.price, COMMISSION_RATE
    );

    const transaction = new Transaction({
      listingId,
      buyerId: req.userId,
      sellerId: listing.ownerId,
      amount: listing.price,
      commissionRate,
      commissionAmount,
      sellerReceives,
      paymentMethod,
      notes,
    });

    await transaction.save();

    // Notifications
    await Notification.create([
      {
        userId: listing.ownerId,
        type: 'TRANSACTION_INITIATED',
        title: '💰 Nouvelle transaction',
        message: `Une transaction de ${listing.price.toLocaleString()} FCFA a été initiée`,
        data: { transactionId: transaction._id },
      },
      {
        userId: req.userId,
        type: 'TRANSACTION_INITIATED',
        title: '💰 Transaction initiée',
        message: `Votre transaction de ${listing.price.toLocaleString()} FCFA a été créée`,
        data: { transactionId: transaction._id },
      },
    ]);

    res.status(201).json({
      transaction,
      commission: { rate: commissionRate, amount: commissionAmount, sellerReceives },
    });
  } catch (error) {
    console.error('Erreur transaction:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, paymentReference, cancelReason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const isParty = [transaction.buyerId, transaction.sellerId].includes(req.userId);

    if (!isAdmin && !isParty) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    transaction.status = status;
    if (status === 'PAID') {
      transaction.paidAt = new Date();
      transaction.paymentReference = paymentReference;
    }
    if (status === 'COMPLETED') {
      transaction.completedAt = new Date();
      await Listing.findByIdAndUpdate(transaction.listingId, { status: 'SOLD' });
    }
    if (status === 'CANCELLED') {
      transaction.cancelReason = cancelReason;
    }

    await transaction.save();
    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/transactions/calculate-commission
router.get('/calculate-commission', (req, res) => {
  const amount = parseFloat(req.query.amount);
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Montant invalide' });
  }
  
  const commission = Math.round(amount * (COMMISSION_RATE / 100));
  res.json({
    amount,
    commissionRate: COMMISSION_RATE,
    commissionAmount: commission,
    sellerReceives: amount - commission,
  });
});

module.exports = router;
