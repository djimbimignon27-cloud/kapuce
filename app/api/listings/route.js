import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer toutes les annonces avec pagination et filtres
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Filtres
    const type = searchParams.get('type');
    const subCategory = searchParams.get('subCategory');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');

    // Construction du filtre
    const filter = { status: 'ACTIVE' };
    
    // On affiche aussi les annonces en attente si elles sont vérifiées
    // ou toutes les annonces actives même non vérifiées pour le dev
    // filter.verified = true; // Désactivé pour le dev

    if (type && type !== 'all') filter.type = type;
    if (subCategory) filter.subCategory = subCategory;
    if (category && category !== 'all') filter.category = category;
    if (city) filter.city = city;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    // Tri
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Vérifier si c'est un admin
    let isAdmin = false;
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const auth = await authenticateRequest(request);
        isAdmin = auth.authenticated && ['ADMIN', 'SUPER_ADMIN'].includes(auth.role);
      }
    } catch (error) {
      // Pas authentifié, continue comme utilisateur normal
    }

    // Sélectionner les champs selon le rôle
    const ownerFields = isAdmin 
      ? 'fullName email phone profilePicture' 
      : 'fullName profilePicture';

    const listings = await Listing.find(filter)
      .populate('ownerId', ownerFields)
      .sort(sort)
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

    // Validation des champs requis de base
    const requiredFields = ['title', 'description', 'price', 'type', 'subCategory', 'category', 'city', 'address'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Validation spécifique selon le type
    if (body.type === 'LAND') {
      if (!body.landDetails?.surface) {
        return NextResponse.json(
          { error: 'La superficie du terrain est requise' },
          { status: 400 }
        );
      }
    } else if (body.type === 'HOUSE') {
      if (!body.propertyDetails?.surface) {
        return NextResponse.json(
          { error: 'La surface du bien est requise' },
          { status: 400 }
        );
      }
    } else if (body.type === 'CAR') {
      if (!body.vehicleDetails?.brand || !body.vehicleDetails?.year) {
        return NextResponse.json(
          { error: 'La marque et l\'année du véhicule sont requises' },
          { status: 400 }
        );
      }
    }

    // Validation des médias (5 photos max + 1 vidéo max)
    if (body.images && Array.isArray(body.images) && body.images.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 photos autorisées par annonce' },
        { status: 400 }
      );
    }

    if (body.video && typeof body.video === 'object' && Array.isArray(body.video)) {
      return NextResponse.json(
        { error: 'Maximum 1 vidéo autorisée par annonce' },
        { status: 400 }
      );
    }

    // Préparer les données
    const listingData = {
      title: body.title,
      description: body.description,
      price: parseFloat(body.price),
      type: body.type,
      subCategory: body.subCategory,
      category: body.category,
      city: body.city,
      address: body.address,
      neighborhood: body.neighborhood || '',
      ownerId: auth.userId,
      status: 'PENDING',
      verified: false,
      documentsStatus: 'INCOMPLETE',
    };

    // Ajouter les détails spécifiques selon le type
    if (body.type === 'LAND' && body.landDetails) {
      listingData.landDetails = {
        surface: parseFloat(body.landDetails.surface) || 0,
        length: parseFloat(body.landDetails.length) || null,
        width: parseFloat(body.landDetails.width) || null,
        topography: body.landDetails.topography || null,
        accessibility: body.landDetails.accessibility || [],
        boundaryMarked: body.landDetails.boundaryMarked || false,
      };
    }

    if (body.type === 'HOUSE' && body.propertyDetails) {
      listingData.propertyDetails = {
        surface: parseFloat(body.propertyDetails.surface) || 0,
        bedrooms: parseInt(body.propertyDetails.bedrooms) || null,
        bathrooms: parseInt(body.propertyDetails.bathrooms) || null,
        floors: parseInt(body.propertyDetails.floors) || null,
        yearBuilt: parseInt(body.propertyDetails.yearBuilt) || null,
        condition: body.propertyDetails.condition || null,
        furnished: body.propertyDetails.furnished || 'UNFURNISHED',
        parking: parseInt(body.propertyDetails.parking) || null,
        amenities: body.propertyDetails.amenities || [],
      };
    }

    if (body.type === 'CAR' && body.vehicleDetails) {
      listingData.vehicleDetails = {
        brand: body.vehicleDetails.brand,
        model: body.vehicleDetails.model || '',
        year: parseInt(body.vehicleDetails.year),
        mileage: parseInt(body.vehicleDetails.mileage) || null,
        fuel: body.vehicleDetails.fuel || null,
        transmission: body.vehicleDetails.transmission || null,
        color: body.vehicleDetails.color || '',
        doors: parseInt(body.vehicleDetails.doors) || null,
        condition: body.vehicleDetails.condition || null,
        features: body.vehicleDetails.features || [],
      };
    }

    // Ajouter les images si présentes
    if (body.images && Array.isArray(body.images)) {
      listingData.images = body.images.slice(0, 5); // Max 5 images
    }

    // Ajouter la vidéo si présente
    if (body.video) {
      listingData.video = body.video;
    }

    // Créer l'annonce
    const listing = await Listing.create(listingData);

    const populatedListing = await Listing.findById(listing._id)
      .populate('ownerId', 'fullName email phone profilePicture');

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
      { error: error.message || 'Erreur serveur lors de la création' },
      { status: 500 }
    );
  }
}
