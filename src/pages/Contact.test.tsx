import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Contact from './Contact';

// Mock useRateLimit
vi.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    checkRateLimit: vi.fn().mockReturnValue(true),
    getRemainingAttempts: vi.fn().mockReturnValue(5),
  }),
}));

// Mock supabase
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
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

// Mock Navbar and Footer
vi.mock('@/components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

const renderContact = () => {
  return render(
    <BrowserRouter>
      <Contact />
    </BrowserRouter>
  );
};

describe('Contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ error: null });
  });

  describe('Page Rendering', () => {
    it('renders contact page with title', () => {
      renderContact();
      
      expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();
    });

    it('renders navbar and footer', () => {
      renderContact();
      
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders contact form', () => {
      renderContact();
      
      expect(screen.getByLabelText(/inquiry type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });

  describe('Inquiry Type Select', () => {
    it('has inquiry type options', async () => {
      const user = userEvent.setup();
      renderContact();
      
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      
      expect(screen.getByRole('option', { name: /general inquiry/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /partnership/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /business/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error for empty name', async () => {
      const user = userEvent.setup();
      renderContact();
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email', async () => {
      const user = userEvent.setup();
      renderContact();
      
      const nameInput = screen.getByLabelText(/your name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty message', async () => {
      const user = userEvent.setup();
      renderContact();
      
      const nameInput = screen.getByLabelText(/your name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/message is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      renderContact();
      
      const nameInput = screen.getByLabelText(/your name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(subjectInput, 'Test Subject');
      await user.type(messageInput, 'This is a test message that is long enough.');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('submit-contact', expect.objectContaining({
          body: expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
          }),
        }));
      });
    });

    it('shows success message after submission', async () => {
      const user = userEvent.setup();
      renderContact();
      
      const nameInput = screen.getByLabelText(/your name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(subjectInput, 'Test Subject');
      await user.type(messageInput, 'This is a test message that is long enough.');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/message sent/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when submission fails', async () => {
      mockInvoke.mockResolvedValue({ error: { message: 'Submission failed' } });
      const user = userEvent.setup();
      renderContact();
      
      const nameInput = screen.getByLabelText(/your name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(subjectInput, 'Test Subject');
      await user.type(messageInput, 'This is a test message that is long enough.');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          variant: 'destructive',
        }));
      });
    });
  });

  describe('Contact Info Sidebar', () => {
    it('displays contact email addresses', () => {
      renderContact();
      
      expect(screen.getByText(/info@allybywaiter.com/i)).toBeInTheDocument();
    });

    it('displays response time info', () => {
      renderContact();
      
      expect(screen.getByText(/24.*48.*hours/i)).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('shows success view after submission', async () => {
      const user = userEvent.setup();
      renderContact();
      
      const nameInput = screen.getByLabelText(/your name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const subjectInput = screen.getByLabelText(/subject/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(subjectInput, 'Test Subject');
      await user.type(messageInput, 'This is a test message that is long enough.');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/message sent/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
      });
    });
  });
});
