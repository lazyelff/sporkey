const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

class ActivityLog extends Model {}

ActivityLog.init({
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ActivityLog'
});

User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = ActivityLog;
