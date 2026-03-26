import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or, and, not } from 'drizzle-orm';
import * as schema from '../db/schema';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { authMiddleware } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
  AVATARS_BUCKET: R2Bucket;
};

type Variables = {
  user: { id: number; username: string; role: string };
};

import { rateLimiter } from '../middleware/rateLimiter';

const account = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all account routes
account.use('*', authMiddleware);

account.use('/profile', rateLimiter(15 * 60 * 1000, 10));
account.use('/password', rateLimiter(60 * 60 * 1000, 5));
account.use('/notifications', rateLimiter(15 * 60 * 1000, 10));
account.use('/feed-settings', rateLimiter(15 * 60 * 1000, 30));
account.use('/privacy', rateLimiter(15 * 60 * 1000, 30));
account.use('/favorites', rateLimiter(15 * 60 * 1000, 30));
account.use('/export', rateLimiter(60 * 60 * 1000, 2));

// ==================== PROFILE ====================

// GET /api/account/me
account.get('/me', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, c.get('user').id)
    });
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);
    
    const { password, ...safeUser } = user;
    return c.json({ success: true, data: safeUser });
  } catch (err) {
    return c.json({ success: false, message: 'Server error fetching user profile' }, 500);
  }
});

// PUT /api/account/profile
account.put('/profile', async (c) => {
  try {
    const { username, email } = await c.req.json();
    if (!username || !email) return c.json({ success: false, message: 'Username and email are required' }, 400);

    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, c.get('user').id) });
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    const isEmailChanging = user.email !== email;
    const isUsernameChanging = user.username !== username;

    if (isUsernameChanging || isEmailChanging) {
      const existingUser = await db.query.users.findFirst({
        where: and(
          or(eq(schema.users.username, username), eq(schema.users.email, email)),
          not(eq(schema.users.id, user.id))
        )
      });
      if (existingUser) return c.json({ success: false, message: 'Username or email already in use' }, 409);
    }

    const updates: any = {};
    if (isUsernameChanging) updates.username = username;
    if (isEmailChanging) updates.pendingEmail = email;

    if (Object.keys(updates).length > 0) {
      await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id));
    }

    const updatedUser = { ...user, ...updates };
    const { password: _, ...safeUser } = updatedUser;
    
    return c.json({ success: true, message: 'Profile updated successfully', data: safeUser });
  } catch (err) {
    return c.json({ success: false, message: 'Server error updating profile' }, 500);
  }
});

// PUT /api/account/password
account.put('/password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    if (!currentPassword || !newPassword) return c.json({ success: false, message: 'Current and new passwords are required' }, 400);
    if (newPassword.length < 8) return c.json({ success: false, message: 'New password must be at least 8 characters' }, 400);

    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, c.get('user').id) });
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return c.json({ success: false, message: 'Incorrect current password' }, 400);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.update(schema.users).set({ password: hashedPassword }).where(eq(schema.users.id, user.id));
    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    return c.json({ success: false, message: 'Server error changing password' }, 500);
  }
});

// DELETE /api/account
account.delete('/', async (c) => {
  return deleteAccountHandler(c);
});
account.delete('', async (c) => {
  return deleteAccountHandler(c);
});

async function deleteAccountHandler(c: any) {
  try {
    const { password, confirmationString } = await c.req.json();
    if (!password) return c.json({ success: false, message: 'Password is required' }, 400);
    if (confirmationString !== 'DELETE') return c.json({ success: false, message: 'You must type DELETE to confirm' }, 400);

    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, c.get('user').id) });
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return c.json({ success: false, message: 'Incorrect password' }, 400);

    // Delete avatar from R2 if exists
    if (user.profileImageUrl) {
      const filename = user.profileImageUrl.split('/').pop();
      if (filename) await c.env.AVATARS_BUCKET.delete(filename);
    }

    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    return c.json({ success: false, message: 'Server error deleting account' }, 500);
  }
}

// ==================== AVATAR UPLOAD (R2) ====================

