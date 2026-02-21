import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within } from 'storybook/test';
import { AuthModal } from '../components/AuthModal';
import { AuthProvider } from '../contexts/AuthContext';

const meta = {
  title: 'Components/AuthModal',
  component: AuthModal,
  decorators: [
    (Story) => (
      <AuthProvider>
        <Story />
      </AuthProvider>
    ),
  ],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof AuthModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoginView: Story = {};

export const RegisterView: Story = {
  name: 'Register View',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Click the register link to switch to register view
    const registerLink = await canvas.findByText(/create an account/i);
    await userEvent.click(registerLink);
  },
};
