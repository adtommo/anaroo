import {
  UserProfile,
  EnrichedUserProfile,
  RecentRun,
  ProfileRankings,
  GameMode,
  TimedDuration,
  calculateLevel,
  calculateGameXp,
  AVATARS,
  THEMES,
  AvatarId,
  ThemeId,
} from '@anaroo/shared';
import { UserModel, PersonalStatsModel, RunModel, BestScoreModel } from '../models';
import { redisService } from './redis.service';
import { supabaseAdmin } from '../lib/supabase';

class ProfileService {
  /**
   * Get full user profile with stats
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await UserModel.findById(userId).lean();
    if (!user) return null;

    const stats = await PersonalStatsModel.findOne({ userId }).lean();
    const gamesPlayed = stats?.globalStats?.gamesPlayed || 0;
    const dailyStreak = stats?.modeStats?.daily?.currentStreak || 0;

    return {
      _id: user._id.toString(),
      nickname: user.nickname,
      createdAt: user.createdAt,
      xp: user.xp || 0,
      level: user.level || 1,
      avatarId: user.avatarId || 'default',
      theme: user.theme || 'dark',
      profileImage: user.profileImage || undefined,
      stats: stats ? {
        _id: stats._id?.toString(),
        userId: stats.userId,
        globalStats: stats.globalStats,
        modeStats: stats.modeStats,
        updatedAt: stats.updatedAt,
      } : null,
      dailyStreak,
      gamesPlayed,
    };
  }

  /**
   * Get public profile by user ID
   */
  async getPublicProfile(userId: string): Promise<UserProfile | null> {
    return this.getProfile(userId);
  }

  /**
   * Get public profile by nickname
   */
  async getProfileByNickname(nickname: string): Promise<UserProfile | null> {
    const user = await UserModel.findOne({ nickname }).lean();
    if (!user) return null;
    return this.getProfile(user._id.toString());
  }

