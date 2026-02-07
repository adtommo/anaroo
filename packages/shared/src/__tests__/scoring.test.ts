import { describe, it, expect } from 'vitest';
import { calculateScore, validateSeed } from '../scoring';
import { GameMode, TimedDuration } from '../types';

describe('calculateScore', () => {
  it('calculates basic score for valid input', () => {
    const result = calculateScore(100, 10, 60, GameMode.TIMED, 0, TimedDuration.SIXTY);
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.accuracy).toBeCloseTo(90.9, 0);
    expect(result.wpm).toBeGreaterThan(0);
  });

  it('rejects time elapsed less than 1 second', () => {
    const result = calculateScore(50, 0, 0.5, GameMode.TIMED);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Time elapsed too short');
  });

  it('rejects time exceeding timed mode duration', () => {
    const result = calculateScore(50, 0, 70, GameMode.TIMED, 0, TimedDuration.SIXTY);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('exceeds mode duration');
  });

  it('allows unlimited time for non-timed modes', () => {
    const result = calculateScore(50, 0, 600, GameMode.DAILY);
    expect(result.isValid).toBe(true);
  });

  it('rejects negative character counts', () => {
    const result = calculateScore(-1, 0, 30, GameMode.TIMED);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Invalid character counts');
  });

  it('returns zero score for zero characters', () => {
    const result = calculateScore(0, 0, 30, GameMode.TIMED);
    expect(result.isValid).toBe(true);
    expect(result.score).toBe(0);
  });

  it('rejects unrealistically high WPM', () => {
    // 10000 chars in 10 seconds = 12000 WPM
    const result = calculateScore(10000, 0, 10, GameMode.INFINITE_SURVIVAL);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('WPM exceeds maximum');
  });

  it('applies combo multiplier', () => {
    const noCombo = calculateScore(100, 0, 60, GameMode.TIMED, 0, TimedDuration.SIXTY);
    const withCombo = calculateScore(100, 0, 60, GameMode.TIMED, 5, TimedDuration.SIXTY);
    expect(withCombo.score).toBeGreaterThan(noCombo.score);
  });

  it('caps combo multiplier at 200%', () => {
    const maxCombo = calculateScore(100, 0, 60, GameMode.TIMED, 20, TimedDuration.SIXTY);
    const overMaxCombo = calculateScore(100, 0, 60, GameMode.TIMED, 100, TimedDuration.SIXTY);
    expect(maxCombo.score).toBe(overMaxCombo.score);
  });

  it('computes accuracy correctly', () => {
    const result = calculateScore(80, 20, 60, GameMode.TIMED, 0, TimedDuration.SIXTY);
    expect(result.accuracy).toBeCloseTo(80, 0);
  });
});

describe('validateSeed', () => {
  it('accepts valid game seed format', () => {
    expect(validateSeed('1234567890-abc123')).toBe(true);
  });

  it('accepts valid daily seed format', () => {
    expect(validateSeed('daily-2024-01-15')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateSeed('')).toBe(false);
  });

  it('rejects null/undefined', () => {
    expect(validateSeed(null as unknown as string)).toBe(false);
    expect(validateSeed(undefined as unknown as string)).toBe(false);
  });

  it('rejects string without dash', () => {
    expect(validateSeed('nodashhere')).toBe(false);
  });

  it('rejects non-numeric timestamp', () => {
    expect(validateSeed('abc-def')).toBe(false);
  });

  it('rejects timestamp of zero or negative', () => {
    expect(validateSeed('0-abc')).toBe(false);
    expect(validateSeed('-1-abc')).toBe(false);
  });

  it('rejects daily seed with invalid date format', () => {
    expect(validateSeed('daily-2024-1-5')).toBe(false);
    expect(validateSeed('daily-')).toBe(false);
  });

  it('rejects seed with nothing after dash', () => {
    expect(validateSeed('12345-')).toBe(false);
  });
});
