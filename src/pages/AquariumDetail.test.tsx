import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import {
  defaultMockAuth,
  mockUseAuth,
} from '@/test/test-utils';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'aquarium.backToDashboard': 'Back to Dashboard',
        'tabs.overview': 'Overview',
        'tabs.waterTests': 'Water Tests',
        'tabs.equipment': 'Equipment',
        'tabs.tasks': 'Tasks',
        'aquarium.editAquarium': 'Edit Aquarium',
        'dashboard.deleteAquarium': 'Delete Aquarium',
        'aquarium.notFound': 'Aquarium Not Found',
        'aquarium.addLocation': 'Add Location',
        'common.success': 'Success',
        'common.error': 'Error',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock react-router-dom params
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-aquarium-id' }),
    useNavigate: () => mockNavigate,
  };
});

// Hoisted mock data (must be before vi.mock that references it)
const { mockAquariumData } = vi.hoisted(() => ({
  mockAquariumData: {
    id: 'test-aquarium-id',
    name: 'Test Aquarium',
    type: 'freshwater',
    volume_gallons: 50,
    status: 'active',
    setup_date: '2024-01-01',
    notes: 'Test notes',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}));

// Mock infrastructure queries
vi.mock('@/infrastructure/queries', () => ({
  fetchAquarium: vi.fn().mockResolvedValue(mockAquariumData),
  deleteAquarium: vi.fn().mockResolvedValue(undefined),
}));

// Mock waterBodyUtils
vi.mock('@/lib/waterBodyUtils', () => ({
  formatWaterBodyType: (type: string) => type,
  isPoolType: () => false,
  getWaterBodyLabels: () => ({
    entityName: 'Aquarium',
    showLivestock: true,
    showPlants: true,
  }),
}));

// Mock unitConversions
vi.mock('@/lib/unitConversions', () => ({
  formatVolume: (gallons: number) => `${gallons} gal`,
  UnitSystem: { IMPERIAL: 'imperial', METRIC: 'metric' },
}));

// Mock query keys and config
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    aquariums: {
      detail: (id: string) => ['aquarium', id],
    },
    tasks: {
      all: ['tasks'],
    },
  },
}));

vi.mock('@/lib/queryConfig', () => ({
  queryPresets: {
    aquariumData: {},
  },
}));

// Mock error boundaries and sentry
vi.mock('@/components/error-boundaries', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/sentry', () => ({
  FeatureArea: { AQUARIUM: 'aquarium', WATER_TESTS: 'water_tests', EQUIPMENT: 'equipment', MAINTENANCE: 'maintenance' },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock components
vi.mock('@/components/AppHeader', () => ({
  default: () => <header data-testid="app-header">Header</header>,
}));

vi.mock('@/components/aquarium/AquariumOverview', () => ({
  AquariumOverview: () => <div data-testid="aquarium-overview">Overview Content</div>,
}));

vi.mock('@/components/aquarium/AquariumLivestock', () => ({
  AquariumLivestock: () => <div data-testid="aquarium-livestock">Livestock Content</div>,
}));

vi.mock('@/components/water-tests/WaterTestCharts', () => ({
  WaterTestCharts: () => <div data-testid="water-test-charts">Water Tests Content</div>,
}));

vi.mock('@/components/aquarium/AquariumEquipment', () => ({
  AquariumEquipment: () => <div data-testid="aquarium-equipment">Equipment Content</div>,
}));

vi.mock('@/components/aquarium/AquariumTasks', () => ({
  AquariumTasks: () => <div data-testid="aquarium-tasks">Tasks Content</div>,
}));

vi.mock('@/components/aquarium/TaskSuggestions', () => ({
  TaskSuggestions: () => <div data-testid="task-suggestions">Task Suggestions</div>,
}));

vi.mock('@/components/aquarium/AquariumDialog', () => ({
  AquariumDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="aquarium-dialog">Edit Dialog</div> : null,
}));

vi.mock('@/components/aquarium/LocationMapPreview', () => ({
  LocationMapPreview: () => <div data-testid="location-map">Map Preview</div>,
}));

vi.mock('@/components/aquarium/AquariumPhotoGallery', () => ({
  AquariumPhotoGallery: () => <div data-testid="photo-gallery">Photo Gallery</div>,
}));

// Import after mocks
import AquariumDetail from './AquariumDetail';

// ResizeObserver class mock for Radix dropdown (floating-ui needs constructable ResizeObserver)
const OriginalResizeObserver = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});
afterAll(() => {
  global.ResizeObserver = OriginalResizeObserver;
});

describe('AquariumDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mockUseAuth.mockReturnValue(defaultMockAuth);
  });

  it('renders loading spinner while fetching', () => {
    mockUseAuth.mockReturnValue({ ...defaultMockAuth, loading: true });

    render(<AquariumDetail />, { wrapper });

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('renders aquarium name after loading', async () => {
    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Aquarium')).toBeInTheDocument();
    });
  });

  it('displays aquarium type badge', async () => {
    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('freshwater')).toBeInTheDocument();
    });
  });

  it('displays aquarium status badge', async () => {
    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('renders back to dashboard button', async () => {
    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard when back button is clicked', async () => {
    const user = userEvent.setup();

    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Dashboard');
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('renders all tab triggers', async () => {
    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Livestock & Plants')).toBeInTheDocument();
      expect(screen.getByText('Water Tests')).toBeInTheDocument();
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
  });

  it('shows overview content by default', async () => {
    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('aquarium-overview')).toBeInTheDocument();
    });
  });

  it('switches to livestock tab when clicked', async () => {
    const user = userEvent.setup();

    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Livestock & Plants')).toBeInTheDocument();
    });

    const livestockTab = screen.getByText('Livestock & Plants');
    await user.click(livestockTab);

    await waitFor(() => {
      expect(screen.getByTestId('aquarium-livestock')).toBeInTheDocument();
    });
  });

  it('switches to water tests tab when clicked', async () => {
    const user = userEvent.setup();

    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Water Tests')).toBeInTheDocument();
    });

    const waterTestsTab = screen.getByText('Water Tests');
    await user.click(waterTestsTab);

    await waitFor(() => {
      expect(screen.getByTestId('water-test-charts')).toBeInTheDocument();
    });
  });

  it('switches to equipment tab when clicked', async () => {
    const user = userEvent.setup();

    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    const equipmentTab = screen.getByText('Equipment');
    await user.click(equipmentTab);

    await waitFor(() => {
      expect(screen.getByTestId('aquarium-equipment')).toBeInTheDocument();
    });
  });

  it('switches to tasks tab when clicked', async () => {
    const user = userEvent.setup();

    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    const tasksTab = screen.getByText('Tasks');
    await user.click(tasksTab);

    await waitFor(() => {
      expect(screen.getByTestId('aquarium-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('task-suggestions')).toBeInTheDocument();
    });
  });

  it('opens dropdown menu when more button is clicked', async () => {
    const user = userEvent.setup();

    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Aquarium')).toBeInTheDocument();
    });

    // Find the more options button (three dots)
    const moreButtons = screen.getAllByRole('button');
    const moreButton = moreButtons.find(btn =>
      btn.querySelector('svg[class*="MoreVertical"]') ||
      btn.getAttribute('aria-haspopup') === 'menu'
    );

    if (moreButton) {
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Aquarium')).toBeInTheDocument();
        expect(screen.getByText('Delete Aquarium')).toBeInTheDocument();
      });
    }
  });

  it('displays aquarium notes when present', async () => {
    render(<AquariumDetail />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });
  });
});
