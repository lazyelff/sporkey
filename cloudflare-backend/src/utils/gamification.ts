// Gamification Utility Functions
// XP, Levels, Quests, and Badges

// XP required to level up: 100 * (level ^ 1.5)
export const getXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

export const getXpToNextLevel = (currentLevel: number, currentXp: number): number => {
  const xpForCurrent = getXpForLevel(currentLevel);
  const xpForNext = getXpForLevel(currentLevel + 1);
  return xpForNext - currentXp;
};

export const calculateLevel = (totalXp: number): { level: number; xp: number } => {
  let level = 1;
  let xpAccumulated = 0;
  
  while (true) {
    const xpNeeded = getXpForLevel(level);
    if (xpAccumulated + xpNeeded > totalXp) {
      return { level, xp: totalXp - xpAccumulated };
    }
    xpAccumulated += xpNeeded;
    level++;
    if (level > 50) break; // Max level
  }
  
  return { level: 50, xp: getXpForLevel(50) };
};

// XP Rewards
export const XP_REWARDS = {
  // Basic Actions
  DAILY_LOGIN: 10,
  VIEW_SCORES: 5,
  CHECK_STANDINGS: 5,
  ADD_FAVORITE_TEAM: 20,
  COMPLETE_PROFILE: 100,
  
  // Daily Quests
  QUEST_VIEW_MATCHES: 30,
  QUEST_CHECK_LEAGUES: 40,
  QUEST_ADD_FAVORITES: 50,
  QUEST_LOGIN_STREAK: 60,
  QUEST_SHARE_RESULT: 35,
  QUEST_COMPLETE_QUIZ: 50,
  QUEST_EARLY_BIRD: 25,
  QUEST_NIGHT_OWL: 25,
  QUEST_UPDATE_PROFILE: 30,
  QUEST_SCORES_10X: 45,
  
  // Quiz
  QUIZ_EASY: 15,
  QUIZ_MEDIUM: 25,
  QUIZ_HARD: 40,
  QUIZ_PERFECT_BONUS: 50,
  
  // Streak Bonuses
  STREAK_3_DAYS: 50,
  STREAK_7_DAYS: 150,
  STREAK_14_DAYS: 300,
  STREAK_30_DAYS: 500,
  
  // Daily Limits
  MAX_VIEW_SCORES_XP: 50,
  MAX_STANDINGS_XP: 50,
};

// Daily Quest Pool
export const QUEST_POOL = [
  { type: 'view_matches', description: 'View 5 match scores', xpReward: XP_REWARDS.QUEST_VIEW_MATCHES, target: 5 },
  { type: 'check_leagues', description: 'Check 3 different league standings', xpReward: XP_REWARDS.QUEST_CHECK_LEAGUES, target: 3 },
  { type: 'add_favorites', description: 'Add 2 favorite teams', xpReward: XP_REWARDS.QUEST_ADD_FAVORITES, target: 2 },
  { type: 'login_streak', description: 'Login 3 days in a row', xpReward: XP_REWARDS.QUEST_LOGIN_STREAK, target: 3 },
  { type: 'complete_quiz', description: 'Complete your daily quiz', xpReward: XP_REWARDS.QUEST_COMPLETE_QUIZ, target: 1 },
  { type: 'share_result', description: 'Share 1 match result', xpReward: XP_REWARDS.QUEST_SHARE_RESULT, target: 1 },
  { type: 'early_bird', description: 'Login before 10 AM', xpReward: XP_REWARDS.QUEST_EARLY_BIRD, target: 1 },
  { type: 'night_owl', description: 'Login after 8 PM', xpReward: XP_REWARDS.QUEST_NIGHT_OWL, target: 1 },
  { type: 'update_profile', description: 'Update profile settings', xpReward: XP_REWARDS.QUEST_UPDATE_PROFILE, target: 1 },
  { type: 'scores_10x', description: 'Check scores 10 times today', xpReward: XP_REWARDS.QUEST_SCORES_10X, target: 10 },
];

