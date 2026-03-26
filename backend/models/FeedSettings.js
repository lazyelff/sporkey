const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const FeedSettings = sequelize.define('FeedSettings', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: User, key: 'id' },
        onDelete: 'CASCADE'
    },
    defaultView: {
        type: DataTypes.ENUM('all', 'favorites'),
        defaultValue: 'all'
    },
    showLiveOnly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    preferredLeagues: {
        type: DataTypes.JSON,
        defaultValue: []
    }
}, {
    timestamps: true,
    createdAt: false
});

User.hasOne(FeedSettings, { foreignKey: 'userId', onDelete: 'CASCADE' });
FeedSettings.belongsTo(User, { foreignKey: 'userId' });

// Auto-create default FeedSettings on user registration
User.afterCreate(async (user, options) => {
    try {
        await FeedSettings.findOrCreate({
            where: { userId: user.id },
            defaults: { userId: user.id },
            transaction: options.transaction
        });
    } catch (error) {
        console.error('Failed to auto-create FeedSettings for user', user.id, error);
    }
});

module.exports = FeedSettings;
