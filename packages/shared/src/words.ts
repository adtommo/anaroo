import fs from 'fs';
import path from 'path';
import { SeededRandom, scrambleWord, signature } from './word-utils';

// Re-export everything from word-utils so existing `import from './words'` still works
export { SeededRandom, scrambleWord, signature, generateSeed } from './word-utils';

/**
 * Load a word list JSON for a given language and difficulty
 */
function loadWordList(lang: string, difficulty: 'easy' | 'medium' | 'hard'): string[] {
  const filePath = path.join(__dirname, 'words', lang, `${difficulty}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Word list not found: ${filePath}`);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as string[];
}

/**
 * Generate full array of scrambled words with grouped answers
 * Returns [{ scrambled, answers }]
 */
export function WORD_LIST(
  lang: string = 'en',
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  seed: string = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
): Array<{ scrambled: string; answers: string[] }> {
  const rng = new SeededRandom(seed);
  const wordList = loadWordList(lang, difficulty);

  if (wordList.length === 0) return [];

  // Group words by sorted-letter signature
  const groups: Record<string, string[]> = {};
  for (const word of wordList) {
    const key = signature(word);
    if (!groups[key]) groups[key] = [];
    groups[key].push(word);
  }

  // Scramble one word per group
  const result: Array<{ scrambled: string; answers: string[] }> = [];
  for (const answers of Object.values(groups)) {
    const wordToScramble = answers[rng.nextInt(0, answers.length - 1)];
    const scrambledWord = scrambleWord(wordToScramble, rng);
    result.push({ scrambled: scrambledWord, answers });
  }

  // Shuffle final array
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generate an array of { scrambled, answer } for game modes.
 * Wraps WORD_LIST, picking the first answer from each anagram group.
 */
export function generateWords(
  seed: string,
  count: number,
  lang: string = 'en',
  difficulty: 'easy' | 'medium' | 'hard' = 'easy'
): Array<{ seed: string; scrambled: string; answer: string }> {
  const groups = WORD_LIST(lang, difficulty, seed);
  return groups.slice(0, count).map((g) => ({
    seed,
    scrambled: g.scrambled,
    answer: g.answers[0],
  }));
}
