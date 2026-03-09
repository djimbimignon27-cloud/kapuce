import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Listing from '@/lib/models/Listing';

// Coordonnées des villes du Gabon pour le tri par proximité
const CITY_COORDINATES = {
  'Libreville': { lat: 0.4162, lng: 9.4673 },
  'Port-Gentil': { lat: -0.7193, lng: 8.7815 },
  'Franceville': { lat: -1.6333, lng: 13.5833 },
  'Oyem': { lat: 1.6000, lng: 11.5833 },
  'Moanda': { lat: -1.5667, lng: 13.2000 },
  'Lambaréné': { lat: -0.7000, lng: 10.2333 },
  'Mouila': { lat: -1.8667, lng: 11.0500 },
  'Tchibanga': { lat: -2.8500, lng: 11.0333 },
  'Koulamoutou': { lat: -1.1333, lng: 12.4667 },
  'Makokou': { lat: 0.5667, lng: 12.8667 },
};

// Calculer la distance entre deux points (formule Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Trouver la ville la plus proche des coordonnées
function findNearestCity(lat, lng) {
  let nearestCity = 'Libreville';
  let minDistance = Infinity;
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }
  
  return { city: nearestCity, distance: minDistance };
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    // Construire le filtre de recherche
    const filter = { status: 'ACTIVE' };

    // Paramètres de géolocalisation
    const userLat = parseFloat(searchParams.get('lat'));
    const userLng = parseFloat(searchParams.get('lng'));
    const userCity = searchParams.get('userCity'); // Ville détectée côté client
    
    // Déterminer la ville de l'utilisateur
    let detectedCity = null;
    if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
      const nearest = findNearestCity(userLat, userLng);
      detectedCity = nearest.city;
    } else if (userCity) {
      detectedCity = userCity;
    }

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
    let sortObj = { [sortBy]: sortOrder };

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Récupérer toutes les annonces correspondant aux filtres
    let listings = await Listing.find(filter)
      .populate('ownerId', 'fullName email profilePicture isVerified')
      .sort(sortObj)
      .lean();

    // ========================================
    // TRI PAR PROXIMITÉ GÉOGRAPHIQUE
    // ========================================
    if (detectedCity && !city) {
      // Si l'utilisateur n'a pas filtré par ville spécifique, trier par proximité
      const userCoords = CITY_COORDINATES[detectedCity] || CITY_COORDINATES['Libreville'];
      
      listings = listings.map(listing => {
        const listingCoords = CITY_COORDINATES[listing.city] || { lat: 0, lng: 0 };
        const distance = calculateDistance(
          userCoords.lat, userCoords.lng,
          listingCoords.lat, listingCoords.lng
        );
        return { ...listing, _distance: distance };
      });
      
      // Trier: d'abord par proximité, puis par date
      listings.sort((a, b) => {
        // Priorité aux annonces de la même ville
        if (a.city === detectedCity && b.city !== detectedCity) return -1;
        if (b.city === detectedCity && a.city !== detectedCity) return 1;
        // Puis par distance
        if (a._distance !== b._distance) return a._distance - b._distance;
        // Enfin par date
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    const total = listings.length;
    
    // Appliquer la pagination après le tri
    const paginatedListings = listings.slice(skip, skip + limit);

    return NextResponse.json({
      listings: paginatedListings,
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
      location: {
        detectedCity,
        userProvided: !!userCity || (!!userLat && !!userLng),
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
