import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from './Settings';

const mockNavigate = vi.fn();
const mockSetTheme = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
    refreshProfile: vi.fn(),
    loading: false,
    isAdmin: false,
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { skill_level: 'beginner', weather_enabled: false }, error: null }),
      single: vi.fn().mockResolvedValue({ data: { skill_level: 'beginner', weather_enabled: false }, error: null }),
      update: vi.fn().mockReturnThis(),
    })),
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: mockSetTheme,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('@/components/settings/MemoryManager', () => ({
  default: () => <div data-testid="memory-manager">Memory Manager</div>,
}));

vi.mock('@/components/settings/WeatherSettings', () => ({
  WeatherSettings: () => <div data-testid="weather-settings">Weather Settings</div>,
}));

vi.mock('@/hooks/useRevenueCat', () => ({
  useRevenueCat: () => ({
    isNative: false,
    isPro: true,
    subscriptionTier: 'plus',
    restore: vi.fn(),
    showCustomerCenter: vi.fn(),
    showPaywall: vi.fn(),
    refreshCustomerInfo: vi.fn(),
    isLoading: false,
  }),
}));

const renderSettings = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

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

  it('renders settings page with account details', () => {
    renderSettings();

    expect(screen.getByText(/test user/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('renders primary settings sections', async () => {
    renderSettings();

    await screen.findByRole('button', { name: /security/i });
    expect(screen.getByRole('button', { name: /subscription/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /language & region/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /units/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /weather settings/i })).toBeInTheDocument();
  });

  it('navigates back to dashboard', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: /^back$/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
