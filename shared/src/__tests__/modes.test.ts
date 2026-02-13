import { describe, it, expect } from 'vitest';
import {
  getModeDuration,
  getModeConfig,
  getTimedDurationConfig,
  calculateSurvivalTimeLimit,
  GAME_MODES,
  TIMED_DURATIONS,
  SURVIVAL_CONFIG,
} from '../modes';
import { GameMode, TimedDuration } from '../types';

describe('GAME_MODES', () => {
  it('has config for all game modes', () => {
    expect(GAME_MODES[GameMode.DAILY]).toBeDefined();
    expect(GAME_MODES[GameMode.TIMED]).toBeDefined();
    expect(GAME_MODES[GameMode.INFINITE_SURVIVAL]).toBeDefined();
  });

  it('daily has hints enabled', () => {
    expect(GAME_MODES[GameMode.DAILY].hintsEnabled).toBe(true);
  });

  it('timed mode has hints disabled', () => {
    expect(GAME_MODES[GameMode.TIMED].hintsEnabled).toBe(false);
  });
});

describe('TIMED_DURATIONS', () => {
  it('has all three durations', () => {
    expect(TIMED_DURATIONS[TimedDuration.THIRTY].duration).toBe(30);
    expect(TIMED_DURATIONS[TimedDuration.SIXTY].duration).toBe(60);
    expect(TIMED_DURATIONS[TimedDuration.ONE_TWENTY].duration).toBe(120);
  });

  it('has labels for display', () => {
    expect(TIMED_DURATIONS[TimedDuration.THIRTY].label).toBe('30s');
    expect(TIMED_DURATIONS[TimedDuration.SIXTY].label).toBe('60s');
    expect(TIMED_DURATIONS[TimedDuration.ONE_TWENTY].label).toBe('120s');
  });
});

describe('getModeDuration', () => {
  it('returns timed duration when mode is TIMED', () => {
    expect(getModeDuration(GameMode.TIMED, TimedDuration.SIXTY)).toBe(60);
  });

  it('returns undefined for non-timed modes', () => {
    expect(getModeDuration(GameMode.DAILY)).toBeUndefined();
    expect(getModeDuration(GameMode.INFINITE_SURVIVAL)).toBeUndefined();
  });

  it('returns undefined for TIMED without duration specified', () => {
    expect(getModeDuration(GameMode.TIMED)).toBeUndefined();
  });
});

describe('getModeConfig', () => {
  it('returns config object for each mode', () => {
    const config = getModeConfig(GameMode.DAILY);
    expect(config.name).toBe('Daily');
    expect(config).toHaveProperty('description');
    expect(config).toHaveProperty('hintsEnabled');
  });
});

describe('getTimedDurationConfig', () => {
  it('returns config for duration', () => {
    const config = getTimedDurationConfig(TimedDuration.THIRTY);
    expect(config.duration).toBe(30);
    expect(config.label).toBe('30s');
  });
});

describe('calculateSurvivalTimeLimit', () => {
  it('returns initial time for 0 words completed', () => {
    expect(calculateSurvivalTimeLimit(0)).toBe(SURVIVAL_CONFIG.initialTimePerWord);
  });

  it('reduces time after difficulty interval', () => {
    const afterInterval = calculateSurvivalTimeLimit(SURVIVAL_CONFIG.difficultyIncreaseInterval);
    expect(afterInterval).toBe(
      SURVIVAL_CONFIG.initialTimePerWord - SURVIVAL_CONFIG.timeReductionPerLevel
    );
  });

  it('never goes below minimum', () => {
    const veryHigh = calculateSurvivalTimeLimit(1000);
    expect(veryHigh).toBe(SURVIVAL_CONFIG.minimumTimePerWord);
  });

  it('decreases progressively', () => {
    const t0 = calculateSurvivalTimeLimit(0);
    const t1 = calculateSurvivalTimeLimit(3);
    const t2 = calculateSurvivalTimeLimit(6);
    expect(t0).toBeGreaterThan(t1);
    expect(t1).toBeGreaterThan(t2);
  });
});
