import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimedMode } from '../components/TimedMode';
import { TimedDuration } from '@anaroo/shared';

vi.mock('../services/api', () => {
  const word = { seed: 'test-seed', scrambled: 'tac', answers: ['cat'] };
  return {
    apiService: {
      getWordPick: vi.fn().mockResolvedValue(word),
      getWordPicks: vi.fn().mockResolvedValue({
        words: Array.from({ length: 20 }, () => word),
      }),
      submitScore: vi.fn().mockResolvedValue({
        success: true,
        run: {
          _id: 'run-1',
          userId: 'user-1',
          mode: 'timed',
          score: 100,
          accuracy: 100,
          wpm: 50,
          rawWpm: 50,
          correctChars: 3,
          incorrectChars: 0,
          timeElapsed: 5,
          seed: 'test-seed',
          comboStreak: 1,
          createdAt: new Date(),
        },
        isPersonalBest: false,
      }),
    },
  };
});

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
    expect(screen.queryByText('Loading game...')).not.toBeInTheDocument();
  });
}

describe('TimedMode - Game Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state then shows letter tiles', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    expect(screen.getByText('Loading game...')).toBeInTheDocument();

    await waitForGameReady();

    const tiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile')
    );
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toHaveTextContent('t');
    expect(tiles[1]).toHaveTextContent('a');
    expect(tiles[2]).toHaveTextContent('c');
  });

  it('clicking a letter adds it to the guess row', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    await clickLetter('c');

    const guessSlots = document.querySelectorAll('.guess-slot');
    expect(guessSlots[0]).toHaveTextContent('c');
  });

  it('solving a word correctly increases the word count', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    expect(screen.getByText('Words: 0')).toBeInTheDocument();

    await spellWord('cat');

    await waitFor(() => {
      expect(screen.getByText('Words: 1')).toBeInTheDocument();
    });
  });

  it('solving multiple words increases combo and count', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    await spellWord('cat');
    await waitFor(() => expect(screen.getByText('Words: 1')).toBeInTheDocument());

    await spellWord('cat');
    await waitFor(() => {
      expect(screen.getByText('Words: 2')).toBeInTheDocument();
      expect(screen.getByText('Combo: 2')).toBeInTheDocument();
    });
  });

  it('incorrect guess resets input and breaks combo', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    // Solve one correctly first
    await spellWord('cat');
    await waitFor(() => expect(screen.getByText('Combo: 1')).toBeInTheDocument());

    // Spell wrong: "tac" ≠ "cat"
    await spellWord('tac');

    await waitFor(() => {
      expect(screen.getByText('Combo: 0')).toBeInTheDocument();
      expect(screen.getByText('Words: 1')).toBeInTheDocument();
    });
  });

  it('backspace removes the last selected letter', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
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

describe('TimedMode - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking an already-selected tile does nothing', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    await clickLetter('t');

    const allTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile')
    ) as HTMLButtonElement[];
    const tTile = allTiles[0];
    expect(tTile).toBeDisabled();

    // Click the disabled tile again
    await userEvent.click(tTile);

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });

  it('keyboard: pressing already-used letter key is a no-op', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    // Use the 't' tile
    await clickLetter('t');

    // Press 't' again via keyboard - only one 't' exists
    await userEvent.keyboard('t');

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });

  it('keyboard: non-letter keys are ignored', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    await userEvent.keyboard('123!@#');

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(0);
  });

  it('keyboard Backspace removes last letter', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
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
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    await clickLetter('c');
    await clickLetter('a');

    await userEvent.click(screen.getByText('Clear'));

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(0);
  });

  it('backspace and clear are disabled with no letters selected', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    expect(screen.getByText(/Backspace/)).toBeDisabled();
    expect(screen.getByText('Clear')).toBeDisabled();
  });

  it('wrong guess does not advance word index but resets input', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    expect(screen.getByText('Words: 0')).toBeInTheDocument();

    await spellWord('tac');

    // Words count should still be 0
    await waitFor(() => {
      expect(screen.getByText('Words: 0')).toBeInTheDocument();
    });

    // Input should be cleared - all tiles available again
    const availableTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
    );
    expect(availableTiles).toHaveLength(3);
  });

  it('multiple wrong guesses followed by correct solve', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    // Two wrong guesses
    await spellWord('tac');
    await waitFor(() => {
      const tiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(tiles).toHaveLength(3);
    });

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
      expect(screen.getByText('Words: 1')).toBeInTheDocument();
    });
  });

  it('shows word count and combo in game header', async () => {
    render(<TimedMode duration={TimedDuration.THIRTY} language="en" difficulty="easy" />);
    await waitForGameReady();

    expect(screen.getByText('Words: 0')).toBeInTheDocument();
    expect(screen.getByText('Combo: 0')).toBeInTheDocument();
  });
});
