const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  themePreference: {
    type: DataTypes.STRING,
    defaultValue: 'dark'
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twoFaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFaSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pendingEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
});

module.exports = User;
