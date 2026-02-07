import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ModePicker } from '../components/ModePicker';
import { GameMode, TimedDuration } from '@anaroo/shared';

const meta = {
  title: 'Components/ModePicker',
  component: ModePicker,
  args: {
    selectedMode: GameMode.TIMED,
    selectedDuration: TimedDuration.SIXTY,
    onModeChange: fn(),
    onDurationChange: fn(),
  },
} satisfies Meta<typeof ModePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimedMode: Story = {};

export const DailySelected: Story = {
  args: {
    selectedMode: GameMode.DAILY,
  },
};

export const InfiniteSurvivalSelected: Story = {
  args: {
    selectedMode: GameMode.INFINITE_SURVIVAL,
  },
};

export const ThirtySecondDuration: Story = {
  args: {
    selectedDuration: TimedDuration.THIRTY,
  },
};

export const TwoMinuteDuration: Story = {
  args: {
    selectedDuration: TimedDuration.ONE_TWENTY,
  },
};
