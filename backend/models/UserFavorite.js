const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const UserFavorite = sequelize.define('UserFavorite', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' },
        onDelete: 'CASCADE'
    },
    entityType: {
        type: DataTypes.ENUM('team', 'league'),
        allowNull: false
    },
    entityId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    entityName: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    updatedAt: false,
    indexes: [
        { unique: true, fields: ['userId', 'entityType', 'entityId'] }
    ]
});

User.hasMany(UserFavorite, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserFavorite.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserFavorite;
