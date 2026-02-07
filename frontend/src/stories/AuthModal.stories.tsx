import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within } from 'storybook/test';
import { AuthModal } from '../components/AuthModal';
import { AuthProvider } from '../contexts/AuthContext';
import { http, HttpResponse, delay } from 'msw';
import { mockUser, mockToken } from '../mocks/data';

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
  parameters: {
    msw: {
      handlers: [
        http.post('/api/auth/login', async ({ request }) => {
          await delay(200);
          const body = await request.json() as { nickname: string };
          return HttpResponse.json({
            user: { ...mockUser, nickname: body.nickname },
            token: mockToken,
          });
        }),
        http.post('/api/auth/register', async ({ request }) => {
          await delay(200);
          const body = await request.json() as { nickname: string };
          return HttpResponse.json({
            user: { ...mockUser, nickname: body.nickname },
            token: mockToken,
          }, { status: 201 });
        }),
      ],
    },
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

// Story showing login error
export const LoginError: Story = {
  name: 'Login Error',
  parameters: {
    msw: {
      handlers: [
        http.post('/api/auth/login', async () => {
          await delay(200);
          return HttpResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }),
      ],
    },
  },
};

// Story showing registration with duplicate nickname
export const RegisterDuplicateNickname: Story = {
  name: 'Register - Duplicate Nickname',
  parameters: {
    msw: {
      handlers: [
        http.post('/api/auth/register', async () => {
          await delay(200);
          return HttpResponse.json(
            { error: 'Nickname already taken' },
            { status: 409 }
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const registerLink = await canvas.findByText(/create an account/i);
    await userEvent.click(registerLink);
  },
};
