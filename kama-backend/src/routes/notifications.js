const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    
    const filter = { userId: req.userId };
    if (unreadOnly === 'true') filter.read = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId: req.userId, read: false });

    res.json({
      notifications,
      unreadCount,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/notifications - Marquer comme lu
router.put('/', auth, async (req, res) => {
  try {
    const { notificationIds, markAllRead } = req.body;

    if (markAllRead) {
      await Notification.updateMany(
        { userId: req.userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
      return res.json({ message: 'Toutes les notifications marquées comme lues' });
    }

    if (notificationIds?.length) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: req.userId },
        { $set: { read: true, readAt: new Date() } }
      );
    }

    res.json({ message: 'Notifications mises à jour' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/notifications
router.delete('/', auth, async (req, res) => {
  try {
    const { id, deleteAll, deleteRead } = req.query;

    if (deleteAll === 'true') {
      await Notification.deleteMany({ userId: req.userId });
    } else if (deleteRead === 'true') {
      await Notification.deleteMany({ userId: req.userId, read: true });
    } else if (id) {
      await Notification.deleteOne({ _id: id, userId: req.userId });
    }

    res.json({ message: 'Notifications supprimées' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
