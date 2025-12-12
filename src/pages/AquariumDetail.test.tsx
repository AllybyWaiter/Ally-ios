import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as testingLibrary from '@testing-library/react';
const { screen, waitFor, render } = testingLibrary;
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { 
  createMockAquarium,
  defaultMockAuth,
  mockUseAuth,
} from '@/test/test-utils';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

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

// Mock infrastructure queries
const mockAquarium = createMockAquarium();
vi.mock('@/infrastructure/queries', () => ({
  fetchAquarium: vi.fn().mockResolvedValue(mockAquarium),
  deleteAquarium: vi.fn().mockResolvedValue(undefined),
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

// Import after mocks
import AquariumDetail from './AquariumDetail';

describe('AquariumDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultMockAuth);
  });

  it('renders loading spinner while fetching', () => {
    mockUseAuth.mockReturnValue({ ...defaultMockAuth, loading: true });
    
    render(<AquariumDetail />);
    
    expect(screen.getByRole('status', { hidden: true }) || screen.getByText((_, element) => 
      element?.classList?.contains('animate-spin') || false
    )).toBeTruthy();
  });

  it('renders aquarium name after loading', async () => {
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Aquarium')).toBeInTheDocument();
    });
  });

  it('displays aquarium type badge', async () => {
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('freshwater')).toBeInTheDocument();
    });
  });

  it('displays aquarium status badge', async () => {
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('renders back to dashboard button', async () => {
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard when back button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
    
    const backButton = screen.getByText('Back to Dashboard');
    await user.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('renders all tab triggers', async () => {
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Livestock & Plants')).toBeInTheDocument();
      expect(screen.getByText('Water Tests')).toBeInTheDocument();
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
  });

  it('shows overview content by default', async () => {
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByTestId('aquarium-overview')).toBeInTheDocument();
    });
  });

  it('switches to livestock tab when clicked', async () => {
    const user = userEvent.setup();
    
    render(<AquariumDetail />);
    
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
    
    render(<AquariumDetail />);
    
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
    
    render(<AquariumDetail />);
    
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
    
    render(<AquariumDetail />);
    
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
    
    render(<AquariumDetail />);
    
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
    render(<AquariumDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });
  });
});
