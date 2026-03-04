import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import Notification from '@/lib/models/Notification';
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
    const mediaStatus = searchParams.get('mediaStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (mediaStatus) filter.mediaStatus = mediaStatus;

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

// PUT - Approuver/rejeter une annonce ou ses médias
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
    const { listingId, action, reason, rejectedImages, rejectedVideo } = body;

    if (!listingId || !action) {
      return NextResponse.json(
        { error: 'listingId et action requis' },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(listingId).populate('ownerId', 'fullName email');
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    let actionDescription = '';
    let notificationData = null;

    if (action === 'approve') {
      listing.verified = true;
      listing.status = 'ACTIVE';
      listing.mediaStatus = 'APPROVED';
      actionDescription = `Annonce approuvée: ${listing.title}`;
      
      notificationData = {
        userId: listing.ownerId._id,
        type: 'LISTING_APPROVED',
        title: '✅ Annonce approuvée',
        message: `Votre annonce "${listing.title}" a été approuvée et est maintenant visible publiquement.`,
        relatedId: listingId,
        relatedType: 'LISTING',
        actionUrl: `/listings/${listingId}`,
      };
    } 
    else if (action === 'reject') {
      listing.verified = false;
      listing.status = 'PENDING';
      listing.rejectionReason = reason || 'Non conforme aux standards';
      actionDescription = `Annonce rejetée: ${listing.title} - Raison: ${reason}`;
      
      notificationData = {
        userId: listing.ownerId._id,
        type: 'LISTING_REJECTED',
        title: '❌ Annonce rejetée',
        message: `Votre annonce "${listing.title}" a été rejetée. Raison: ${reason || 'Non conforme'}`,
        relatedId: listingId,
        relatedType: 'LISTING',
        actionUrl: `/listings/edit/${listingId}`,
      };
    }
    else if (action === 'reject_media') {
      listing.mediaStatus = 'REJECTED';
      listing.mediaRejectionReason = reason || 'Photos ou vidéo de mauvaise qualité';
      
      // Stocker les médias rejetés
      listing.rejectedMedia = {
        images: rejectedImages || listing.images,
        video: rejectedVideo !== undefined ? rejectedVideo : listing.video,
        reason: reason || 'Mauvaise qualité des médias',
      };
      
      actionDescription = `Médias rejetés pour: ${listing.title} - Raison: ${reason}`;
      
      // Notification spécifique pour rejet de médias
      notificationData = {
        userId: listing.ownerId._id,
        type: 'MEDIA_REJECTED',
        title: '📸 Médias rejetés - Action requise',
        message: `Les photos ou la vidéo de votre annonce "${listing.title}" sont de mauvaise qualité. Raison: ${reason || 'Qualité insuffisante'}. Veuillez les remplacer par des médias de meilleure qualité.`,
        relatedId: listingId,
        relatedType: 'LISTING',
        actionUrl: `/listings/edit/${listingId}`,
      };
    }
    else if (action === 'approve_media') {
      listing.mediaStatus = 'APPROVED';
      listing.mediaRejectionReason = undefined;
      listing.rejectedMedia = undefined;
      actionDescription = `Médias approuvés pour: ${listing.title}`;
      
      notificationData = {
        userId: listing.ownerId._id,
        type: 'LISTING_APPROVED',
        title: '✅ Médias approuvés',
        message: `Les médias de votre annonce "${listing.title}" ont été approuvés.`,
        relatedId: listingId,
        relatedType: 'LISTING',
        actionUrl: `/listings/${listingId}`,
      };
    }
    else if (action === 'delete') {
      await Listing.findByIdAndDelete(listingId);
      actionDescription = `Annonce supprimée: ${listing.title}`;
      
      notificationData = {
        userId: listing.ownerId._id,
        type: 'LISTING_REJECTED',
        title: '🗑️ Annonce supprimée',
        message: `Votre annonce "${listing.title}" a été supprimée par un administrateur.`,
        relatedId: listingId,
        relatedType: 'LISTING',
      };
      
      await logAdminAction({
        adminId: auth.userId,
        action: actionDescription,
        targetType: 'LISTING',
        targetId: listingId,
        details: reason || '',
        request,
      });

      // Créer notification
      if (notificationData) {
        await Notification.create(notificationData);
      }

      return NextResponse.json({
        message: 'Annonce supprimée avec succès',
      });
    } 
    else {
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

    // Créer la notification
    if (notificationData) {
      await Notification.create(notificationData);
      console.log(`📬 [NOTIFICATION] Envoyée à ${listing.ownerId.email}: ${notificationData.title}`);
    }

    return NextResponse.json({
      message: 'Action effectuée avec succès',
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
