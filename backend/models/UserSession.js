const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User'); // Import user to define association

const UserSession = sequelize.define('UserSession', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    deviceInfo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastUsedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true // adds createdAt, updatedAt
});

// Define associations
User.hasMany(UserSession, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserSession.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserSession;
