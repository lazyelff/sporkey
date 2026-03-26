const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const betsRoutes = require('./routes/bets');
const favoritesRoutes = require('./routes/favorites');
const User = require('./models/User'); // Import models to ensure they sync
const NotificationPreference = require('./models/NotificationPreference');
const UserSession = require('./models/UserSession');
const UserFavorite = require('./models/UserFavorite');
const FeedSettings = require('./models/FeedSettings');
const PrivacySettings = require('./models/PrivacySettings');
const ConnectedAccount = require('./models/ConnectedAccount');
const Bet = require('./models/Bet');
const Favorite = require('./models/Favorite');
const ActivityLog = require('./models/ActivityLog');
const authMiddleware = require('./middleware/authMiddleware');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/account', require('./routes/account'));

// Protected route example
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

if (process.env.NODE_ENV !== 'test') {
  // Sync Database and Start Server
  sequelize.sync() // Synchronize models with database
    .then(async () => {
      console.log('Database synced');
      
      // Create default admin if none exists
      const adminExists = await User.findOne({ where: { role: 'admin' } });
      if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await User.create({
          username: 'admin',
          email: 'admin@sporkey.com',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('Default admin created (admin@sporkey.com / admin123)');
      }

      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Unable to connect to the database:', err);
    });
}

module.exports = app;