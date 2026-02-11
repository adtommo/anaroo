export interface User {
  _id?: string;
  nickname: string;
  createdAt: Date;
  // Profile enhancements
  xp: number;
  level: number;
  avatarId: string;
  theme: string;
  profileImage?: string; // Custom profile image URL or base64
}

export interface UserProfile extends User {
  stats: PersonalStats | null;
  dailyStreak: number;
  gamesPlayed: number;
}

export interface Run {
  _id?: string;
  userId: string;
  mode: GameMode;
  score: number;
  accuracy: number;
  wpm: number;
  rawWpm: number;
  correctChars: number;
  incorrectChars: number;
  timeElapsed: number;
  seed: string;
  comboStreak: number;
  createdAt: Date;
  // Infinite Survival specific
  wordsCompleted?: number;
  survivalStreak?: number;
  // Timed Mode specific
  timedDuration?: TimedDuration;
}

export interface BestScore {
  _id?: string;
  userId: string;
  mode: GameMode;
  score: number;
  accuracy: number;
  wpm: number;
  updatedAt: Date;
  // Mode-specific best scores
  timedDuration?: TimedDuration;
}

export enum GameMode {
  DAILY = 'daily',
  TIMED = 'timed',
  INFINITE_SURVIVAL = 'infinite_survival',
}

export enum TimedDuration {
  THIRTY = 30,
  SIXTY = 60,
  ONE_TWENTY = 120,
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  score: number;
  accuracy?: number;
  wpm?: number;
  rank: number;
  createdAt?: Date;
  avatarId?: string;
  level?: number;
  profileImage?: string;
}

export interface GameState {
  words: string[];
  currentWordIndex: number;
  userInput: string;
  correctChars: number;
  incorrectChars: number;
  startTime: number | null;
  endTime: number | null;
  comboStreak: number;
  maxCombo: number;
  mode: GameMode;
  seed: string;
  revealedLetters: number[];
  revealsUsed: number;
  timePenalty: number;
  lastRevealTime: number | null;
  solvedWords: string[];
  score: number;
  // Timed Mode
  timedDuration?: TimedDuration;
  // Infinite Survival specific
  survivalStreak: number;
  currentWordTimeLimit: number; // Time limit for current word in survival mode
  wordStartTime: number | null; // When current word timer started
  difficultyLevel: number; // Tracks difficulty progression
}

export interface HintState {
  revealedIndices: number[];
  nextRevealAvailableAt: number | null;
  revealsUsed: number;
  totalPenalty: number;
}

export interface PersonalStats {
  _id?: string;
  userId: string;
  globalStats: GlobalStats;
  modeStats: ModeStats;
  updatedAt: Date;
}

export interface GlobalStats {
  gamesPlayed: number;
  wordsSolved: number;
  averageSolveTime: number;
  wordsWithoutReveals: number;
  totalWords: number;
}

export interface ModeStats {
  [GameMode.DAILY]: DailyStats;
  [GameMode.TIMED]: TimedStats;
  [GameMode.INFINITE_SURVIVAL]: InfiniteSurvivalStats;
}

export interface DailyStats {
  bestTime: number | null;
  completions: number;
  currentStreak: number;
  longestStreak: number;
}

export interface TimedStats {
  [TimedDuration.THIRTY]: {
    gamesPlayed: number;
    highestScore: number;
    averageWpm: number;
  };
  [TimedDuration.SIXTY]: {
    gamesPlayed: number;
    highestScore: number;
    averageWpm: number;
  };
  [TimedDuration.ONE_TWENTY]: {
    gamesPlayed: number;
    highestScore: number;
    averageWpm: number;
  };
}

export interface InfiniteSurvivalStats {
  gamesPlayed: number;
  longestStreak: number;
  highestScore: number;
  averageWordsPerGame: number;
}

export interface DailyChallenge {
  _id?: string;
  date: string;
  word: string;
  scrambled: string;
  seed: string;
  createdAt: Date;
}

/**
 * Create a default GameState with overrides for mode-specific fields.
 */
export function createInitialGameState(
  overrides: Partial<GameState> & Pick<GameState, 'mode' | 'seed' | 'words'>
): GameState {
  return {
    currentWordIndex: 0,
    userInput: '',
    correctChars: 0,
    incorrectChars: 0,
    startTime: null,
    endTime: null,
    comboStreak: 0,
    maxCombo: 0,
    revealedLetters: [],
    revealsUsed: 0,
    timePenalty: 0,
    lastRevealTime: null,
    solvedWords: [],
    score: 0,
    survivalStreak: 0,
    currentWordTimeLimit: 0,
    wordStartTime: null,
    difficultyLevel: 0,
    ...overrides,
  };
}

export interface SubmitScoreRequest {
  userId: string;
  mode: GameMode;
  timeElapsed: number;
  correctChars: number;
  incorrectChars: number;
  seed: string;
  wordCount: number;
  revealsUsed?: number;
  timePenalty?: number;
  // Timed mode
  timedDuration?: TimedDuration;
  // Infinite Survival
  survivalStreak?: number;
  wordsCompleted?: number;
}

export interface AnagramGroup {
  _id?: string;
  lang: string;
  difficulty: string;
  signature: string;
  words: string[];
}

export interface WordPickResult {
  scrambled: string;
  answers: string[];
}

export interface SubmitScoreResponse {
  success: boolean;
  run: Run;
  isPersonalBest: boolean;
  dailyRank?: number;
  globalRank?: number;
}