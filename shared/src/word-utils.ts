/**
 * Seeded random number generator
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32-bit int
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Scramble a word while ensuring it's different from the original
 */
export function scrambleWord(word: string, rng: SeededRandom): string {
  const chars = word.split('');
  let scrambled = word;
  let attempts = 0;
  const maxAttempts = 100;

  while (scrambled === word && attempts < maxAttempts) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    scrambled = chars.join('');
    attempts++;
  }

  return scrambled;
}

/**
 * Helper: sorted-letter signature
 */
export function signature(word: string): string {
  return word.split('').sort().join('');
}

/**
 * Generate a random seed string in "timestamp-randomstring" format
 */
export function generateSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
