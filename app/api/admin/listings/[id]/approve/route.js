import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import { authenticateRequest } from '@/lib/auth';

// PUT - Approuver une annonce
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    listing.verified = true;
    listing.status = 'ACTIVE';
    listing.verifiedAt = new Date();
    listing.verifiedBy = auth.userId;
    await listing.save();

    console.log(`✅ [ADMIN] Annonce approuvée: ${listing.title} par ${auth.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Annonce approuvée avec succès',
      listing,
    });
  } catch (error) {
    console.error('Erreur lors de l\'approbation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
