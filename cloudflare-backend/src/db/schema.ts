import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamps = {
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable('Users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').default('user'),
  isBanned: integer('isBanned', { mode: 'boolean' }).default(false),
  themePreference: text('themePreference').default('dark'),
  lastActiveAt: text('lastActiveAt'),
  profileImageUrl: text('profileImageUrl'),
  twoFaEnabled: integer('twoFaEnabled', { mode: 'boolean' }).default(false),
  twoFaSecret: text('twoFaSecret'),
  pendingEmail: text('pendingEmail').unique(),
  ...timestamps
});

export const userSessions = sqliteTable('UserSessions', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('tokenHash').notNull().unique(),
  deviceInfo: text('deviceInfo'),
  ipAddress: text('ipAddress'),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  lastUsedAt: text('lastUsedAt'),
  ...timestamps
});

export const activityLogs = sqliteTable('ActivityLogs', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  details: text('details'), // Stored as JSON string
  userId: integer('userId').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  ...timestamps
});

export const bets = sqliteTable('Bets', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  amount: integer('amount').notNull(),
  team: text('team').notNull(),
  matchId: text('matchId').notNull(),
  status: text('status').default('pending'),
  userId: integer('userId').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  ...timestamps
});

export const favorites = sqliteTable('Favorites', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  referenceId: text('referenceId').notNull(),
  type: text('type').default('match'),
  userId: integer('userId').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  ...timestamps
});

export const notificationPreferences = sqliteTable('NotificationPreferences', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  match_start: integer('match_start', { mode: 'boolean' }).default(true),
  match_reminder: integer('match_reminder', { mode: 'boolean' }).default(true),
  favorite_team_alert: integer('favorite_team_alert', { mode: 'boolean' }).default(true),
  platform_updates: integer('platform_updates', { mode: 'boolean' }).default(false),
  email_notifications: integer('email_notifications', { mode: 'boolean' }).default(true),
  push_notifications: integer('push_notifications', { mode: 'boolean' }).default(false),
  ...timestamps
});

export const userFavorites = sqliteTable('UserFavorites', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }), // No strictly unique constraint to allow multiple per user, wait existing schema said UNIQUE but it had a unique index on user+type+entity
  entityType: text('entityType').notNull(),
  entityId: text('entityId').notNull(),
  entityName: text('entityName').notNull(),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    userFavoritesUniqueIndex: uniqueIndex('user_favorites_user_id_entity_type_entity_id').on(table.userId, table.entityType, table.entityId),
  }
});

export const rateLimits = sqliteTable('RateLimits', {
  ip: text('ip').primaryKey(),
  count: integer('count').notNull().default(0),
  resetAt: integer('resetAt').notNull() // Unix timestamp in ms
});

export const feedSettings = sqliteTable('FeedSettings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  defaultView: text('defaultView').default('all'),
  showLiveOnly: integer('showLiveOnly', { mode: 'boolean' }).default(false),
  preferredLeagues: text('preferredLeagues').default('[]'),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const privacySettings = sqliteTable('PrivacySettings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  profileVisibility: text('profileVisibility').default('public'),
  showOnlineStatus: integer('showOnlineStatus', { mode: 'boolean' }).default(true),
  showFavorites: integer('showFavorites', { mode: 'boolean' }).default(true),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const connectedAccounts = sqliteTable('ConnectedAccounts', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  connectedAt: text('connectedAt').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    connectedAccountsUniqueIndex: uniqueIndex('connected_accounts_user_id_provider').on(table.userId, table.provider)
  }
});
