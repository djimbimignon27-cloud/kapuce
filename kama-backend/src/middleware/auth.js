const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Compte suspendu' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// Middleware pour les admins
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
      }
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
};

module.exports = { auth, adminAuth };
