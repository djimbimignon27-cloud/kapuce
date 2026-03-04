import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import Listing from '@/lib/models/Listing';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';
import { processPayment, calculateCommission } from '@/lib/payment';
import { sendTransactionEmail } from '@/lib/email';

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

    // Récupérer les transactions où l'utilisateur est acheteur ou vendeur
    const transactions = await Transaction.find({
      $or: [
        { buyerId: auth.userId },
        { sellerId: auth.userId },
      ],
    })
      .populate('listingId', 'title price images type')
      .populate('buyerId', 'fullName email')
      .populate('sellerId', 'fullName email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
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
    const { listingId, paymentMethod } = body;

    if (!listingId || !paymentMethod) {
      return NextResponse.json(
        { error: 'listingId et paymentMethod requis' },
        { status: 400 }
      );
    }

    // Trouver l'annonce
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cette annonce n\'est plus disponible' },
        { status: 400 }
      );
    }

    // Vérifier que l'acheteur n'est pas le vendeur
    if (listing.ownerId.toString() === auth.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas acheter votre propre annonce' },
        { status: 400 }
      );
    }

    const amount = listing.price;
    const commissionAmount = calculateCommission(amount);

    // Traiter le paiement (mocké)
    const paymentResult = await processPayment({
      amount,
      buyerId: auth.userId,
      sellerId: listing.ownerId.toString(),
      listingId,
      paymentMethod,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Le paiement a échoué' },
        { status: 400 }
      );
    }

    // Créer la transaction
    const transaction = await Transaction.create({
      listingId,
      buyerId: auth.userId,
      sellerId: listing.ownerId,
      amount,
      commissionAmount,
      status: 'PAID',
      paymentMethod,
      transactionId: paymentResult.transactionId,
    });

    // Mettre à jour le statut de l'annonce
    listing.status = listing.category === 'SALE' ? 'SOLD' : 'RENTED';
    await listing.save();

    // Envoyer notifications email
    const buyer = await User.findById(auth.userId);
    const seller = await User.findById(listing.ownerId);

    await sendTransactionEmail(buyer.email, {
      type: 'buyer',
      listing: listing.title,
      amount,
      transactionId: transaction._id,
    });

    await sendTransactionEmail(seller.email, {
      type: 'seller',
      listing: listing.title,
      amount,
      transactionId: transaction._id,
    });

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('listingId', 'title price images')
      .populate('buyerId', 'fullName email')
      .populate('sellerId', 'fullName email');

    return NextResponse.json(
      {
        message: 'Transaction créée avec succès!',
        transaction: populatedTransaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
