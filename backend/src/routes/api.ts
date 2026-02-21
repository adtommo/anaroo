import { Router, Request, Response } from 'express';
import { GameMode, SubmitScoreRequest, TimedDuration, generateSeed } from '@anaroo/shared';

const VALID_GAME_MODES = Object.values(GameMode) as string[];
const VALID_TIMED_DURATIONS = Object.values(TimedDuration).filter(v => typeof v === 'number') as number[];

function parseGameMode(value: unknown): GameMode | undefined {
  if (typeof value !== 'string') return undefined;
  return VALID_GAME_MODES.includes(value) ? (value as GameMode) : undefined;
}
import { scoreService } from '../services/score.service';
import { leaderboardService } from '../services/leaderboard.service';
import { statsService } from '../services/stats.service';
import { dailyChallengeService } from '../services/daily.service';
import { wordService } from '../services/word.service';
import { profileService } from '../services/profile.service';
import { UserModel } from '../models';
import { AuthRequest, requireAuth, optionalAuth } from '../middleware/auth';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const VALID_LANGS = ['en', 'es', 'fr', 'de'] as const;

const router = Router();

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile
 */
router.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.userId).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      _id: user._id.toString(),
      nickname: user.nickname,
      email: user.email,
      createdAt: user.createdAt,
      xp: user.xp,
      level: user.level,
      avatarId: user.avatarId,
      theme: user.theme,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/submitScore
 * Submit a game score
 */
router.post('/submitScore', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mode, timeElapsed, correctChars, incorrectChars, wordCount, timedDuration } = req.body;

    if (!parseGameMode(mode)) {
      res.status(400).json({ error: 'Invalid game mode' });
      return;
    }
    if (typeof timeElapsed !== 'number' || timeElapsed < 0) {
      res.status(400).json({ error: 'timeElapsed must be a non-negative number' });
      return;
    }
    if (typeof correctChars !== 'number' || correctChars < 0) {
      res.status(400).json({ error: 'correctChars must be a non-negative number' });
      return;
    }
    if (typeof incorrectChars !== 'number' || incorrectChars < 0) {
      res.status(400).json({ error: 'incorrectChars must be a non-negative number' });
      return;
    }
    if (typeof wordCount !== 'number' || !Number.isInteger(wordCount) || wordCount < 1) {
      res.status(400).json({ error: 'wordCount must be a positive integer' });
      return;
    }
    if (timedDuration !== undefined && !VALID_TIMED_DURATIONS.includes(timedDuration)) {
      res.status(400).json({ error: 'Invalid timed duration' });
      return;
    }

    const scoreRequest: SubmitScoreRequest = {
      userId: req.userId!,
      mode,
      timeElapsed,
      correctChars,
      incorrectChars,
      seed: req.body.seed,
      wordCount,
      revealsUsed: req.body.revealsUsed,
      timePenalty: req.body.timePenalty,
      // Timed mode
      timedDuration,
      // Infinite Survival
      survivalStreak: req.body.survivalStreak,
      wordsCompleted: req.body.wordsCompleted,
    };

    const result = await scoreService.submitScore(scoreRequest);

    // Update personal stats
    await statsService.updateStatsAfterRun(req.userId!, result.run);

    // Award XP
    const stats = await statsService.getPersonalStats(req.userId!);
    const xpResult = await profileService.addXp(req.userId!, {
      mode: mode as 'daily' | 'timed' | 'infinite_survival',
      wordsSolved: wordCount,
      accuracy: result.run.accuracy,
      isPersonalBest: result.isPersonalBest,
      dailyStreak: stats?.modeStats?.daily?.currentStreak,
    });

    res.json({
      ...result,
      xpEarned: xpResult.xpEarned,
      newXp: xpResult.newXp,
      newLevel: xpResult.newLevel,
      leveledUp: xpResult.leveledUp,
    });
  } catch (error) {
    console.error('Submit score error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit score';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/stats
 * Get personal stats for the authenticated user
 */
router.get('/stats', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await statsService.getPersonalStats(req.userId!);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/daily
 * Get today's daily challenge
 */
router.get('/daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const challenge = await dailyChallengeService.getTodayChallenge();
    res.json({
      _id: challenge._id,
      date: challenge.date,
      letterCount: challenge.word.length,
      scrambled: challenge.scrambled,
      seed: challenge.seed,
      createdAt: challenge.createdAt,
    });
  } catch (error) {
    console.error('Get daily challenge error:', error);
    res.status(500).json({ error: 'Failed to fetch daily challenge' });
  }
});

/**
 * POST /api/daily/guess
 * Validate a guess against today's daily challenge
 */
router.post('/daily/guess', async (req: Request, res: Response): Promise<void> => {
  try {
    const { guess } = req.body;

    if (!guess || typeof guess !== 'string') {
      res.status(400).json({ error: 'guess is required' });
      return;
    }

    const result = await dailyChallengeService.validateGuess(guess);
    res.json(result);
  } catch (error) {
    console.error('Daily guess error:', error);
    res.status(500).json({ error: 'Failed to validate guess' });
  }
});

/**
 * POST /api/daily/reveal
 * Get the next letter to reveal for today's daily challenge
 */
router.post('/daily/reveal', async (req: Request, res: Response): Promise<void> => {
  try {
    const { revealedPositions } = req.body;

    if (!Array.isArray(revealedPositions)) {
      res.status(400).json({ error: 'revealedPositions must be an array' });
      return;
    }

    const result = await dailyChallengeService.getNextReveal(revealedPositions);
    res.json(result);
  } catch (error) {
    console.error('Daily reveal error:', error);
    res.status(500).json({ error: 'Failed to reveal letter' });
  }
});

/**
 * GET /api/daily/status
 * Check if user has completed today's challenge and get their result
 */
router.get('/daily/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await dailyChallengeService.getTodayStatus(req.userId!);
    res.json(status);
  } catch (error) {
    console.error('Get daily status error:', error);
    res.status(500).json({ error: 'Failed to fetch daily status' });
  }
});

