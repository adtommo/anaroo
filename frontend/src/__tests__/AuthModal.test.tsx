import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '../components/AuthModal';
import { AuthProvider } from '../contexts/AuthContext';

// Mock api service
vi.mock('../services/api', () => ({
  apiService: {
    login: vi.fn().mockResolvedValue({
      user: { _id: '1', nickname: 'testuser', createdAt: new Date() },
      token: 'token123',
    }),
    register: vi.fn().mockResolvedValue({
      user: { _id: '2', nickname: 'newuser', createdAt: new Date() },
      token: 'token456',
    }),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('AuthModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form by default', () => {
    renderWithAuth(<AuthModal onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
  });

  it('switches between login and register', async () => {
    renderWithAuth(<AuthModal onClose={onClose} />);

    // Should start on Sign In
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();

    // Switch to Register
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

    // Switch back to Sign In
    await userEvent.click(screen.getByRole('button', { name: /already have an account/i }));
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('closes when overlay is clicked', async () => {
    renderWithAuth(<AuthModal onClose={onClose} />);

    const overlay = screen.getByRole('heading', { name: 'Sign In' }).closest('.modal-overlay')!;
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when X button is clicked', async () => {
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when modal content is clicked', async () => {
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.click(screen.getByLabelText('Nickname'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits login form', async () => {
    const { apiService } = await import('../services/api');
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Nickname'), 'testuser');
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(apiService.login).toHaveBeenCalledWith('testuser');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('submits register form', async () => {
    const { apiService } = await import('../services/api');
    renderWithAuth(<AuthModal onClose={onClose} />);

    // Switch to register
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    await userEvent.type(screen.getByLabelText('Nickname'), 'newuser');
    await userEvent.click(screen.getByRole('button', { name: /^register$/i }));

    await waitFor(() => {
      expect(apiService.register).toHaveBeenCalledWith('newuser');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error when login fails', async () => {
    const { apiService } = await import('../services/api');
    vi.mocked(apiService.login).mockRejectedValueOnce(new Error('User not found'));

    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Nickname'), 'baduser');
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('disables form while loading', async () => {
    const { apiService } = await import('../services/api');
    // Make login hang
    vi.mocked(apiService.login).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Nickname'), 'test');
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });
  });
});
