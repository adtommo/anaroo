import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimedMode } from '../components/TimedMode';
import { TimedDuration } from '@anaroo/shared';

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
