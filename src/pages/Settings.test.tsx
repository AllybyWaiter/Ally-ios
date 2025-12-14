import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from './Settings';

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
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },
    userName: 'Test User',
    subscriptionTier: 'plus',
    unitPreference: 'imperial',
    themePreference: 'dark',
    languagePreference: 'en',
    hemisphere: 'northern',
    signOut: vi.fn(),
    loading: false,
  })),
}));

// Mock supabase
const mockUpdate = vi.fn().mockReturnValue({ error: null });
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { skill_level: 'beginner' } }),
      update: vi.fn().mockReturnThis(),
    })),
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock MemoryManager
vi.mock('@/components/settings/MemoryManager', () => ({
  default: () => <div data-testid="memory-manager">Memory Manager</div>,
}));

// Mock WeatherSettings
vi.mock('@/components/settings/WeatherSettings', () => ({
  WeatherSettings: () => <div data-testid="weather-settings">Weather Settings</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderSettings = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders settings page with title', () => {
      renderSettings();
      
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    });

    it('renders all tabs', () => {
      renderSettings();
      
      expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /memory/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /theme/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /language/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /units/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /plan/i })).toBeInTheDocument();
    });

    it('renders back button that navigates to dashboard', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Profile Tab', () => {
    it('renders profile form with user email', () => {
      renderSettings();
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveValue('test@example.com');
      expect(emailInput).toBeDisabled();
    });

    it('renders display name input', () => {
      renderSettings();
      
      const nameInput = screen.getByLabelText(/display name/i);
      expect(nameInput).toHaveValue('Test User');
    });

    it('renders skill level options', () => {
      renderSettings();
      
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('has save changes button', () => {
      renderSettings();
      
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Memory Tab', () => {
    it('renders memory manager component', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      const memoryTab = screen.getByRole('tab', { name: /memory/i });
      await user.click(memoryTab);
      
      expect(screen.getByTestId('memory-manager')).toBeInTheDocument();
    });
  });

  describe('Theme Tab', () => {
    it('switches to theme tab and shows theme options', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      const themeTab = screen.getByRole('tab', { name: /theme/i });
      await user.click(themeTab);
      
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  describe('Language Tab', () => {
    it('switches to language tab and shows language options', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      const langTab = screen.getByRole('tab', { name: /language/i });
      await user.click(langTab);
      
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
    });
  });

  describe('Units Tab', () => {
    it('switches to units tab and shows unit options', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      const unitsTab = screen.getByRole('tab', { name: /units/i });
      await user.click(unitsTab);
      
      expect(screen.getByText(/imperial/i)).toBeInTheDocument();
      expect(screen.getByText(/metric/i)).toBeInTheDocument();
    });
  });

  describe('Security Tab', () => {
    it('switches to security tab and shows password form', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      const securityTab = screen.getByRole('tab', { name: /security/i });
      await user.click(securityTab);
      
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });
  });

  describe('Plan Tab', () => {
    it('switches to plan tab and shows subscription info', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      const planTab = screen.getByRole('tab', { name: /plan/i });
      await user.click(planTab);
      
      expect(screen.getByText(/current plan/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('can navigate between tabs', async () => {
      const user = userEvent.setup();
      renderSettings();
      
      // Start at profile (default)
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      
      // Go to theme
      await user.click(screen.getByRole('tab', { name: /theme/i }));
      expect(screen.getByText('Light')).toBeInTheDocument();
      
      // Go to security
      await user.click(screen.getByRole('tab', { name: /security/i }));
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      
      // Go back to profile
      await user.click(screen.getByRole('tab', { name: /profile/i }));
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
  });
});
