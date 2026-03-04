import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import { authenticateRequest } from '@/lib/auth';
import { logAdminAction, hasPermission } from '@/lib/adminAuth';

// GET - Récupérer les annonces avec filtres
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !hasPermission(auth.role, 'approve_listings')) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const listings = await Listing.find(filter)
      .populate('ownerId', 'fullName email phone emailVerified identityVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Listing.countDocuments(filter);

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Approuver/rejeter une annonce
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !hasPermission(auth.role, 'approve_listings')) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { listingId, action, reason } = body;

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

    let actionDescription = '';

    if (action === 'approve') {
      listing.verified = true;
      listing.status = 'ACTIVE';
      actionDescription = `Annonce approuvée: ${listing.title}`;
    } else if (action === 'reject') {
      listing.verified = false;
      listing.status = 'PENDING';
      listing.rejectionReason = reason || 'Non conforme';
      actionDescription = `Annonce rejetée: ${listing.title} - Raison: ${reason}`;
    } else if (action === 'delete') {
      await Listing.findByIdAndDelete(listingId);
      actionDescription = `Annonce supprimée: ${listing.title}`;
      
      await logAdminAction({
        adminId: auth.userId,
        action: actionDescription,
        targetType: 'LISTING',
        targetId: listingId,
        details: reason || '',
        request,
      });

      return NextResponse.json({
        message: 'Annonce supprimée avec succès',
      });
    } else {
      return NextResponse.json(
        { error: 'Action non reconnue' },
        { status: 400 }
      );
    }

    await listing.save();

    // Logger l'action
    await logAdminAction({
      adminId: auth.userId,
      action: actionDescription,
      targetType: 'LISTING',
      targetId: listingId,
      details: reason || '',
      request,
    });

    return NextResponse.json({
      message: `Annonce ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
      listing,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
