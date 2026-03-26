CREATE TABLE `Users` (`id` INTEGER PRIMARY KEY, `username` VARCHAR(255) NOT NULL UNIQUE, `email` VARCHAR(255) NOT NULL UNIQUE, `password` VARCHAR(255) NOT NULL, `role` TEXT DEFAULT 'user', `isBanned` TINYINT(1) DEFAULT 0, `themePreference` VARCHAR(255) DEFAULT 'dark', `lastActiveAt` DATETIME, `profileImageUrl` VARCHAR(255), `twoFaEnabled` TINYINT(1) DEFAULT 0, `twoFaSecret` VARCHAR(255), `pendingEmail` VARCHAR(255) UNIQUE, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);

CREATE TABLE `UserSessions` (`id` INTEGER PRIMARY KEY, `userId` INTEGER NOT NULL REFERENCES `Users` (`id`), `tokenHash` VARCHAR(255) NOT NULL UNIQUE, `deviceInfo` VARCHAR(255), `ipAddress` VARCHAR(255), `isActive` TINYINT(1) DEFAULT 1, `lastUsedAt` DATETIME, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);

CREATE TABLE `ActivityLogs` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `action` VARCHAR(255) NOT NULL, `details` TEXT, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `userId` INTEGER REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE);

CREATE TABLE `Bets` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `amount` INTEGER NOT NULL, `team` VARCHAR(255) NOT NULL, `matchId` VARCHAR(255) NOT NULL, `status` TEXT DEFAULT 'pending', `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `userId` INTEGER REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE);

CREATE TABLE `Favorites` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `referenceId` VARCHAR(255) NOT NULL, `type` TEXT DEFAULT 'match', `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `userId` INTEGER REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE);

CREATE TABLE `NotificationPreferences` (`id` INTEGER PRIMARY KEY, `userId` INTEGER NOT NULL REFERENCES `Users` (`id`), `match_start` TINYINT(1) DEFAULT 1, `match_reminder` TINYINT(1) DEFAULT 1, `favorite_team_alert` TINYINT(1) DEFAULT 1, `platform_updates` TINYINT(1) DEFAULT 0, `email_notifications` TINYINT(1) DEFAULT 1, `push_notifications` TINYINT(1) DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);

CREATE TABLE `UserFavorites` (`id` INTEGER PRIMARY KEY, `userId` INTEGER NOT NULL UNIQUE REFERENCES `Users` (`id`), `entityType` TEXT NOT NULL UNIQUE, `entityId` VARCHAR(255) NOT NULL UNIQUE, `entityName` VARCHAR(255) NOT NULL, `createdAt` DATETIME NOT NULL);

CREATE UNIQUE INDEX `user_favorites_user_id_entity_type_entity_id` ON `UserFavorites` (`userId`, `entityType`, `entityId`);

CREATE TABLE `FeedSettings` (`id` INTEGER PRIMARY KEY, `userId` INTEGER NOT NULL UNIQUE REFERENCES `Users` (`id`), `defaultView` TEXT DEFAULT 'all', `showLiveOnly` TINYINT(1) DEFAULT 0, `preferredLeagues` JSON DEFAULT '[]', `updatedAt` DATETIME NOT NULL);

CREATE TABLE `PrivacySettings` (`id` INTEGER PRIMARY KEY, `userId` INTEGER NOT NULL UNIQUE REFERENCES `Users` (`id`), `profileVisibility` TEXT DEFAULT 'public', `showOnlineStatus` TINYINT(1) DEFAULT 1, `showFavorites` TINYINT(1) DEFAULT 1, `updatedAt` DATETIME NOT NULL);

CREATE TABLE `ConnectedAccounts` (`id` INTEGER PRIMARY KEY, `userId` INTEGER NOT NULL UNIQUE REFERENCES `Users` (`id`), `provider` TEXT NOT NULL UNIQUE, `providerAccountId` VARCHAR(255) NOT NULL, `connectedAt` DATETIME);

CREATE UNIQUE INDEX `connected_accounts_user_id_provider` ON `ConnectedAccounts` (`userId`, `provider`);

