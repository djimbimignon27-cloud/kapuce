import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    // Construire le filtre de recherche
    const filter = { status: 'ACTIVE' };

    // Filtres de base
    const city = searchParams.get('city');
    if (city) filter.city = { $regex: city, $options: 'i' };

    const type = searchParams.get('type');
    if (type) filter.type = type;

    const category = searchParams.get('category');
    if (category) filter.category = category;

    const verified = searchParams.get('verified');
    if (verified === 'true') filter.verified = true;

    // Filtres de prix
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Recherche par texte
    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Tri
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const listings = await Listing.find(filter)
      .populate('ownerId', 'fullName email profilePicture isVerified')
      .sort(sortObj)
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
      filters: {
        city,
        type,
        category,
        minPrice,
        maxPrice,
        verified,
        search,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la recherche' },
      { status: 500 }
    );
  }
}
