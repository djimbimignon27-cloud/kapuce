const express = require('express');
const User = require('../models/User');
const Listing = require('../models/Listing');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -refreshToken');
    const listingsCount = await Listing.countDocuments({ ownerId: req.userId });
    
    res.json({
      user,
      stats: { listingsCount }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, phone, profilePicture } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, phone, profilePicture },
      { new: true }
    ).select('-passwordHash -refreshToken');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('fullName profilePicture role isVerified averageRating createdAt');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const listings = await Listing.find({ ownerId: req.params.id, status: 'ACTIVE' })
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({ user, listings });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
