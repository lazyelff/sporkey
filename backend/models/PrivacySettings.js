const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const PrivacySettings = sequelize.define('PrivacySettings', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: User, key: 'id' },
        onDelete: 'CASCADE'
    },
    profileVisibility: {
        type: DataTypes.ENUM('public', 'friends', 'private'),
        defaultValue: 'public'
    },
    showOnlineStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    showFavorites: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    createdAt: false
});

User.hasOne(PrivacySettings, { foreignKey: 'userId', onDelete: 'CASCADE' });
PrivacySettings.belongsTo(User, { foreignKey: 'userId' });

// Auto-create default PrivacySettings on user registration
User.afterCreate(async (user, options) => {
    try {
        await PrivacySettings.findOrCreate({
            where: { userId: user.id },
            defaults: { userId: user.id },
            transaction: options.transaction
        });
    } catch (error) {
        console.error('Failed to auto-create PrivacySettings for user', user.id, error);
    }
});

module.exports = PrivacySettings;
