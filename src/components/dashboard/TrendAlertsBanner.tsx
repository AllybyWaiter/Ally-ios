import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { fetchActiveAlerts, dismissAlert, WaterTestAlert } from '@/infrastructure/queries/waterTestAlerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const alertIcons = {
  rising: TrendingUp,
  falling: TrendingDown,
  unstable: Activity,
  approaching_threshold: AlertTriangle,
};

const severityStyles = {
  critical: {
    container: 'bg-destructive/10 border-destructive/30',
    icon: 'text-destructive',
    badge: 'bg-destructive text-destructive-foreground',
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/30',
    icon: 'text-amber-500',
    badge: 'bg-amber-500 text-white',
  },
  info: {
    container: 'bg-primary/10 border-primary/30',
    icon: 'text-primary',
    badge: 'bg-primary text-primary-foreground',
  },
};

export function TrendAlertsBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: queryKeys.waterTests.alerts(user?.id || ''),
    queryFn: () => fetchActiveAlerts(user!.id),
    enabled: !!user,
    staleTime: 30000,
  });

  const dismissMutation = useMutation({
    mutationFn: dismissAlert,
    onMutate: async (alertId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.waterTests.alerts(user?.id || '') });
      const previousAlerts = queryClient.getQueryData<WaterTestAlert[]>(queryKeys.waterTests.alerts(user?.id || ''));
      
      queryClient.setQueryData<WaterTestAlert[]>(
        queryKeys.waterTests.alerts(user?.id || ''),
        (old) => old?.filter(a => a.id !== alertId) || []
      );

      return { previousAlerts };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousAlerts) {
        queryClient.setQueryData(queryKeys.waterTests.alerts(user?.id || ''), context.previousAlerts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.waterTests.alerts(user?.id || '') });
    },
  });

  if (isLoading || alerts.length === 0) {
    return null;
  }

  // Sort by severity (critical first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Show max 3 alerts in banner
  const displayedAlerts = sortedAlerts.slice(0, 3);
  const remainingCount = alerts.length - displayedAlerts.length;

  return (
    <div className="mb-6 space-y-3">
      {displayedAlerts.map((alert) => {
        const Icon = alertIcons[alert.alert_type] || AlertTriangle;
        const styles = severityStyles[alert.severity];
        const aquariumName = alert.details?.aquariumName || 'Unknown';

        return (
          <Card 
            key={alert.id} 
            className={cn('border transition-colors', styles.container)}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', styles.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', styles.badge)}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {aquariumName}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {alert.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => navigate(`/aquarium/${alert.aquarium_id}`)}
                  >
                    <span className="sr-only md:not-sr-only md:mr-1">View</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => dismissMutation.mutate(alert.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {remainingCount > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          +{remainingCount} more alert{remainingCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
