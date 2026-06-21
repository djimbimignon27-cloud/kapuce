import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer une annonce par ID
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // Vérifier si c'est un admin
    let isAdmin = false;
    try {
      const auth = await authenticateRequest(request);
      isAdmin = auth.authenticated && ['ADMIN', 'SUPER_ADMIN'].includes(auth.role);
    } catch (error) {
      // Pas authentifié, continue comme utilisateur normal
    }

    // Sélectionner les champs selon le rôle
    const ownerFields = isAdmin 
      ? 'fullName email phone profilePicture isVerified' 
      : 'fullName profilePicture isVerified';

    const listing = await Listing.findById(id)
      .populate('ownerId', ownerFields);

    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    // Incrémenter le compteur de vues
    listing.viewsCount += 1;
    await listing.save();

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'annonce:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une annonce
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = params;
    const body = await request.json();

    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire ou admin
    if (listing.ownerId.toString() !== auth.userId && auth.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Mettre à jour l'annonce
    Object.assign(listing, body);
    await listing.save();

    const updatedListing = await Listing.findById(id)
      .populate('ownerId', 'fullName email profilePicture');

    return NextResponse.json({
      message: 'Annonce mise à jour avec succès',
      listing: updatedListing,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une annonce
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
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

    // Vérifier que l'utilisateur est le propriétaire ou admin
    if (listing.ownerId.toString() !== auth.userId && auth.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await Listing.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Annonce supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