  /**
   * Get enriched profile with recent runs and leaderboard rankings
   */
  async getEnrichedProfile(userId: string): Promise<EnrichedUserProfile | null> {
    const baseProfile = await this.getProfile(userId);
    if (!baseProfile) return null;

    // Fetch recent runs (last 10)
    const runs = await RunModel.find({ userId: { $eq: userId } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentRuns: RecentRun[] = runs.map((run) => ({
      mode: run.mode,
      score: run.score,
      wpm: run.wpm,
      accuracy: run.accuracy,
      timeElapsed: run.timeElapsed,
      timedDuration: run.timedDuration,
      createdAt: run.createdAt,
    }));

    // Fetch rankings for each mode in parallel
    const [dailyRank, timed30Rank, timed60Rank, timed120Rank, survivalRank] = await Promise.all([
      redisService.getUserRank(userId, GameMode.DAILY).catch(() => null),
      redisService.getUserRank(userId, GameMode.TIMED, TimedDuration.THIRTY).catch(() => null),
      redisService.getUserRank(userId, GameMode.TIMED, TimedDuration.SIXTY).catch(() => null),
      redisService.getUserRank(userId, GameMode.TIMED, TimedDuration.ONE_TWENTY).catch(() => null),
      redisService.getUserRank(userId, GameMode.INFINITE_SURVIVAL).catch(() => null),
    ]);

    // Fetch leaderboard sizes in parallel
    const [dailySize, timed30Size, timed60Size, timed120Size, survivalSize] = await Promise.all([
      redisService.getLeaderboardSize(GameMode.DAILY, 'global').catch(() => 0),
      redisService.getLeaderboardSize(GameMode.TIMED, 'global', TimedDuration.THIRTY).catch(() => 0),
      redisService.getLeaderboardSize(GameMode.TIMED, 'global', TimedDuration.SIXTY).catch(() => 0),
      redisService.getLeaderboardSize(GameMode.TIMED, 'global', TimedDuration.ONE_TWENTY).catch(() => 0),
      redisService.getLeaderboardSize(GameMode.INFINITE_SURVIVAL, 'global').catch(() => 0),
    ]);

    const rankings: ProfileRankings = {};
    if (dailyRank) rankings.daily = { rank: dailyRank.globalRank, totalPlayers: dailySize };
    if (timed30Rank) rankings.timed30 = { rank: timed30Rank.globalRank, totalPlayers: timed30Size };
    if (timed60Rank) rankings.timed60 = { rank: timed60Rank.globalRank, totalPlayers: timed60Size };
    if (timed120Rank) rankings.timed120 = { rank: timed120Rank.globalRank, totalPlayers: timed120Size };
    if (survivalRank) rankings.survival = { rank: survivalRank.globalRank, totalPlayers: survivalSize };

    return {
      ...baseProfile,
      recentRuns,
      rankings,
    };
  }

  /**
   * Update user profile settings
   */
  async updateProfile(
    userId: string,
    updates: { nickname?: string; avatarId?: AvatarId; theme?: ThemeId; profileImage?: string | null }
  ): Promise<UserProfile | null> {
    const updateFields: Record<string, unknown> = {};

    // Validate and set nickname
    if (updates.nickname !== undefined) {
      const trimmed = updates.nickname.trim();
      if (trimmed.length < 2 || trimmed.length > 20) {
        throw new Error('Nickname must be between 2 and 20 characters');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        throw new Error('Nickname can only contain letters, numbers, underscores, and hyphens');
      }
      // Check if nickname is taken by another user
      const existing = await UserModel.findOne({
        nickname: trimmed,
        _id: { $ne: userId },
      });
      if (existing) {
        throw new Error('Nickname already taken');
      }
      updateFields.nickname = trimmed;
    }

    // Validate avatarId
    if (updates.avatarId !== undefined) {
      const validAvatar = AVATARS.find(a => a.id === updates.avatarId);
      if (!validAvatar) {
        throw new Error('Invalid avatar');
      }
      updateFields.avatarId = updates.avatarId;
    }

    // Validate theme
    if (updates.theme !== undefined) {
      const validTheme = THEMES.find(t => t.id === updates.theme);
      if (!validTheme) {
        throw new Error('Invalid theme');
      }
      updateFields.theme = updates.theme;
    }

    // Handle profile image
    if (updates.profileImage !== undefined) {
      if (updates.profileImage === null) {
        // Remove profile image
        updateFields.profileImage = null;
      } else {
        // Validate base64 image (should start with data:image/)
        if (!updates.profileImage.startsWith('data:image/')) {
          throw new Error('Invalid image format');
        }
        // Limit size (roughly 2MB base64 ~= 2.7MB encoded)
        if (updates.profileImage.length > 2800000) {
          throw new Error('Image too large. Maximum size is 2MB.');
        }
        updateFields.profileImage = updates.profileImage;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return this.getProfile(userId);
    }

    await UserModel.findByIdAndUpdate(userId, { $set: updateFields });
    return this.getProfile(userId);
  }

  /**
   * Add XP to user and update level
   */
  async addXp(
    userId: string,
    params: {
      mode: 'daily' | 'timed' | 'infinite_survival';
      wordsSolved: number;
      accuracy: number;
      isPersonalBest: boolean;
      dailyStreak?: number;
    }
  ): Promise<{ xpEarned: number; newXp: number; newLevel: number; leveledUp: boolean }> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentXp = user.xp || 0;
    const currentLevel = user.level || 1;
    const xpEarned = calculateGameXp(params);
    const newXp = currentXp + xpEarned;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > currentLevel;

    await UserModel.findByIdAndUpdate(userId, {
      $set: { xp: newXp, level: newLevel },
    });

    return { xpEarned, newXp, newLevel, leveledUp };
  }

  /**
   * Delete user account and all associated data (MongoDB + Supabase)
   */
  async deleteAccount(userId: string): Promise<void> {
    // Look up the Supabase ID before deleting MongoDB records
    const user = await UserModel.findById(userId).lean();
    const supabaseId = user?.supabaseId;

    // Delete all MongoDB data in parallel
    await Promise.all([
      UserModel.findByIdAndDelete(userId),
      PersonalStatsModel.deleteMany({ userId }),
      RunModel.deleteMany({ userId }),
      BestScoreModel.deleteMany({ userId }),
    ]);

    // Delete from Supabase Auth
    if (supabaseId) {
      await supabaseAdmin.auth.admin.deleteUser(supabaseId);
    }
  }
}

export const profileService = new ProfileService();
