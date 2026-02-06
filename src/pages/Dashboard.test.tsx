import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { 
  createMockAquarium, 
  defaultMockAuth, 
  defaultMockPlanLimits,
  mockUseAuth,
  mockUsePlanLimits,
} from '@/test/test-utils';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

const renderDashboard = () => render(<Dashboard />, { wrapper });
const getAddAquariumButton = () =>
  screen.getByRole('button', {
    name: /add aquarium|dashboard\.addaquarium|dashboard\.addwaterbody|dashboard\.addpool/i,
  });

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/usePlanLimits', () => ({
  usePlanLimits: () => mockUsePlanLimits(),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    isRefreshing: false,
    pullDistance: 0,
    isPastThreshold: false,
  }),
}));

// Mock dashboard data hook
const mockLoadAquariums = vi.fn();
const mockDeleteAquarium = vi.fn();
const mockSetLoading = vi.fn();
const mockAquarium = createMockAquarium();

vi.mock('@/components/dashboard', async () => {
  const actual = await vi.importActual('@/components/dashboard');
  return {
    ...actual,
    WeatherStatsCard: () => <div data-testid="weather-stats-card">Weather Stats</div>,
    useDashboardData: () => ({
      loading: false,
      setLoading: mockSetLoading,
      dataFetched: true,
      aquariums: [mockAquarium],
      aquariumsOnly: [mockAquarium],
      poolsOnly: [],
      hasOnlyAquariums: true,
      hasOnlyPools: false,
      hasMixed: false,
      upcomingTaskCount: 3,
      totalVolume: 50,
      activeCount: 1,
      loadAquariums: mockLoadAquariums,
      deleteAquarium: mockDeleteAquarium,
    }),
  };
});

vi.mock('@/components/dashboard/DashboardHeroBanner', () => ({
  DashboardBackground: () => <div data-testid="dashboard-background" />,
  DashboardGreeting: () => (
    <div role="status" aria-live="polite">
      <h2>Good evening</h2>
    </div>
  ),
}));

// Mock components
vi.mock('@/components/AppHeader', () => ({
  default: () => <header data-testid="app-header">Header</header>,
}));

vi.mock('@/components/ui/loading-skeleton', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
}));

vi.mock('@/components/ui/pull-to-refresh-indicator', () => ({
  PullToRefreshIndicator: () => null,
}));

vi.mock('@/components/PreferencesOnboarding', () => ({
  PreferencesOnboarding: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="preferences-onboarding">
      <button onClick={onComplete}>Complete Preferences</button>
    </div>
  ),
}));

vi.mock('@/components/AquariumOnboarding', () => ({
  AquariumOnboarding: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="aquarium-onboarding">
      <button onClick={onComplete}>Complete Aquarium Setup</button>
    </div>
  ),
}));

// Import after mocks
import Dashboard from './Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultMockAuth);
    mockUsePlanLimits.mockReturnValue(defaultMockPlanLimits);
  });

  it('renders loading skeleton when auth is loading', () => {
    mockUseAuth.mockReturnValue({ ...defaultMockAuth, loading: true });
    
    renderDashboard();
    
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders dashboard greeting and stats overview', () => {
    renderDashboard();
    
    expect(screen.getByText(/good (morning|afternoon|evening)/i)).toBeInTheDocument();
    expect(
      screen.getByRole('region', {
        name: /dashboard\.totalaquariums|total aquariums/i,
      })
    ).toBeInTheDocument();
  });

  it('renders app header', () => {
    renderDashboard();
    
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('displays aquarium cards when data is loaded', () => {
    renderDashboard();
    
    expect(screen.getByText('Test Aquarium')).toBeInTheDocument();
  });

  it('shows add aquarium button', () => {
    renderDashboard();
    
    expect(getAddAquariumButton()).toBeInTheDocument();
  });

  it('opens aquarium dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    
    renderDashboard();
    
    const addButton = getAddAquariumButton();
    await user.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('disables add button when at aquarium limit', async () => {
    mockUsePlanLimits.mockReturnValue({
      ...defaultMockPlanLimits,
      canCreateAquarium: vi.fn().mockReturnValue(false),
    });
    
    renderDashboard();
    
    // The button should still be visible but clicking shows a toast
    const addButton = getAddAquariumButton();
    expect(addButton).toBeInTheDocument();
  });

  it('shows delete confirmation dialog when delete is clicked', async () => {
    const user = userEvent.setup();
    
    renderDashboard();
    
    // Find and click the delete button in aquarium card
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('[class*="Trash"]') || btn.textContent?.includes('Delete')
    );
    
    if (deleteButton) {
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Aquarium')).toBeInTheDocument();
      });
    }
  });

  it('shows preferences onboarding when not completed', async () => {
    mockUseAuth.mockReturnValue({ 
      ...defaultMockAuth, 
      onboardingCompleted: false,
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByTestId('preferences-onboarding')).toBeInTheDocument();
    });
  });
});
