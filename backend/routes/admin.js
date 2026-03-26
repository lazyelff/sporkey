const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Bet = require('../models/Bet');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes are protected
router.use(authMiddleware, adminMiddleware);

// GET all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'lastActiveAt', 'createdAt', 'isBanned'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// DELETE a user
router.delete('/users/:id', async (req, res) => {
  try {
    const userToDelete = await User.findByPk(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting self
    if (userToDelete.id === req.user.user.id) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    if (userToDelete.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete other admins' });
    }
    
    // Manually delete related records first to avoid foreign key constraints
    await ActivityLog.destroy({ where: { userId: userToDelete.id } });
    await Bet.destroy({ where: { userId: userToDelete.id } });
    const Favorite = require('../models/Favorite');
    await Favorite.destroy({ where: { userId: userToDelete.id } });
    
    await userToDelete.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot ban admins' });

    user.isBanned = true;
    await user.save();
    res.json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error banning user' });
  }
});

// POST /api/admin/users/:id/unban
router.post('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = false;
    await user.save();
    res.json({ message: 'User unbanned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error unbanning user' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.count();
    const betsCount = await Bet.count();
    const totalBetsAmount = await Bet.sum('amount') || 0;
    
    res.json({
      userCount,
      betsCount,
      totalBetsAmount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

module.exports = router;
