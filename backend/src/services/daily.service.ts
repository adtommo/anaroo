import { DailyChallenge, GameMode, scrambleWord, SeededRandom } from '@anaroo/shared';
import { generateWords } from '@anaroo/shared/node';
import { DailyChallengeModel } from '../models';

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
    // Use date as seed for reproducibility
    const seed = `daily-${date}`;
    const rng = new SeededRandom(seed);
    
    // Select a word (prefer medium-length words for daily challenge)
    const allWords = generateWords(seed, 500);
    const mediumWords = allWords.filter(w => w.answer.length >= 5 && w.answer.length <= 8);
    const pool = mediumWords.length > 0 ? mediumWords : allWords;
    const wordIndex = rng.nextInt(0, pool.length - 1);
    const word = pool[wordIndex].answer;

    // Scramble it
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