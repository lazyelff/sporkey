const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware');
const NotificationPreference = require('../models/NotificationPreference');
const UserSession = require('../models/UserSession');
const UserFavorite = require('../models/UserFavorite');
const FeedSettings = require('../models/FeedSettings');
const PrivacySettings = require('../models/PrivacySettings');
const ConnectedAccount = require('../models/ConnectedAccount');
const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');

const notificationsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many updates, please try again later.' }
});

// GET /api/account/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const [prefs] = await NotificationPreference.findOrCreate({
            where: { userId: req.user.user.id },
            defaults: { userId: req.user.user.id }
        });
        res.json({ success: true, data: prefs });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/account/notifications
router.put('/notifications', authMiddleware, notificationsLimiter, async (req, res) => {
    try {
        const allowedFields = [
            'match_start', 'match_reminder', 'favorite_team_alert', 
            'platform_updates', 'email_notifications', 'push_notifications'
        ];
        
        let updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (typeof req.body[field] !== 'boolean') {
                    return res.status(400).json({ success: false, message: `Field ${field} must be a boolean` });
                }
                updates[field] = req.body[field];
            }
        }

        const [prefs] = await NotificationPreference.findOrCreate({
            where: { userId: req.user.user.id },
            defaults: { userId: req.user.user.id }
        });

        await prefs.update(updates);
        
        res.json({ success: true, message: 'Preferences updated successfully', data: prefs });
    } catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ success: false, message: 'Server error updating preferences' });
    }
});

// GET /api/account/sessions
router.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const sessions = await UserSession.findAll({
            where: { userId: req.user.user.id, isActive: true },
            attributes: ['id', 'deviceInfo', 'ipAddress', 'lastUsedAt', 'createdAt'] // Exclude tokenHash
        });
        
        const mappedSessions = sessions.map(s => ({
            ...s.toJSON(),
            isCurrent: s.id === req.session_id
        }));

        res.json({ success: true, data: mappedSessions });
    } catch (error) {
        console.error('Fetch sessions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/account/sessions/:id
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
    try {
        const sessionToRevoke = await UserSession.findOne({
            where: { id: req.params.id, userId: req.user.user.id, isActive: true }
        });

        if (!sessionToRevoke) {
            return res.status(404).json({ success: false, message: 'Session not found or already inactive' });
        }

        if (sessionToRevoke.id === req.session_id) {
            return res.status(400).json({ success: false, message: 'Cannot revoke your current session' });
        }

        sessionToRevoke.isActive = false;
        await sessionToRevoke.save();

        res.json({ success: true, message: 'Session revoked successfully' });
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ success: false, message: 'Server error revoking session' });
    }
});

// DELETE /api/account/sessions
router.delete('/sessions', authMiddleware, async (req, res) => {
    try {
        // Find all active sessions for this user EXCEPT the current one
        const sessions = await UserSession.findAll({
            where: { userId: req.user.user.id, isActive: true }
        });

        for (let s of sessions) {
            if (s.id !== req.session_id) {
                s.isActive = false;
                await s.save();
            }
        }

        res.json({ success: true, message: 'All other sessions revoked' });
    } catch (error) {
        console.error('Revoke all sessions error:', error);
        res.status(500).json({ success: false, message: 'Server error revoking sessions' });
    }
});

// POST /api/account/2fa/enable
router.post('/2fa/enable', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.twoFaEnabled) return res.status(400).json({ success: false, message: '2FA is already enabled' });

        const secret = speakeasy.generateSecret({ name: `SporKey (${user.email})` });
        user.twoFaSecret = secret.base32;
        await user.save();

        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        res.json({ success: true, message: '2FA initialized', data: { qrCode, secret: secret.base32 } });
    } catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ success: false, message: 'Server error enabling 2FA' });
    }
});

// POST /api/account/2fa/verify
router.post('/2fa/verify', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Verification code is required' });

        const user = await User.findByPk(req.user.user.id);
        if (!user || !user.twoFaSecret) return res.status(400).json({ success: false, message: '2FA setup not initialized' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFaSecret,
            encoding: 'base32',
            token: code,
            window: 2 // Allow a bit of time drift
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        user.twoFaEnabled = true;
        await user.save();

        res.json({ success: true, message: '2FA successfully enabled' });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ success: false, message: 'Server error verifying 2FA' });
    }
});

