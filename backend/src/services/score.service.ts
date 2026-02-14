import {
  SubmitScoreRequest,
  SubmitScoreResponse,
  Run,
  GameMode,
  calculateScore,
  validateSeed,
} from '@anaroo/shared';
import { RunModel, BestScoreModel } from '../models';
import { redisService } from './redis.service';

export class ScoreService {
  /**
   * Submit and validate a score
   */
  async submitScore(request: SubmitScoreRequest): Promise<SubmitScoreResponse> {
    // Validate seed
    if (!validateSeed(request.seed)) {
      throw new Error('Invalid seed format');
    }

    // Validate mode
    if (!Object.values(GameMode).includes(request.mode)) {
      throw new Error('Invalid game mode');
    }

    // Validate userId
    if (typeof request.userId !== 'string') {
      throw new Error('Invalid userId');
    }

    // Sanitize to plain primitives to prevent NoSQL operator injection
    const userId = String(request.userId);
    const mode = String(request.mode) as GameMode;

    // Prevent duplicate daily submissions
    if (mode === GameMode.DAILY) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const existingRun = await RunModel.findOne({
        userId: { $eq: userId },
        mode: { $eq: GameMode.DAILY },
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }).lean();

      if (existingRun) {
        return {
          success: true,
          run: { ...existingRun, _id: existingRun._id.toString() },
          isPersonalBest: false,
          dailyRank: undefined as any,
          globalRank: undefined as any,
        };
      }
    }

    // Server-side score calculation with anti-cheat
    const scoreCalc = calculateScore(
      request.correctChars,
      request.incorrectChars,
      request.timeElapsed,
      mode,
      0
    );

    if (!scoreCalc.isValid) {
      throw new Error(`Invalid score: ${scoreCalc.reason}`);
    }

    // Create run record
    const run: Omit<Run, '_id'> = {
      userId,
      mode,
      score: scoreCalc.score,
      accuracy: scoreCalc.accuracy,
      wpm: scoreCalc.wpm,
      rawWpm: scoreCalc.rawWpm,
      correctChars: request.correctChars,
      incorrectChars: request.incorrectChars,
      timeElapsed: request.timeElapsed,
      seed: request.seed,
      comboStreak: 0,
      createdAt: new Date(),
      timedDuration: request.timedDuration,
      wordsCompleted: request.wordsCompleted,
      survivalStreak: request.survivalStreak,
    };

    // Save to database
    const savedRun = await RunModel.create(run);

    // Check if it's a personal best
    let isPersonalBest = false;
    const existingBest = await BestScoreModel.findOne({
      userId: { $eq: userId },
      mode: { $eq: mode },
    });

    if (!existingBest || scoreCalc.score > existingBest.score) {
      isPersonalBest = true;
      await BestScoreModel.findOneAndUpdate(
        {
          userId: { $eq: userId },
          mode: { $eq: mode },
        },
        {
          userId,
          mode,
          score: scoreCalc.score,
          accuracy: scoreCalc.accuracy,
          wpm: scoreCalc.wpm,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // Update leaderboards
    // For daily mode, store negative timeElapsed so fastest time sorts highest via ZREVRANK
    // For timed mode, split by duration
    const leaderboardScore = mode === GameMode.DAILY
      ? -request.timeElapsed
      : scoreCalc.score;

    const ranks = await redisService.addScore(
      userId,
      mode,
      leaderboardScore,
      request.timedDuration
    );

    return {
      success: true,
      run: {
        ...run,
        _id: savedRun._id.toString(),
      },
      isPersonalBest,
      dailyRank: ranks.dailyRank,
      globalRank: ranks.globalRank,
    };
  }

  /**
   * Get user's run history
   */
  async getUserRuns(userId: string, mode?: GameMode, limit: number = 20): Promise<Run[]> {
    if (typeof userId !== 'string') {
      throw new Error('Invalid userId');
    }

    const query: any = { userId: { $eq: userId } };
    if (mode) {
      query.mode = { $eq: mode };
    }

    const runs = await RunModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return runs.map(run => ({
      ...run,
      _id: run._id.toString(),
    }));
  }

  /**
   * Get user's best scores
   */
  async getUserBestScores(userId: string) {
    if (typeof userId !== 'string') {
      throw new Error('Invalid userId');
    }

    const bestScores = await BestScoreModel.find({ userId: { $eq: userId } }).lean();
    return bestScores.map(score => ({
      ...score,
      _id: score._id.toString(),
    }));
  }
}

export const scoreService = new ScoreService();
