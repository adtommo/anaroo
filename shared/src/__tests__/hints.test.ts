import { describe, it, expect } from 'vitest';
import {
  canRevealNext,
  getNextRevealTime,
  getSecondsUntilNextReveal,
  getRevealPenalty,
  revealNextLetter,
  buildDisplayWithReveals,
  validateInputWithReveals,
  isWordSolved,
  calculateEffectiveTime,
} from '../hints';
import { GameMode } from '../types';

/**
 * Daily
 * revealDelaySeconds = 10
 * delay growth = +2s
 *
 * Reveal times:
 * 1st: 10
 * 2nd: 10 + 12 = 22
 * 3rd: 22 + 14 = 36
 * 4th: 36 + 16 = 52
 *
 * Penalty:
 * base = 6
 * growth = +3
 *
 * 1: 6
 * 2: 6 + 9 = 15
 * 3: 6 + 9 + 12 = 27
 */

describe('getNextRevealTime', () => {
  it('returns time for first reveal at base delay', () => {
    const startTime = 1000;
    const nextTime = getNextRevealTime(0, startTime, GameMode.DAILY);
    expect(nextTime).toBe(1000 + 10000);
  });

  it('increases with staggered gaps for subsequent reveals', () => {
    const startTime = 0;
    expect(getNextRevealTime(0, startTime, GameMode.DAILY)).toBe(10000);
    expect(getNextRevealTime(1, startTime, GameMode.DAILY)).toBe(22000);
    expect(getNextRevealTime(2, startTime, GameMode.DAILY)).toBe(36000);
  });

  it('gaps increase by 2s each time', () => {
    const startTime = 0;
    const t1 = getNextRevealTime(0, startTime, GameMode.DAILY);
    const t2 = getNextRevealTime(1, startTime, GameMode.DAILY);
    const t3 = getNextRevealTime(2, startTime, GameMode.DAILY);
    const t4 = getNextRevealTime(3, startTime, GameMode.DAILY);

    const gap1 = t1;
    const gap2 = t2 - t1;
    const gap3 = t3 - t2;
    const gap4 = t4 - t3;

    expect(gap2 - gap1).toBe(2000);
    expect(gap3 - gap2).toBe(2000);
    expect(gap4 - gap3).toBe(2000);
  });
});

describe('canRevealNext', () => {
  it('returns false before delay has passed', () => {
    expect(canRevealNext(0, 9000, 0, GameMode.DAILY)).toBe(false);
  });

  it('returns true after delay has passed', () => {
    expect(canRevealNext(0, 10000, 0, GameMode.DAILY)).toBe(true);
  });

  it('requires more time for subsequent reveals', () => {
    expect(canRevealNext(1, 21000, 0, GameMode.DAILY)).toBe(false);
    expect(canRevealNext(1, 22000, 0, GameMode.DAILY)).toBe(true);
  });
});

describe('getSecondsUntilNextReveal', () => {
  it('returns 0 when reveal is available', () => {
    expect(getSecondsUntilNextReveal(0, 10000, 0, GameMode.DAILY)).toBe(0);
  });

  it('returns remaining seconds when not yet available', () => {
    expect(getSecondsUntilNextReveal(0, 2000, 0, GameMode.DAILY)).toBe(8);
  });
});

describe('getRevealPenalty', () => {
  it('returns 0 for no reveals', () => {
    expect(getRevealPenalty(0, GameMode.DAILY)).toBe(0);
  });

  it('returns escalating penalty for reveals used', () => {
    expect(getRevealPenalty(1, GameMode.DAILY)).toBe(6);
    expect(getRevealPenalty(2, GameMode.DAILY)).toBe(15);
    expect(getRevealPenalty(3, GameMode.DAILY)).toBe(27);
  });

  it('uses mode-specific penalty', () => {
    expect(getRevealPenalty(1, GameMode.INFINITE_SURVIVAL)).toBe(5);
    expect(getRevealPenalty(2, GameMode.INFINITE_SURVIVAL)).toBe(13);
  });
});

describe('revealNextLetter', () => {
  it('reveals first unrevealed letter', () => {
    expect(revealNextLetter('hello', [])).toBe(0);
    expect(revealNextLetter('hello', [0, 1, 2])).toBe(3);
  });

  it('returns -1 when all letters revealed', () => {
    expect(revealNextLetter('hi', [0, 1])).toBe(-1);
  });
});

describe('buildDisplayWithReveals', () => {
  it('shows underscores for unrevealed letters', () => {
    expect(buildDisplayWithReveals('hello', [], '')).toBe('_____');
  });

  it('shows revealed letters', () => {
    expect(buildDisplayWithReveals('hello', [0, 2], '')).toBe('h_l__');
  });

  it('fills unrevealed with user input', () => {
    expect(buildDisplayWithReveals('hello', [0], 'ello')).toBe('hello');
    expect(buildDisplayWithReveals('hello', [0], 'el')).toBe('hel__');
  });
});

describe('validateInputWithReveals', () => {
  it('validates correct input', () => {
    expect(validateInputWithReveals('hello', [], 'hello')).toBe(true);
    expect(validateInputWithReveals('hello', [0], 'ello')).toBe(true);
  });

  it('rejects incorrect or incomplete input', () => {
    expect(validateInputWithReveals('hello', [], 'hel')).toBe(false);
    expect(validateInputWithReveals('hello', [], 'helxo')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(validateInputWithReveals('Hello', [], 'hello')).toBe(true);
  });
});

describe('isWordSolved', () => {
  it('detects solved state correctly', () => {
    expect(isWordSolved('cat', [], 'cat')).toBe(true);
    expect(isWordSolved('cat', [0], 'at')).toBe(true);
    expect(isWordSolved('cat', [], 'ca')).toBe(false);
    expect(isWordSolved('cat', [], 'dog')).toBe(false);
  });
});

describe('calculateEffectiveTime', () => {
  it('adds reveal penalty to actual time', () => {
    // 10s actual + (6 + 9) = 25
    expect(calculateEffectiveTime(10, 2, GameMode.DAILY)).toBe(25);
  });

  it('returns actual time when no reveals used', () => {
    expect(calculateEffectiveTime(10, 0, GameMode.DAILY)).toBe(10);
  });
});
