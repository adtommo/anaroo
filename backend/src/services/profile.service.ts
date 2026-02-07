import { UserProfile, calculateLevel, calculateGameXp, AVATARS, THEMES, AvatarId, ThemeId } from '@anaroo/shared';
import { UserModel, PersonalStatsModel, RunModel, BestScoreModel } from '../models';

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
   * Delete user account and all associated data
   */
  async deleteAccount(userId: string): Promise<void> {
    // Delete all user data in parallel
    await Promise.all([
      UserModel.findByIdAndDelete(userId),
      PersonalStatsModel.deleteMany({ userId }),
      RunModel.deleteMany({ userId }),
      BestScoreModel.deleteMany({ userId }),
    ]);
  }
}

export const profileService = new ProfileService();
