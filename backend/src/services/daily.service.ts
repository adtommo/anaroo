import { DailyChallenge, GameMode, scrambleWord, SeededRandom } from '@anaroo/shared';
import { AnagramGroupModel, DailyChallengeModel } from '../models';

export class DailyChallengeService {
  /**
   * Get or create today's daily challenge
   */
  async getTodayChallenge(): Promise<DailyChallenge> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const challenge = await DailyChallengeModel.findOne({ date: today }).lean().exec();

    if (!challenge) {
      // Create today's challenge
      return await this.createDailyChallenge(today);
    }

    return {
      _id: challenge._id.toString(),
      date: challenge.date,
      word: challenge.word,
      scrambled: challenge.scrambled,
      seed: challenge.seed,
      createdAt: challenge.createdAt,
    };
  }

  /**
   * Get challenge for a specific date
   */
  async getChallengeForDate(date: string): Promise<DailyChallenge | null> {
    const challenge = await DailyChallengeModel.findOne({ date }).lean().exec();

    if (!challenge) {
      return null;
    }

    return {
      _id: challenge._id.toString(),
      date: challenge.date,
      word: challenge.word,
      scrambled: challenge.scrambled,
      seed: challenge.seed,
      createdAt: challenge.createdAt,
    };
  }

  /**
   * Create a daily challenge for a specific date
   */
  private async createDailyChallenge(date: string): Promise<DailyChallenge> {
    const seed = `daily-${date}`;
    const rng = new SeededRandom(seed);

    // Pick a random anagram group from the database
    const count = await AnagramGroupModel.countDocuments({ lang: 'en', difficulty: 'easy' });
    if (count === 0) {
      throw new Error('No anagram groups found. Run seed:words first.');
    }

    const index = rng.nextInt(0, count - 1);
    const group = await AnagramGroupModel.findOne({ lang: 'en', difficulty: 'easy' }).skip(index).lean();
    if (!group) {
      throw new Error('Failed to pick anagram group');
    }

    // Pick a word from the group
    const wordIndex = rng.nextInt(0, group.words.length - 1);
    const word = group.words[wordIndex];
    const scrambled = scrambleWord(word, rng);

    const challenge = await DailyChallengeModel.create({
      date,
      word,
      scrambled,
      seed,
      createdAt: new Date(),
    });

    const plainChallenge = challenge.toObject();

    return {
      _id: plainChallenge._id.toString(),
      date: plainChallenge.date,
      word: plainChallenge.word,
      scrambled: plainChallenge.scrambled,
      seed: plainChallenge.seed,
      createdAt: plainChallenge.createdAt,
    };
  }

  /**
   * Check if user has completed today's challenge and get their result
   */
  async getTodayStatus(userId: string): Promise<{
    completed: boolean;
    timeElapsed?: number;
    word?: string;
  }> {
    const today = new Date().toISOString().split('T')[0];

    // Check if there's a run for today's daily challenge
    const { RunModel } = await import('../models');
    const todayRun = await RunModel.findOne({
      userId,
      mode: GameMode.DAILY,
      createdAt: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 86400000),
      },
    }).lean();

    if (!todayRun) {
      return { completed: false };
    }

    // Get today's challenge to include the word
    const challenge = await this.getTodayChallenge();

    return {
      completed: true,
      timeElapsed: todayRun.timeElapsed,
      word: challenge.word,
    };
  }

  /**
   * Check if user has completed today's challenge (simple boolean)
   */
  async hasCompletedToday(userId: string): Promise<boolean> {
    const status = await this.getTodayStatus(userId);
    return status.completed;
  }

  /**
   * Get user's daily challenge history
   */
  async getUserHistory(userId: string, limit: number = 30) {
    const { RunModel } = await import('../models');

    const runs = await RunModel.find({
      userId,
      mode: GameMode.DAILY,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return runs.map(run => ({
      ...run,
      _id: run._id.toString(),
      date: run.createdAt.toISOString().split('T')[0],
    }));
  }
}

export const dailyChallengeService = new DailyChallengeService();
