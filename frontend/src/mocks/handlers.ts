import { http, HttpResponse, delay } from 'msw';
import { GameMode } from '@anaroo/shared';
import {
  mockUser,
  mockToken,
  mockDailyChallenge,
  mockLeaderboardEntries,
  mockRuns,
  mockPersonalStats,
  mockUserProfile,
  getNextWordPick,
} from './data';

const API_BASE = '/api';

// State for tracking daily completion
let dailyCompleted = false;
let dailyTimeElapsed: number | undefined;

export const handlers = [
  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Auth: Register
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { nickname: string };
    return HttpResponse.json({
      user: { ...mockUser, nickname: body.nickname },
      token: mockToken,
    }, { status: 201 });
  }),

  // Auth: Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { nickname: string };
    return HttpResponse.json({
      user: { ...mockUser, nickname: body.nickname },
      token: mockToken,
    });
  }),

  // Daily challenge
  http.get(`${API_BASE}/daily`, async () => {
    await delay(50);
    return HttpResponse.json(mockDailyChallenge);
  }),

  // Daily status
  http.get(`${API_BASE}/daily/status`, async () => {
    await delay(50);
    if (dailyCompleted) {
      return HttpResponse.json({
        completed: true,
        timeElapsed: dailyTimeElapsed,
        word: mockDailyChallenge.word,
      });
    }
    return HttpResponse.json({ completed: false });
  }),

  // Daily history
  http.get(`${API_BASE}/daily/history`, async () => {
    await delay(50);
    return HttpResponse.json(
      mockRuns
        .filter(r => r.mode === GameMode.DAILY)
        .map(r => ({ ...r, date: new Date().toISOString().split('T')[0] }))
    );
  }),

  // Word pick
  http.get(`${API_BASE}/word/pick`, async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const count = parseInt(url.searchParams.get('count') || '1', 10);

    // Return multiple word picks if requested
    const picks = [];
    for (let i = 0; i < count; i++) {
      picks.push(getNextWordPick());
    }

    // For single pick, return just the object; for multiple, return array
    if (count === 1) {
      return HttpResponse.json(picks[0]);
    }
    return HttpResponse.json(picks);
  }),

  // Batch word picks
  http.get(`${API_BASE}/word/picks`, async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const count = Math.min(parseInt(url.searchParams.get('count') || '10', 10), 20);

    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(getNextWordPick());
    }
    return HttpResponse.json({ words });
  }),

  // Submit score
  http.post(`${API_BASE}/submitScore`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as {
      mode: GameMode;
      score: number;
      accuracy: number;
      wpm: number;
      rawWpm: number;
      correctChars: number;
      incorrectChars: number;
      timeElapsed: number;
      seed: string;
    };

    // Track daily completion
    if (body.mode === GameMode.DAILY) {
      dailyCompleted = true;
      dailyTimeElapsed = body.timeElapsed;
    }

    const run = {
      _id: `run-${Date.now()}`,
      userId: mockUser._id,
      mode: body.mode,
      score: body.score,
      accuracy: body.accuracy,
      wpm: body.wpm,
      rawWpm: body.rawWpm,
      correctChars: body.correctChars,
      incorrectChars: body.incorrectChars,
      timeElapsed: body.timeElapsed,
      seed: body.seed,
      comboStreak: 0,
      createdAt: new Date(),
    };

    return HttpResponse.json({
      success: true,
      run,
      isPersonalBest: body.score > 2000,
      xpAwarded: Math.floor(body.score / 10),
    });
  }),

  // Leaderboard: Daily
  http.get(`${API_BASE}/leaderboard/daily`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    return HttpResponse.json(mockLeaderboardEntries.slice(0, limit));
  }),

  // Leaderboard: Global
  http.get(`${API_BASE}/leaderboard/global`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    return HttpResponse.json(mockLeaderboardEntries.slice(0, limit));
  }),

  // User rank
  http.get(`${API_BASE}/leaderboard/user/:userId`, async () => {
    await delay(50);
    return HttpResponse.json({
      rank: 5,
      score: 1500,
    });
  }),

  // User runs
  http.get(`${API_BASE}/user/runs`, async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') as GameMode | null;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let runs = mockRuns;
    if (mode) {
      runs = runs.filter(r => r.mode === mode);
    }
    return HttpResponse.json(runs.slice(0, limit));
  }),

  // User best scores
  http.get(`${API_BASE}/user/best`, async () => {
    await delay(50);
    return HttpResponse.json([]);
  }),

  // Personal stats
  http.get(`${API_BASE}/stats`, async () => {
    await delay(50);
    return HttpResponse.json(mockPersonalStats);
  }),

  // Profile: Get
  http.get(`${API_BASE}/profile`, async () => {
    await delay(100);
    return HttpResponse.json(mockUserProfile);
  }),

  // Profile: Update
  http.patch(`${API_BASE}/profile`, async ({ request }) => {
    await delay(100);
    const updates = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...mockUserProfile,
      ...updates,
    });
  }),

  // Profile: Delete
  http.delete(`${API_BASE}/profile`, async () => {
    await delay(100);
    return HttpResponse.json({ success: true });
  }),
];

// Reset function for tests
export function resetMockState() {
  dailyCompleted = false;
  dailyTimeElapsed = undefined;
}
