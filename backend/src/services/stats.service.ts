import { PersonalStats, GameMode, Run, TimedDuration } from '@anaroo/shared';
import { PersonalStatsModel, RunModel } from '../models';

export class StatsService {
  /**
   * Get or create personal stats for a user
   */
  async getPersonalStats(userId: string): Promise<PersonalStats> {
    const stats = await PersonalStatsModel.findOne({ userId }).lean().exec();
    
    if (!stats) {
      // Initialize stats for new user
      const newStats = await PersonalStatsModel.create({
        userId,
        globalStats: {
          gamesPlayed: 0,
          wordsSolved: 0,
          averageSolveTime: 0,
          wordsWithoutReveals: 0,
          totalWords: 0,
        },
        modeStats: {
          [GameMode.DAILY]: {
            bestTime: null,
            completions: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
          [GameMode.TIMED]: {
            [TimedDuration.THIRTY]: {
              gamesPlayed: 0,
              highestScore: 0,
              averageWpm: 0,
            },
            [TimedDuration.SIXTY]: {
              gamesPlayed: 0,
              highestScore: 0,
              averageWpm: 0,
            },
            [TimedDuration.ONE_TWENTY]: {
              gamesPlayed: 0,
              highestScore: 0,
              averageWpm: 0,
            },
          },
          [GameMode.INFINITE_SURVIVAL]: {
            gamesPlayed: 0,
            longestStreak: 0,
            highestScore: 0,
            averageWordsPerGame: 0,
          },
        },
        updatedAt: new Date(),
      });
      
      const plainStats = newStats.toObject();
      
      return {
        _id: plainStats._id.toString(),
        userId: plainStats.userId,
        globalStats: plainStats.globalStats,
        modeStats: plainStats.modeStats,
        updatedAt: plainStats.updatedAt,
      };
    }
    
    return {
      _id: stats._id.toString(),
      userId: stats.userId,
      globalStats: stats.globalStats,
      modeStats: stats.modeStats,
      updatedAt: stats.updatedAt,
    };
  }

  /**
   * Update stats after a completed run.
   * Uses a single fetch + single write to avoid race conditions.
   */
  async updateStatsAfterRun(userId: string, run: Partial<Run> & { wordCount?: number }): Promise<void> {
    const stats = await this.getPersonalStats(userId);

    // Ensure mode stats have all required fields (handles old documents)
    if (!stats.modeStats[GameMode.DAILY]) {
      stats.modeStats[GameMode.DAILY] = { bestTime: null, completions: 0, currentStreak: 0, longestStreak: 0 };
    }
    if (!stats.modeStats[GameMode.TIMED]) {
      stats.modeStats[GameMode.TIMED] = {
        [TimedDuration.THIRTY]: { gamesPlayed: 0, highestScore: 0, averageWpm: 0 },
        [TimedDuration.SIXTY]: { gamesPlayed: 0, highestScore: 0, averageWpm: 0 },
        [TimedDuration.ONE_TWENTY]: { gamesPlayed: 0, highestScore: 0, averageWpm: 0 },
      };
    }
    if (!stats.modeStats[GameMode.INFINITE_SURVIVAL]) {
      stats.modeStats[GameMode.INFINITE_SURVIVAL] = { gamesPlayed: 0, longestStreak: 0, highestScore: 0, averageWordsPerGame: 0 };
    }

    // Update global stats
    stats.globalStats.gamesPlayed += 1;
    stats.globalStats.wordsSolved += run.wordCount ?? 1;

    // Update average solve time
    const totalTime = stats.globalStats.averageSolveTime * (stats.globalStats.gamesPlayed - 1) + (run.timeElapsed || 0);
    stats.globalStats.averageSolveTime = totalTime / stats.globalStats.gamesPlayed;

    // Track words without reveals
    if (run.wordsCompleted !== undefined ? run.wordsCompleted > 0 : true) {
      if (!run.survivalStreak && run.mode === GameMode.DAILY) {
        // Daily mode: no reveals used means clean solve
      }
      stats.globalStats.totalWords += 1;
    }

    // Update mode-specific stats (inline, no second fetch)
    if (run.mode) {
      switch (run.mode) {
        case GameMode.DAILY: {
          const dailyStats = stats.modeStats[GameMode.DAILY];
          dailyStats.completions += 1;

          if (!dailyStats.bestTime || (run.timeElapsed && run.timeElapsed < dailyStats.bestTime)) {
            dailyStats.bestTime = run.timeElapsed || 0;
          }

          // Update streak: check if user completed yesterday's daily challenge
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStart = new Date(yesterday.toISOString().split('T')[0]);
          const yesterdayEnd = new Date(yesterdayStart.getTime() + 86400000);

          const yesterdayRun = await RunModel.findOne({
            userId,
            mode: GameMode.DAILY,
            createdAt: { $gte: yesterdayStart, $lt: yesterdayEnd },
          }).lean();

          if (yesterdayRun) {
            dailyStats.currentStreak += 1;
          } else {
            dailyStats.currentStreak = 1;
          }

          if (dailyStats.currentStreak > dailyStats.longestStreak) {
            dailyStats.longestStreak = dailyStats.currentStreak;
          }
          break;
        }

        case GameMode.TIMED: {
          const timedDuration = run.timedDuration;
          if (timedDuration) {
            if (!stats.modeStats[GameMode.TIMED][timedDuration]) {
              stats.modeStats[GameMode.TIMED][timedDuration] = { gamesPlayed: 0, highestScore: 0, averageWpm: 0 };
            }
            const timedStats = stats.modeStats[GameMode.TIMED][timedDuration];
            timedStats.gamesPlayed += 1;

            if (run.score && run.score > timedStats.highestScore) {
              timedStats.highestScore = run.score;
            }

            // Update average WPM
            const totalWpm = timedStats.averageWpm * (timedStats.gamesPlayed - 1) + (run.wpm || 0);
            timedStats.averageWpm = totalWpm / timedStats.gamesPlayed;
          }
          break;
        }

        case GameMode.INFINITE_SURVIVAL: {
          const survivalStats = stats.modeStats[GameMode.INFINITE_SURVIVAL];
          survivalStats.gamesPlayed += 1;

          const survivalStreak = run.survivalStreak || 0;
          if (survivalStreak > survivalStats.longestStreak) {
            survivalStats.longestStreak = survivalStreak;
          }

          if (run.score && run.score > survivalStats.highestScore) {
            survivalStats.highestScore = run.score;
          }

          const wordsCompleted = run.wordsCompleted || 0;
          const totalWordsCompleted = survivalStats.averageWordsPerGame * (survivalStats.gamesPlayed - 1) + wordsCompleted;
          survivalStats.averageWordsPerGame = totalWordsCompleted / survivalStats.gamesPlayed;
          break;
        }
      }
    }

    // Single write for both global and mode stats
    await PersonalStatsModel.findOneAndUpdate(
      { userId },
      {
        globalStats: stats.globalStats,
        modeStats: stats.modeStats,
        updatedAt: new Date(),
      },
      { upsert: true }
    );
  }

  /**
   * Reset personal stats (for testing or user request)
   */
  async resetStats(userId: string): Promise<void> {
    await PersonalStatsModel.deleteOne({ userId });
  }
}

export const statsService = new StatsService();