/**
 * GET /api/daily/history
 * Get user's daily challenge history
 */
router.get('/daily/history', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 30, 100));
    const history = await dailyChallengeService.getUserHistory(req.userId!, limit);
    res.json(history);
  } catch (error) {
    console.error('Get daily history error:', error);
    res.status(500).json({ error: 'Failed to fetch daily history' });
  }
});

/**
 * GET /api/leaderboard/daily
 * Get daily leaderboard
 */
router.get('/leaderboard/daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const mode = parseGameMode(req.query.mode) || GameMode.TIMED;
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 50, 100));
    const rawDuration = parseInt(req.query.timedDuration as string);
    const timedDuration = VALID_TIMED_DURATIONS.includes(rawDuration) ? rawDuration as TimedDuration : undefined;

    const leaderboard = await leaderboardService.getDailyLeaderboard(mode, limit, timedDuration);
    res.json(leaderboard);
  } catch (error) {
    console.error('Daily leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch daily leaderboard' });
  }
});

/**
 * GET /api/leaderboard/global
 * Get global leaderboard
 */
router.get('/leaderboard/global', async (req: Request, res: Response): Promise<void> => {
  try {
    const mode = parseGameMode(req.query.mode) || GameMode.TIMED;
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 50, 100));
    const rawDuration = parseInt(req.query.timedDuration as string);
    const timedDuration = VALID_TIMED_DURATIONS.includes(rawDuration) ? rawDuration as TimedDuration : undefined;

    const leaderboard = await leaderboardService.getGlobalLeaderboard(mode, limit, timedDuration);
    res.json(leaderboard);
  } catch (error) {
    console.error('Global leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch global leaderboard' });
  }
});

/**
 * GET /api/leaderboard/user/:id
 * Get user's leaderboard rank
 */
router.get('/leaderboard/user/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const mode = parseGameMode(req.query.mode) || GameMode.TIMED;

    const rank = await leaderboardService.getUserRank(userId as string, mode);
    
    if (!rank) {
      res.status(404).json({ error: 'User not found on leaderboard' });
      return;
    }

    res.json(rank);
  } catch (error) {
    console.error('User rank error:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
});

/**
 * GET /api/user/runs
 * Get user's run history
 */
router.get('/user/runs', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mode = req.query.mode ? parseGameMode(req.query.mode) : undefined;
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 20, 100));

    const runs = await scoreService.getUserRuns(req.userId!, mode, limit);
    res.json(runs);
  } catch (error) {
    console.error('User runs error:', error);
    res.status(500).json({ error: 'Failed to fetch user runs' });
  }
});

/**
 * GET /api/user/best
 * Get user's best scores
 */
router.get('/user/best', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bestScores = await scoreService.getUserBestScores(req.userId!);
    res.json(bestScores);
  } catch (error) {
    console.error('User best scores error:', error);
    res.status(500).json({ error: 'Failed to fetch best scores' });
  }
});

/**
 * GET /api/word/pick
 * Pick a random word for the authenticated user
 */
