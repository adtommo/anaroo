import { GameMode, TimedDuration } from './types';
import { getModeDuration } from './modes';

export interface ScoreCalculation {
  score: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  isValid: boolean;
  reason?: string;
}

// Anti-cheat constants
const MAX_WPM = 300; // Maximum realistic WPM
const MIN_ACCURACY = 0; // Minimum accuracy (0-100)
const MAX_ACCURACY = 100; // Maximum accuracy
const COMBO_MULTIPLIER = 0.1; // 10% bonus per combo level

/**
 * Calculate score with anti-cheat validation
 */
export function calculateScore(
  correctChars: number,
  incorrectChars: number,
  timeElapsed: number,
  mode: GameMode,
  comboStreak: number = 0,
  timedDuration?: TimedDuration
): ScoreCalculation {
  const modeDuration = getModeDuration(mode, timedDuration);

  // Validate time elapsed
  if (timeElapsed < 1) {
    return {
      score: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      isValid: false,
      reason: 'Time elapsed too short',
    };
  }

  // Only validate against mode duration if mode has a duration limit (Timed mode)
  if (modeDuration !== undefined && timeElapsed > modeDuration + 5) {
    return {
      score: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      isValid: false,
      reason: 'Time elapsed exceeds mode duration',
    };
  }

  // Validate character counts
  if (correctChars < 0 || incorrectChars < 0) {
    return {
      score: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      isValid: false,
      reason: 'Invalid character counts',
    };
  }

  const totalChars = correctChars + incorrectChars;
  if (totalChars === 0) {
    return {
      score: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      isValid: true,
    };
  }

  // Calculate metrics
  const timeInMinutes = timeElapsed / 60;
  const rawWpm = totalChars / 5 / timeInMinutes;
  const wpm = correctChars / 5 / timeInMinutes;
  const accuracy = (correctChars / totalChars) * 100;

  // Anti-cheat validation
  if (rawWpm > MAX_WPM) {
    return {
      score: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      isValid: false,
      reason: `WPM exceeds maximum (${MAX_WPM})`,
    };
  }

  if (accuracy < MIN_ACCURACY || accuracy > MAX_ACCURACY) {
    return {
      score: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      isValid: false,
      reason: 'Invalid accuracy value',
    };
  }

  // Calculate base score
  const baseScore = wpm * accuracy;

  // Apply combo multiplier
  const comboBonus = Math.min(comboStreak * COMBO_MULTIPLIER, 2.0); // Max 200% bonus
  const finalScore = Math.round(baseScore * (1 + comboBonus));

  return {
    score: finalScore,
    wpm: Math.round(wpm * 10) / 10,
    rawWpm: Math.round(rawWpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    isValid: true,
  };
}

/**
 * Validate seed format
 * Supports both game seeds (timestamp-randomstring) and daily seeds (daily-YYYY-MM-DD)
 */
export function validateSeed(seed: string): boolean {
  if (!seed || typeof seed !== 'string') {
    return false;
  }

  // Daily challenge seed format: daily-YYYY-MM-DD
  if (seed.startsWith('daily-')) {
    const dateStr = seed.substring(6);
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  // Game seed format: timestamp-randomstring
  const dashIndex = seed.indexOf('-');
  if (dashIndex === -1) {
    return false;
  }

  const timestamp = parseInt(seed.substring(0, dashIndex), 10);
  if (isNaN(timestamp) || timestamp <= 0) {
    return false;
  }

  return seed.length > dashIndex + 1;
}