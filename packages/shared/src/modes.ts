import { GameMode, TimedDuration } from './types';

export interface ModeConfig {
  duration?: number; // in seconds, undefined for no fixed limit
  name: string;
  description: string;
  hintsEnabled: boolean;
  revealDelaySeconds: number;
  revealPenaltySeconds: number;
}

export const GAME_MODES: Record<GameMode, ModeConfig> = {
  [GameMode.DAILY]: {
    name: 'daily',
    description: 'one word per day, compete globally',
    hintsEnabled: true,
    revealDelaySeconds: 10,
    revealPenaltySeconds: 6,
  },
  [GameMode.TIMED]: {
    name: 'timed',
    description: 'solve as many words as you can before time runs out',
    hintsEnabled: false,
    revealDelaySeconds: 5,
    revealPenaltySeconds: 3,
  },
  [GameMode.INFINITE_SURVIVAL]: {
    name: 'survival',
    description: 'endless words with increasing difficulty',
    hintsEnabled: true,
    revealDelaySeconds: 5,
    revealPenaltySeconds: 5,
  },
};

export interface TimedModeConfig {
  duration: number;
  label: string;
}

export const TIMED_DURATIONS: Record<TimedDuration, TimedModeConfig> = {
  [TimedDuration.THIRTY]: {
    duration: 30,
    label: '30s',
  },
  [TimedDuration.SIXTY]: {
    duration: 60,
    label: '60s',
  },
  [TimedDuration.ONE_TWENTY]: {
    duration: 120,
    label: '120s',
  },
};

// Infinite Survival Mode configuration
export const SURVIVAL_CONFIG = {
  initialTimePerWord: 120, // 2 minutes for first word
  minimumTimePerWord: 15, // Minimum 15 seconds per word
  difficultyIncreaseInterval: 3, // Increase difficulty every 3 words
  timeReductionPerLevel: 10, // Reduce time by 10 seconds per difficulty level
  wrongAnswerPenalty: 10, // Deduct 10 seconds for wrong answer
};

export const getModeDuration = (mode: GameMode, timedDuration?: TimedDuration): number | undefined => {
  if (mode === GameMode.TIMED && timedDuration) {
    return TIMED_DURATIONS[timedDuration].duration;
  }
  return GAME_MODES[mode].duration;
};

export const getModeConfig = (mode: GameMode): ModeConfig => {
  return GAME_MODES[mode];
};

export const getTimedDurationConfig = (duration: TimedDuration): TimedModeConfig => {
  return TIMED_DURATIONS[duration];
};

export const calculateSurvivalTimeLimit = (wordsCompleted: number): number => {
  const difficultyLevel = Math.floor(wordsCompleted / SURVIVAL_CONFIG.difficultyIncreaseInterval);
  const timeLimit = SURVIVAL_CONFIG.initialTimePerWord - (difficultyLevel * SURVIVAL_CONFIG.timeReductionPerLevel);
  return Math.max(timeLimit, SURVIVAL_CONFIG.minimumTimePerWord);
};