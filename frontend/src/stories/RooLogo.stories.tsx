import type { Meta, StoryObj } from '@storybook/react';
import { RooLogo } from '../components/RooLogo';

const meta = {
  title: 'Components/RooLogo',
  component: RooLogo,
  args: {
    colour: '#60A5FA',
  },
} satisfies Meta<typeof RooLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Red: Story = {
  args: { colour: '#EF4444' },
};

export const Green: Story = {
  args: { colour: '#10B981' },
};

export const White: Story = {
  args: { colour: '#FFFFFF' },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
