import type { Meta, StoryObj } from '@storybook/react';
import { Leaderboard } from '../components/Leaderboard';
import { GameMode } from '@anaroo/shared';
import { http, HttpResponse, delay } from 'msw';
import { mockLeaderboardEntries } from '../mocks/data';

const meta = {
  title: 'Components/Leaderboard',
  component: Leaderboard,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/leaderboard/daily', async () => {
          await delay(100);
          return HttpResponse.json(mockLeaderboardEntries);
        }),
        http.get('/api/leaderboard/global', async () => {
          await delay(100);
          return HttpResponse.json(mockLeaderboardEntries);
        }),
      ],
    },
  },
} satisfies Meta<typeof Leaderboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DailyTimedLeaderboard: Story = {
  args: {
    mode: GameMode.TIMED,
    type: 'daily',
  },
};

export const GlobalTimedLeaderboard: Story = {
  args: {
    mode: GameMode.TIMED,
    type: 'global',
  },
};

export const DailyLeaderboard: Story = {
  args: {
    mode: GameMode.DAILY,
    type: 'daily',
  },
};

export const SurvivalLeaderboard: Story = {
  args: {
    mode: GameMode.INFINITE_SURVIVAL,
    type: 'global',
  },
};

// Story showing loading state
export const Loading: Story = {
  args: {
    mode: GameMode.TIMED,
    type: 'daily',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/leaderboard/daily', async () => {
          await delay(10000); // Long delay to show loading
          return HttpResponse.json(mockLeaderboardEntries);
        }),
      ],
    },
  },
};

// Story showing empty state
export const Empty: Story = {
  args: {
    mode: GameMode.TIMED,
    type: 'daily',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/leaderboard/daily', async () => {
          await delay(100);
          return HttpResponse.json([]);
        }),
      ],
    },
  },
};

// Story showing error state
export const Error: Story = {
  args: {
    mode: GameMode.TIMED,
    type: 'daily',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/leaderboard/daily', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        }),
      ],
    },
  },
};
