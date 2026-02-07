import {
  GameMode,
  TimedDuration,
  User,
  DailyChallenge,
  LeaderboardEntry,
  Run,
  PersonalStats,
  UserProfile,
} from '@anaroo/shared';

// Mock users
export const mockUser: User = {
  _id: 'user-1',
  nickname: 'TestPlayer',
  avatarId: 'default',
  theme: 'dark',
  xp: 1500,
  level: 5,
  createdAt: new Date('2025-01-01'),
};

export const mockToken = 'mock-jwt-token-12345';

// Mock daily challenge
export const mockDailyChallenge: DailyChallenge = {
  _id: 'daily-1',
  date: new Date().toISOString().split('T')[0],
  word: 'testing',
  scrambled: 'gtinets',
  seed: `daily-${new Date().toISOString().split('T')[0]}`,
  createdAt: new Date(),
};

// Mock leaderboard entries
export const mockLeaderboardEntries: LeaderboardEntry[] = [
  {
    userId: 'user-1',
    nickname: 'SpeedRunner',
    score: 2500,
    accuracy: 98.5,
    wpm: 85,
    rank: 1,
    createdAt: new Date(),
  },
  {
    userId: 'user-2',
    nickname: 'WordMaster',
    score: 2200,
    accuracy: 95.0,
    wpm: 72,
    rank: 2,
    createdAt: new Date(),
  },
  {
    userId: 'user-3',
    nickname: 'QuickType',
    score: 1900,
    accuracy: 92.3,
    wpm: 68,
    rank: 3,
    createdAt: new Date(),
  },
  {
    userId: 'user-4',
    nickname: 'AnagramPro',
    score: 1750,
    accuracy: 90.0,
    wpm: 65,
    rank: 4,
    createdAt: new Date(),
  },
  {
    userId: 'user-5',
    nickname: 'TestPlayer',
    score: 1500,
    accuracy: 88.0,
    wpm: 60,
    rank: 5,
    createdAt: new Date(),
  },
];

// Mock runs
export const mockRuns: Run[] = [
  {
    _id: 'run-1',
    userId: 'user-1',
    mode: GameMode.TIMED,
    score: 1500,
    accuracy: 92.5,
    wpm: 65,
    rawWpm: 70,
    correctChars: 185,
    incorrectChars: 15,
    timeElapsed: 60,
    seed: 'seed-1',
    comboStreak: 5,
    timedDuration: TimedDuration.SIXTY,
    createdAt: new Date(),
  },
  {
    _id: 'run-2',
    userId: 'user-1',
    mode: GameMode.DAILY,
    score: 100,
    accuracy: 100,
    wpm: 50,
    rawWpm: 50,
    correctChars: 7,
    incorrectChars: 0,
    timeElapsed: 3.5,
    seed: 'daily-2025-01-15',
    comboStreak: 1,
    createdAt: new Date(),
  },
];

// Mock personal stats
export const mockPersonalStats: PersonalStats = {
  _id: 'stats-1',
  userId: 'user-1',
  globalStats: {
    gamesPlayed: 150,
    wordsSolved: 500,
    averageSolveTime: 3.2,
    wordsWithoutReveals: 420,
    totalWords: 500,
  },
  modeStats: {
    [GameMode.DAILY]: {
      bestTime: 2.5,
      completions: 30,
      currentStreak: 5,
      longestStreak: 10,
    },
    [GameMode.TIMED]: {
      [TimedDuration.THIRTY]: {
        gamesPlayed: 40,
        highestScore: 1200,
        averageWpm: 55,
      },
      [TimedDuration.SIXTY]: {
        gamesPlayed: 60,
        highestScore: 2500,
        averageWpm: 62,
      },
      [TimedDuration.ONE_TWENTY]: {
        gamesPlayed: 20,
        highestScore: 4500,
        averageWpm: 58,
      },
    },
    [GameMode.INFINITE_SURVIVAL]: {
      gamesPlayed: 30,
      longestStreak: 25,
      highestScore: 3500,
      averageWordsPerGame: 12,
    },
  },
  updatedAt: new Date(),
};

// Mock user profile
export const mockUserProfile: UserProfile = {
  ...mockUser,
  stats: mockPersonalStats,
  dailyStreak: 5,
  gamesPlayed: 150,
};

// Mock word picks
export const mockWordPicks = [
  { seed: 'seed-easy-1', scrambled: 'tac', answers: ['cat', 'act'] },
  { seed: 'seed-easy-2', scrambled: 'god', answers: ['dog', 'god'] },
  { seed: 'seed-easy-3', scrambled: 'tar', answers: ['rat', 'tar', 'art'] },
  { seed: 'seed-medium-1', scrambled: 'aplep', answers: ['apple'] },
  { seed: 'seed-medium-2', scrambled: 'ohsue', answers: ['house'] },
  { seed: 'seed-hard-1', scrambled: 'utocmper', answers: ['computer'] },
];

let wordPickIndex = 0;
export function getNextWordPick() {
  const pick = mockWordPicks[wordPickIndex % mockWordPicks.length];
  wordPickIndex++;
  return pick;
}

export function resetWordPickIndex() {
  wordPickIndex = 0;
}
