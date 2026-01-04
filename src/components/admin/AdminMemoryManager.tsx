import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Brain, 
  Search, 
  Trash2, 
  Flag,
  Filter,
  User,
  Droplets
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
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

interface Memory {
  id: string;
  user_id: string;
  memory_key: string;
  memory_value: string;
  water_type: string | null;
  source: string | null;
  confidence: string | null;
  created_at: string;
  user_email?: string;
}

const chartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function AdminMemoryManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [waterTypeFilter, setWaterTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all memories with user info
  const { data: memories, isLoading } = useQuery({
    queryKey: ['admin-memories', categoryFilter, waterTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (waterTypeFilter !== 'all') {
        query = query.eq('water_type', waterTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get user emails
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const emailMap: Record<string, string> = {};
      profiles?.forEach(p => { emailMap[p.user_id] = p.email; });

      return data?.map(m => ({
        ...m,
        user_email: emailMap[m.user_id] || 'Unknown'
      })) as Memory[];
    },
    ...queryPresets.analytics,
  });

  // Delete memories mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('user_memories')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-memories'] });
      setSelectedIds(new Set());
      toast.success('Memories deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete memories: ' + (error as Error).message);
    },
  });

  // Filter memories
  const filteredMemories = memories?.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.memory_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.memory_value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || memory.memory_key.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  // Calculate analytics
  const analytics = {
    totalMemories: memories?.length || 0,
    uniqueUsers: new Set(memories?.map(m => m.user_id)).size,
    bySource: memories?.reduce((acc, m) => {
      const source = m.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    byWaterType: memories?.reduce((acc, m) => {
      const type = m.water_type || 'general';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    topCategories: Object.entries(
      memories?.reduce((acc, m) => {
        const key = m.memory_key.split('_')[0] || m.memory_key;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    ).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };

  const sourceChartData = Object.entries(analytics.bySource).map(([name, count]) => ({
    name,
    count,
    fill: name === 'conversation' ? 'hsl(var(--chart-1))' : 
          name === 'manual' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))'
  }));

  const categoryChartData = analytics.topCategories.map(([name, count]) => ({
    name,
    count,
  }));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredMemories?.map(m => m.id) || []));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    deleteMutation.mutate(Array.from(selectedIds));
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {analytics.totalMemories}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {analytics.uniqueUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">From Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.bySource['conversation'] || 0}</div>
            <p className="text-xs text-muted-foreground">AI-learned memories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Manual Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.bySource['manual'] || 0}</div>
            <p className="text-xs text-muted-foreground">User-created memories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Memory Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-48">
              <PieChart>
                <Pie
                  data={sourceChartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {sourceChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-48">
              <BarChart data={categoryChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Memory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Memories</CardTitle>
              <CardDescription>Browse and manage user memories across the platform</CardDescription>
            </div>
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search memories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={waterTypeFilter} onValueChange={setWaterTypeFilter}>
              <SelectTrigger className="w-40">
                <Droplets className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Water Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="freshwater">Freshwater</SelectItem>
                <SelectItem value="saltwater">Saltwater</SelectItem>
                <SelectItem value="pond">Pond</SelectItem>
                <SelectItem value="pool">Pool</SelectItem>
                <SelectItem value="spa">Spa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedIds.size === filteredMemories?.length && filteredMemories?.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Memory Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemories?.map(memory => (
                  <TableRow key={memory.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(memory.id)}
                        onCheckedChange={(checked) => handleSelectOne(memory.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{memory.user_email}</span>
                    </TableCell>
                    <TableCell className="font-medium">{memory.memory_key}</TableCell>
                    <TableCell className="max-w-xs truncate">{memory.memory_value}</TableCell>
                    <TableCell>
                      {memory.water_type && (
                        <Badge variant="outline">{memory.water_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={memory.source === 'conversation' ? 'default' : 'secondary'}
                      >
                        {memory.source || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(memory.created_at, 'PP')}
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredMemories || filteredMemories.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No memories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Memories?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected memories will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
