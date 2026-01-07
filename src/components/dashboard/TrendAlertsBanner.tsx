import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, X, ChevronRight, Sparkles, MessageSquare, Clock, Users, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { queryKeys } from '@/lib/queryKeys';
import { fetchActiveAlerts, dismissAlert, WaterTestAlert } from '@/infrastructure/queries/waterTestAlerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const alertIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  rising: TrendingUp,
  falling: TrendingDown,
  unstable: Activity,
  approaching_threshold: AlertTriangle,
  predictive: Clock,
  seasonal: Activity,
  stocking: Users,
  correlation: Activity,
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

const alertTypeLabels: Record<string, string> = {
  rising: 'Rising',
  falling: 'Falling',
  unstable: 'Unstable',
  predictive: 'Predictive',
  seasonal: 'Seasonal',
  stocking: 'Stocking',
  correlation: 'Correlation',
};

export function TrendAlertsBanner() {
  const { user } = useAuth();
  const { limits } = usePlanLimits();
  const hasAIAlerts = limits.hasAITrendAlerts;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, isError, error } = useQuery({
    queryKey: queryKeys.waterTests.alerts(user?.id || ''),
    queryFn: () => fetchActiveAlerts(user!.id),
    enabled: !!user,
    staleTime: 30000,
  });

  // Handle error state silently - this is a non-critical feature
  if (isError) {
    console.error('Failed to fetch trend alerts:', error);
    return null;
  }

  const dismissMutation = useMutation({
    mutationFn: dismissAlert,
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.waterTests.alerts(user?.id || '') });
      const previousAlerts = queryClient.getQueryData<WaterTestAlert[]>(queryKeys.waterTests.alerts(user?.id || ''));
      
      queryClient.setQueryData<WaterTestAlert[]>(
        queryKeys.waterTests.alerts(user?.id || ''),
        (old) => old?.filter(a => a.id !== alertId) || []
      );

      return { previousAlerts };
    },
    onError: (_, __, context) => {
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
    const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
  });

  // Show max 3 alerts in banner
  const displayedAlerts = sortedAlerts.slice(0, 3);
  const remainingCount = alerts.length - displayedAlerts.length;

  // Check if any alerts are AI-powered
  const hasAIAnalyzedAlerts = alerts.some(a => a.analysis_model === 'ai');
  const hasRuleOnlyAlerts = alerts.every(a => a.analysis_model === 'rule' || !a.analysis_model);

  return (
    <div className="mb-6 space-y-3">
      {/* Upgrade prompt for Free/Basic users */}
      {!hasAIAlerts && hasRuleOnlyAlerts && alerts.length > 0 && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Upgrade to Plus for AI-powered predictive alerts
              </span>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/pricing">
                <Lock className="h-3 w-3 mr-1" />
                Upgrade
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-6">
            Get personalized recommendations, predict problems before they occur, and see which inhabitants are affected.
          </p>
        </div>
      )}

      {displayedAlerts.map((alert) => {
        const Icon = alertIcons[alert.alert_type] || AlertTriangle;
        const styles = severityStyles[alert.severity];
        const aquariumName = alert.details?.aquariumName || 'Unknown';
        const isAIPowered = alert.analysis_model === 'ai';

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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', styles.badge)}>
                      {alert.severity.toUpperCase()}
                    </span>
                    {isAIPowered && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    )}
                    {alertTypeLabels[alert.alert_type] && (
                      <Badge variant="outline" className="text-xs">
                        {alertTypeLabels[alert.alert_type]}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground truncate">
                      {aquariumName}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-foreground">
                    {alert.message}
                  </p>

                  {/* AI-powered recommendation (Plus/Gold only) */}
                  {isAIPowered && alert.recommendation && (
                    <div className="mt-2 p-2 rounded-md bg-background/50">
                      <p className="text-sm text-muted-foreground">
                        <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
                        {alert.recommendation}
                      </p>
                    </div>
                  )}

                  {/* Timeframe */}
                  {isAIPowered && alert.timeframe && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.timeframe}
                    </p>
                  )}

                  {/* Affected inhabitants */}
                  {isAIPowered && alert.affected_inhabitants && alert.affected_inhabitants.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {alert.affected_inhabitants.map((name, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quick actions for AI alerts */}
                  {isAIPowered && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate('/ally', { 
                          state: { 
                            prefillMessage: `Why is my ${alert.parameter_name} ${alert.alert_type}? ${alert.recommendation || ''}`.trim(),
                            context: { alertId: alert.id, parameter: alert.parameter_name, severity: alert.severity }
                          }
                        })}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Ask Ally
                      </Button>
                    </div>
                  )}
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
