import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabase
const mockGetSession = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      updateUser: (data: any) => mockUpdateUser(data),
      signOut: () => mockSignOut(),
    },
  },
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const renderResetPassword = () => {
  return render(
    <BrowserRouter>
      <ResetPassword />
    </BrowserRouter>
  );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe('Loading State', () => {
    it('shows loading indicator while checking session', () => {
      mockGetSession.mockReturnValue(new Promise(() => {})); // Never resolves
      renderResetPassword();
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Invalid Session', () => {
    it('shows expired link message when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByText(/link expired/i)).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
    });

    it('navigates to auth when back button clicked', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const user = userEvent.setup();
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByText(/link expired/i)).toBeInTheDocument();
      });
      
      const backButton = screen.getByRole('button', { name: /back to sign in/i });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  describe('Valid Session - Form Rendering', () => {
    it('renders password reset form when session is valid', async () => {
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
      
      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Find toggle button (first one)
      const toggleButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg')
      );
      await user.click(toggleButtons[0]);
      
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Form Validation', () => {
    it('shows error for short password', async () => {
      const user = userEvent.setup();
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
      
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      await user.type(passwordInput, '123');
      await user.type(confirmInput, '123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for mismatched passwords', async () => {
      const user = userEvent.setup();
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
      
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'differentpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Reset', () => {
    it('updates password and shows success message', async () => {
      const user = userEvent.setup();
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
      
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/password reset complete/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when update fails', async () => {
      mockUpdateUser.mockResolvedValue({ error: { message: 'Update failed' } });
      const user = userEvent.setup();
      renderResetPassword();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
      
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          variant: 'destructive',
        }));
      });
    });
  });
});
