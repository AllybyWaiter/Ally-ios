import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Admin from './Admin';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth with admin permissions
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-1', email: 'admin@example.com' },
    hasPermission: vi.fn(() => true),
    hasAnyRole: vi.fn((roles: string[]) => roles.includes('admin')),
    loading: false,
  })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock SectionErrorBoundary
vi.mock('@/components/error-boundaries', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock sentry
vi.mock('@/lib/sentry', () => ({
  FeatureArea: { ADMIN: 'admin' },
}));

// Mock sidebar UI components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock AdminSidebar with clickable navigation
vi.mock('@/components/admin/AdminSidebar', () => ({
  AdminSidebar: ({ onSectionChange }: { activeSection: string; onSectionChange: (s: string) => void }) => (
    <nav data-testid="admin-sidebar">
      <button onClick={() => onSectionChange('users')}>Users</button>
      <button onClick={() => onSectionChange('feature-flags')}>Feature Flags</button>
      <button onClick={() => onSectionChange('ai-analytics')}>AI Analytics</button>
    </nav>
  ),
}));

// Mock all admin content components
vi.mock('@/components/admin/AdminDashboardHome', () => ({
  AdminDashboardHome: () => <div data-testid="dashboard-home">Dashboard Home</div>,
}));

vi.mock('@/components/admin/CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('@/components/admin/KeyboardShortcuts', () => ({
  KeyboardShortcuts: () => null,
}));

vi.mock('@/components/admin/SystemHealth', () => ({
  SystemHealth: () => <div data-testid="system-health">System Health</div>,
}));

vi.mock('@/components/admin/ContactsManager', () => ({
  ContactsManager: () => <div data-testid="contacts-manager">Contacts Manager</div>,
}));

vi.mock('@/components/admin/ReferralLeaderboard', () => ({
  ReferralLeaderboard: () => <div data-testid="referral-leaderboard">Referral Leaderboard</div>,
}));

vi.mock('@/components/admin/SupportTickets', () => ({
  default: () => <div data-testid="support-tickets">Support Tickets</div>,
}));

vi.mock('@/components/admin/UserManagement', () => ({
  default: () => <div data-testid="user-management">User Management</div>,
}));

vi.mock('@/components/admin/AnnouncementManager', () => ({
  default: () => <div data-testid="announcement-manager">Announcement Manager</div>,
}));

vi.mock('@/components/admin/RoleManager', () => ({
  RoleManager: () => <div data-testid="role-manager">Role Manager</div>,
}));

vi.mock('@/components/admin/BetaAccessManager', () => ({
  BetaAccessManager: () => <div data-testid="beta-access-manager">Beta Access Manager</div>,
}));

vi.mock('@/components/admin/UserActivityLogs', () => ({
  default: () => <div data-testid="activity-logs">Activity Logs</div>,
}));

vi.mock('@/components/admin/AIAnalytics', () => ({
  default: () => <div data-testid="ai-analytics">AI Analytics</div>,
}));

vi.mock('@/components/admin/AIUserInsights', () => ({
  default: () => <div data-testid="ai-user-insights">AI User Insights</div>,
}));

vi.mock('@/components/admin/AdminMemoryManager', () => ({
  default: () => <div data-testid="admin-memory-manager">Admin Memory Manager</div>,
}));

vi.mock('@/components/admin/ConversationAnalytics', () => ({
  default: () => <div data-testid="conversation-analytics">Conversation Analytics</div>,
}));

vi.mock('@/components/admin/AIModelSettings', () => ({
  default: () => <div data-testid="ai-model-settings">AI Model Settings</div>,
}));

vi.mock('@/components/admin/AIMonitoring', () => ({
  default: () => <div data-testid="ai-monitoring">AI Monitoring</div>,
}));

vi.mock('@/components/admin/FeatureFlagManager', () => ({
  default: () => <div data-testid="feature-flag-manager">Feature Flag Manager</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAdmin = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders admin dashboard title', async () => {
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });
    });

    it('renders admin sidebar', async () => {
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      });
    });

    it('renders dashboard home by default', async () => {
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-home')).toBeInTheDocument();
      });
    });
  });

  describe('Section Navigation', () => {
    it('switches to users section when sidebar clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Users'));

      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument();
      });
    });

    it('switches to feature flags section', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Feature Flags'));

      await waitFor(() => {
        expect(screen.getByTestId('feature-flag-manager')).toBeInTheDocument();
      });
    });

    it('switches to AI analytics section', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('AI Analytics'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Header', () => {
    it('updates header text when section changes', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText('Feature Flags'));

      await waitFor(() => {
        // Header shows activeSection.replace(/-/g, ' ') = 'feature flags'
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('feature flags');
      });
    });
  });

  describe('Loading State', () => {
    it('renders without crashing', () => {
      renderAdmin();
      expect(document.body).toBeTruthy();
    });
  });
});