account.post('/avatar', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('profilePicture') as unknown as File;
    if (!file) return c.json({ message: 'No file uploaded' }, 400);

    // Basic validation
    if (file.size > 5 * 1024 * 1024) return c.json({ message: 'File too large (max 5MB)' }, 413);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return c.json({ message: 'Invalid file type' }, 400);
    }

    const userId = c.get('user').id;
    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user) return c.json({ message: 'User not found' }, 404);

    const ext = file.type.split('/')[1];
    const filename = `user-${user.id}-${Date.now()}.${ext}`;

    // Upload to R2 (ArrayBuffer)
    const arrayBuffer = await file.arrayBuffer();
    await c.env.AVATARS_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    // Assume worker serves R2 bucket at a specific route or public URL
    // e.g. /cdn/avatars/filename
    const newImageUrl = `/cdn/avatars/${filename}`;

    if (user.profileImageUrl) {
      const oldFilename = user.profileImageUrl.split('/').pop();
      if (oldFilename) await c.env.AVATARS_BUCKET.delete(oldFilename);
    }

    await db.update(schema.users).set({ profileImageUrl: newImageUrl }).where(eq(schema.users.id, user.id));

    return c.json({ success: true, message: 'Profile picture updated successfully', data: { profileImageUrl: newImageUrl } });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, message: 'Server error during upload' }, 500);
  }
});

// ==================== NOTIFICATIONS ====================

account.get('/notifications', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;
    let prefs = await db.query.notificationPreferences.findFirst({ where: eq(schema.notificationPreferences.userId, userId) });
    if (!prefs) {
      [prefs] = await db.insert(schema.notificationPreferences).values({ userId }).returning();
    }
    return c.json({ success: true, data: prefs });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

account.put('/notifications', async (c) => {
  try {
    const body = await c.req.json();
    const allowedFields = ['match_start', 'match_reminder', 'favorite_team_alert', 'platform_updates', 'email_notifications', 'push_notifications'];
    const updates: any = {};
    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updates[field] = body[field];
      }
    }

    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;
    
    // Check exist
    const prefs = await db.query.notificationPreferences.findFirst({ where: eq(schema.notificationPreferences.userId, userId) });
    if (!prefs) {
      await db.insert(schema.notificationPreferences).values({ userId, ...updates });
    } else {
      await db.update(schema.notificationPreferences).set(updates).where(eq(schema.notificationPreferences.userId, userId));
    }
    
    const updated = await db.query.notificationPreferences.findFirst({ where: eq(schema.notificationPreferences.userId, userId) });
    return c.json({ success: true, message: 'Preferences updated successfully', data: updated });
  } catch (err) {
    return c.json({ success: false, message: 'Server error updating preferences' }, 500);
  }
});

// ==================== FEED SETTINGS ====================

