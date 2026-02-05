import { useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Activity, LogIn, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    email: string;
    name: string | null;
  } | null;
}

interface LoginHistory {
  id: string;
  user_id: string;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  profiles?: {
    email: string;
    name: string | null;
  } | null;
}

// Fetch activity logs and login history with profile data
async function fetchActivityData() {
  // Fetch both in parallel for better performance
  const [activitiesResult, loginsResult] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('login_history')
      .select('*')
      .order('login_at', { ascending: false })
      .limit(100),
  ]);

  // Handle potential errors from parallel queries
  if (activitiesResult.error) {
    console.error('Failed to fetch activity logs:', activitiesResult.error);
  }
  if (loginsResult.error) {
    console.error('Failed to fetch login history:', loginsResult.error);
  }

  const activities = activitiesResult.data || [];
  const logins = loginsResult.data || [];

  // Collect unique user IDs from both datasets
  const userIds = new Set([
    ...activities.map(a => a.user_id),
    ...logins.map(l => l.user_id)
  ]);

  // Fetch profiles for all users in one query
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, email, name')
    .in('user_id', Array.from(userIds));

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  // Merge profiles with activities and logins
  const activitiesWithProfiles = activities.map(a => ({
    ...a,
    profiles: profileMap.get(a.user_id) || null
  })) as ActivityLog[];

  const loginsWithProfiles = logins.map(l => ({
    ...l,
    profiles: profileMap.get(l.user_id) || null
  })) as LoginHistory[];

  return { activities: activitiesWithProfiles, logins: loginsWithProfiles };
}

export default function UserActivityLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity-logs'],
    queryFn: fetchActivityData,
    staleTime: 30 * 1000, // 30 seconds
  });

  const activityLogs = data?.activities || [];
  const loginHistory = data?.logins || [];

  // All hooks must be called before any conditional returns (React rules of hooks)
  const ROW_HEIGHT = 64;

  // Memoize stats calculation with single-pass filtering
  const stats = useMemo(() => {
    let totalLogins = 0, failedLogins = 0;
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    let last24h = 0;

    for (const login of loginHistory) {
      if (login.success) totalLogins++;
      else failedLogins++;
    }

    for (const log of activityLogs) {
      if (new Date(log.created_at).getTime() > yesterday) last24h++;
    }

    return {
      totalActivities: activityLogs.length,
      totalLogins,
      failedLogins,
      last24h,
    };
  }, [activityLogs, loginHistory]);

  // Virtualization setup for activity logs table
  const activityContainerRef = useRef<HTMLDivElement>(null);

  const activityVirtualizer = useVirtualizer({
    count: activityLogs.length,
    getScrollElement: () => activityContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // Virtualization setup for login history table
  const loginContainerRef = useRef<HTMLDivElement>(null);

  const loginVirtualizer = useVirtualizer({
    count: loginHistory.length,
    getScrollElement: () => loginContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const getActionBadge = useCallback((actionType: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      login: 'default',
      logout: 'secondary',
      aquarium_created: 'default',
      aquarium_deleted: 'destructive',
      water_test_created: 'default',
      profile_updated: 'secondary',
      support_ticket_created: 'outline',
    };

    return (
      <Badge variant={colors[actionType] || 'outline'}>
        {actionType.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  }, []);

  const getBrowser = useCallback((userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }, []);

  // Early return for loading state - AFTER all hooks
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failedLogins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last24h}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tables */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Activity Logs</TabsTrigger>
          <TabsTrigger value="logins">Login History</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Track all user actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Fixed header */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">User</TableHead>
                    <TableHead className="w-[150px]">Action</TableHead>
                    <TableHead className="w-[200px]">Details</TableHead>
                    <TableHead className="w-[100px]">Browser</TableHead>
                    <TableHead className="w-[150px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              {/* Virtualized scrollable body */}
              <div
                ref={activityContainerRef}
                className="h-[500px] overflow-auto border rounded-md"
                style={{ contain: 'strict' }}
              >
                <div
                  style={{
                    height: `${activityVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <Table>
                    <tbody>
                      {activityVirtualizer.getVirtualItems().map((virtualRow) => {
                        const log = activityLogs[virtualRow.index];
                        return (
                          <TableRow
                            key={log.id}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <TableCell className="w-[200px]">
                              <div>
                                <div className="font-medium">
                                  {log.profiles?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {log.profiles?.email || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-[150px]">{getActionBadge(log.action_type)}</TableCell>
                            <TableCell className="w-[200px] max-w-xs truncate">
                              {log.action_details && typeof log.action_details === 'object' && Object.keys(log.action_details).length > 0
                                ? JSON.stringify(log.action_details)
                                : '-'}
                            </TableCell>
                            <TableCell className="w-[100px]">{getBrowser(log.user_agent)}</TableCell>
                            <TableCell className="w-[150px]">{formatDate(log.created_at, 'PPp')}</TableCell>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>
              {activityLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logs found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Monitor user authentication attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Fixed header */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">User</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Browser</TableHead>
                    <TableHead className="w-[200px]">Failure Reason</TableHead>
                    <TableHead className="w-[150px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              {/* Virtualized scrollable body */}
              <div
                ref={loginContainerRef}
                className="h-[500px] overflow-auto border rounded-md"
                style={{ contain: 'strict' }}
              >
                <div
                  style={{
                    height: `${loginVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <Table>
                    <tbody>
                      {loginVirtualizer.getVirtualItems().map((virtualRow) => {
                        const login = loginHistory[virtualRow.index];
                        return (
                          <TableRow
                            key={login.id}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <TableCell className="w-[200px]">
                              <div>
                                <div className="font-medium">
                                  {login.profiles?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {login.profiles?.email || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-[100px]">
                              {login.success ? (
                                <Badge variant="default">Success</Badge>
                              ) : (
                                <Badge variant="destructive">Failed</Badge>
                              )}
                            </TableCell>
                            <TableCell className="w-[100px]">{getBrowser(login.user_agent)}</TableCell>
                            <TableCell className="w-[200px]">
                              {login.failure_reason || '-'}
                            </TableCell>
                            <TableCell className="w-[150px]">{formatDate(login.login_at, 'PPp')}</TableCell>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>
              {loginHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No login history found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
