import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

const mockFetchAllWaterTests = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/infrastructure/queries/waterTests', () => ({
  fetchAllWaterTests: (...args: unknown[]) => mockFetchAllWaterTests(...args),
}));

vi.mock('@/contexts/ProfileContext', () => ({
  useProfileContext: () => ({ units: 'imperial' }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    loading: false,
  }),
}));

vi.mock('@/hooks/useAquariumHealthScore', () => ({
  useAquariumHealthScore: () => ({
    score: 90,
    label: 'Excellent',
    color: 'green',
    lastWaterTest: '2026-02-05',
  }),
}));

vi.mock('@/components/AppHeader', () => ({
  default: () => <header data-testid="app-header">Header</header>,
}));

vi.mock('@/components/error-boundaries', () => ({
  SectionErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/water-tests/WaterQualityHero', () => ({
  WaterQualityHero: () => <div data-testid="water-quality-hero">Hero</div>,
}));

vi.mock('@/components/water-tests/QuickLogSection', () => ({
  QuickLogSection: () => <div data-testid="quick-log-section">QuickLog</div>,
}));

vi.mock('@/components/water-tests/RecentActivityTimeline', () => ({
  RecentActivityTimeline: () => <div data-testid="recent-activity">Recent Activity</div>,
}));

vi.mock('@/components/water-tests/ParameterInsightsGrid', () => ({
  ParameterInsightsGrid: ({ onParameterClick }: { onParameterClick?: (paramName: string) => void }) => (
    <button type="button" onClick={() => onParameterClick?.('Nitrate')}>
      Select Nitrate
    </button>
  ),
}));

vi.mock('@/components/water-tests/WaterTestCharts', () => ({
  WaterTestCharts: ({
    selectedParameter,
  }: {
    selectedParameter?: string;
  }) => <div data-testid="selected-parameter">{selectedParameter}</div>,
}));

import WaterTests from './WaterTests';

const buildWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('WaterTests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      order: mockOrder,
    });

    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'aq-1',
          name: 'Tank One',
          type: 'freshwater',
        },
      ],
      error: null,
    });

    mockFetchAllWaterTests.mockResolvedValue([
      {
        id: 'test-1',
        test_date: '2026-02-05T00:00:00.000Z',
        test_parameters: [
          { parameter_name: 'pH', value: 8, unit: '', status: 'good' },
          { parameter_name: 'Nitrate', value: 4, unit: 'ppm', status: 'good' },
        ],
      },
    ]);
  });

  it('updates chart parameter when a parameter card is clicked', async () => {
    const user = userEvent.setup();
    const wrapper = buildWrapper();

    render(<WaterTests />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('selected-parameter')).toHaveTextContent('pH');
    });

    await user.click(screen.getByRole('button', { name: 'Select Nitrate' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected-parameter')).toHaveTextContent('Nitrate');
    });
  });
});
