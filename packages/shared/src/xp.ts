/**
 * XP and Leveling System
 *
 * XP is earned from:
 * - Completing games
 * - Daily streaks
 * - Achievements (future)
 */

// XP required for each level (cumulative)
// Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250 XP, etc.
const LEVEL_XP_REQUIREMENTS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2600,   // Level 8
  3500,   // Level 9
  4600,   // Level 10
  5900,   // Level 11
  7400,   // Level 12
  9200,   // Level 13
  11300,  // Level 14
  13700,  // Level 15
  16500,  // Level 16
  19700,  // Level 17
  23400,  // Level 18
  27600,  // Level 19
  32500,  // Level 20
];

// After level 20, each level requires 5000 more XP than the previous
const XP_PER_LEVEL_AFTER_20 = 5000;

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXp: number): number {
  // Check predefined levels
  for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_XP_REQUIREMENTS[i]) {
      // Check levels beyond 20
      if (i === LEVEL_XP_REQUIREMENTS.length - 1) {
        const xpBeyond20 = totalXp - LEVEL_XP_REQUIREMENTS[i];
        const levelsAbove20 = Math.floor(xpBeyond20 / XP_PER_LEVEL_AFTER_20);
        return i + 1 + levelsAbove20;
      }
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for a specific level
 */
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= LEVEL_XP_REQUIREMENTS.length) {
    return LEVEL_XP_REQUIREMENTS[level - 1];
  }
  // Beyond level 20
  const level20Xp = LEVEL_XP_REQUIREMENTS[LEVEL_XP_REQUIREMENTS.length - 1];
  const levelsAbove20 = level - LEVEL_XP_REQUIREMENTS.length;
  return level20Xp + (levelsAbove20 * XP_PER_LEVEL_AFTER_20);
}

/**
 * Get progress within current level (0-1)
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(currentLevel + 1);

  const xpIntoLevel = totalXp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;

  return Math.min(1, xpIntoLevel / xpNeededForNext);
}

/**
 * XP rewards for different actions
 */
export const XP_REWARDS = {
  // Per game completion
  DAILY_COMPLETE: 50,
  TIMED_COMPLETE: 30,
  SURVIVAL_COMPLETE: 20,

  // Bonus XP
  DAILY_STREAK_BONUS: 10, // per day of streak
  PERSONAL_BEST: 25,
  PERFECT_ACCURACY: 15,

  // Per word solved (in timed/survival)
  PER_WORD: 2,
};

/**
 * Calculate XP earned from a game
 */
export function calculateGameXp(params: {
  mode: 'daily' | 'timed' | 'infinite_survival';
  wordsSolved: number;
  accuracy: number;
  isPersonalBest: boolean;
  dailyStreak?: number;
}): number {
  let xp = 0;

  // Base XP for game type
  switch (params.mode) {
    case 'daily':
      xp += XP_REWARDS.DAILY_COMPLETE;
      if (params.dailyStreak && params.dailyStreak > 1) {
        xp += Math.min(params.dailyStreak * XP_REWARDS.DAILY_STREAK_BONUS, 100);
      }
      break;
    case 'timed':
      xp += XP_REWARDS.TIMED_COMPLETE;
      xp += params.wordsSolved * XP_REWARDS.PER_WORD;
      break;
    case 'infinite_survival':
      xp += XP_REWARDS.SURVIVAL_COMPLETE;
      xp += params.wordsSolved * XP_REWARDS.PER_WORD;
      break;
  }

  // Bonus for perfect accuracy
  if (params.accuracy >= 100) {
    xp += XP_REWARDS.PERFECT_ACCURACY;
  }

  // Bonus for personal best
  if (params.isPersonalBest) {
    xp += XP_REWARDS.PERSONAL_BEST;
  }

  return xp;
}

/**
 * Available avatars (predefined set)
 */
export const AVATARS = [
  { id: 'default', name: 'Default', emoji: '👤' },
  { id: 'lightning', name: 'Lightning', emoji: '⚡' },
  { id: 'fire', name: 'Fire', emoji: '🔥' },
  { id: 'star', name: 'Star', emoji: '⭐' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀' },
  { id: 'brain', name: 'Brain', emoji: '🧠' },
  { id: 'ghost', name: 'Ghost', emoji: '👻' },
  { id: 'alien', name: 'Alien', emoji: '👽' },
  { id: 'robot', name: 'Robot', emoji: '🤖' },
  { id: 'cat', name: 'Cat', emoji: '🐱' },
  { id: 'dog', name: 'Dog', emoji: '🐕' },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉' },
  { id: 'crown', name: 'Crown', emoji: '👑' },
  { id: 'gem', name: 'Gem', emoji: '💎' },
  { id: 'heart', name: 'Heart', emoji: '❤️' },
] as const;

export type AvatarId = typeof AVATARS[number]['id'];

export function getAvatarEmoji(avatarId: string): string {
  const avatar = AVATARS.find(a => a.id === avatarId);
  return avatar?.emoji || '👤';
}

/**
 * Available themes
 */
export const THEMES = [
  { id: 'dark', name: 'Dark', description: 'Default dark theme' },
  { id: 'light', name: 'Light', description: 'Light theme' },
  { id: 'midnight', name: 'Midnight', description: 'Deep blue dark theme' },
  { id: 'forest', name: 'Forest', description: 'Green nature theme' },
  { id: 'sunset', name: 'Sunset', description: 'Warm orange theme' },
] as const;

export type ThemeId = typeof THEMES[number]['id'];
