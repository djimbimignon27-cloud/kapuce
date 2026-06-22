import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import User from '@/lib/models/User';
import Listing from '@/lib/models/Listing';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import jwt from 'jsonwebtoken';

// Configuration des paiements Mobile Money KAPUCE.G
const MOBILE_MONEY_CONFIG = {
  AIRTEL_MONEY: {
    number: '077347262',
    name: 'KAPUCE.G - Airtel Money',
  },
  MOOV_MONEY: {
    number: '065216069',
    name: 'KAPUCE.G - Moov Money',
  },
};

// Taux de commission par défaut (en pourcentage)
const DEFAULT_COMMISSION_RATES = {
  USER: 7,
  OWNER: 5,
  AGENCY: 3,
  PROFESSIONAL: 4,
};

// Middleware pour vérifier les droits admin
async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Non autorisé', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return { error: 'Token invalide', status: 401 };
  }

  const admin = await User.findById(decoded.userId);
  if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    return { error: 'Accès refusé', status: 403 };
  }

  return { admin, decoded };
}

// GET - Liste des transactions (admin)
export async function GET(request) {
  try {
    await connectDB();
    
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status'); // PENDING, COMPLETED, CANCELLED, REFUNDED
    const userId = searchParams.get('userId');

    // Construire le filtre
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (userId) {
      filter.$or = [{ buyerId: userId }, { sellerId: userId }];
    }

    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    // Enrichir avec les infos
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        const [buyer, seller, listing] = await Promise.all([
          User.findById(tx.buyerId).select('fullName email role').lean(),
          User.findById(tx.sellerId).select('fullName email role customCommissionRate').lean(),
          Listing.findById(tx.listingId).select('title type category').lean(),
        ]);
        
        return {
          ...tx,
          buyer: buyer || { fullName: 'Utilisateur supprimé' },
          seller: seller || { fullName: 'Utilisateur supprimé' },
          listing: listing || { title: 'Annonce supprimée' },
        };
      })
    );

    // Statistiques
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      transactions: enrichedTransactions,
      stats: stats.reduce((acc, s) => ({ 
        ...acc, 
        [s._id]: { 
          count: s.count, 
          totalAmount: s.totalAmount,
          totalCommission: s.totalCommission,
        } 
      }), {}),
      mobileMoneyConfig: MOBILE_MONEY_CONFIG,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur liste transactions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Modifier une transaction (commission, statut)
