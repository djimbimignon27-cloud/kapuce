import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import { authenticateRequest } from '@/lib/auth';
import { notifyListingRejected } from '@/lib/services/notificationService';

// PUT - Rejeter une annonce
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
    const body = await request.json();
    const { reason } = body;

    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    listing.status = 'REJECTED';
    listing.verified = false;
    listing.rejectedAt = new Date();
    listing.rejectedBy = auth.userId;
    listing.rejectionReason = reason || 'Non conforme aux conditions';
    await listing.save();

    // Envoyer une notification au propriétaire
    try {
      await notifyListingRejected(listing.ownerId, listing._id, listing.title, reason);
    } catch (notifError) {
      console.error('Erreur notification:', notifError);
    }

    console.log(`❌ [ADMIN] Annonce rejetée: ${listing.title} - Raison: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'Annonce rejetée',
      listing,
    });
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
