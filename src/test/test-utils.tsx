/* eslint-disable react-refresh/only-export-components */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';

// Initialize i18n for tests
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'Manage your aquariums',
        'dashboard.deleteAquarium': 'Delete Aquarium',
        'dashboard.deleteConfirmation': 'Are you sure?',
        'dashboard.aquariumDeleted': 'Aquarium deleted',
        'dashboard.failedToDelete': 'Failed to delete',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.success': 'Success',
        'common.error': 'Error',
        'common.loading': 'Loading...',
        'common.optional': 'Optional',
        'aquarium.notFound': 'Aquarium Not Found',
        'aquarium.backToDashboard': 'Back to Dashboard',
        'aquarium.editAquarium': 'Edit Aquarium',
        'aquarium.notes': 'Notes',
        'aquarium.notesPlaceholder': 'Add notes...',
        'tabs.overview': 'Overview',
        'tabs.waterTests': 'Water Tests',
        'tabs.equipment': 'Equipment',
        'tabs.tasks': 'Tasks',
        'waterTests.parameterTemplate': 'Parameter Template',
        'waterTests.manageTemplates': 'Manage Templates',
        'waterTests.systemTemplates': 'System Templates',
        'waterTests.myCustomTemplates': 'My Custom Templates',
        'waterTests.custom': 'Custom',
        'waterTests.templateDescription': 'Select a template to configure parameters',
        'waterTests.saveTest': 'Save Test',
        'waterTests.tagsPlaceholder': 'Add tags...',
        'waterTests.upgradeTitle': 'Upgrade Required',
        'waterTests.upgradeDescription': 'Upgrade for custom templates',
        'waterTests.plusPlan': 'Plus Plan',
        'waterTests.plusDescription': 'Create custom templates',
        'waterTests.goldPlan': 'Gold Plan',
        'waterTests.goldDescription': 'Unlimited templates',
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// Mock user factory
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  ...overrides,
});

// Mock aquarium factory
export const createMockAquarium = (overrides = {}) => ({
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
  ...overrides,
});

// Mock water test factory
export const createMockWaterTest = (overrides = {}) => ({
  id: 'test-water-test-id',
  aquarium_id: 'test-aquarium-id',
  test_date: '2024-01-15',
  notes: 'Test water test',
  tags: ['weekly'],
  photo_url: null,
  confidence: 'high',
  entry_method: 'manual',
  user_id: 'test-user-id',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
});

// Mock task factory
export const createMockTask = (overrides = {}) => ({
  id: 'test-task-id',
  aquarium_id: 'test-aquarium-id',
  task_name: 'Water Change',
  task_type: 'water_change',
  due_date: '2024-01-20',
  status: 'pending',
  notes: null,
  completed_date: null,
  equipment_id: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
});

// Mock conversation factory
export const createMockConversation = (overrides = {}) => ({
  id: 'test-conversation-id',
  title: 'Test Conversation',
  updated_at: '2024-01-15T00:00:00Z',
  aquarium_id: null,
  user_id: 'test-user-id',
  created_at: '2024-01-15T00:00:00Z',
  ...overrides,
});

// Default mock auth values
export const defaultMockAuth = {
  user: createMockUser(),
  isAdmin: false,
  hasPermission: vi.fn().mockReturnValue(false),
  hasAnyRole: vi.fn().mockReturnValue(false),
  units: 'imperial' as const,
  onboardingCompleted: true,
  loading: false,
  canCreateCustomTemplates: false,
};

// Mock useAuth hook
export const mockUseAuth = vi.fn().mockReturnValue(defaultMockAuth);

// Default mock plan limits
export const defaultMockPlanLimits = {
  limits: {
    maxAquariums: 3,
    maxTestLogsPerMonth: 10,
    hasEquipmentTracking: true,
    hasCustomTemplates: false,
    hasAdvancedAnalytics: false,
    hasMemory: false,
  },
  canCreateAquarium: vi.fn().mockReturnValue(true),
  getRemainingAquariums: vi.fn().mockReturnValue(2),
  getUpgradeSuggestion: vi.fn().mockReturnValue('plus'),
  tier: 'free',
  loading: false,
  canLogTest: vi.fn().mockReturnValue(true),
  getRemainingTests: vi.fn().mockReturnValue(5),
  monthlyTestCount: 5,
};

// Mock usePlanLimits hook
export const mockUsePlanLimits = vi.fn().mockReturnValue(defaultMockPlanLimits);

// Create test query client
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// All providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const AllProviders = ({ children, queryClient }: AllProvidersProps) => {
  const testQueryClient = queryClient || createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {children}
          </BrowserRouter>
        </TooltipProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { queryClient, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