export async function PUT(request) {
  try {
    await connectDB();
    
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { transactionId, action, commissionRate, newStatus, adminNotes } = body;

    if (!transactionId || !action) {
      return NextResponse.json({ error: 'ID transaction et action requis' }, { status: 400 });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    if (action === 'update_commission') {
      if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
        return NextResponse.json({ error: 'Taux de commission invalide (0-100)' }, { status: 400 });
      }

      // Recalculer le montant de la commission
      const newCommissionAmount = (transaction.amount * commissionRate) / 100;
      const newSellerReceives = transaction.amount - newCommissionAmount;

      await Transaction.findByIdAndUpdate(transactionId, {
        commissionRate,
        commissionAmount: newCommissionAmount,
        sellerReceives: newSellerReceives,
        adminModified: true,
        adminModifiedAt: new Date(),
        adminModifiedBy: authCheck.decoded.userId,
        adminNotes,
      });

      return NextResponse.json({
        success: true,
        message: `Commission mise à jour: ${commissionRate}% (${newCommissionAmount} FCFA)`,
        newCommissionAmount,
        newNetAmount: newSellerReceives,
      });
    } else if (action === 'validate_payment') {
      // Valider le paiement reçu par KAPUCE.G
      transaction.status = 'PAID';
      transaction.paidAt = new Date();
      transaction.adminModified = true;
      transaction.adminModifiedAt = new Date();
      transaction.adminModifiedBy = authCheck.decoded.userId;
      if (adminNotes) transaction.notes = adminNotes;
      
      await transaction.save();

      // Récupérer les infos du vendeur et de l'annonce
      const [seller, listing] = await Promise.all([
        User.findById(transaction.sellerId),
        Listing.findById(transaction.listingId),
      ]);

      // Créer une conversation ou récupérer existante entre KAPUCE.G (système) et le vendeur
      let conversation = await Conversation.findOne({
        participants: { $all: [transaction.sellerId] },
        isSystemConversation: true,
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [transaction.sellerId],
          isSystemConversation: true,
          isActive: true,
        });
        await conversation.save();
      }

      // Créer un message de notification dans la messagerie
      const notificationMessage = new Message({
        conversationId: conversation._id,
        senderId: 'SYSTEM', // Message système
        receiverId: transaction.sellerId,
        content: `🎉 Bonne nouvelle ! Le paiement pour votre ${listing?.type === 'HOUSE' ? 'bien immobilier' : listing?.type === 'CAR' ? 'véhicule' : 'terrain'} "${listing?.title}" a été validé par KAPUCE.G.\n\n💰 Montant: ${new Intl.NumberFormat('fr-FR').format(transaction.amount)} FCFA\n💵 Vous recevrez: ${new Intl.NumberFormat('fr-FR').format(transaction.sellerReceives)} FCFA\n⏰ Délai: Sous 24 heures sur votre compte Mobile Money\n\n✅ Transaction ID: ${transaction._id}`,
        status: 'SENT',
        isSystemMessage: true,
      });
      await notificationMessage.save();

      // Mettre à jour la conversation
      conversation.lastMessage = {
        content: notificationMessage.content,
        senderId: 'SYSTEM',
        createdAt: new Date(),
      };
      conversation.updatedAt = new Date();
      await conversation.save();

      return NextResponse.json({
        success: true,
        message: 'Paiement validé et notification envoyée au propriétaire',
        transaction: {
          _id: transaction._id,
          status: transaction.status,
          sellerReceives: transaction.sellerReceives,
        },
      });
    } else if (action === 'update_status') {
      if (!['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(newStatus)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }

      await Transaction.findByIdAndUpdate(transactionId, {
        status: newStatus,
        adminModified: true,
        adminModifiedAt: new Date(),
        adminModifiedBy: authCheck.decoded.userId,
        adminNotes,
      });

      // Si la transaction est complétée, mettre à jour le listing
      if (newStatus === 'COMPLETED') {
        await Listing.findByIdAndUpdate(transaction.listingId, {
          status: transaction.type === 'SALE' ? 'SOLD' : 'RENTED',
        });
      }

      return NextResponse.json({
        success: true,
        message: `Statut mis à jour: ${newStatus}`,
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur modification transaction:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une transaction
export async function POST(request) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, paymentMethod } = body;

    if (!listingId || !paymentMethod) {
      return NextResponse.json({ error: 'Annonce et méthode de paiement requis' }, { status: 400 });
    }

    // Vérifier l'utilisateur
    const buyer = await User.findById(decoded.userId);
    if (!buyer) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    if (buyer.isBanned) {
      return NextResponse.json({ error: 'Votre compte est bloqué' }, { status: 403 });
    }

    // Vérifier l'annonce
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }
    if (listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cette annonce n\'est plus disponible' }, { status: 400 });
    }

    // Récupérer le vendeur
    const seller = await User.findById(listing.ownerId);
    if (!seller) {
      return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });
    }

    // Calculer la commission
    let commissionRate = seller.customCommissionRate || DEFAULT_COMMISSION_RATES[seller.role] || 7;
    const amount = listing.price;
    const commissionAmount = (amount * commissionRate) / 100;
    const sellerReceives = amount - commissionAmount;

    // Créer la transaction
    const transaction = new Transaction({
      listingId,
      buyerId: decoded.userId,
      sellerId: listing.ownerId,
      type: listing.category,
      amount,
      commissionRate,
      commissionAmount,
      sellerReceives,
      paymentMethod,
      status: 'INITIATED',
    });
    await transaction.save();

    // Infos de paiement Mobile Money
    const paymentInfo = MOBILE_MONEY_CONFIG[paymentMethod] || MOBILE_MONEY_CONFIG.AIRTEL_MONEY;

    return NextResponse.json({
      success: true,
      transaction: transaction.toObject(),
      paymentInfo: {
        ...paymentInfo,
        amount,
        reference: transaction._id,
        instructions: `Envoyez ${amount} FCFA au ${paymentInfo.number} (${paymentInfo.name}) avec la référence: ${transaction._id}`,
      },
    });
  } catch (error) {
    console.error('Erreur création transaction:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
