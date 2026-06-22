import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import Listing from '@/lib/models/Listing';
import User from '@/lib/models/User';
import Settings from '@/lib/models/Settings';
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

    // Récupérer les taux de commission
    let settings = await Settings.findById('global_settings');
    if (!settings) {
      // Créer paramètres par défaut si inexistants
      settings = new Settings({
        _id: 'global_settings',
        commissionRates: { client: 7, owner: 7 },
      });
      await settings.save();
    }

    const clientCommissionRate = settings.commissionRates.client;
    const ownerCommissionRate = settings.commissionRates.owner;

    // Calculer les commissions
    // Commission client (ajoutée au prix)
    const clientCommission = Math.round(amount * (clientCommissionRate / 100));
    // Commission propriétaire (prélevée du prix)
    const ownerCommission = Math.round(amount * (ownerCommissionRate / 100));
    // Total KAPUCE.G
    const totalCommission = clientCommission + ownerCommission;
    // Montant que paie le client (prix + commission client)
    const clientPays = amount + clientCommission;
    // Montant que reçoit le propriétaire (prix - commission propriétaire)
    const sellerReceives = amount - ownerCommission;

    // Créer la transaction
    const transaction = new Transaction({
      listingId,
      buyerId: auth.userId,
      sellerId: listing.ownerId,
      amount: clientPays, // Le montant total payé par le client
      baseAmount: amount, // Le prix de base de l'annonce
      commissionRate: clientCommissionRate, // Taux client pour historique
      ownerCommissionRate: ownerCommissionRate, // Taux propriétaire
      commissionAmount: totalCommission, // Commission totale KAPUCE.G
      clientCommission, // Commission prélevée au client
      ownerCommission, // Commission prélevée au propriétaire
      sellerReceives,
      paymentMethod,
      paymentReference,
      notes: paymentProof,
      status: 'PENDING_PAYMENT',
      transactionType: listing.category === 'SALE' ? 'SALE' : 'RENT',
    });

    await transaction.save();

    return NextResponse.json({
      success: true,
      message: 'Paiement enregistré avec succès. Validation sous 24-48h.',
      transaction: {
        _id: transaction._id,
        baseAmount: amount,
        clientPays,
        clientCommission,
        ownerCommission,
        totalCommission,
        sellerReceives,
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
