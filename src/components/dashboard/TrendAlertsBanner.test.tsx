import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TrendAlertsBanner } from './TrendAlertsBanner';
import type { WaterTestAlert } from '@/infrastructure/queries/waterTestAlerts';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

vi.mock('@/hooks/usePlanLimits', () => ({
  usePlanLimits: () => ({
    limits: { hasAITrendAlerts: true },
  }),
}));

const baseAlert: WaterTestAlert = {
  id: 'alert-1',
  user_id: 'user-1',
  aquarium_id: 'aq-1',
  parameter_name: 'Nitrate',
  alert_type: 'rising',
  severity: 'warning',
  message: 'Nitrate is rising',
  details: { aquariumName: 'Reef Tank' },
  is_dismissed: false,
  dismissed_at: null,
  created_at: '2026-02-06T00:00:00.000Z',
  updated_at: '2026-02-06T00:00:00.000Z',
  recommendation: null,
  timeframe: null,
  affected_inhabitants: null,
  confidence: null,
  analysis_model: 'rule',
  predicted_impact: null,
};

const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TrendAlertsBanner />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TrendAlertsBanner', () => {
  let queryState: {
    data?: WaterTestAlert[];
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryState = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    };
    vi.mocked(useQuery).mockImplementation(() => queryState as ReturnType<typeof useQuery>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles error-to-success rerender without hook order crashes', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    queryState = {
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('failed query'),
    };

    const { rerender } = renderWithProviders();
    expect(screen.queryByText('Nitrate is rising')).not.toBeInTheDocument();

    queryState = {
      data: [baseAlert],
      isLoading: false,
      isError: false,
      error: null,
    };

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TrendAlertsBanner />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Nitrate is rising')).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
