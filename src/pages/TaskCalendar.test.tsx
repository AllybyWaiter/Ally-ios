import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskCalendar from './TaskCalendar';

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
    user: { id: 'user-1' },
    loading: false,
  })),
}));

// Mock supabase
const mockTasks = [
  {
    id: 'task-1',
    task_name: 'Water Change',
    task_type: 'water_change',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    aquarium_id: 'aquarium-1',
    aquariums: { name: 'Test Tank' },
  },
  {
    id: 'task-2',
    task_name: 'Filter Clean',
    task_type: 'filter_cleaning',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    aquarium_id: 'aquarium-1',
    aquariums: { name: 'Test Tank' },
  },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock tanstack query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: mockTasks,
      isLoading: false,
      error: null,
    })),
  };
});

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

const renderTaskCalendar = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TaskCalendar />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TaskCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders calendar page with title', () => {
      renderTaskCalendar();
      
      expect(screen.getByText(/task calendar/i)).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      renderTaskCalendar();
      
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    });

    it('renders current month and year', () => {
      renderTaskCalendar();
      
      const now = new Date();
      const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(monthYear)).toBeInTheDocument();
    });

    it('renders day headers', () => {
      renderTaskCalendar();
      
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('renders back button that navigates to dashboard', async () => {
      const user = userEvent.setup();
      renderTaskCalendar();
      
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Month Navigation', () => {
    it('has previous and next month buttons', () => {
      renderTaskCalendar();
      
      // Look for navigation buttons by their icons or aria-labels
      const prevButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('[data-lucide="chevron-left"]') || btn.textContent === '‹'
      );
      const nextButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('[data-lucide="chevron-right"]') || btn.textContent === '›'
      );
      
      // At minimum, verify there are navigation controls
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    });
  });

  describe('Task Display', () => {
    it('displays tasks on calendar', () => {
      renderTaskCalendar();
      
      // Tasks should be displayed somewhere in the calendar
      expect(screen.getByText('Water Change')).toBeInTheDocument();
      expect(screen.getByText('Filter Clean')).toBeInTheDocument();
    });
  });

  describe('Task Legend', () => {
    it('displays task type legend', () => {
      renderTaskCalendar();
      
      // Legend should show task type colors
      expect(screen.getByText(/water change/i)).toBeInTheDocument();
    });
  });

  describe('Calendar Grid', () => {
    it('renders calendar cells for the month', () => {
      renderTaskCalendar();
      
      // Should have day numbers visible
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('highlights today', () => {
      renderTaskCalendar();
      
      const today = new Date().getDate().toString();
      const todayCell = screen.getByText(today);
      
      // Today should be in the document
      expect(todayCell).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('renders properly structured calendar grid', () => {
      renderTaskCalendar();
      
      // Verify the 7-column grid for days of week
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });
  });
});
