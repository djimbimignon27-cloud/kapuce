import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import { authenticateRequest } from '@/lib/auth';
import { notifyListingApproved } from '@/lib/services/notificationService';

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

    // Utiliser findByIdAndUpdate pour éviter les problèmes de validation
    const listing = await Listing.findByIdAndUpdate(
      id,
      {
        $set: {
          verified: true,
          status: 'ACTIVE',
          verifiedAt: new Date(),
          verifiedBy: auth.userId,
        }
      },
      { new: true, runValidators: false }
    );

    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    // Envoyer une notification au propriétaire
    try {
      await notifyListingApproved(listing.ownerId, listing._id, listing.title);
    } catch (notifError) {
      console.error('Erreur notification:', notifError);
    }

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
