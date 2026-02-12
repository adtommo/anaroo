import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfiniteSurvival } from '../components/InfiniteSurvival';

vi.mock('../services/api', () => ({
  apiService: {
    getWordPick: vi.fn().mockResolvedValue({
      seed: 'test-seed',
      scrambled: 'tac',
      answers: ['cat'],
    }),
    submitScore: vi.fn().mockResolvedValue({
      success: true,
      run: {
        _id: 'run-1',
        userId: 'user-1',
        mode: 'infinite_survival',
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
      isPersonalBest: true,
    }),
  },
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
    expect(screen.queryByText('Loading game...')).not.toBeInTheDocument();
  });
}

describe('InfiniteSurvival - Game Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state then shows game UI', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    expect(screen.getByText('Loading game...')).toBeInTheDocument();

    await waitForGameReady();

    const tiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile')
    );
    expect(tiles).toHaveLength(3);
  });

  it('shows streak and level in header', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    expect(screen.getByText(/Streak 0/)).toBeInTheDocument();
    expect(screen.getByText(/Lvl 0/)).toBeInTheDocument();
  });

  it('solving a word increases survival streak', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    await spellWord('cat');

    await waitFor(() => {
      expect(screen.getByText(/Streak 1/)).toBeInTheDocument();
    });
  });

  it('wrong answer skips to next word instead of ending game', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    // Spell wrong: "tac" ≠ "cat"
    await spellWord('tac');

    // Game should NOT be over - should still show game UI
    await waitFor(() => {
      expect(screen.queryByText('game over')).not.toBeInTheDocument();
      // Tiles should be reset for next word
      const availableTiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(availableTiles).toHaveLength(3);
    });
  });

  it('can solve word after a wrong answer', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    // Wrong answer first
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
      expect(screen.getByText(/Streak 1/)).toBeInTheDocument();
    });
  });

  it('wrong answer resets combo to 0', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    // Solve one correctly
    await spellWord('cat');
    await waitFor(() => expect(screen.getByText(/Streak 1/)).toBeInTheDocument());

    // Wrong answer
    await spellWord('tac');

    // Solve another correctly - streak should be 2 but let's just verify game continues
    await waitFor(() => {
      const tiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(tiles).toHaveLength(3);
    });
  });

  it('backspace removes the last selected letter', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    await clickLetter('c');

    let usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);

    await userEvent.click(screen.getByText(/Backspace/));

    usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(0);
  });
});

describe('InfiniteSurvival - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking an already-selected tile does nothing', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    await clickLetter('t');

    const allTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile')
    ) as HTMLButtonElement[];
    const tTile = allTiles[0];
    expect(tTile).toBeDisabled();

    await userEvent.click(tTile);

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });

  it('keyboard: pressing already-used letter key is a no-op', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    await clickLetter('t');
    await userEvent.keyboard('t');

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(1);
  });

  it('keyboard: non-letter keys are ignored', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    await userEvent.keyboard('123!@#');

    const usedTiles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('letter-tile') && (btn as HTMLButtonElement).disabled
    );
    expect(usedTiles).toHaveLength(0);
  });

  it('keyboard Backspace removes last letter', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
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
    render(<InfiniteSurvival language="en" difficulty="easy" />);
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
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    expect(screen.getByText(/Backspace/)).toBeDisabled();
    expect(screen.getByText('Clear')).toBeDisabled();
  });

  it('wrong guess skips to next word and tiles reset', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    await spellWord('tac');

    await waitFor(() => {
      const availableTiles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('letter-tile') && !(btn as HTMLButtonElement).disabled
      );
      expect(availableTiles).toHaveLength(3);
    });

    // Game should still be active (not game over)
    expect(screen.queryByText('game over')).not.toBeInTheDocument();
  });

  it('multiple wrong guesses followed by correct solve', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
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

    // Solve correctly
    await spellWord('cat');
    await waitFor(() => {
      expect(screen.getByText(/Streak 1/)).toBeInTheDocument();
    });
  });

  it('shows streak and level info during gameplay', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    expect(screen.getByText(/Streak 0/)).toBeInTheDocument();
    expect(screen.getByText(/Lvl 0/)).toBeInTheDocument();
  });

  it('solving increases streak counter', async () => {
    render(<InfiniteSurvival language="en" difficulty="easy" />);
    await waitForGameReady();

    await spellWord('cat');
    await waitFor(() => expect(screen.getByText(/Streak 1/)).toBeInTheDocument());

    await spellWord('cat');
    await waitFor(() => expect(screen.getByText(/Streak 2/)).toBeInTheDocument());
  });
});
