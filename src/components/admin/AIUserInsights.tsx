import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  MessageSquare, 
  Brain, 
  ThumbsUp, 
  ThumbsDown,
  Search,
  Eye,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { queryPresets } from '@/lib/queryConfig';

interface UserAIStats {
  user_id: string;
  email: string;
  name: string | null;
  subscription_tier: string | null;
  total_messages: number;
  total_memories: number;
  positive_feedback: number;
  negative_feedback: number;
  last_ai_interaction: string | null;
}

interface UserMemory {
  id: string;
  memory_key: string;
  memory_value: string;
  water_type: string | null;
  source: string | null;
  confidence: string | null;
  created_at: string;
}

interface UserMessage {
  id: string;
  content: string;
  role: string;
  created_at: string;
  conversation_title: string;
}

export default function AIUserInsights() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserAIStats | null>(null);
  const [detailTab, setDetailTab] = useState('memories');

  // Fetch user AI stats
  const { data: userStats, isLoading } = useQuery({
    queryKey: ['ai-user-stats'],
    queryFn: async () => {
      // Get all profiles with their basic info - limit to prevent performance issues
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, name, subscription_tier, last_ai_interaction')
        .order('last_ai_interaction', { ascending: false, nullsFirst: false })
        .limit(500);
      
      if (profilesError) throw profilesError;

      // Get chat message counts per user
      const { data: conversations, error: convError } = await supabase
        .from('chat_conversations')
        .select('user_id');
      if (convError) console.error('Failed to fetch conversations:', convError.message);

      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('conversation_id');
      if (msgError) console.error('Failed to fetch messages:', msgError.message);

      // Get memory counts per user
      const { data: memories, error: memError } = await supabase
        .from('user_memories')
        .select('user_id');
      if (memError) console.error('Failed to fetch memories:', memError.message);

      // Get feedback counts per user
      const { data: feedback, error: fbError } = await supabase
        .from('ai_feedback')
        .select('user_id, rating');
      if (fbError) console.error('Failed to fetch feedback:', fbError.message);

      // Build conversation to user mapping
      const conversationUserMap: Record<string, string> = {};
      conversations?.forEach(c => {
        conversationUserMap[c.user_id] = c.user_id;
      });

      // Aggregate stats
      const statsMap: Record<string, UserAIStats> = {};
      
      profiles?.forEach(profile => {
        statsMap[profile.user_id] = {
          user_id: profile.user_id,
          email: profile.email,
          name: profile.name,
          subscription_tier: profile.subscription_tier,
          total_messages: 0,
          total_memories: 0,
          positive_feedback: 0,
          negative_feedback: 0,
          last_ai_interaction: profile.last_ai_interaction,
        };
      });

      // Count memories
      memories?.forEach(m => {
        if (statsMap[m.user_id]) {
          statsMap[m.user_id].total_memories++;
        }
      });

      // Count feedback
      feedback?.forEach(f => {
        if (statsMap[f.user_id]) {
          if (f.rating === 'positive') {
            statsMap[f.user_id].positive_feedback++;
          } else {
            statsMap[f.user_id].negative_feedback++;
          }
        }
      });

      return Object.values(statsMap)
        .filter(u => u.total_memories > 0 || u.positive_feedback > 0 || u.negative_feedback > 0)
        .sort((a, b) => (b.total_memories + b.positive_feedback + b.negative_feedback) - 
                        (a.total_memories + a.positive_feedback + a.negative_feedback));
    },
    ...queryPresets.analytics,
  });

  // Fetch user memories when viewing details
  const { data: userMemories } = useQuery({
    queryKey: ['user-memories', selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', selectedUser.user_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserMemory[];
    },
    enabled: !!selectedUser,
  });

  // Fetch user chat messages when viewing details
  const { data: userMessages } = useQuery({
    queryKey: ['user-chat-messages', selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      // Get user's conversations first
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('id, title')
        .eq('user_id', selectedUser.user_id);
      
      if (!conversations || conversations.length === 0) return [];
      
      const conversationIds = conversations.map(c => c.id);
      const conversationTitleMap: Record<string, string> = {};
      conversations.forEach(c => { conversationTitleMap[c.id] = c.title; });
      
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return messages?.map(m => ({
        ...m,
        conversation_title: conversationTitleMap[m.conversation_id] || 'Unknown'
      })) as UserMessage[];
    },
    enabled: !!selectedUser,
  });

  // Filter users with debounced search
  const filteredUsers = useMemo(() => {
    if (!userStats) return [];
    const searchLower = debouncedSearchQuery.toLowerCase();
    return userStats.filter(user => {
      const matchesSearch = !debouncedSearchQuery ||
        user.email.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower);
      const matchesTier = tierFilter === 'all' || user.subscription_tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [userStats, debouncedSearchQuery, tierFilter]);

  const getEngagementLevel = (user: UserAIStats): { label: string; color: string } => {
    const total = user.total_memories + user.positive_feedback + user.negative_feedback;
    if (total >= 20) return { label: 'High', color: 'bg-green-500/10 text-green-600 border-green-500/30' };
    if (total >= 5) return { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
    return { label: 'Low', color: 'bg-muted text-muted-foreground' };
  };

  const getSatisfactionRate = (user: UserAIStats): number | null => {
    const total = user.positive_feedback + user.negative_feedback;
    if (total === 0) return null;
    return Math.round((user.positive_feedback / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
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
            <CardTitle className="text-sm font-medium">Active AI Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Users with AI interactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.reduce((sum, u) => sum + u.total_memories, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats && userStats.length > 0 
                ? Math.round(
                    userStats.reduce((sum, u) => sum + u.positive_feedback, 0) / 
                    Math.max(1, userStats.reduce((sum, u) => sum + u.positive_feedback + u.negative_feedback, 0)) * 100
                  )
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Based on feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.filter(u => getEngagementLevel(u).label === 'High').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Power users</p>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User AI Insights</CardTitle>
          <CardDescription>View AI usage statistics per user</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Memories</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map(user => {
                  const engagement = getEngagementLevel(user);
                  const satisfaction = getSatisfactionRate(user);
                  
                  return (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{user.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.subscription_tier || 'free'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          {user.total_memories}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 flex items-center gap-0.5">
                            <ThumbsUp className="h-3 w-3" />
                            {user.positive_feedback}
                          </span>
                          <span className="text-amber-600 flex items-center gap-0.5">
                            <ThumbsDown className="h-3 w-3" />
                            {user.negative_feedback}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {satisfaction !== null ? (
                          <span className={satisfaction >= 70 ? 'text-green-600' : satisfaction >= 50 ? 'text-amber-600' : 'text-red-600'}>
                            {satisfaction}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={engagement.color}>
                          {engagement.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_ai_interaction ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(user.last_ai_interaction, 'PP')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredUsers || filteredUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No users with AI interactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              AI interaction details for this user
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 overflow-hidden">
            <TabsList>
              <TabsTrigger value="memories">
                <Brain className="h-4 w-4 mr-1" />
                Memories ({userMemories?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="h-4 w-4 mr-1" />
                Messages ({userMessages?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="memories" className="overflow-auto max-h-[50vh]">
              <div className="space-y-2">
                {userMemories?.map(memory => (
                  <Card key={memory.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{memory.memory_key}</p>
                        <p className="text-sm text-muted-foreground">{memory.memory_value}</p>
                      </div>
                      <div className="flex gap-1">
                        {memory.water_type && (
                          <Badge variant="outline" className="text-xs">{memory.water_type}</Badge>
                        )}
                        {memory.source && (
                          <Badge variant="secondary" className="text-xs">{memory.source}</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(memory.created_at, 'PPp')}
                    </p>
                  </Card>
                ))}
                {(!userMemories || userMemories.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No memories found</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="messages" className="overflow-auto max-h-[50vh]">
              <div className="space-y-2">
                {userMessages?.map(message => (
                  <Card key={message.id} className={`p-3 ${message.role === 'assistant' ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                            {message.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{message.conversation_title}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap line-clamp-3">{message.content}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(message.created_at, 'PPp')}
                    </p>
                  </Card>
                ))}
                {(!userMessages || userMessages.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No messages found</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
