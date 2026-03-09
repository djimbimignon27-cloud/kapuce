import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer les annonces en attente de vérification
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const pendingListings = await Listing.find({ status: 'PENDING' })
      .populate('ownerId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    // Mapper ownerId vers owner pour le frontend
    const listingsWithOwner = pendingListings.map(listing => ({
      ...listing,
      owner: listing.ownerId,
    }));

    return NextResponse.json({ listings: listingsWithOwner });
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Vérifier ou rejeter une annonce
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { listingId, action } = body;

    if (!listingId || !action) {
      return NextResponse.json(
        { error: 'listingId et action requis' },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      listing.verified = true;
      listing.status = 'ACTIVE';
      console.log(`✅ [ADMIN] Annonce approuvée: ${listing.title}`);
    } else if (action === 'reject') {
      listing.status = 'PENDING';
      listing.verified = false;
      console.log(`❌ [ADMIN] Annonce rejetée: ${listing.title}`);
    } else {
      return NextResponse.json(
        { error: 'Action non reconnue' },
        { status: 400 }
      );
    }

    await listing.save();

    return NextResponse.json({
      message: `Annonce ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
      listing,
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'annonce:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