// POST /api/account/2fa/disable
router.post('/2fa/disable', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Password is required to disable 2FA' });

        const user = await User.findByPk(req.user.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        user.twoFaEnabled = false;
        user.twoFaSecret = null;
        await user.save();

        res.json({ success: true, message: '2FA successfully disabled' });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ success: false, message: 'Server error disabling 2FA' });
    }
});

// ==================== FAVORITES ====================

const favoritesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// GET /api/account/favorites
router.get('/favorites', authMiddleware, async (req, res) => {
    try {
        const favorites = await UserFavorite.findAll({
            where: { userId: req.user.user.id },
            attributes: ['id', 'entityType', 'entityId', 'entityName', 'createdAt']
        });
        res.json({ success: true, data: favorites });
    } catch (error) {
        console.error('Fetch favorites error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/account/favorites
router.post('/favorites', authMiddleware, favoritesLimiter, async (req, res) => {
    try {
        const { entityType, entityId, entityName } = req.body;
        if (!entityType || !entityId || !entityName) {
            return res.status(400).json({ success: false, message: 'entityType, entityId, and entityName are required' });
        }
        if (!['team', 'league'].includes(entityType)) {
            return res.status(400).json({ success: false, message: 'entityType must be team or league' });
        }

        const existing = await UserFavorite.findOne({
            where: { userId: req.user.user.id, entityType, entityId }
        });
        if (existing) {
            return res.status(409).json({ success: false, message: 'This item is already in your favorites' });
        }

        const favorite = await UserFavorite.create({
            userId: req.user.user.id, entityType, entityId, entityName
        });
        res.status(201).json({ success: true, message: 'Favorite added', data: favorite });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ success: false, message: 'Server error adding favorite' });
    }
});

// DELETE /api/account/favorites/:id
router.delete('/favorites/:id', authMiddleware, async (req, res) => {
    try {
        const favorite = await UserFavorite.findOne({
            where: { id: req.params.id, userId: req.user.user.id }
        });
        if (!favorite) {
            return res.status(404).json({ success: false, message: 'Favorite not found' });
        }
        await favorite.destroy();
        res.json({ success: true, message: 'Favorite removed' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ success: false, message: 'Server error removing favorite' });
    }
});

// ==================== FEED SETTINGS ====================

// GET /api/account/feed-settings
router.get('/feed-settings', authMiddleware, async (req, res) => {
    try {
        const [settings] = await FeedSettings.findOrCreate({
            where: { userId: req.user.user.id },
            defaults: { userId: req.user.user.id }
        });
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch feed settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/account/feed-settings
router.put('/feed-settings', authMiddleware, favoritesLimiter, async (req, res) => {
    try {
        const { defaultView, showLiveOnly, preferredLeagues } = req.body;

        // Validate
        if (defaultView !== undefined && !['all', 'favorites'].includes(defaultView)) {
            return res.status(400).json({ success: false, message: 'defaultView must be "all" or "favorites"' });
        }
        if (showLiveOnly !== undefined && typeof showLiveOnly !== 'boolean') {
            return res.status(400).json({ success: false, message: 'showLiveOnly must be a boolean' });
        }
        if (preferredLeagues !== undefined && !Array.isArray(preferredLeagues)) {
            return res.status(400).json({ success: false, message: 'preferredLeagues must be an array' });
        }

        const [settings] = await FeedSettings.findOrCreate({
            where: { userId: req.user.user.id },
            defaults: { userId: req.user.user.id }
        });

        const updates = {};
        if (defaultView !== undefined) updates.defaultView = defaultView;
        if (showLiveOnly !== undefined) updates.showLiveOnly = showLiveOnly;
        if (preferredLeagues !== undefined) updates.preferredLeagues = preferredLeagues;

        await settings.update(updates);
        res.json({ success: true, message: 'Feed settings updated', data: settings });
    } catch (error) {
        console.error('Update feed settings error:', error);
        res.status(500).json({ success: false, message: 'Server error updating feed settings' });
    }
});

// ==================== PRIVACY SETTINGS ====================

// GET /api/account/privacy
router.get('/privacy', authMiddleware, async (req, res) => {
    try {
        const [settings] = await PrivacySettings.findOrCreate({
            where: { userId: req.user.user.id },
            defaults: { userId: req.user.user.id }
        });
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch privacy settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/account/privacy
router.put('/privacy', authMiddleware, favoritesLimiter, async (req, res) => {
    try {
        const { profileVisibility, showOnlineStatus, showFavorites } = req.body;

        if (profileVisibility !== undefined && !['public', 'friends', 'private'].includes(profileVisibility)) {
            return res.status(400).json({ success: false, message: 'profileVisibility must be "public", "friends", or "private"' });
        }
        if (showOnlineStatus !== undefined && typeof showOnlineStatus !== 'boolean') {
            return res.status(400).json({ success: false, message: 'showOnlineStatus must be a boolean' });
        }
        if (showFavorites !== undefined && typeof showFavorites !== 'boolean') {
            return res.status(400).json({ success: false, message: 'showFavorites must be a boolean' });
        }

        const [settings] = await PrivacySettings.findOrCreate({
            where: { userId: req.user.user.id },
            defaults: { userId: req.user.user.id }
        });

        const updates = {};
        if (profileVisibility !== undefined) updates.profileVisibility = profileVisibility;
        if (showOnlineStatus !== undefined) updates.showOnlineStatus = showOnlineStatus;
        if (showFavorites !== undefined) updates.showFavorites = showFavorites;

        await settings.update(updates);
        res.json({ success: true, message: 'Privacy settings updated', data: settings });
    } catch (error) {
        console.error('Update privacy settings error:', error);
        res.status(500).json({ success: false, message: 'Server error updating privacy' });
    }
});

// ==================== CONNECTED ACCOUNTS ====================

// GET /api/account/connected
router.get('/connected', authMiddleware, async (req, res) => {
    try {
        const accounts = await ConnectedAccount.findAll({
            where: { userId: req.user.user.id },
            attributes: ['id', 'provider', 'providerAccountId', 'connectedAt']
        });
        res.json({ success: true, data: accounts });
    } catch (error) {
        console.error('Fetch connected accounts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/account/connected/:provider
router.delete('/connected/:provider', authMiddleware, async (req, res) => {
    try {
        const { provider } = req.params;
        const account = await ConnectedAccount.findOne({
            where: { userId: req.user.user.id, provider }
        });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Connected account not found' });
        }

        // Check if this is the only login method
        const user = await User.findByPk(req.user.user.id);
        const otherAccounts = await ConnectedAccount.count({ where: { userId: req.user.user.id } });
        const hasPassword = user && user.password;
        if (otherAccounts <= 1 && !hasPassword) {
            return res.status(400).json({ success: false, message: 'Cannot disconnect your only login method' });
        }

        await account.destroy();
        res.json({ success: true, message: `${provider} account disconnected` });
    } catch (error) {
        console.error('Disconnect account error:', error);
        res.status(500).json({ success: false, message: 'Server error disconnecting account' });
    }
});

// ==================== DATA EXPORT ====================

const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2,
    message: { success: false, message: 'Maximum 2 exports per hour. Please try again later.' }
});

// POST /api/account/export
router.post('/export', authMiddleware, exportLimiter, async (req, res) => {
    try {
        const userId = req.user.user.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'twoFaSecret'] }
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const [privacy] = await PrivacySettings.findOrCreate({ where: { userId }, defaults: { userId } });
        const [notifications] = await NotificationPreference.findOrCreate({ where: { userId }, defaults: { userId } });
        const [feedSettings] = await FeedSettings.findOrCreate({ where: { userId }, defaults: { userId } });
        const favorites = await UserFavorite.findAll({ where: { userId } });
        const sessions = await UserSession.findAll({ where: { userId, isActive: true }, attributes: { exclude: ['tokenHash'] } });
        const connectedAccounts = await ConnectedAccount.findAll({ where: { userId } });

        const exportData = {
            profile: user.toJSON(),
            privacy: privacy.toJSON(),
            notifications: notifications.toJSON(),
            feedSettings: feedSettings.toJSON(),
            favorites: favorites.map(f => f.toJSON()),
            sessions: sessions.map(s => s.toJSON()),
            connectedAccounts: connectedAccounts.map(a => a.toJSON()),
            exportedAt: new Date().toISOString()
        };

        res.json({ success: true, message: 'Data export ready', data: exportData });
    } catch (error) {
        console.error('Data export error:', error);
        res.status(500).json({ success: false, message: 'Server error generating export' });
    }
});

module.exports = router;