router.get('/word/pick', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawLang = (req.query.lang as string) || 'en';
    const difficulty = (req.query.difficulty as string) || 'easy';
    const seed = generateSeed();

    if (!VALID_DIFFICULTIES.includes(difficulty as typeof VALID_DIFFICULTIES[number])) {
      res.status(400).json({ error: 'Invalid difficulty. Must be one of: easy, medium, hard' });
      return;
    }

    if (!VALID_LANGS.includes(rawLang as typeof VALID_LANGS[number])) {
      res.status(400).json({ error: 'Invalid language.' });
      return;
    }

    const lang = rawLang as typeof VALID_LANGS[number];

    const result = await wordService.pickWordForUser(req.userId, lang, difficulty, seed);
    res.json({ seed: seed, ...result });
  } catch (error) {
    const safeLang = ((req.query.lang as string) || 'en').replace(/[\r\n]/g, '');
    const safeDifficulty = ((req.query.difficulty as string) || 'easy').replace(/[\r\n]/g, '');
    const err = error as Error;
    console.error('Word pick error', {
      lang: safeLang,
      difficulty: safeDifficulty,
      name: err.name,
    });
    res.status(500).json({ error: 'Failed to pick word' });
  }
});

/**
 * GET /api/word/picks
 * Pick multiple random words for the authenticated user
 */
router.get('/word/picks', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawLang = (req.query.lang as string) || 'en';
    const difficulty = (req.query.difficulty as string) || 'easy';
    const count = Math.max(1, Math.min(parseInt(req.query.count as string) || 10, 20));

    if (!VALID_DIFFICULTIES.includes(difficulty as typeof VALID_DIFFICULTIES[number])) {
      res.status(400).json({ error: 'Invalid difficulty. Must be one of: easy, medium, hard' });
      return;
    }

    if (!VALID_LANGS.includes(rawLang as typeof VALID_LANGS[number])) {
      res.status(400).json({ error: 'Invalid language.' });
      return;
    }

    const lang = rawLang as typeof VALID_LANGS[number];

    const results = await wordService.pickWordsForUser(req.userId, lang, difficulty, count);
    const words = results.map(r => ({
      seed: generateSeed(),
      scrambled: r.scrambled,
      answers: r.answers,
    }));

    res.json({ words });
  } catch (error) {
    const safeLang = ((req.query.lang as string) || 'en').replace(/[\r\n]/g, '');
    const safeDifficulty = ((req.query.difficulty as string) || 'easy').replace(/[\r\n]/g, '');
    const err = error as Error;
    console.error('Word picks error', {
      lang: safeLang,
      difficulty: safeDifficulty,
      name: err.name,
    });
    res.status(500).json({ error: 'Failed to pick words' });
  }
});

/**
 * DELETE /api/word/recent
 * Reset user's recent word history
 */
router.delete('/word/recent', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'en';
    const difficulty = (req.query.difficulty as string) || 'easy';

    if (!VALID_DIFFICULTIES.includes(difficulty as typeof VALID_DIFFICULTIES[number])) {
      res.status(400).json({ error: 'Invalid difficulty. Must be one of: easy, medium, hard' });
      return;
    }

    await wordService.resetUser(req.userId!, lang, difficulty);
    res.json({ success: true });
  } catch (error) {
    const safeLang = ((req.query.lang as string) || 'en').replace(/[\r\n]/g, '');
    const safeDifficulty = ((req.query.difficulty as string) || 'easy').replace(/[\r\n]/g, '');
    const err = error as Error;
    const safeMessage = (err.message || '').replace(/[\r\n]/g, '');
    console.error('Word reset error', {
      lang: safeLang,
      difficulty: safeDifficulty,
      name: err.name,
      message: safeMessage,
    });
    res.status(500).json({ error: 'Failed to reset recent words' });
  }
});

/**
 * GET /api/profile
 * Get current user's enriched profile with stats, recent runs, and rankings
 */
router.get('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await profileService.getEnrichedProfile(req.userId!);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * GET /api/profile/user/:nickname
 * Get public enriched profile by nickname (for viewing other players)
 */
router.get('/profile/user/:nickname', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname } = req.params;
    const user = await UserModel.findOne({ nickname: nickname as string }).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const profile = await profileService.getEnrichedProfile(user._id.toString());
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(profile);
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/profile
 * Update user profile settings
 */
router.patch('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nickname, avatarId, theme, profileImage } = req.body;

    const profile = await profileService.updateProfile(req.userId!, {
      nickname,
      avatarId,
      theme,
      profileImage,
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/profile
 * Delete user account and all data
 */
router.delete('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await profileService.deleteAccount(req.userId!);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;