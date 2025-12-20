import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UserPlus, 
  Ticket, 
  FileText, 
  Droplets,
  TestTube,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { RecentActivity } from '@/hooks/useAdminDashboardStats';

interface RecentActivityFeedProps {
  activities?: RecentActivity[];
  isLoading: boolean;
}

const activityConfig = {
  user_signup: {
    icon: UserPlus,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  ticket: {
    icon: Ticket,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  blog: {
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  beta_grant: {
    icon: UserPlus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  water_test: {
    icon: TestTube,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  aquarium: {
    icon: Droplets,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
};

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={cn("p-2 rounded-full shrink-0", config.bgColor)}>
        <Icon className={cn("h-3.5 w-3.5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {activity.description}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
      </span>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-3 w-16 shrink-0" />
    </div>
  );
}

export function RecentActivityFeed({ activities, isLoading }: RecentActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest platform events
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="px-4 pb-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ActivitySkeleton key={i} />
              ))
            ) : activities && activities.length > 0 ? (
              activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
