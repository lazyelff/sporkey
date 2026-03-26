CREATE TABLE `ActivityLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`details` text,
	`userId` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `Bets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` integer NOT NULL,
	`team` text NOT NULL,
	`matchId` text NOT NULL,
	`status` text DEFAULT 'pending',
	`userId` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `ConnectedAccounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`connectedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referenceId` text NOT NULL,
	`type` text DEFAULT 'match',
	`userId` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `FeedSettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`defaultView` text DEFAULT 'all',
	`showLiveOnly` integer DEFAULT false,
	`preferredLeagues` text DEFAULT '[]',
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `NotificationPreferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`match_start` integer DEFAULT true,
	`match_reminder` integer DEFAULT true,
	`favorite_team_alert` integer DEFAULT true,
	`platform_updates` integer DEFAULT false,
	`email_notifications` integer DEFAULT true,
	`push_notifications` integer DEFAULT false,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `PrivacySettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`profileVisibility` text DEFAULT 'public',
	`showOnlineStatus` integer DEFAULT true,
	`showFavorites` integer DEFAULT true,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `UserFavorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`entityName` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `UserSessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`tokenHash` text NOT NULL,
	`deviceInfo` text,
	`ipAddress` text,
	`isActive` integer DEFAULT true,
	`lastUsedAt` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'user',
	`isBanned` integer DEFAULT false,
	`themePreference` text DEFAULT 'dark',
	`lastActiveAt` text,
	`profileImageUrl` text,
	`twoFaEnabled` integer DEFAULT false,
	`twoFaSecret` text,
	`pendingEmail` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `connected_accounts_user_id_provider` ON `ConnectedAccounts` (`userId`,`provider`);--> statement-breakpoint
CREATE UNIQUE INDEX `FeedSettings_userId_unique` ON `FeedSettings` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PrivacySettings_userId_unique` ON `PrivacySettings` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_favorites_user_id_entity_type_entity_id` ON `UserFavorites` (`userId`,`entityType`,`entityId`);--> statement-breakpoint
CREATE UNIQUE INDEX `UserSessions_tokenHash_unique` ON `UserSessions` (`tokenHash`);--> statement-breakpoint
CREATE UNIQUE INDEX `Users_username_unique` ON `Users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `Users_email_unique` ON `Users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `Users_pendingEmail_unique` ON `Users` (`pendingEmail`);