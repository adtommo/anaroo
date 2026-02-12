// Cypress E2E support file
// Uses mock data shared with MSW for consistency

// Ignore AdSense errors in test environment
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('adsbygoogle') || err.message.includes('googlesyndication')) {
    return false;
  }
});

// Mock data (mirrored from src/mocks/data.ts for Cypress)
const mockUser = {
  _id: 'user-1',
  nickname: 'TestPlayer',
  avatarId: 'default',
  theme: 'dark',
  xp: 1500,
  level: 5,
  createdAt: new Date('2025-01-01').toISOString(),
};

const mockToken = 'mock-jwt-token-12345';

const mockDailyChallenge = {
  _id: 'daily-1',
  date: new Date().toISOString().split('T')[0],
  word: 'testing',
  scrambled: 'gtinets',
  seed: `daily-${new Date().toISOString().split('T')[0]}`,
  createdAt: new Date().toISOString(),
};

const mockLeaderboardEntries = [
  { userId: 'user-1', nickname: 'SpeedRunner', score: 2500, accuracy: 98.5, wpm: 85, rank: 1, createdAt: new Date().toISOString() },
  { userId: 'user-2', nickname: 'WordMaster', score: 2200, accuracy: 95.0, wpm: 72, rank: 2, createdAt: new Date().toISOString() },
  { userId: 'user-3', nickname: 'QuickType', score: 1900, accuracy: 92.3, wpm: 68, rank: 3, createdAt: new Date().toISOString() },
  { userId: 'user-4', nickname: 'AnagramPro', score: 1750, accuracy: 90.0, wpm: 65, rank: 4, createdAt: new Date().toISOString() },
  { userId: 'user-5', nickname: 'TestPlayer', score: 1500, accuracy: 88.0, wpm: 60, rank: 5, createdAt: new Date().toISOString() },
];

const mockWordPick = { seed: 'seed-easy-1', scrambled: 'tac', answers: ['cat', 'act'] };

declare global {
  namespace Cypress {
    interface Chainable {
      /** Set up all API mocks using cy.intercept */
      setupMocks(): Chainable<void>;
      /** Login with mocked API */
      mockLogin(nickname?: string): Chainable<void>;
      /** Register with mocked API */
      mockRegister(nickname?: string): Chainable<void>;
      /** Solve a word by clicking letter tiles in order */
      solveWord(word: string): Chainable<void>;
      /** Wait for game to be interactive (isGameActive = true) */
      waitForGameReady(): Chainable<void>;
    }
  }
}

