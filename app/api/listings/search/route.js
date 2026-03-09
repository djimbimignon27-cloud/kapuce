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

    const subCategory = searchParams.get('subCategory');
    if (subCategory) filter.subCategory = subCategory;

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

    // ========================================
    // FILTRES AVANCÉS POUR LES TERRAINS
    // ========================================
    const minSurface = searchParams.get('minSurface');
    const maxSurface = searchParams.get('maxSurface');
    
    if (type === 'LAND') {
      if (minSurface || maxSurface) {
        filter['landDetails.surface'] = {};
        if (minSurface) filter['landDetails.surface'].$gte = parseFloat(minSurface);
        if (maxSurface) filter['landDetails.surface'].$lte = parseFloat(maxSurface);
      }
      
      const topography = searchParams.get('topography');
      if (topography) filter['landDetails.topography'] = topography;
      
      const boundaryMarked = searchParams.get('boundaryMarked');
      if (boundaryMarked === 'true') filter['landDetails.boundaryMarked'] = true;
      
      const accessibility = searchParams.get('accessibility');
      if (accessibility) {
        filter['landDetails.accessibility'] = { $in: accessibility.split(',') };
      }
    }

    // ========================================
    // FILTRES AVANCÉS POUR L'IMMOBILIER
    // ========================================
    if (type === 'HOUSE') {
      if (minSurface || maxSurface) {
        filter['propertyDetails.surface'] = {};
        if (minSurface) filter['propertyDetails.surface'].$gte = parseFloat(minSurface);
        if (maxSurface) filter['propertyDetails.surface'].$lte = parseFloat(maxSurface);
      }
      
      const minBedrooms = searchParams.get('minBedrooms');
      if (minBedrooms) filter['propertyDetails.bedrooms'] = { $gte: parseInt(minBedrooms) };
      
      const minBathrooms = searchParams.get('minBathrooms');
      if (minBathrooms) filter['propertyDetails.bathrooms'] = { $gte: parseInt(minBathrooms) };
      
      const furnished = searchParams.get('furnished');
      if (furnished) filter['propertyDetails.furnished'] = furnished;
      
      const condition = searchParams.get('condition');
      if (condition) filter['propertyDetails.condition'] = condition;
      
      const amenities = searchParams.get('amenities');
      if (amenities) {
        filter['propertyDetails.amenities'] = { $all: amenities.split(',') };
      }
    }

    // ========================================
    // FILTRES AVANCÉS POUR LES VÉHICULES
    // ========================================
    if (type === 'CAR') {
      const brand = searchParams.get('brand');
      if (brand) filter['vehicleDetails.brand'] = brand;
      
      const minYear = searchParams.get('minYear');
      const maxYear = searchParams.get('maxYear');
      if (minYear || maxYear) {
        filter['vehicleDetails.year'] = {};
        if (minYear) filter['vehicleDetails.year'].$gte = parseInt(minYear);
        if (maxYear) filter['vehicleDetails.year'].$lte = parseInt(maxYear);
      }
      
      const maxMileage = searchParams.get('maxMileage');
      if (maxMileage) filter['vehicleDetails.mileage'] = { $lte: parseInt(maxMileage) };
      
      const fuel = searchParams.get('fuel');
      if (fuel) filter['vehicleDetails.fuel'] = fuel;
      
      const transmission = searchParams.get('transmission');
      if (transmission) filter['vehicleDetails.transmission'] = transmission;
      
      const vehicleCondition = searchParams.get('vehicleCondition');
      if (vehicleCondition) filter['vehicleDetails.condition'] = vehicleCondition;
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
        subCategory,
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
