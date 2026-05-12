const express = require('express');
const Listing = require('../models/Listing');
const Favorite = require('../models/Favorite');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Coordonnées des villes du Gabon
const CITY_COORDINATES = {
  'Libreville': { lat: 0.4162, lng: 9.4673 },
  'Port-Gentil': { lat: -0.7193, lng: 8.7815 },
  'Franceville': { lat: -1.6333, lng: 13.5833 },
  'Oyem': { lat: 1.6000, lng: 11.5833 },
  'Moanda': { lat: -1.5667, lng: 13.2000 },
};

// GET /api/listings - Liste des annonces
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, type, category, city, minPrice, maxPrice, search, verified } = req.query;
    
    const filter = { status: 'ACTIVE' };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (verified === 'true') filter.verified = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const listings = await Listing.find(filter)
      .populate('ownerId', 'fullName profilePicture isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(filter);

    res.json({
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur listings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/listings/search - Recherche avancée
router.get('/search', async (req, res) => {
  try {
    const {
      page = 1, limit = 12, type, category, city, minPrice, maxPrice,
      search, verified, minSurface, maxSurface, minBedrooms, brand, minYear, maxYear, fuel
    } = req.query;

    const filter = { status: 'ACTIVE' };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (verified === 'true') filter.verified = true;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtres spécifiques par type
    if (type === 'HOUSE') {
      if (minSurface) filter['propertyDetails.surface'] = { $gte: parseFloat(minSurface) };
      if (minBedrooms) filter['propertyDetails.bedrooms'] = { $gte: parseInt(minBedrooms) };
    }
    if (type === 'LAND' && minSurface) {
      filter['landDetails.surface'] = { $gte: parseFloat(minSurface) };
    }
    if (type === 'CAR') {
      if (brand) filter['vehicleDetails.brand'] = brand;
      if (fuel) filter['vehicleDetails.fuel'] = fuel;
      if (minYear || maxYear) {
        filter['vehicleDetails.year'] = {};
        if (minYear) filter['vehicleDetails.year'].$gte = parseInt(minYear);
        if (maxYear) filter['vehicleDetails.year'].$lte = parseInt(maxYear);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Listing.find(filter)
      .populate('ownerId', 'fullName profilePicture isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(filter);

    res.json({
      listings,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Erreur recherche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/listings/constants
router.get('/constants', (req, res) => {
  res.json({
    types: ['HOUSE', 'CAR', 'LAND'],
    categories: ['SALE', 'RENT'],
    cities: Object.keys(CITY_COORDINATES),
    vehicleBrands: ['TOYOTA', 'NISSAN', 'MERCEDES', 'BMW', 'HYUNDAI', 'KIA', 'FORD', 'PEUGEOT', 'RENAULT'],
    fuelTypes: ['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC'],
  });
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('ownerId', 'fullName email phone profilePicture isVerified averageRating');

    if (!listing) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    // Incrémenter les vues
    listing.viewsCount = (listing.viewsCount || 0) + 1;
    await listing.save();

    res.json({ listing });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/listings - Créer une annonce
router.post('/', auth, async (req, res) => {
  try {
    const listingData = {
      ...req.body,
      ownerId: req.userId,
      status: 'PENDING',
    };

    const listing = new Listing(listingData);
    await listing.save();

    res.status(201).json({
      message: 'Annonce créée avec succès',
      listing,
    });
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/listings/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (listing.ownerId !== req.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const updated = await Listing.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status: 'PENDING' },
      { new: true, runValidators: false }
    );

    res.json({ listing: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (listing.ownerId !== req.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Annonce supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/listings/:id/favorite
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const existing = await Favorite.findOne({
      userId: req.userId,
      listingId: req.params.id,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      await Listing.findByIdAndUpdate(req.params.id, { $inc: { favoritesCount: -1 } });
      return res.json({ favorited: false });
    }

    await Favorite.create({ userId: req.userId, listingId: req.params.id });
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { favoritesCount: 1 } });
    res.json({ favorited: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
