const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

class Bet extends Model {}

Bet.init({
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  team: {
    type: DataTypes.STRING,
    allowNull: false
  },
  matchId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'won', 'lost'),
    defaultValue: 'pending'
  }
}, {
  sequelize,
  modelName: 'Bet'
});

User.hasMany(Bet, { foreignKey: 'userId', as: 'bets' });
Bet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Bet;
