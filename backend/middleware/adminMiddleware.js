const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error in admin authorization' });
  }
};

module.exports = adminMiddleware;
