import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock AppHeader
vi.mock('@/components/AppHeader', () => ({
  default: () => <header data-testid="app-header">Header</header>,
}));

// Mock error boundaries
vi.mock('@/components/error-boundaries', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/sentry', () => ({
  FeatureArea: { MAINTENANCE: 'maintenance' },
}));

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: { tasks: { all: ['tasks'] } },
}));

// Mock MaintenanceTaskDialog
vi.mock('@/components/aquarium/MaintenanceTaskDialog', () => ({
  MaintenanceTaskDialog: () => null,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock calendar components and hooks
vi.mock('@/components/calendar', () => ({
  CalendarHeroBanner: ({ todayCount }: { todayCount: number }) => (
    <div data-testid="calendar-hero">
      <span>Task Calendar</span>
      <span>{todayCount} today</span>
    </div>
  ),
  WeekAtGlance: ({ onAddTask }: { onAddTask: () => void }) => (
    <div data-testid="week-at-glance">
      <button onClick={onAddTask}>Add Task</button>
    </div>
  ),
  CalendarGrid: () => (
    <div data-testid="calendar-grid">
      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span>
      <span>Thu</span><span>Fri</span><span>Sat</span>
    </div>
  ),
  CalendarTimeline: () => (
    <div data-testid="calendar-timeline">Timeline</div>
  ),
  DayDetailPanel: () => (
    <div data-testid="day-detail">Day Detail</div>
  ),
  QuickAddTaskFAB: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="quick-add-fab" onClick={onClick}>Quick Add</button>
  ),
  useCalendarData: () => ({
    isLoading: false,
    calendarDays: [],
    getTasksForDay: vi.fn().mockReturnValue([]),
    stats: {
      todayCount: 2,
      overdueCount: 0,
      completedCount: 1,
      thisWeekCount: 3,
      totalPending: 5,
      todayTasks: [],
    },
    aquariums: [],
    completeTask: vi.fn(),
    rescheduleTask: vi.fn(),
    isCompleting: false,
  }),
  useCalendarKeyboard: vi.fn(),
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

    it('renders calendar grid', () => {
      renderTaskCalendar();

      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
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
  });

  describe('Calendar Sections', () => {
    it('renders hero banner with stats', () => {
      renderTaskCalendar();

      expect(screen.getByTestId('calendar-hero')).toBeInTheDocument();
      expect(screen.getByText('2 today')).toBeInTheDocument();
    });

    it('renders week at glance section', () => {
      renderTaskCalendar();

      expect(screen.getByTestId('week-at-glance')).toBeInTheDocument();
    });

    it('renders timeline section', () => {
      renderTaskCalendar();

      expect(screen.getByTestId('calendar-timeline')).toBeInTheDocument();
    });

    it('renders quick add FAB', () => {
      renderTaskCalendar();

      expect(screen.getByTestId('quick-add-fab')).toBeInTheDocument();
    });

    it('renders app header', () => {
      renderTaskCalendar();

      expect(screen.getByTestId('app-header')).toBeInTheDocument();
    });
  });
});
