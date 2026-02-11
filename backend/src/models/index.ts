import mongoose, { Schema, Document } from 'mongoose';
import { User, Run, BestScore, GameMode, PersonalStats, DailyChallenge, TimedDuration, AnagramGroup } from '@anaroo/shared';

export interface UserDocument extends Omit<User, '_id'>, Document {}
export interface RunDocument extends Omit<Run, '_id'>, Document {}
export interface BestScoreDocument extends Omit<BestScore, '_id'>, Document {}
export interface PersonalStatsDocument extends Omit<PersonalStats, '_id'>, Document {}
export interface DailyChallengeDocument extends Omit<DailyChallenge, '_id'>, Document {}
export interface AnagramGroupDocument extends Omit<AnagramGroup, '_id'>, Document {}

const UserSchema = new Schema<UserDocument>({
  nickname: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  // Profile enhancements
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  avatarId: { type: String, default: 'default' },
  theme: { type: String, default: 'dark' },
  profileImage: { type: String, default: null }, // Base64 or URL
});

const TIMED_DURATIONS = [30, 60, 120] as const;
const TIMED_DURATION_FIELD = {
  type: Number,
  enum: TIMED_DURATIONS,
  required: function (this: any) {
    return this.mode === GameMode.TIMED;
  },
};

const RunSchema = new Schema<RunDocument>({
  userId: { type: String, required: true, index: true },
  mode: { 
    type: String, 
    required: true, 
    enum: Object.values(GameMode),
    index: true 
  },
  score: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  wpm: { type: Number, required: true },
  rawWpm: { type: Number, required: true },
  correctChars: { type: Number, required: true },
  incorrectChars: { type: Number, required: true },
  timeElapsed: { type: Number, required: true },
  seed: { type: String, required: true },
  comboStreak: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true },
  // Infinite Survival specific
  wordsCompleted: { type: Number },
  survivalStreak: { type: Number },
  // Timed Mode specific
  timedDuration: TIMED_DURATION_FIELD,
});

// Compound index for user's runs by mode
RunSchema.index({ userId: 1, mode: 1, createdAt: -1 });

const BestScoreSchema = new Schema<BestScoreDocument>({
  userId: { type: String, required: true },
  mode: { 
    type: String, 
    required: true, 
    enum: Object.values(GameMode) 
  },
  score: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  wpm: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
  // Timed Mode specific
  timedDuration: TIMED_DURATION_FIELD,
});

// Unique constraint: one best score per user per mode (and duration for timed)
BestScoreSchema.index({ userId: 1, mode: 1, timedDuration: 1 }, { unique: true });

const PersonalStatsSchema = new Schema<PersonalStatsDocument>({
  userId: { type: String, required: true, unique: true },
  globalStats: {
    gamesPlayed: { type: Number, default: 0 },
    wordsSolved: { type: Number, default: 0 },
    averageSolveTime: { type: Number, default: 0 },
    wordsWithoutReveals: { type: Number, default: 0 },
    totalWords: { type: Number, default: 0 },
  },
  modeStats: {
    [GameMode.DAILY]: {
      bestTime: { type: Number, default: null },
      completions: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
    },
    [GameMode.TIMED]: {
      [TimedDuration.THIRTY]: {
        gamesPlayed: { type: Number, default: 0 },
        highestScore: { type: Number, default: 0 },
        averageWpm: { type: Number, default: 0 },
      },
      [TimedDuration.SIXTY]: {
        gamesPlayed: { type: Number, default: 0 },
        highestScore: { type: Number, default: 0 },
        averageWpm: { type: Number, default: 0 },
      },
      [TimedDuration.ONE_TWENTY]: {
        gamesPlayed: { type: Number, default: 0 },
        highestScore: { type: Number, default: 0 },
        averageWpm: { type: Number, default: 0 },
      },
    },
    [GameMode.INFINITE_SURVIVAL]: {
      gamesPlayed: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      averageWordsPerGame: { type: Number, default: 0 },
    },
  },
  updatedAt: { type: Date, default: Date.now },
});

const DailyChallengeSchema = new Schema<DailyChallengeDocument>({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  word: { type: String, required: true },
  scrambled: { type: String, required: true },
  seed: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AnagramGroupSchema = new Schema<AnagramGroupDocument>({
  lang: { type: String, required: true },
  difficulty: { type: String, required: true },
  signature: { type: String, required: true },
  words: [{ type: String, required: true }],
});

AnagramGroupSchema.index({ lang: 1, difficulty: 1, signature: 1 }, { unique: true });
AnagramGroupSchema.index({ lang: 1, difficulty: 1 });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
export const RunModel = mongoose.model<RunDocument>('Run', RunSchema);
export const BestScoreModel = mongoose.model<BestScoreDocument>('BestScore', BestScoreSchema);
export const PersonalStatsModel = mongoose.model<PersonalStatsDocument>('PersonalStats', PersonalStatsSchema);
export const DailyChallengeModel = mongoose.model<DailyChallengeDocument>('DailyChallenge', DailyChallengeSchema);
export const AnagramGroupModel = mongoose.model<AnagramGroupDocument>('AnagramGroup', AnagramGroupSchema);