// Set up all API mocks
Cypress.Commands.add('setupMocks', () => {

  // Health check
  cy.intercept('GET', '/api/health', { statusCode: 200, body: { status: 'ok' } });

  // Auth
  cy.intercept('POST', '/api/auth/register', (req) => {
    req.reply({
      statusCode: 201,
      body: {
        user: { ...mockUser, nickname: req.body.nickname },
        token: mockToken,
      },
    });
  });

  cy.intercept('POST', '/api/auth/login', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        user: { ...mockUser, nickname: req.body.nickname },
        token: mockToken,
      },
    });
  });

  // Daily challenge
  cy.intercept('GET', '/api/daily', { statusCode: 200, body: mockDailyChallenge });
  cy.intercept('GET', '/api/daily/status', { statusCode: 200, body: { completed: false } });
  cy.intercept('GET', '/api/daily/history*', { statusCode: 200, body: [] });

  // Word pick - static response avoids StrictMode double-mount counter drift
  cy.intercept('GET', '/api/word/pick*', { statusCode: 200, body: mockWordPick });

  // Batch word picks
  cy.intercept('GET', '/api/word/picks*', {
    statusCode: 200,
    body: { words: Array.from({ length: 20 }, () => mockWordPick) },
  });

  // Submit score
  cy.intercept('POST', '/api/submitScore', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        run: {
          _id: `run-${Date.now()}`,
          odid: mockUser.odid,
          mode: req.body.mode,
          score: req.body.score,
          accuracy: req.body.accuracy,
          wpm: req.body.wpm,
          rawWpm: req.body.rawWpm,
          correctChars: req.body.correctChars,
          incorrectChars: req.body.incorrectChars,
          timeElapsed: req.body.timeElapsed,
          seed: req.body.seed,
          createdAt: new Date().toISOString(),
        },
        isPersonalBest: false,
        xpAwarded: Math.floor(req.body.score / 10),
      },
    });
  });

  // Leaderboard
  cy.intercept('GET', '/api/leaderboard/daily*', { statusCode: 200, body: mockLeaderboardEntries });
  cy.intercept('GET', '/api/leaderboard/global*', { statusCode: 200, body: mockLeaderboardEntries });
  cy.intercept('GET', '/api/leaderboard/user/*', { statusCode: 200, body: { rank: 5, score: 1500 } });

  // User
  cy.intercept('GET', '/api/user/runs*', { statusCode: 200, body: [] });
  cy.intercept('GET', '/api/user/best', { statusCode: 200, body: [] });

  // Stats
  cy.intercept('GET', '/api/stats', {
    statusCode: 200,
    body: {
      totalGames: 150,
      totalTime: 7200,
      avgAccuracy: 91.5,
      avgWpm: 62,
      bestWpm: 85,
      totalScore: 45000,
      currentStreak: 5,
      longestStreak: 10,
    },
  });

  // Profile - UserProfile extends User with stats, dailyStreak, gamesPlayed
  cy.intercept('GET', '/api/profile', {
    statusCode: 200,
    body: {
      ...mockUser,
      stats: {
        _id: 'stats-1',
        userId: 'user-1',
        globalStats: {
          gamesPlayed: 150,
          wordsSolved: 500,
          averageSolveTime: 3.2,
          wordsWithoutReveals: 420,
          totalWords: 500,
        },
        modeStats: {
          daily: {
            bestTime: 2.5,
            completions: 30,
            currentStreak: 5,
            longestStreak: 10,
          },
          timed: {
            30: { gamesPlayed: 40, highestScore: 1200, averageWpm: 55 },
            60: { gamesPlayed: 60, highestScore: 2500, averageWpm: 62 },
            120: { gamesPlayed: 20, highestScore: 4500, averageWpm: 58 },
          },
          infinite_survival: {
            gamesPlayed: 30,
            longestStreak: 25,
            highestScore: 3500,
            averageWordsPerGame: 12,
          },
        },
        updatedAt: new Date().toISOString(),
      },
      dailyStreak: 5,
      gamesPlayed: 150,
    },
  });

  cy.intercept('PATCH', '/api/profile', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        ...mockUser,
        ...req.body,
        stats: null,
        dailyStreak: 5,
        gamesPlayed: 150,
      },
    });
  });

  cy.intercept('DELETE', '/api/profile', { statusCode: 200, body: { success: true } });
});

// Wait for the game to be interactive by confirming a tile click works.
// React's auto-start effect sets isGameActive after the first render,
// so keyboard/click events may be ignored until that effect runs.
Cypress.Commands.add('waitForGameReady', () => {
  cy.get('.letter-tile').first().click();
  cy.get('.letter-tile.used').should('have.length', 1);
  cy.contains('Clear').click();
  cy.get('.letter-tile.used').should('have.length', 0);
});

// Solve a word by clicking letter tiles in the correct order.
Cypress.Commands.add('solveWord', (word: string) => {
  for (const letter of word) {
    cy.get('.letter-tile').not('.used').contains(letter).click();
  }
});

// Mock login - sets up localStorage as if logged in
Cypress.Commands.add('mockLogin', (nickname = 'TestPlayer') => {
  const user = { ...mockUser, nickname };
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', mockToken);
    win.localStorage.setItem('user', JSON.stringify(user));
  });
});

// Mock register - same as login for testing purposes
Cypress.Commands.add('mockRegister', (nickname = 'TestPlayer') => {
  cy.mockLogin(nickname);
});

export {};
