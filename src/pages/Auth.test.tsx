import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Auth from './Auth';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    signIn: mockSignIn,
    signUp: mockSignUp,
    loading: false,
  })),
}));

// Mock useRateLimit
vi.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    checkRateLimit: vi.fn().mockReturnValue(true),
    getRemainingAttempts: vi.fn().mockReturnValue(5),
  }),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAuth = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSignIn.mockClear();
    mockSignUp.mockClear();
  });

  describe('Login View', () => {
    it('renders login form by default', () => {
      renderAuth();
      
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for short password', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('calls signIn with correct credentials', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      renderAuth();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      const toggleButton = screen.getByRole('button', { name: '' });
      await user.click(toggleButton);
      
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Signup View', () => {
    it('switches to signup view when link is clicked', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      const signupLink = screen.getByText(/create an account/i);
      await user.click(signupLink);
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('validates password confirmation match', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      // Switch to signup
      const signupLink = screen.getByText(/create an account/i);
      await user.click(signupLink);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'differentpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('calls signUp with correct data', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      renderAuth();
      
      // Switch to signup
      const signupLink = screen.getByText(/create an account/i);
      await user.click(signupLink);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      });
    });
  });

  describe('Forgot Password View', () => {
    it('switches to forgot password view', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      const forgotLink = screen.getByText(/forgot password/i);
      await user.click(forgotLink);
      
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('shows back to sign in link in forgot password view', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      const forgotLink = screen.getByText(/forgot password/i);
      await user.click(forgotLink);
      
      const backLink = screen.getByText(/back to sign in/i);
      expect(backLink).toBeInTheDocument();
      
      await user.click(backLink);
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Navigation between views', () => {
    it('can navigate from login to signup and back', async () => {
      const user = userEvent.setup();
      renderAuth();
      
      // Start at login
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      
      // Go to signup
      await user.click(screen.getByText(/create an account/i));
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      
      // Go back to login
      await user.click(screen.getByText(/already have an account/i));
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});