// Generate 3 random quests for the day
export const generateDailyQuests = (): typeof QUEST_POOL[0][] => {
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

// Badge Definitions
export const BADGES = {
  // Level Badges
  LEVEL_5: { id: 'level_5', name: 'Rookie Fan', icon: '🌟', description: 'Reach Level 5', requirement: { type: 'level', value: 5 } },
  LEVEL_10: { id: 'level_10', name: 'Die-Hard Supporter', icon: '⚽', description: 'Reach Level 10', requirement: { type: 'level', value: 10 } },
  LEVEL_15: { id: 'level_15', name: 'Stats Guru', icon: '📊', description: 'Reach Level 15', requirement: { type: 'level', value: 15 } },
  LEVEL_20: { id: 'level_20', name: 'Predictor Pro', icon: '🎯', description: 'Reach Level 20', requirement: { type: 'level', value: 20 } },
  LEVEL_25: { id: 'level_25', name: 'Legend', icon: '👑', description: 'Reach Level 25', requirement: { type: 'level', value: 25 } },
  LEVEL_30: { id: 'level_30', name: 'Hall of Fame', icon: '🏆', description: 'Reach Level 30', requirement: { type: 'level', value: 30 } },
  LEVEL_40: { id: 'level_40', name: 'Elite Champion', icon: '💎', description: 'Reach Level 40', requirement: { type: 'level', value: 40 } },
  LEVEL_50: { id: 'level_50', name: 'Ultimate Master', icon: '🔥', description: 'Reach Level 50', requirement: { type: 'level', value: 50 } },
  
  // Quest Badges
  QUEST_10: { id: 'quest_10', name: 'Quest Starter', icon: '📝', description: 'Complete 10 quests', requirement: { type: 'quests', value: 10 } },
  QUEST_50: { id: 'quest_50', name: 'Quest Master', icon: '🎖️', description: 'Complete 50 quests', requirement: { type: 'quests', value: 50 } },
  QUEST_100: { id: 'quest_100', name: 'Quest Legend', icon: '👑', description: 'Complete 100 quests', requirement: { type: 'quests', value: 100 } },
  STREAK_30: { id: 'streak_30', name: 'Streak King', icon: '🔥', description: '30-day login streak', requirement: { type: 'streak', value: 30 } },
  
  // Quiz Badges
  QUIZ_25: { id: 'quiz_25', name: 'Trivia Novice', icon: '🧠', description: 'Answer 25 questions correctly', requirement: { type: 'quiz_correct', value: 25 } },
  QUIZ_100: { id: 'quiz_100', name: 'Trivia Expert', icon: '🧩', description: 'Answer 100 questions correctly', requirement: { type: 'quiz_correct', value: 100 } },
  QUIZ_PERFECT: { id: 'quiz_perfect', name: 'Perfect Score', icon: '💯', description: 'Get 5/5 on daily quiz', requirement: { type: 'perfect_quiz', value: 1 } },
  QUIZ_HARD_50: { id: 'quiz_hard_50', name: 'Football Genius', icon: '🎓', description: 'Get 50 hard questions correct', requirement: { type: 'hard_correct', value: 50 } },
};

// Get tier color based on level
export const getLevelTierColor = (level: number): string => {
  if (level >= 40) return '#EAB308'; // Gold
  if (level >= 30) return '#F97316'; // Orange
  if (level >= 20) return '#8B5CF6'; // Purple
  if (level >= 10) return '#3B82F6'; // Blue
  return '#6B7280'; // Gray
};

// Check if user earned a new badge
export const checkBadgeEarned = (
  userStats: { level: number; questsCompleted: number; loginStreak: number; quizCorrect: number; hardCorrect: number; perfectQuizzes: number },
  currentBadges: string[]
): string[] => {
  const earnedBadges: string[] = [];
  
  const allBadges = Object.values(BADGES);
  
  for (const badge of allBadges) {
    if (currentBadges.includes(badge.id)) continue;
    
    const { requirement } = badge.requirement;
    let earned = false;
    
    switch (requirement.type) {
      case 'level':
        earned = userStats.level >= requirement.value;
        break;
      case 'quests':
        earned = userStats.questsCompleted >= requirement.value;
        break;
      case 'streak':
        earned = userStats.loginStreak >= requirement.value;
        break;
      case 'quiz_correct':
        earned = userStats.quizCorrect >= requirement.value;
        break;
      case 'hard_correct':
        earned = userStats.hardCorrect >= requirement.value;
        break;
      case 'perfect_quiz':
        earned = userStats.perfectQuizzes >= requirement.value;
        break;
    }
    
    if (earned) {
      earnedBadges.push(badge.id);
    }
  }
  
  return earnedBadges;
};

// Get streak bonus XP
export const getStreakBonus = (streakDays: number): number => {
  if (streakDays >= 30) return XP_REWARDS.STREAK_30_DAYS;
  if (streakDays >= 14) return XP_REWARDS.STREAK_14_DAYS;
  if (streakDays >= 7) return XP_REWARDS.STREAK_7_DAYS;
  if (streakDays >= 3) return XP_REWARDS.STREAK_3_DAYS;
  return 0;
};

// Check if it's a new day for daily login bonus
export const isNewDay = (lastLoginDate: string | null): boolean => {
  if (!lastLoginDate) return true;
  
  const today = new Date().toISOString().split('T')[0];
  return lastLoginDate !== today;
};

// Check if login streak continues
export const updateLoginStreak = (lastLoginDate: string | null): { streak: number; bonus: number } => {
  if (!lastLoginDate) {
    return { streak: 1, bonus: XP_REWARDS.DAILY_LOGIN };
  }
  
  const today = new Date();
  const lastLogin = new Date(lastLoginDate);
  const diffTime = today.getTime() - lastLogin.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day, no streak update
    return { streak: 0, bonus: 0 };
  } else if (diffDays === 1) {
    // Consecutive day, increase streak
    return { streak: 1, bonus: XP_REWARDS.DAILY_LOGIN };
  } else {
    // Streak broken, reset to 1
    return { streak: 1, bonus: XP_REWARDS.DAILY_LOGIN };
  }
};
