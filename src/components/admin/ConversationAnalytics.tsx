import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Users, 
  Clock,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { queryPresets } from '@/lib/queryConfig';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar, CartesianGrid } from 'recharts';
import { subDays, format, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay, getHours } from 'date-fns';

const chartConfig = {
  conversations: {
    label: 'Conversations',
    color: 'hsl(var(--chart-1))',
  },
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function ConversationAnalytics() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const startDate = subDays(new Date(), daysBack);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['admin-conversations', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, user_id, created_at, updated_at, title')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    ...queryPresets.analytics,
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-messages', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, conversation_id, role, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      return data;
    },
    ...queryPresets.analytics,
  });

  // Calculate daily trends
  const dailyTrends = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayConversations = conversations?.filter(c => {
        const date = new Date(c.created_at);
        return date >= dayStart && date <= dayEnd;
      }).length || 0;
      
      const dayMessages = messages?.filter(m => {
        const date = new Date(m.created_at);
        return date >= dayStart && date <= dayEnd;
      }).length || 0;
      
      return {
        date: format(day, 'MMM d'),
        fullDate: format(day, 'yyyy-MM-dd'),
        conversations: dayConversations,
        messages: dayMessages,
      };
    });
  }, [conversations, messages, startDate]);

  // Calculate hourly distribution
  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const hourMessages = messages?.filter(m => {
        const date = new Date(m.created_at);
        return getHours(date) === hour;
      }).length || 0;
      
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        messages: hourMessages,
      };
    });
  }, [messages]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalConversations = conversations?.length || 0;
    const totalMessages = messages?.length || 0;
    const uniqueUsers = new Set(conversations?.map(c => c.user_id)).size;
    const avgMessagesPerConvo = totalConversations > 0 
      ? Math.round(totalMessages / totalConversations) 
      : 0;
    
    // Calculate messages by role
    const userMessages = messages?.filter(m => m.role === 'user').length || 0;
    const assistantMessages = messages?.filter(m => m.role === 'assistant').length || 0;
    
    // Find peak hour
    const peakHour = hourlyDistribution.reduce((max, curr) => 
      curr.messages > max.messages ? curr : max
    , { hour: '00:00', messages: 0 });
    
    return {
      totalConversations,
      totalMessages,
      uniqueUsers,
      avgMessagesPerConvo,
      userMessages,
      assistantMessages,
      peakHour: peakHour.hour,
      peakHourMessages: peakHour.messages,
    };
  }, [conversations, messages, hourlyDistribution]);

  // Get recent conversations
  const recentConversations = useMemo(() => {
    if (!conversations || !messages) return [];
    
    return conversations.slice(0, 10).map(conv => {
      const convMessages = messages.filter(m => m.conversation_id === conv.id);
      return {
        ...conv,
        messageCount: convMessages.length,
        lastActivity: convMessages.length > 0 
          ? convMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : conv.updated_at,
      };
    });
  }, [conversations, messages]);

  const isLoading = conversationsLoading || messagesLoading;

  if (isLoading) {
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
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as '7d' | '30d' | '90d')}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {stats.totalConversations}
            </div>
            <p className="text-xs text-muted-foreground">Last {daysBack} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.userMessages} user / {stats.assistantMessages} AI
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {stats.uniqueUsers}
            </div>
            <p className="text-xs text-muted-foreground">Unique chatters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Messages/Convo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMessagesPerConvo}</div>
            <p className="text-xs text-muted-foreground">Messages per conversation</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Activity
            </CardTitle>
            <CardDescription>Conversations and messages over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <AreaChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="conversations" 
                  stackId="1"
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="messages" 
                  stackId="2"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))" 
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Peak Usage Hours
            </CardTitle>
            <CardDescription>
              Busiest hour: {stats.peakHour} ({stats.peakHourMessages} messages)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="messages" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Conversations
          </CardTitle>
          <CardDescription>Latest chat activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentConversations.map(conv => (
              <div 
                key={conv.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(conv.created_at, 'PPp')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{conv.messageCount} msgs</Badge>
                  <span className="text-xs text-muted-foreground">
                    Last: {formatDate(conv.lastActivity, 'PP')}
                  </span>
                </div>
              </div>
            ))}
            {recentConversations.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No conversations in this period
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
