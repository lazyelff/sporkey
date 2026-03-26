const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

class Favorite extends Model {}

Favorite.init({
  referenceId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('match', 'team'),
    defaultValue: 'match'
  }
}, {
  sequelize,
  modelName: 'Favorite'
});

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Favorite;
