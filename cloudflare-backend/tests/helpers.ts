import Database from 'better-sqlite3';

export function createD1Mock() {
  const sql = new Database(':memory:');
  sql.exec('PRAGMA foreign_keys = ON;');
  
  const d1 = {
    prepare: (query: string) => {
      const stmt = sql.prepare(query);
      return {
        bind: (...args: any[]) => {
          return {
            first: async () => stmt.get(...args),
            run: async () => {
              const res = stmt.run(...args);
              return { success: true, meta: { changes: res.changes, last_row_id: res.lastInsertRowid } };
            },
            all: async () => {
              const res = stmt.all(...args);
              return { success: true, results: res, meta: {} };
            },
            raw: async () => stmt.raw().all(...args)
          };
        },
        all: async () => ({ success: true, results: stmt.all(), meta: {} }),
        run: async () => {
          const res = stmt.run();
          return { success: true, meta: { changes: res.changes, last_row_id: res.lastInsertRowid } };
        },
        first: async () => stmt.get()
      };
    },
    exec: async (query: string) => {
      sql.exec(query);
      return { success: true };
    },
    batch: async (statements: any[]) => {
      // Simplified
      return Promise.all(statements.map(s => s.run()));
    }
  };
  return d1 as any;
}

export function createR2Mock() {
  return {
    put: async () => ({}),
    get: async () => null,
    delete: async () => ({}),
    list: async () => ({ objects: [], truncated: false })
  } as any;
}

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    isBanned INTEGER DEFAULT 0,
    themePreference TEXT DEFAULT 'dark',
    lastActiveAt TEXT,
    profileImageUrl TEXT,
    twoFaEnabled INTEGER DEFAULT 0,
    twoFaSecret TEXT,
    pendingEmail TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS UserSessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    tokenHash TEXT NOT NULL UNIQUE,
    deviceInfo TEXT,
    ipAddress TEXT,
    isActive INTEGER DEFAULT 1,
    lastUsedAt TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ActivityLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    userId INTEGER REFERENCES Users(id) ON DELETE SET NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS Bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    team TEXT NOT NULL,
    matchId TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    userId INTEGER REFERENCES Users(id) ON DELETE SET NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS Favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referenceId TEXT NOT NULL,
    type TEXT DEFAULT 'match',
    userId INTEGER REFERENCES Users(id) ON DELETE SET NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS NotificationPreferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE,
    match_start INTEGER DEFAULT 1,
    match_reminder INTEGER DEFAULT 1,
    favorite_team_alert INTEGER DEFAULT 1,
    platform_updates INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    push_notifications INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS UserFavorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    entityName TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS user_favorites_user_id_entity_type_entity_id ON UserFavorites (userId, entityType, entityId);
  CREATE TABLE IF NOT EXISTS RateLimits (
    ip TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    resetAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS FeedSettings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE,
    defaultView TEXT DEFAULT 'all',
    showLiveOnly INTEGER DEFAULT 0,
    preferredLeagues TEXT DEFAULT '[]',
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS PrivacySettings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE,
    profileVisibility TEXT DEFAULT 'public',
    showOnlineStatus INTEGER DEFAULT 1,
    showFavorites INTEGER DEFAULT 1,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ConnectedAccounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    connectedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_user_id_provider ON ConnectedAccounts (userId, provider);
`;
