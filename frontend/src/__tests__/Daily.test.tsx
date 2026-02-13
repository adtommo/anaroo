import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Daily } from '../components/Daily';

vi.mock('../services/api', () => ({
  apiService: {
    getTodayChallenge: vi.fn().mockResolvedValue({
      _id: 'challenge-1',
      date: '2025-01-15',
      word: 'cat',
      scrambled: 'tac',
      seed: 'daily-2025-01-15',
      createdAt: new Date(),
    }),
    getDailyStatus: vi.fn().mockResolvedValue({ completed: false }),
    submitScore: vi.fn().mockResolvedValue({
      success: true,
      run: {
        _id: 'run-1',
        userId: 'user-1',
        mode: 'daily',
        score: 100,
        accuracy: 100,
        wpm: 50,
        rawWpm: 50,
        correctChars: 3,
        incorrectChars: 0,
        timeElapsed: 5,
        seed: 'daily-2025-01-15',
        comboStreak: 0,
        createdAt: new Date(),
      },
      isPersonalBest: false,
    }),
  },
}));

vi.mock('../hooks/useSound', () => ({
  useSound: () => ({
    playCorrect: vi.fn(),
    playIncorrect: vi.fn(),
    playSkip: vi.fn(),
    playGameOver: vi.fn(),
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'user-1', nickname: 'TestPlayer', createdAt: new Date() },
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

async function clickLetter(letter: string) {
  const tiles = screen.getAllByRole('button').filter(
    btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
  ) as HTMLButtonElement[];
  const target = tiles.find(t => t.textContent === letter);
  if (!target) throw new Error(`No available tile for letter "${letter}"`);
  await userEvent.click(target);
}

async function spellWord(word: string) {
  for (const letter of word) {
    await clickLetter(letter);
  }
}

async function waitForGameReady() {
  await waitFor(() => {
    const tiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile')
    );
    expect(tiles.length).toBeGreaterThan(0);
  });
}

describe('Daily - Game Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state then shows letter tiles', async () => {
    render(<Daily />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    await waitForGameReady();

    const tiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile')
    );
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toHaveTextContent('t');
    expect(tiles[1]).toHaveTextContent('a');
    expect(tiles[2]).toHaveTextContent('c');
  });

  it('shows already completed message when daily was done', async () => {
    const { apiService } = await import('../services/api');
    vi.mocked(apiService.getDailyStatus).mockResolvedValueOnce({
      completed: true,
      timeElapsed: 12.5,
      word: 'cat',
    });

    render(<Daily />);

    await waitFor(() => {
      // Should show completion screen with previous time
      expect(screen.getByText('daily complete')).toBeInTheDocument();
      expect(screen.getByText('12.5s')).toBeInTheDocument();
      expect(screen.getByText('Come back tomorrow for a new word!')).toBeInTheDocument();
    });
  });

  it('solving the word correctly shows completion screen', async () => {
    render(<Daily />);
    await waitForGameReady();

    await spellWord('cat');

    await waitFor(() => {
      expect(screen.getByText('daily complete')).toBeInTheDocument();
    });
  });

  it('shows the answer word after completion', async () => {
    render(<Daily />);
    await waitForGameReady();

    await spellWord('cat');

    await waitFor(() => {
      expect(screen.getByText("Today's Word")).toBeInTheDocument();
      expect(screen.getByText('cat')).toBeInTheDocument();
    });
  });

  it('wrong guess resets input without ending the game', async () => {
    render(<Daily />);
    await waitForGameReady();

    // Spell wrong: "tac" ≠ "cat"
    await spellWord('tac');

    // Tiles should reset (all available again)
    await waitFor(() => {
      const availableTiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(availableTiles).toHaveLength(3);
    });

    // Game should NOT be over
    expect(screen.queryByText('daily complete')).not.toBeInTheDocument();
  });

  it('can solve after a wrong guess', async () => {
    render(<Daily />);
    await waitForGameReady();

    // Wrong guess first
    await spellWord('tac');
    await waitFor(() => {
      const tiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(tiles).toHaveLength(3);
    });

    // Now solve correctly
    await spellWord('cat');

    await waitFor(() => {
      expect(screen.getByText('daily complete')).toBeInTheDocument();
    });
  });

  it('submits score on completion', async () => {
    render(<Daily />);
    await waitForGameReady();

    await spellWord('cat');

    const { apiService } = await import('../services/api');
    await waitFor(() => {
      expect(apiService.submitScore).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          seed: 'daily-2025-01-15',
          correctChars: 3,
        })
      );
    });
  });

  it('backspace removes the last letter', async () => {
    render(<Daily />);
    await waitForGameReady();

    await clickLetter('c');
    await clickLetter('a');

    let usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(2);

    await userEvent.click(screen.getByText(/Backspace/));

    usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });
});

describe('Daily - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking an already-selected (disabled) tile does nothing', async () => {
    render(<Daily />);
    await waitForGameReady();

    // Click 't' tile (index 0)
    await clickLetter('t');

    // The 't' tile should now be disabled
    const allTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile')
    ) as HTMLButtonElement[];
    const tTile = allTiles[0];
    expect(tTile).toBeDisabled();

    // Clicking the disabled tile should have no effect
    await userEvent.click(tTile);

    // Should still have exactly 1 used tile
    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });

  it('keyboard: pressing a letter already fully selected does nothing', async () => {
    render(<Daily />);
    await waitForGameReady();

    // Word is "tac" - only one 't'. Click it.
    await clickLetter('t');

    // Press 't' again via keyboard - should be no-op since only 't' tile is already used
    await userEvent.keyboard('t');

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });

  it('keyboard: non-letter keys are ignored', async () => {
    render(<Daily />);
    await waitForGameReady();

    // Press numbers and special chars
    await userEvent.keyboard('123!@#');

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(0);
  });

  it('keyboard: Backspace removes last letter', async () => {
    render(<Daily />);
    await waitForGameReady();

    await userEvent.keyboard('c');
    await userEvent.keyboard('a');

    let usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(2);

    await userEvent.keyboard('{Backspace}');

    usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });

  it('clear button resets all selected tiles', async () => {
    render(<Daily />);
    await waitForGameReady();

    await clickLetter('c');
    await clickLetter('a');

    let usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(2);

    await userEvent.click(screen.getByText('Clear'));

    usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(0);
  });

  it('backspace and clear are disabled when no letters selected', async () => {
    render(<Daily />);
    await waitForGameReady();

    const backspaceBtn = screen.getByText(/Backspace/);
    const clearBtn = screen.getByText('Clear');

    expect(backspaceBtn).toBeDisabled();
    expect(clearBtn).toBeDisabled();
  });

  it('multiple wrong guesses track incorrect chars without ending game', async () => {
    render(<Daily />);
    await waitForGameReady();

    // First wrong guess
    await spellWord('tac');
    await waitFor(() => {
      const tiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(tiles).toHaveLength(3);
    });

    // Second wrong guess
    await spellWord('tac');
    await waitFor(() => {
      const tiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(tiles).toHaveLength(3);
    });

    // Game should still be active
    expect(screen.queryByText('daily complete')).not.toBeInTheDocument();

    // Can still solve correctly
    await spellWord('cat');
    await waitFor(() => {
      expect(screen.getByText('daily complete')).toBeInTheDocument();
    });
  });

  it('shows timer during gameplay', async () => {
    render(<Daily />);
    await waitForGameReady();

    // Timer should be visible with a "s" suffix
    const timerValue = document.querySelector('.timer-value');
    expect(timerValue).toBeInTheDocument();
    expect(timerValue?.textContent).toMatch(/\d+\.\d+s/);
  });
});
