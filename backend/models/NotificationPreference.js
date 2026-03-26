const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User'); // Import user to define association

const NotificationPreference = sequelize.define('NotificationPreference', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    match_start: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    match_reminder: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    favorite_team_alert: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    platform_updates: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    email_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    push_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true // adds createdAt, updatedAt
});

// Define associations
User.hasOne(NotificationPreference, { foreignKey: 'userId', onDelete: 'CASCADE' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId' });

// Hook to auto-create preferences when User is created
User.afterCreate(async (user, options) => {
    try {
        await NotificationPreference.create({ userId: user.id }, { transaction: options.transaction });
    } catch (error) {
        console.error('Failed to auto-create NotificationPreference for user', user.id, error);
    }
});

module.exports = NotificationPreference;
