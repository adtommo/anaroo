import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Leaderboard } from '../components/Leaderboard';
import { GameMode, TimedDuration } from '@anaroo/shared';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

vi.mock('../services/api', () => ({
  apiService: {
    getDailyLeaderboard: vi.fn().mockResolvedValue([
      { userId: '1', nickname: 'Alice', score: 5000, rank: 1 },
      { userId: '2', nickname: 'Bob', score: 4000, rank: 2 },
      { userId: '3', nickname: 'Charlie', score: 3000, rank: 3 },
      { userId: '4', nickname: 'Dave', score: 2000, rank: 4 },
    ]),
    getGlobalLeaderboard: vi.fn().mockResolvedValue([
      { userId: '1', nickname: 'Alice', score: 5000, rank: 1 },
      { userId: '2', nickname: 'Bob', score: 4000, rank: 2 },
      { userId: '3', nickname: 'Charlie', score: 3000, rank: 3 },
      { userId: '4', nickname: 'Dave', score: 2000, rank: 4 },
    ]),
  },
}));

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    renderWithRouter(<Leaderboard mode={GameMode.TIMED} type="daily" />);
    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
    // Wait for async updates to complete to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText('Loading leaderboard...')).not.toBeInTheDocument();
    });
  });

  it('renders daily leaderboard entries', async () => {
    renderWithRouter(<Leaderboard mode={GameMode.TIMED} type="daily" />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Dave')).toBeInTheDocument();
    });
  });

  it('renders rank numbers for entries', async () => {
    renderWithRouter(<Leaderboard mode={GameMode.TIMED} type="daily" />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('renders table with score column header', async () => {
    renderWithRouter(<Leaderboard mode={GameMode.TIMED} type="daily" />);

    await waitFor(() => {
      expect(screen.getByText('score')).toBeInTheDocument();
    });
  });

  it('shows empty state when no entries', async () => {
    const { apiService } = await import('../services/api');
    vi.mocked(apiService.getDailyLeaderboard).mockResolvedValueOnce([]);

    renderWithRouter(<Leaderboard mode={GameMode.TIMED} type="daily" />);

    await waitFor(() => {
      expect(screen.getByText('No scores yet. Be the first!')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    const { apiService } = await import('../services/api');
    vi.mocked(apiService.getDailyLeaderboard).mockRejectedValueOnce(
      new Error('Network error')
    );

    renderWithRouter(<Leaderboard mode={GameMode.TIMED} type="daily" />);

    await waitFor(() => {
      expect(screen.getByText(/Error.*Network error/)).toBeInTheDocument();
    });
  });

  it('reloads when mode prop changes', async () => {
    const { apiService } = await import('../services/api');
    const { rerender } = render(
      <MemoryRouter>
        <Leaderboard mode={GameMode.TIMED} type="daily" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiService.getDailyLeaderboard).toHaveBeenCalledWith(GameMode.TIMED, 50, undefined);
    });

    rerender(
      <MemoryRouter>
        <Leaderboard mode={GameMode.DAILY} type="daily" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiService.getDailyLeaderboard).toHaveBeenCalledWith(GameMode.DAILY, 50, undefined);
    });
  });

  it('displays formatted scores', async () => {
    renderWithRouter(<Leaderboard mode={GameMode.TIMED} type="daily" />);

    await waitFor(() => {
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });
  });

  it('passes timedDuration to API for timed mode', async () => {
    const { apiService } = await import('../services/api');

    renderWithRouter(
      <Leaderboard mode={GameMode.TIMED} type="global" timedDuration={TimedDuration.THIRTY} />
    );

    await waitFor(() => {
      expect(apiService.getGlobalLeaderboard).toHaveBeenCalledWith(GameMode.TIMED, 50, TimedDuration.THIRTY);
    });
  });

  it('shows time instead of score for daily mode', async () => {
    const { apiService } = await import('../services/api');
    vi.mocked(apiService.getDailyLeaderboard).mockResolvedValueOnce([
      { userId: '1', nickname: 'FastPlayer', score: 0, rank: 1, timeElapsed: 12.5 },
    ]);

    renderWithRouter(<Leaderboard mode={GameMode.DAILY} type="daily" />);

    await waitFor(() => {
      expect(screen.getByText('12.5s')).toBeInTheDocument();
      expect(screen.getByText('time')).toBeInTheDocument();
    });
  });
});
