import { describe, it, expect } from 'vitest';
import {
  signature,
  SeededRandom,
  scrambleWord,
  generateSeed,
} from '@anaroo/shared';
import { generateWords } from '@anaroo/shared/node';

describe('signature', () => {
  it('returns sorted letters', () => {
    expect(signature('eat')).toBe('aet');
    expect(signature('tea')).toBe('aet');
    expect(signature('eta')).toBe('aet');
  });

  it('handles single character', () => {
    expect(signature('a')).toBe('a');
  });

  it('handles repeated characters', () => {
    expect(signature('aab')).toBe('aab');
    expect(signature('baa')).toBe('aab');
  });
});

describe('SeededRandom', () => {
  it('produces deterministic sequences', () => {
    const rng1 = new SeededRandom('test');
    const rng2 = new SeededRandom('test');

    const seq1 = [rng1.next(), rng1.next(), rng1.next()];
    const seq2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRandom('seed-a');
    const rng2 = new SeededRandom('seed-b');

    expect(rng1.next()).not.toBe(rng2.next());
  });

  it('nextInt returns values within range', () => {
    const rng = new SeededRandom('range-test');
    for (let i = 0; i < 50; i++) {
      const val = rng.nextInt(3, 7);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
    }
  });
});

describe('scrambleWord', () => {
  it('returns a string with the same letters', () => {
    const rng = new SeededRandom('scramble-test');
    const result = scrambleWord('hello', rng);

    expect(result.split('').sort().join('')).toBe('ehllo');
  });

  it('returns a different arrangement for words longer than 1 char', () => {
    const rng = new SeededRandom('scramble-diff');
    const result = scrambleWord('abcdef', rng);

    // With 6 distinct letters, a shuffle should differ from original
    expect(result).not.toBe('abcdef');
  });

  it('is deterministic with same seed', () => {
    const rng1 = new SeededRandom('det-test');
    const rng2 = new SeededRandom('det-test');

    expect(scrambleWord('testing', rng1)).toBe(scrambleWord('testing', rng2));
  });
});

describe('generateSeed', () => {
  it('returns a string in timestamp-random format', () => {
    const seed = generateSeed();
    const parts = seed.split('-');

    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(Number(parts[0])).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('returns unique values on successive calls', () => {
    const seed1 = generateSeed();
    const seed2 = generateSeed();

    expect(seed1).not.toBe(seed2);
  });
});

describe('generateWords', () => {
  it('returns array of { scrambled, answer }', () => {
    const words = generateWords(generateSeed(), 5);

    expect(words.length).toBeGreaterThan(0);
    expect(words.length).toBeLessThanOrEqual(5);
    for (const w of words) {
      expect(w).toHaveProperty('scrambled');
      expect(w).toHaveProperty('answer');
      expect(typeof w.scrambled).toBe('string');
      expect(typeof w.answer).toBe('string');
    }
  });

  it('respects count limit', () => {
    const words = generateWords(generateSeed(), 3);
    expect(words.length).toBeLessThanOrEqual(3);
  });

  it('produces deterministic results with same seed', () => {
    const seed = 'deterministic-test-seed';
    const words1 = generateWords(seed, 10);
    const words2 = generateWords(seed, 10);

    expect(words1).toEqual(words2);
  });

  it('scrambled word has same letters as answer', () => {
    const words = generateWords(generateSeed(), 10);

    for (const w of words) {
      expect(signature(w.scrambled)).toBe(signature(w.answer));
    }
  });
});
