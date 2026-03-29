-- Gamification System Migration
-- Add gamification fields to Users table
ALTER TABLE `Users` ADD COLUMN `level` integer DEFAULT 1;
ALTER TABLE `Users` ADD COLUMN `xp` integer DEFAULT 0;
ALTER TABLE `Users` ADD COLUMN `totalXp` integer DEFAULT 0;
ALTER TABLE `Users` ADD COLUMN `badges` text DEFAULT '[]';
ALTER TABLE `Users` ADD COLUMN `loginStreak` integer DEFAULT 0;
ALTER TABLE `Users` ADD COLUMN `lastLoginDate` text;
ALTER TABLE `Users` ADD COLUMN `questsCompleted` integer DEFAULT 0;
ALTER TABLE `Users` ADD COLUMN `quizCorrect` integer DEFAULT 0;

-- Create XP Transactions table
CREATE TABLE IF NOT EXISTS `XpTransactions` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `userId` integer NOT NULL,
    `amount` integer NOT NULL,
    `action` text NOT NULL,
    `timestamp` text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS `xp_transactions_user_id` ON `XpTransactions` (`userId`);

-- Create Daily Quests table
CREATE TABLE IF NOT EXISTS `DailyQuests` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `userId` integer NOT NULL,
    `questType` text NOT NULL,
    `questDescription` text NOT NULL,
    `xpReward` integer NOT NULL,
    `progress` integer DEFAULT 0,
    `target` integer NOT NULL,
    `completed` integer DEFAULT 0,
    `questDate` text,
    `expiresAt` text,
    FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS `daily_quests_user_date` ON `DailyQuests` (`userId`, `questDate`);

-- Create Quiz Questions table
CREATE TABLE IF NOT EXISTS `QuizQuestions` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `question` text NOT NULL,
    `optionA` text NOT NULL,
    `optionB` text NOT NULL,
    `optionC` text NOT NULL,
    `optionD` text NOT NULL,
    `correctAnswer` text NOT NULL,
    `difficulty` text NOT NULL,
    `category` text NOT NULL,
    `createdAt` text DEFAULT CURRENT_TIMESTAMP
);

-- Create Quiz Attempts table
CREATE TABLE IF NOT EXISTS `QuizAttempts` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `userId` integer NOT NULL,
    `questionId` integer NOT NULL,
    `userAnswer` text NOT NULL,
    `isCorrect` integer NOT NULL,
    `xpEarned` integer DEFAULT 0,
    `timestamp` text DEFAULT CURRENT_TIMESTAMP,
    `dailyQuizDate` text,
    FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`questionId`) REFERENCES `QuizQuestions`(`id`) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS `quiz_attempts_user_date` ON `QuizAttempts` (`userId`, `dailyQuizDate`);
