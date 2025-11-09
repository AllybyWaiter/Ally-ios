import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Activity, LogIn, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    email: string;
    name: string | null;
  };
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
  };
}

export default function UserActivityLogs() {
  const { toast } = useToast();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);

    // Fetch activity logs
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch login history
    const { data: logins, error: loginsError } = await supabase
      .from('login_history')
      .select('*')
      .order('login_at', { ascending: false })
      .limit(100);

    // Fetch user profiles separately
    const userIds = new Set([
      ...(activities?.map(a => a.user_id) || []),
      ...(logins?.map(l => l.user_id) || [])
    ]);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, name')
      .in('user_id', Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Merge profiles with activities
    const activitiesWithProfiles = activities?.map(a => ({
      ...a,
      profiles: profileMap.get(a.user_id) || null
    })) || [];

    // Merge profiles with logins
    const loginsWithProfiles = logins?.map(l => ({
      ...l,
      profiles: profileMap.get(l.user_id) || null
    })) || [];

    if (activitiesError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch activity logs',
        variant: 'destructive',
      });
    } else {
      setActivityLogs(activitiesWithProfiles as any);
    }

    if (loginsError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch login history',
        variant: 'destructive',
      });
    } else {
      setLoginHistory(loginsWithProfiles as any);
    }

    setLoading(false);
  };

  const getActionBadge = (actionType: string) => {
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
  };

  const getBrowser = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = {
    totalActivities: activityLogs.length,
    totalLogins: loginHistory.filter(l => l.success).length,
    failedLogins: loginHistory.filter(l => !l.success).length,
    last24h: activityLogs.filter(log => {
      const logDate = new Date(log.created_at);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logDate > yesterday;
    }).length,
  };

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
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.profiles?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.profiles?.email || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action_type)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.action_details && Object.keys(log.action_details).length > 0
                            ? JSON.stringify(log.action_details)
                            : '-'}
                        </TableCell>
                        <TableCell>{getBrowser(log.user_agent)}</TableCell>
                        <TableCell>{formatDate(log.created_at, 'PPp')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
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
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Failure Reason</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {login.profiles?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {login.profiles?.email || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {login.success ? (
                            <Badge variant="default">Success</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getBrowser(login.user_agent)}</TableCell>
                        <TableCell>
                          {login.failure_reason || '-'}
                        </TableCell>
                        <TableCell>{formatDate(login.login_at, 'PPp')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
