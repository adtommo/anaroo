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

    // Server-side score calculation with anti-cheat
    const scoreCalc = calculateScore(
      request.correctChars,
      request.incorrectChars,
      request.timeElapsed,
      request.mode,
      0
    );

    if (!scoreCalc.isValid) {
      throw new Error(`Invalid score: ${scoreCalc.reason}`);
    }

    // Create run record
    const run: Omit<Run, '_id'> = {
      userId: request.userId,
      mode: request.mode,
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
    };

    // Save to database
    const savedRun = await RunModel.create(run);

    // Check if it's a personal best
    let isPersonalBest = false;
    const existingBest = await BestScoreModel.findOne({
      userId: { $eq: request.userId },
      mode: { $eq: request.mode },
    });

    if (!existingBest || scoreCalc.score > existingBest.score) {
      isPersonalBest = true;
      await BestScoreModel.findOneAndUpdate(
        {
          userId: { $eq: request.userId },
          mode: { $eq: request.mode },
        },
        {
          userId: request.userId,
          mode: request.mode,
          score: scoreCalc.score,
          accuracy: scoreCalc.accuracy,
          wpm: scoreCalc.wpm,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // Update leaderboards
    const ranks = await redisService.addScore(
      request.userId,
      request.mode,
      scoreCalc.score
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
