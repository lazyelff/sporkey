const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const ConnectedAccount = sequelize.define('ConnectedAccount', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' },
        onDelete: 'CASCADE'
    },
    provider: {
        type: DataTypes.ENUM('google', 'twitter', 'discord'),
        allowNull: false
    },
    providerAccountId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    connectedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    indexes: [
        { unique: true, fields: ['userId', 'provider'] }
    ]
});

User.hasMany(ConnectedAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });
ConnectedAccount.belongsTo(User, { foreignKey: 'userId' });

module.exports = ConnectedAccount;
