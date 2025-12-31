import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  MessageSquare,
  Camera,
  Sparkles
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { queryPresets } from '@/lib/queryConfig';
import { PLAN_DEFINITIONS, type PlanTier } from '@/lib/planConstants';

interface RateLimitInfo {
  tier: string;
  chatLimit: number;
  photoLimit: number;
  memoryLimit: number;
}

// Build tier limits from plan constants
const tierLimits: RateLimitInfo[] = (['free', 'basic', 'plus', 'gold', 'business', 'enterprise'] as PlanTier[]).map(tier => ({
  tier,
  chatLimit: PLAN_DEFINITIONS[tier].adminLimits.chatLimit,
  photoLimit: PLAN_DEFINITIONS[tier].adminLimits.photoLimit,
  memoryLimit: PLAN_DEFINITIONS[tier].adminLimits.memoryLimit,
}));

const systemPromptPreview = `You are Ally, a friendly AI assistant specialized in aquatic care...

Key capabilities:
- Water parameter analysis and recommendations
- Fish and plant care advice
- Equipment maintenance guidance
- Personalized suggestions based on user preferences

The assistant has access to:
- User's aquarium/pool/spa/pond data
- Historical water test results
- Equipment and livestock information
- User memories and preferences`;

export default function AIModelSettings() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch usage stats
  const { data: usageStats, isLoading } = useQuery({
    queryKey: ['ai-usage-stats'],
    queryFn: async () => {
      // Get chat message counts by tier
      const { data: profiles } = await supabase
        .from('profiles')
        .select('subscription_tier');
      
      const tierCounts: Record<string, number> = {};
      profiles?.forEach(p => {
        const tier = p.subscription_tier || 'free';
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      });

      // Get today's usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayChats } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: todayPhotos } = await supabase
        .from('water_tests')
        .select('*', { count: 'exact', head: true })
        .eq('entry_method', 'photo')
        .gte('created_at', today.toISOString());

      const { count: totalMemories } = await supabase
        .from('user_memories')
        .select('*', { count: 'exact', head: true });

      return {
        tierCounts,
        todayChats: todayChats || 0,
        todayPhotos: todayPhotos || 0,
        totalMemories: totalMemories || 0,
      };
    },
    ...queryPresets.analytics,
  });

  // Fetch AI features from feature flags
  const { data: aiFeatureFlags } = useQuery({
    queryKey: ['ai-feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .or('key.ilike.%ai%,key.ilike.%chat%,key.ilike.%photo%');
      
      if (error) throw error;
      return data;
    },
    ...queryPresets.analytics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Model Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Current AI Configuration
              </CardTitle>
              <CardDescription>Active model and settings overview</CardDescription>
            </div>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Operational
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Primary Model</p>
              <p className="text-lg font-semibold">Lovable AI Gateway</p>
              <Badge variant="outline">google/gemini-2.5-flash</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Fallback Model</p>
              <p className="text-lg font-semibold">OpenAI GPT-5</p>
              <Badge variant="outline">openai/gpt-5-mini</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Vision Model</p>
              <p className="text-lg font-semibold">Gemini 2.5 Pro</p>
              <Badge variant="outline">Photo Analysis</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Today */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Messages Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.todayChats || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Analyses Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.todayPhotos || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Total Memories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.totalMemories || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Rate Limits</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rate Limits by Tier
              </CardTitle>
              <CardDescription>Daily usage limits per subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {tierLimits.map(tier => {
                  const userCount = usageStats?.tierCounts[tier.tier] || 0;
                  
                  return (
                    <div key={tier.tier} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={tier.tier === 'enterprise' ? 'default' : 'outline'}>
                            {tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {userCount} users
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>Chat: {tier.chatLimit === -1 ? 'Unlimited' : `${tier.chatLimit}/day`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          <span>Photos: {tier.photoLimit === -1 ? 'Unlimited' : `${tier.photoLimit}/day`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          <span>Memories: {tier.memoryLimit === -1 ? 'Unlimited' : tier.memoryLimit === 0 ? 'None' : tier.memoryLimit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                System Prompt Preview
              </CardTitle>
              <CardDescription>
                The base prompt used for Ally chat (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <pre className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono">
                  {systemPromptPreview}
                </pre>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-4">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                System prompts are managed in edge functions. Contact development team to make changes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                AI-Related Feature Flags
              </CardTitle>
              <CardDescription>
                Control AI features through feature flags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiFeatureFlags?.map(flag => (
                  <div 
                    key={flag.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{flag.name}</p>
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {flag.rollout_percentage}%
                      </span>
                    </div>
                  </div>
                ))}
                {(!aiFeatureFlags || aiFeatureFlags.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No AI-related feature flags found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
