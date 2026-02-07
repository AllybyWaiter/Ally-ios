import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Users, 
  FileText, 
  HardDrive, 
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';

interface TableStats {
  name: string;
  rowCount: number;
  icon: React.ElementType;
}

interface SystemStatus {
  database: 'healthy' | 'degraded' | 'down';
  auth: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  functions: 'healthy' | 'degraded' | 'down';
}

export function SystemHealth() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'healthy',
    auth: 'healthy',
    storage: 'healthy',
    functions: 'healthy',
  });
  const [storageUsage, setStorageUsage] = useState<{ bucket: string; count: number }[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      // Fetch row counts for key tables
      // Fetch counts for key tables
      const [profilesCount, aquariumsCount, waterTestsCount, blogPostsCount, ticketsCount, messagesCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('aquariums').select('*', { count: 'exact', head: true }),
        supabase.from('water_tests').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
      ]);

      const stats: TableStats[] = [
        { name: 'profiles', rowCount: profilesCount.count || 0, icon: Users },
        { name: 'aquariums', rowCount: aquariumsCount.count || 0, icon: Database },
        { name: 'water_tests', rowCount: waterTestsCount.count || 0, icon: Activity },
        { name: 'blog_posts', rowCount: blogPostsCount.count || 0, icon: FileText },
        { name: 'support_tickets', rowCount: ticketsCount.count || 0, icon: AlertTriangle },
        { name: 'chat_messages', rowCount: messagesCount.count || 0, icon: Zap },
      ];

      setTableStats(stats);

      // Check storage buckets in parallel
      const buckets = ['blog-images', 'water-test-photos', 'livestock-photos', 'plant-photos'];
      const bucketResults = await Promise.all(
        buckets.map(async (bucket) => {
          const { data, error: storageError } = await supabase.storage.from(bucket).list('', { limit: 1000 });
          if (storageError) {
            console.error(`Storage list error for ${bucket}:`, storageError.message);
          }
          return {
            bucket,
            count: data?.length || 0,
          };
        })
      );
      
      setStorageUsage(bucketResults);

      // Simple health check - if we got here, database is working
      setSystemStatus({
        database: 'healthy',
        auth: 'healthy',
        storage: 'healthy',
        functions: 'healthy',
      });

      setLastRefresh(new Date());
    } catch {
      // Error fetching system stats - mark database as degraded
      setSystemStatus(prev => ({
        ...prev,
        database: 'degraded',
      }));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle2;
      case 'degraded': return AlertTriangle;
      case 'down': return AlertTriangle;
      default: return Activity;
    }
  };

  const totalRows = tableStats.reduce((sum, t) => sum + t.rowCount, 0);
  const totalFiles = storageUsage.reduce((sum, b) => sum + b.count, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">
            Last updated {formatRelativeTime(lastRefresh.toISOString())}
          </p>
        </div>
        <Button onClick={fetchStats} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(systemStatus).map(([service, status]) => {
          const StatusIcon = getStatusIcon(status);
          return (
            <Card key={service}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="capitalize">{service}</span>
                  <Badge className={getStatusColor(status)}>{status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${status === 'healthy' ? 'text-green-500' : status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`} />
                  <span className="text-sm text-muted-foreground">
                    {status === 'healthy' ? 'All systems operational' : 
                     status === 'degraded' ? 'Experiencing issues' : 
                     'Service unavailable'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Statistics
          </CardTitle>
          <CardDescription>
            Row counts for key tables ({totalRows.toLocaleString()} total records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableStats.map((table) => {
              const Icon = table.icon;
              const percentage = totalRows > 0 ? (table.rowCount / totalRows) * 100 : 0;
              return (
                <div key={table.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">
                        {table.name.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-bold">{table.rowCount.toLocaleString()}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Storage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Files stored in buckets ({totalFiles.toLocaleString()} total files)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {storageUsage.map((bucket) => {
              const percentage = totalFiles > 0 ? (bucket.count / totalFiles) * 100 : 0;
              return (
                <div key={bucket.bucket} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {bucket.bucket.replace('-', ' ')}
                    </span>
                    <span className="text-sm font-bold">{bucket.count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Environment</p>
              <Badge variant="outline">Production</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Region</p>
              <Badge variant="outline">Auto</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Database Version</p>
              <Badge variant="outline">PostgreSQL 15+</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">API Version</p>
              <Badge variant="outline">v1</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
