import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '../components/AuthModal';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Mock api service
vi.mock('../services/api', () => ({
  apiService: {
    getMe: vi.fn().mockResolvedValue({
      _id: '1',
      nickname: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
    }),
    setToken: vi.fn(),
    getToken: vi.fn().mockReturnValue(null),
    clearToken: vi.fn(),
  },
}));

// Wrap with AuthProvider since AuthModal uses useAuth
import { AuthProvider } from '../contexts/AuthContext';

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('AuthModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders sign in form by default', () => {
    renderWithAuth(<AuthModal onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows OAuth buttons', () => {
    renderWithAuth(<AuthModal onClose={onClose} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });

  it('switches between sign in and create account', async () => {
    renderWithAuth(<AuthModal onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();

    // Switch to Create Account
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();

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

    await userEvent.click(screen.getByLabelText('Email'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits sign in form', async () => {
    const { supabase } = await import('../lib/supabase');
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('closes modal after sign up (auto-login)', async () => {
    const { supabase } = await import('../lib/supabase');
    renderWithAuth(<AuthModal onClose={onClose} />);

    // Switch to register
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /^create account$/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: { data: { nickname: 'new' } },
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('sends nickname in sign up when provided', async () => {
    const { supabase } = await import('../lib/supabase');
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('Nickname'), 'coolname');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /^create account$/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: { data: { nickname: 'coolname' } },
      });
    });
  });

  it('shows error when sign in fails', async () => {
    const { supabase } = await import('../lib/supabase');
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
    } as any);

    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Email'), 'bad@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'different');
    await userEvent.click(screen.getByRole('button', { name: /^create account$/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('disables form while loading', async () => {
    const { supabase } = await import('../lib/supabase');
    // Make sign in hang
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });
  });

  it('calls Google OAuth when clicking Google button', async () => {
    const { supabase } = await import('../lib/supabase');
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.click(screen.getByText('Continue with Google'));

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google' });
  });

  it('calls GitHub OAuth when clicking GitHub button', async () => {
    const { supabase } = await import('../lib/supabase');
    renderWithAuth(<AuthModal onClose={onClose} />);

    await userEvent.click(screen.getByText('Continue with GitHub'));

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'github' });
  });

  it('toggles password visibility', async () => {
    renderWithAuth(<AuthModal onClose={onClose} />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText('Show password');
    await userEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Hide password'));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
