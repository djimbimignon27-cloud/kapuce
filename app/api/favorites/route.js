import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Favorite from '@/lib/models/Favorite';
import Listing from '@/lib/models/Listing';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer les favoris de l'utilisateur
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

    const favorites = await Favorite.find({ userId: auth.userId })
      .populate({
        path: 'listingId',
        populate: {
          path: 'ownerId',
          select: 'fullName email profilePicture',
        },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter/retirer un favori
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
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId requis' },
        { status: 400 }
      );
    }

    // Vérifier si le listing existe
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si déjà en favori
    const existingFavorite = await Favorite.findOne({
      userId: auth.userId,
      listingId,
    });

    if (existingFavorite) {
      // Retirer des favoris
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return NextResponse.json({
        message: 'Retiré des favoris',
        isFavorite: false,
      });
    } else {
      // Ajouter aux favoris
      const favorite = await Favorite.create({
        userId: auth.userId,
        listingId,
      });
      return NextResponse.json(
        {
          message: 'Ajouté aux favoris',
          favorite,
          isFavorite: true,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de la gestion des favoris:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
