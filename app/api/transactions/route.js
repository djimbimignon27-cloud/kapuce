import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import Listing from '@/lib/models/Listing';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';
import { 
  notifyTransactionInitiated, 
  notifyPaymentReceived,
  notifyCommissionCharged 
} from '@/lib/services/notificationService';
import { v4 as uuidv4 } from 'uuid';

// Taux de commission par défaut (peut être configurable dans l'admin)
const DEFAULT_COMMISSION_RATE = 7; // 7%

// GET - Récupérer les transactions de l'utilisateur
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role') || 'all'; // 'buyer', 'seller', 'all'
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Construire le filtre
    let filter = {};
    if (role === 'buyer') {
      filter.buyerId = auth.userId;
    } else if (role === 'seller') {
      filter.sellerId = auth.userId;
    } else {
      filter.$or = [
        { buyerId: auth.userId },
        { sellerId: auth.userId }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .populate('listingId', 'title images price type category')
      .populate('buyerId', 'fullName email phone')
      .populate('sellerId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    // Calculer les statistiques
    const stats = await Transaction.aggregate([
      { $match: { $or: [{ buyerId: auth.userId }, { sellerId: auth.userId }] } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalReceived: { $sum: { $cond: [{ $eq: ['$sellerId', auth.userId] }, '$sellerReceives', 0] } },
          totalPaid: { $sum: { $cond: [{ $eq: ['$buyerId', auth.userId] }, '$amount', 0] } },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        }
      }
    ]);

    return NextResponse.json({
      transactions,
      stats: stats[0] || { totalAmount: 0, totalCommission: 0, totalReceived: 0, totalPaid: 0, completedCount: 0 },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle transaction
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { listingId, paymentMethod, notes, transactionType, rentalPeriod } = body;

    // Vérifier que l'annonce existe et est active
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cette annonce n\'est pas disponible' },
        { status: 400 }
      );
    }

    // Vérifier que l'acheteur n'est pas le vendeur
    if (listing.ownerId === auth.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas acheter votre propre annonce' },
        { status: 400 }
      );
    }

    // Calculer la commission
    const { commissionAmount, sellerReceives, commissionRate } = Transaction.calculateCommission(
      listing.price,
      DEFAULT_COMMISSION_RATE
    );

    // Créer la transaction
    const transaction = new Transaction({
      _id: uuidv4(),
      listingId: listing._id,
      buyerId: auth.userId,
      sellerId: listing.ownerId,
      amount: listing.price,
      commissionRate,
      commissionAmount,
      sellerReceives,
      paymentMethod,
      transactionType: transactionType || (listing.category === 'RENT' ? 'RENT' : 'SALE'),
      notes,
      rentalPeriod,
      status: 'INITIATED',
    });

    await transaction.save();

    // Envoyer des notifications
    try {
      // Notifier le vendeur
      await notifyTransactionInitiated(
        listing.ownerId,
        transaction._id,
        listing.title,
        listing.price
      );

      // Notifier l'acheteur
      await notifyTransactionInitiated(
        auth.userId,
        transaction._id,
        listing.title,
        listing.price
      );
    } catch (notifError) {
      console.error('Erreur notifications:', notifError);
    }

    console.log(`💰 [TRANSACTION] Nouvelle transaction créée: ${transaction._id} - ${listing.price} FCFA`);

    return NextResponse.json({
      success: true,
      message: 'Transaction initiée avec succès',
      transaction: {
        ...transaction.toObject(),
        listing: {
          title: listing.title,
          price: listing.price,
        },
      },
      commission: {
        rate: commissionRate,
        amount: commissionAmount,
        sellerReceives,
      },
    });
  } catch (error) {
    console.error('Erreur création transaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le statut d'une transaction
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { transactionId, status, paymentReference, cancelReason } = body;

    const transaction = await Transaction.findById(transactionId)
      .populate('listingId', 'title');
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est impliqué dans la transaction
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(auth.role);
    const isBuyer = transaction.buyerId === auth.userId;
    const isSeller = transaction.sellerId === auth.userId;

    if (!isAdmin && !isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Mettre à jour le statut
    const previousStatus = transaction.status;
    transaction.status = status;

    if (status === 'PAID') {
      transaction.paidAt = new Date();
      transaction.paymentReference = paymentReference;
      
      // Notifier le vendeur du paiement
      try {
        await notifyPaymentReceived(
          transaction.sellerId,
          transaction.sellerReceives,
          transaction._id
        );
        await notifyCommissionCharged(
          transaction.sellerId,
          transaction.commissionAmount,
          transaction.commissionRate,
          transaction._id
        );
      } catch (e) {
        console.error('Erreur notification paiement:', e);
      }
    }

    if (status === 'COMPLETED') {
      transaction.completedAt = new Date();
      
      // Mettre à jour le statut de l'annonce
      await Listing.findByIdAndUpdate(transaction.listingId, {
        status: 'SOLD',
        soldAt: new Date(),
      });
    }

    if (status === 'CANCELLED') {
      transaction.cancelReason = cancelReason;
    }

    await transaction.save();

    console.log(`💰 [TRANSACTION] Statut mis à jour: ${transactionId} - ${previousStatus} -> ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Transaction mise à jour',
      transaction,
    });
  } catch (error) {
    console.error('Erreur mise à jour transaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
