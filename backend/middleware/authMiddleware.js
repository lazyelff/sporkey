const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const UserSession = require('../models/UserSession');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  // Debug: log incoming auth header (remove in production)
  console.log('[AUTH] Incoming Authorization header:', authHeader ? `Bearer <${authHeader.length} chars>` : 'MISSING');

  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Extract token from "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('[AUTH] Malformed Authorization header. Expected "Bearer <token>", got:', authHeader.substring(0, 30));
    return res.status(401).json({ message: 'Malformed authorization header' });
  }

  const token = parts[1];
  console.log('[AUTH] Token extracted, length:', token.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Check if user is banned
    const user = await User.findByPk(decoded.user.id);
    if (!user || user.isBanned) {
      return res.status(403).json({ message: 'Access denied. Account may be banned.' });
    }

    // Verify Session is actively open
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sessionRow = await UserSession.findOne({ where: { tokenHash, isActive: true } });
    
    if (!sessionRow) {
      return res.status(401).json({ message: 'Session expired or revoked, please login again' });
    }

    // Update lastUsedAt
    sessionRow.lastUsedAt = new Date();
    await sessionRow.save();

    req.user = decoded;
    req.session_id = sessionRow.id; // strictly attach session row id
    next();
  } catch (err) {
    console.log('[AUTH] Token verification failed:', err.name, '-', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;

