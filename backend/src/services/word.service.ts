import { PipelineStage } from 'mongoose';
import { SeededRandom, scrambleWord, WordPickResult } from '@anaroo/shared';
import { AnagramGroupModel } from '../models';
import { redisService } from './redis.service';

const RECENT_MAX = 100;
const ALLOWED_LANGS = ['en', 'es', 'fr', 'de'];
const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard'];

class WordService {
  private recentKey(userId: string, lang: string, difficulty: string): string {
    return `user:${userId}:${lang}:${difficulty}:recent`;
  }

  private validateInputs(lang: string, difficulty: string) {
    if (!ALLOWED_LANGS.includes(lang)) {
      throw new Error(`Unsupported language: ${lang}`);
    }
    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      throw new Error(`Unsupported difficulty: ${difficulty}`);
    }
  }

  async pickWordForUser(
    userId: string | undefined,
    lang: string,
    difficulty: string,
    seed?: string
  ): Promise<WordPickResult> {
    this.validateInputs(lang, difficulty);

    // Read recent signatures to exclude them (only for authenticated users)
    let recentSignatures: string[] = [];
    let key: string | undefined;
    if (userId) {
      key = this.recentKey(userId, lang, difficulty);
      try {
        recentSignatures = await redisService.listRange(key, 0, RECENT_MAX - 1);
      } catch {
        // Redis unavailable — proceed without exclusion
      }
    }

    // Build safe filter using $eq
    const filter: Record<string, unknown> = {
      lang: { $eq: lang },
      difficulty: { $eq: difficulty },
    };
    if (recentSignatures.length > 0) {
      filter.signature = { $nin: recentSignatures };
    }

    let doc;

    if (seed) {
      // Deterministic path: count + skip
      const rng = new SeededRandom(seed);
      let count = await AnagramGroupModel.countDocuments(filter);

      if (count === 0) {
        // All signatures exhausted — fall back without exclusion
        delete filter.signature;
        count = await AnagramGroupModel.countDocuments(filter);

        if (count === 0) {
          const err = new Error('No anagram groups found');
          (err as any).lang = lang;
          (err as any).difficulty = difficulty;
          throw err;
        }
      }

      const skip = rng.nextInt(0, count - 1);
      doc = await AnagramGroupModel.findOne(filter).skip(skip).lean();

      // Scramble using seeded RNG
      const wordToScramble = doc!.words[rng.nextInt(0, doc!.words.length - 1)];
      const scrambled = scrambleWord(wordToScramble, rng);

      // Track signature in Redis (only for authenticated users)
      if (key) {
        try {
          await redisService.listPushAndTrim(key, doc!.signature, RECENT_MAX);
        } catch {
          // Redis unavailable — non-fatal
        }
      }

      return { scrambled, answers: doc!.words };
    } else {
      // Random path: $sample aggregation
      const pipeline: PipelineStage[] = [{ $match: filter }, { $sample: { size: 1 } }];
      let results = await AnagramGroupModel.aggregate(pipeline);

      if (results.length === 0 && recentSignatures.length > 0) {
        // Fallback without recent signatures
        delete filter.signature;
        results = await AnagramGroupModel.aggregate([
          { $match: filter },
          { $sample: { size: 1 } },
        ]);

        if (results.length === 0) {
          const err = new Error('No anagram groups found');
          (err as any).lang = lang;
          (err as any).difficulty = difficulty;
          throw err;
        }
      }

      doc = results[0];

      // Scramble with random RNG
      const rng = new SeededRandom(`${Date.now()}-${Math.random()}`);
      const wordToScramble = doc.words[rng.nextInt(0, doc.words.length - 1)];
      const scrambled = scrambleWord(wordToScramble, rng);

      // Track signature in Redis (only for authenticated users)
      if (key) {
        try {
          await redisService.listPushAndTrim(key, doc.signature, RECENT_MAX);
        } catch {
          // Redis unavailable — non-fatal
        }
      }

      return { scrambled, answers: doc.words };
    }
  }

  async pickWordsForUser(
    userId: string | undefined,
    lang: string,
    difficulty: string,
    count: number
  ): Promise<WordPickResult[]> {
    const results: WordPickResult[] = [];
    for (let i = 0; i < count; i++) {
      results.push(await this.pickWordForUser(userId, lang, difficulty));
    }
    return results;
  }

  async resetUser(userId: string, lang: string, difficulty: string): Promise<void> {
    this.validateInputs(lang, difficulty);
    const key = this.recentKey(userId, lang, difficulty);
    await redisService.deleteKey(key);
  }
}

export const wordService = new WordService();
