import { createClient, RedisClientType } from 'redis';
import { GameMode } from '@anaroo/shared';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(host: string = 'localhost', port: number = 6379): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host,
          port,
        },
      });

      this.client.on('error', (err) => console.error('Redis Client Error', err));
      this.client.on('connect', () => console.log('Redis connected'));
      this.client.on('disconnect', () => {
        console.log('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Redis service initialized');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  private getGlobalKey(mode: GameMode): string {
    return `leaderboard:global:${mode}`;
  }

  private getDailyKey(mode: GameMode): string {
    const date = new Date().toISOString().split('T')[0];
    return `leaderboard:daily:${mode}:${date}`;
  }

  /**
   * Add a score to both global and daily leaderboards
   */
  async addScore(
    userId: string,
    mode: GameMode,
    score: number
  ): Promise<{ globalRank: number; dailyRank: number }> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    const globalKey = this.getGlobalKey(mode);
    const dailyKey = this.getDailyKey(mode);

    // Add to both leaderboards (higher score = better)
    await Promise.all([
      this.client.zAdd(globalKey, { score, value: userId }),
      this.client.zAdd(dailyKey, { score, value: userId }),
    ]);

    // Set expiry on daily leaderboard (7 days)
    await this.client.expire(dailyKey, 60 * 60 * 24 * 7);

    // Get ranks (Redis uses 0-based index, we want 1-based)
    const [globalRank, dailyRank] = await Promise.all([
      this.client.zRevRank(globalKey, userId),
      this.client.zRevRank(dailyKey, userId),
    ]);

    return {
      globalRank: (globalRank ?? -1) + 1,
      dailyRank: (dailyRank ?? -1) + 1,
    };
  }

  /**
   * Get top N scores from global leaderboard
   */
  async getGlobalLeaderboard(mode: GameMode, limit: number = 50): Promise<Array<{ userId: string; score: number }>> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    const key = this.getGlobalKey(mode);
    const results = await this.client.zRangeWithScores(key, 0, limit - 1, { REV: true });

    return results.map((result) => ({
      userId: result.value,
      score: result.score,
    }));
  }

  /**
   * Get top N scores from daily leaderboard
   */
  async getDailyLeaderboard(mode: GameMode, limit: number = 50): Promise<Array<{ userId: string; score: number }>> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    const key = this.getDailyKey(mode);
    const results = await this.client.zRangeWithScores(key, 0, limit - 1, { REV: true });

    return results.map((result) => ({
      userId: result.value,
      score: result.score,
    }));
  }

  /**
   * Get user's rank and score
   */
  async getUserRank(
    userId: string,
    mode: GameMode
  ): Promise<{ globalRank: number; globalScore: number; dailyRank: number; dailyScore: number } | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    const globalKey = this.getGlobalKey(mode);
    const dailyKey = this.getDailyKey(mode);

    const [globalRank, globalScore, dailyRank, dailyScore] = await Promise.all([
      this.client.zRevRank(globalKey, userId),
      this.client.zScore(globalKey, userId),
      this.client.zRevRank(dailyKey, userId),
      this.client.zScore(dailyKey, userId),
    ]);

    if (globalScore === null && dailyScore === null) {
      return null;
    }

    return {
      globalRank: (globalRank ?? -1) + 1,
      globalScore: globalScore ?? 0,
      dailyRank: (dailyRank ?? -1) + 1,
      dailyScore: dailyScore ?? 0,
    };
  }

  /**
   * Push a value to a list and trim to maxLen (FIFO)
   */
  async listPushAndTrim(key: string, value: string, maxLen: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    await this.client.lPush(key, value);
    await this.client.lTrim(key, 0, maxLen - 1);
  }

  /**
   * Read list elements by range
   */
  async listRange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    return this.client.lRange(key, start, stop);
  }

  /**
   * Delete a key
   */
  async deleteKey(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    await this.client.del(key);
  }

  /**
   * Clear all leaderboards (for testing)
   */
  async clearLeaderboards(): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    const keys = await this.client.keys('leaderboard:*');
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

export const redisService = new RedisService();