import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  Bell,
  RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { queryPresets } from '@/lib/queryConfig';
import { toast } from 'sonner';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { subHours, format, eachHourOfInterval } from 'date-fns';

interface AIAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  details: Record<string, unknown> | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

const chartConfig = {
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const edgeFunctions = [
  { name: 'ally-chat', description: 'Main AI chat function' },
  { name: 'analyze-water-test-photo', description: 'Photo analysis' },
  { name: 'analyze-water-trends', description: 'Water trend analysis' },
  { name: 'analyze-water-trends-ai', description: 'AI trend predictions' },
  { name: 'suggest-maintenance-tasks', description: 'Task suggestions' },
];

export default function AIMonitoring() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['ai-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as AIAlert[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch hourly message counts
  const { data: hourlyData } = useQuery({
    queryKey: ['ai-hourly-metrics'],
    queryFn: async () => {
      const now = new Date();
      const hoursAgo = subHours(now, 24);
      
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('created_at')
        .gte('created_at', hoursAgo.toISOString());
      
      const hours = eachHourOfInterval({ start: hoursAgo, end: now });
      
      return hours.map(hour => {
        const hourEnd = new Date(hour);
        hourEnd.setHours(hourEnd.getHours() + 1);
        
        const count = messages?.filter(m => {
          const date = new Date(m.created_at);
          return date >= hour && date < hourEnd;
        }).length || 0;
        
        return {
          time: format(hour, 'HH:mm'),
          messages: count,
        };
      });
    },
    ...queryPresets.analytics,
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('ai_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-alerts'] });
      toast.success('Alert resolved');
    },
    onError: (error) => {
      toast.error('Failed to resolve alert: ' + (error as Error).message);
    },
  });

  // Calculate stats and filter active alerts with single-pass iteration for performance
  const { stats, unresolvedAlerts } = useMemo(() => {
    let activeAlerts = 0;
    let criticalAlerts = 0;
    const unresolved: typeof alerts = [];

    if (alerts) {
      for (const alert of alerts) {
        if (!alert.is_resolved) {
          activeAlerts++;
          unresolved.push(alert);
          if (alert.severity === 'critical') {
            criticalAlerts++;
          }
        }
      }
    }

    let totalMessages24h = 0;
    if (hourlyData) {
      for (const h of hourlyData) {
        totalMessages24h += h.messages;
      }
    }

    return {
      stats: {
        activeAlerts,
        criticalAlerts,
        messagesLastHour: hourlyData?.slice(-1)[0]?.messages || 0,
        totalMessages24h,
      },
      unresolvedAlerts: unresolved,
    };
  }, [alerts, hourlyData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['ai-alerts'] });
    await queryClient.invalidateQueries({ queryKey: ['ai-hourly-metrics'] });
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error_rate':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'traffic_spike':
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      case 'negative_feedback':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'latency':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (alertsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Real-time AI Monitoring</h2>
          <p className="text-sm text-muted-foreground">Live metrics and alerts</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={stats.criticalAlerts > 0 ? 'border-red-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.activeAlerts > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {stats.activeAlerts}
            </div>
            {stats.criticalAlerts > 0 && (
              <p className="text-xs text-red-500">{stats.criticalAlerts} critical</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages/Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {stats.messagesLastHour}
            </div>
            <p className="text-xs text-muted-foreground">Current rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">24h Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages24h}</div>
            <p className="text-xs text-muted-foreground">Messages processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground">All systems normal</p>
          </CardContent>
        </Card>
      </div>

      {/* Message Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Message Rate (24h)
          </CardTitle>
          <CardDescription>Hourly message volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-48">
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={2}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="messages" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edge Function Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Edge Function Status
            </CardTitle>
            <CardDescription>AI-related serverless functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {edgeFunctions.map(fn => (
                <div 
                  key={fn.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm font-mono">{fn.name}</p>
                    <p className="text-xs text-muted-foreground">{fn.description}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Alerts
            </CardTitle>
            <CardDescription>Latest system alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {unresolvedAlerts.slice(0, 5).map(alert => (
                  <div 
                    key={alert.id}
                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.alert_type)}
                      <div>
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(alert.created_at, 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
                {(!alerts || alerts.filter(a => !a.is_resolved).length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                    <p>No active alerts</p>
                    <p className="text-xs">All systems operating normally</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