account.get('/feed-settings', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;
    let settings = await db.query.feedSettings.findFirst({ where: eq(schema.feedSettings.userId, userId) });
    if (!settings) {
      [settings] = await db.insert(schema.feedSettings).values({ userId }).returning();
    }
    return c.json({ success: true, data: settings });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

account.put('/feed-settings', async (c) => {
  try {
    const { defaultView, showLiveOnly, preferredLeagues } = await c.req.json();
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;

    if (defaultView !== undefined && !['all', 'favorites'].includes(defaultView)) return c.json({ success: false, message: 'Invalid defaultView' }, 400);

    const updates: any = { updatedAt: new Date().toISOString() };
    if (defaultView !== undefined) updates.defaultView = defaultView;
    if (typeof showLiveOnly === 'boolean') updates.showLiveOnly = showLiveOnly;
    if (Array.isArray(preferredLeagues)) updates.preferredLeagues = JSON.stringify(preferredLeagues);

    const settings = await db.query.feedSettings.findFirst({ where: eq(schema.feedSettings.userId, userId) });
    if (!settings) {
      await db.insert(schema.feedSettings).values({ userId, ...updates });
    } else {
      await db.update(schema.feedSettings).set(updates).where(eq(schema.feedSettings.userId, userId));
    }

    const updated = await db.query.feedSettings.findFirst({ where: eq(schema.feedSettings.userId, userId) });
    return c.json({ success: true, message: 'Feed settings updated', data: updated });
  } catch (err) {
    return c.json({ success: false, message: 'Server error updating feed settings' }, 500);
  }
});

// ==================== FAVORITES ====================

account.get('/favorites', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const favorites = await db.query.userFavorites.findMany({
      where: eq(schema.userFavorites.userId, c.get('user').id)
    });
    return c.json({ success: true, data: favorites });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

account.post('/favorites', async (c) => {
  try {
    const { entityType, entityId, entityName } = await c.req.json();
    if (!entityType || !entityId || !entityName) return c.json({ success: false, message: 'Missing fields' }, 400);

    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;

    const existing = await db.query.userFavorites.findFirst({
      where: and(eq(schema.userFavorites.userId, userId), eq(schema.userFavorites.entityType, entityType), eq(schema.userFavorites.entityId, entityId))
    });
    if (existing) return c.json({ success: false, message: 'Already in favorites' }, 409);

    const [favorite] = await db.insert(schema.userFavorites).values({ userId, entityType, entityId, entityName }).returning();
    return c.json({ success: true, message: 'Favorite added', data: favorite }, 201);
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

account.delete('/favorites/:id', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    await db.delete(schema.userFavorites).where(
      and(eq(schema.userFavorites.id, parseInt(c.req.param('id'))), eq(schema.userFavorites.userId, c.get('user').id))
    );
    return c.json({ success: true, message: 'Favorite removed' });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ==================== SESSIONS ====================

account.get('/sessions', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const sessions = await db.query.userSessions.findMany({
      where: and(eq(schema.userSessions.userId, c.get('user').id), eq(schema.userSessions.isActive, true))
    });
    const mapped = sessions.map(s => {
      const { tokenHash, ...rest } = s;
      return rest;
    });
    return c.json({ success: true, data: mapped });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

account.delete('/sessions', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    await db.update(schema.userSessions)
      .set({ isActive: false })
      .where(and(eq(schema.userSessions.userId, c.get('user').id)));
    // Note: To preserve the current session, we would need to know the current tokenHash, which requires modifying authMiddleware to pass the token down. But for now we revoke all.
    return c.json({ success: true, message: 'All sessions revoked' });
  } catch (err) {
    return c.json({ success: false, message: 'Server error revoking sessions' }, 500);
  }
});

account.delete('/sessions/:id', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    await db.update(schema.userSessions)
      .set({ isActive: false })
      .where(and(eq(schema.userSessions.id, parseInt(c.req.param('id'))), eq(schema.userSessions.userId, c.get('user').id)));
    return c.json({ success: true, message: 'Session revoked' });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ==================== PRIVACY SETTINGS ====================

account.get('/privacy', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;
    let settings = await db.query.privacySettings.findFirst({ where: eq(schema.privacySettings.userId, userId) });
    if (!settings) {
      [settings] = await db.insert(schema.privacySettings).values({ userId }).returning();
    }
    return c.json({ success: true, data: settings });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

account.put('/privacy', async (c) => {
  try {
    const { profileVisibility, showOnlineStatus, showFavorites } = await c.req.json();
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;

    if (profileVisibility && !['public', 'friends', 'private'].includes(profileVisibility)) return c.json({ success: false, message: 'Invalid profileVisibility' }, 400);

    const updates: any = { updatedAt: new Date().toISOString() };
    if (profileVisibility) updates.profileVisibility = profileVisibility;
    if (typeof showOnlineStatus === 'boolean') updates.showOnlineStatus = showOnlineStatus;
    if (typeof showFavorites === 'boolean') updates.showFavorites = showFavorites;

    const settings = await db.query.privacySettings.findFirst({ where: eq(schema.privacySettings.userId, userId) });
    if (!settings) {
      await db.insert(schema.privacySettings).values({ userId, ...updates });
    } else {
      await db.update(schema.privacySettings).set(updates).where(eq(schema.privacySettings.userId, userId));
    }
    const updated = await db.query.privacySettings.findFirst({ where: eq(schema.privacySettings.userId, userId) });
    return c.json({ success: true, message: 'Privacy settings updated', data: updated });
  } catch (err) {
    return c.json({ success: false, message: 'Server error updating privacy' }, 500);
  }
});

// ==================== CONNECTED ACCOUNTS ====================

account.get('/connected', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const accounts = await db.query.connectedAccounts.findMany({
      where: eq(schema.connectedAccounts.userId, c.get('user').id)
    });
    return c.json({ success: true, data: accounts });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

account.delete('/connected/:provider', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    await db.delete(schema.connectedAccounts).where(
      and(eq(schema.connectedAccounts.provider, c.req.param('provider')), eq(schema.connectedAccounts.userId, c.get('user').id))
    );
    return c.json({ success: true, message: 'Account disconnected' });
  } catch (err) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ==================== 2FA ====================

account.post('/2fa/enable', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, c.get('user').id) });
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);
    if (user.twoFaEnabled) return c.json({ success: false, message: '2FA is already enabled' }, 400);

    const secret = speakeasy.generateSecret({ name: `SporKey (${user.email})` });
    await db.update(schema.users).set({ twoFaSecret: secret.base32 }).where(eq(schema.users.id, user.id));

    // Use external API for QR logic instead of node canvas
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(secret.otpauth_url!)}`;

    return c.json({ success: true, message: '2FA initialized', data: { qrCode: qrCodeUrl, secret: secret.base32 } });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, message: 'Server error enabling 2FA' }, 500);
  }
});

account.post('/2fa/verify', async (c) => {
  try {
    const { code } = await c.req.json();
    if (!code) return c.json({ success: false, message: 'Verification code is required' }, 400);

    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, c.get('user').id) });
    if (!user || !user.twoFaSecret) return c.json({ success: false, message: '2FA setup not initialized' }, 400);

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) return c.json({ success: false, message: 'Invalid verification code' }, 400);

    await db.update(schema.users).set({ twoFaEnabled: true }).where(eq(schema.users.id, user.id));
    return c.json({ success: true, message: '2FA successfully enabled' });
  } catch (err) {
    return c.json({ success: false, message: 'Server error verifying 2FA' }, 500);
  }
});

account.post('/2fa/disable', async (c) => {
  try {
    const { password } = await c.req.json();
    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, c.get('user').id) });
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return c.json({ success: false, message: 'Incorrect password' }, 400);

    await db.update(schema.users).set({ twoFaEnabled: false, twoFaSecret: null }).where(eq(schema.users.id, user.id));
    return c.json({ success: true, message: '2FA successfully disabled' });
  } catch (err) {
    return c.json({ success: false, message: 'Server error disabling 2FA' }, 500);
  }
});

// ==================== DATA EXPORT ====================

account.post('/export', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('user').id;

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    const privacy = await db.query.privacySettings.findFirst({ where: eq(schema.privacySettings.userId, userId) });
    const notifications = await db.query.notificationPreferences.findFirst({ where: eq(schema.notificationPreferences.userId, userId) });
    const feedSettings = await db.query.feedSettings.findFirst({ where: eq(schema.feedSettings.userId, userId) });
    const favorites = await db.query.userFavorites.findMany({ where: eq(schema.userFavorites.userId, userId) });
    const sessionsRaw = await db.query.userSessions.findMany({ where: and(eq(schema.userSessions.userId, userId), eq(schema.userSessions.isActive, true)) });
    const sessions = sessionsRaw.map(s => { const { tokenHash, ...safe } = s; return safe; });
    const connectedAccounts = await db.query.connectedAccounts.findMany({ where: eq(schema.connectedAccounts.userId, userId) });

    const { password: _, twoFaSecret: __, ...safeProfile } = user;

    const exportData = {
      profile: safeProfile,
      privacy: privacy || {},
      notifications: notifications || {},
      feedSettings: feedSettings || {},
      favorites,
      sessions,
      connectedAccounts,
      exportedAt: new Date().toISOString()
    };

    return c.json({ success: true, message: 'Data export ready', data: exportData });
  } catch (err) {
    return c.json({ success: false, message: 'Server error generating export' }, 500);
  }
});

export default account;
