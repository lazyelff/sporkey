const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Favorite = require('../models/Favorite');
const ActivityLog = require('../models/ActivityLog');

// POST /api/favorites - Add favorite
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { referenceId, type } = req.body;
    const userId = req.user.user.id;

    if (!referenceId) return res.status(400).json({ message: 'Reference ID is required' });

    let favorite = await Favorite.findOne({ where: { userId, referenceId, type: type || 'match' } });
    if (favorite) return res.status(400).json({ message: 'Already favorited' });

    favorite = await Favorite.create({ referenceId, type: type || 'match', userId });

    await ActivityLog.create({
      userId,
      action: 'ADD_FAVORITE',
      details: `Favorited ${type} ${referenceId}`
    });

    res.status(201).json(favorite);
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/favorites/:id - Remove favorite by referenceId
router.delete('/:referenceId', authMiddleware, async (req, res) => {
  try {
    const { referenceId } = req.params;
    const userId = req.user.user.id;

    const favorite = await Favorite.findOne({ where: { userId, referenceId } });
    if (!favorite) return res.status(404).json({ message: 'Favorite not found' });

    await favorite.destroy();

    await ActivityLog.create({
      userId,
      action: 'REMOVE_FAVORITE',
      details: `Removed favorite ${referenceId}`
    });

    res.json({ message: 'Removed favorite' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/favorites - Get user's favorites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const favorites = await Favorite.findAll({ where: { userId } });
    res.json(favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
