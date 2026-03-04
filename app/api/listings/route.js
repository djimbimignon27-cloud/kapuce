import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer toutes les annonces avec pagination
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const listings = await Listing.find({ status: 'ACTIVE', verified: true })
      .populate('ownerId', 'fullName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Listing.countDocuments({ status: 'ACTIVE', verified: true });

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
    console.error('Erreur lors de la récupération des annonces:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle annonce
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();

    // Validation des champs requis
    const requiredFields = ['title', 'description', 'price', 'type', 'category', 'city', 'address'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Créer l'annonce
    const listing = await Listing.create({
      ...body,
      ownerId: auth.userId,
      status: 'PENDING',
      verified: false,
    });

    const populatedListing = await Listing.findById(listing._id)
      .populate('ownerId', 'fullName email profilePicture');

    return NextResponse.json(
      {
        message: 'Annonce créée avec succès! En attente de vérification.',
        listing: populatedListing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de l\'annonce:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création' },
      { status: 500 }
    );
  }
}
