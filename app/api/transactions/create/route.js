import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import Listing from '@/lib/models/Listing';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';

// POST - Créer une transaction (client confirme son paiement)
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { listingId, amount, paymentMethod, paymentReference, paymentProof } = body;

    if (!listingId || !amount || !paymentMethod || !paymentReference) {
      return NextResponse.json({ 
        error: 'Données manquantes' 
      }, { status: 400 });
    }

    // Vérifier l'annonce
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur n'est pas le propriétaire
    if (listing.ownerId.toString() === auth.userId) {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas acheter votre propre annonce' 
      }, { status: 400 });
    }

    // Calculer la commission
    const commissionRate = 7; // 7%
    const commissionAmount = Math.round(amount * (commissionRate / 100));
    const sellerReceives = amount - commissionAmount;

    // Créer la transaction
    const transaction = new Transaction({
      listingId,
      buyerId: auth.userId,
      sellerId: listing.ownerId,
      amount,
      commissionRate,
      commissionAmount,
      sellerReceives,
      paymentMethod,
      paymentReference,
      notes: paymentProof,
      status: 'PENDING_PAYMENT', // En attente de validation par admin
      transactionType: listing.category === 'SALE' ? 'SALE' : 'RENT',
    });

    await transaction.save();

    return NextResponse.json({
      success: true,
      message: 'Paiement enregistré avec succès. Validation sous 24-48h.',
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        commissionAmount: transaction.commissionAmount,
        status: transaction.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur création transaction:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}
