const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Bet = require('../models/Bet');
const ActivityLog = require('../models/ActivityLog');

// POST /api/bets - Place a bet
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { amount, team, matchId } = req.body;
    const userId = req.user.user.id;

    if (!amount || amount <= 0 || !team || !matchId) {
      return res.status(400).json({ message: 'Invalid bet parameters' });
    }

    const bet = await Bet.create({ amount, team, matchId, userId });

    await ActivityLog.create({
      userId,
      action: 'PLACE_BET',
      details: `Placed a bet of ${amount} on ${team} for match ${matchId}`
    });

    res.status(201).json(bet);
  } catch (err) {
    console.error('Error placing bet:', err);
    res.status(500).json({ message: 'Server error placing bet' });
  }
});

// GET /api/bets - Get user's bets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const bets = await Bet.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    res.json(bets);
  } catch (err) {
    console.error('Error fetching bets:', err);
    res.status(500).json({ message: 'Server error fetching bets' });
  }
});

module.exports = router;
