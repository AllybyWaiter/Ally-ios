import { 
  useAdminDashboardStats, 
  useAdminTrendData, 
  useAdminPendingActions, 
  useAdminRecentActivity 
} from '@/hooks/useAdminDashboardStats';
import { 
  QuickStatsGrid, 
  TrendCharts, 
  PendingActionsPanel, 
  RecentActivityFeed,
  QuickActionsBar 
} from './dashboard';

interface AdminDashboardHomeProps {
  onTabChange?: (tab: string) => void;
}

export function AdminDashboardHome({ onTabChange }: AdminDashboardHomeProps) {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminDashboardStats();
  const { data: trendData, isLoading: trendLoading } = useAdminTrendData();
  const { data: pendingActions, isLoading: actionsLoading, refetch: refetchActions } = useAdminPendingActions();
  const { data: recentActivity, isLoading: activityLoading } = useAdminRecentActivity();

  const handleNavigate = (tab: string) => {
    onTabChange?.(tab);
  };

  const handleRefresh = () => {
    refetchStats();
    refetchActions();
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <QuickStatsGrid stats={stats} isLoading={statsLoading} />

      {/* Trend Charts */}
      <TrendCharts data={trendData} isLoading={trendLoading} />

      {/* Pending Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingActionsPanel 
          actions={pendingActions} 
          isLoading={actionsLoading} 
          onNavigate={handleNavigate}
        />
        <RecentActivityFeed 
          activities={recentActivity} 
          isLoading={activityLoading} 
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsBar onNavigate={handleNavigate} onRefresh={handleRefresh} />
    </div>
  );
}
