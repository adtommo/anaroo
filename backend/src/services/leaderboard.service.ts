import { GameMode, LeaderboardEntry, TimedDuration } from '@anaroo/shared';
import { redisService } from './redis.service';
import { UserModel, RunModel } from '../models';

export class LeaderboardService {
  /**
   * Get global leaderboard with user details
   */
  async getGlobalLeaderboard(mode: GameMode, limit: number = 50, timedDuration?: TimedDuration): Promise<LeaderboardEntry[]> {
    const scores = await redisService.getGlobalLeaderboard(mode, limit, timedDuration);

    // Fetch user details
    const userIds = scores.map(s => s.userId);
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Fetch best runs to get dates
    const runs = await RunModel.find({
      userId: { $in: userIds },
      mode,
    }).sort({ score: -1 }).lean();

    // Map userId to their best run's createdAt
    const runMap = new Map<string, Date>();
    for (const run of runs) {
      if (!runMap.has(run.userId)) {
        runMap.set(run.userId, run.createdAt);
      }
    }

    return scores.map((score, index) => {
      const user = userMap.get(score.userId);
      // For daily mode, score is stored as negative timeElapsed — convert back
      const isDaily = mode === GameMode.DAILY;
      return {
        userId: score.userId,
        nickname: user?.nickname || 'Unknown',
        score: isDaily ? 0 : score.score,
        rank: index + 1,
        createdAt: runMap.get(score.userId),
        avatarId: user?.avatarId || 'default',
        level: user?.level || 1,
        profileImage: user?.profileImage,
        timeElapsed: isDaily ? Math.abs(score.score) : undefined,
        timedDuration,
      };
    });
  }

  /**
   * Get daily leaderboard with user details
   */
  async getDailyLeaderboard(mode: GameMode, limit: number = 50, timedDuration?: TimedDuration): Promise<LeaderboardEntry[]> {
    const scores = await redisService.getDailyLeaderboard(mode, limit, timedDuration);

    // Fetch user details
    const userIds = scores.map(s => s.userId);
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Fetch today's runs to get dates
    const today = new Date().toISOString().split('T')[0];
    const runs = await RunModel.find({
      userId: { $in: userIds },
      mode,
      createdAt: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 86400000),
      },
    }).sort({ score: -1 }).lean();

    // Map userId to their best run's createdAt for today
    const runMap = new Map<string, Date>();
    for (const run of runs) {
      if (!runMap.has(run.userId)) {
        runMap.set(run.userId, run.createdAt);
      }
    }

    return scores.map((score, index) => {
      const user = userMap.get(score.userId);
      // For daily mode, score is stored as negative timeElapsed — convert back
      const isDaily = mode === GameMode.DAILY;
      return {
        userId: score.userId,
        nickname: user?.nickname || 'Unknown',
        score: isDaily ? 0 : score.score,
        rank: index + 1,
        createdAt: runMap.get(score.userId),
        avatarId: user?.avatarId || 'default',
        level: user?.level || 1,
        profileImage: user?.profileImage,
        timeElapsed: isDaily ? Math.abs(score.score) : undefined,
        timedDuration,
      };
    });
  }

  /**
   * Get user's leaderboard position
   */
  async getUserRank(userId: string, mode: GameMode, timedDuration?: TimedDuration) {
    return await redisService.getUserRank(userId, mode, timedDuration);
  }
}

export const leaderboardService = new LeaderboardService();