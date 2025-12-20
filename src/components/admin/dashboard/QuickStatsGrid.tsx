import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Droplets, 
  TestTube, 
  Ticket, 
  UserPlus, 
  ThumbsUp,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/hooks/useAdminDashboardStats';

interface QuickStatsGridProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  subtitle?: string;
}

function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor, subtitle }: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg bg-primary/10", iconColor)}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change !== undefined || subtitle) && (
          <div className="flex items-center gap-1 mt-1">
            {change !== undefined && (
              <span className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                {getTrendIcon()}
                {Math.abs(change)}%
              </span>
            )}
            {changeLabel && (
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function QuickStatsGrid({ stats, isLoading }: QuickStatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Total Users"
        value={stats.totalUsers.toLocaleString()}
        change={stats.userGrowth}
        changeLabel="vs last 30d"
        icon={Users}
      />
      <StatCard
        title="Active Aquariums"
        value={stats.activeAquariums.toLocaleString()}
        change={stats.aquariumGrowth}
        changeLabel="growth"
        icon={Droplets}
      />
      <StatCard
        title="Water Tests (30d)"
        value={stats.monthlyWaterTests.toLocaleString()}
        change={stats.waterTestGrowth}
        changeLabel="vs prev period"
        icon={TestTube}
      />
      <StatCard
        title="Open Tickets"
        value={stats.openTickets}
        subtitle={stats.urgentTickets > 0 ? `${stats.urgentTickets} urgent` : 'None urgent'}
        icon={Ticket}
      />
      <StatCard
        title="Waitlist"
        value={stats.waitlistCount.toLocaleString()}
        subtitle={`${stats.betaAccessGranted} granted`}
        icon={UserPlus}
      />
      <StatCard
        title="AI Satisfaction"
        value={`${stats.aiSatisfactionRate}%`}
        subtitle={`${stats.totalFeedback} reviews`}
        icon={ThumbsUp}
      />
    </div>
  );
}
