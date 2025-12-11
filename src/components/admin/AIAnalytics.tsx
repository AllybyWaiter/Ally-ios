import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  ThumbsUp, 
  ThumbsDown, 
  Camera, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Target,
  Activity
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface FeedbackStats {
  feature: string;
  positive: number;
  negative: number;
  total: number;
  satisfaction: number;
}

interface ParameterAccuracy {
  parameter: string;
  totalDetections: number;
  corrections: number;
  accuracy: number;
  avgDelta: number;
}

interface RecentFeedback {
  id: string;
  feature: string;
  rating: string;
  feedback_text: string | null;
  created_at: string;
}

interface RecentCorrection {
  id: string;
  parameter_name: string;
  ai_detected_value: number;
  user_corrected_value: number;
  correction_delta: number;
  ai_confidence: number | null;
  created_at: string;
}

const featureLabels: Record<string, string> = {
  chat: 'Ally Chat',
  photo_analysis: 'Photo Analysis',
  task_suggestions: 'Task Suggestions',
  ticket_reply: 'Ticket Reply'
};

const chartConfig = {
  positive: {
    label: 'Positive',
    color: 'hsl(var(--chart-1))',
  },
  negative: {
    label: 'Negative',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function AIAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch feedback data
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ['ai-feedback-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('feature, rating');
      
      if (error) throw error;
      
      // Aggregate by feature
      const stats: Record<string, { positive: number; negative: number }> = {};
      data?.forEach(item => {
        if (!stats[item.feature]) {
          stats[item.feature] = { positive: 0, negative: 0 };
        }
        if (item.rating === 'positive') {
          stats[item.feature].positive++;
        } else {
          stats[item.feature].negative++;
        }
      });

      const result: FeedbackStats[] = Object.entries(stats).map(([feature, counts]) => ({
        feature,
        positive: counts.positive,
        negative: counts.negative,
        total: counts.positive + counts.negative,
        satisfaction: counts.positive + counts.negative > 0 
          ? Math.round((counts.positive / (counts.positive + counts.negative)) * 100)
          : 0
      }));

      return result;
    }
  });

  // Fetch photo analysis corrections
  const { data: correctionsData, isLoading: correctionsLoading } = useQuery({
    queryKey: ['photo-corrections-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_analysis_corrections')
        .select('parameter_name, ai_detected_value, user_corrected_value, correction_delta, ai_confidence');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch total photo analyses
  const { data: photoTestsCount } = useQuery({
    queryKey: ['photo-tests-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('water_tests')
        .select('*', { count: 'exact', head: true })
        .eq('entry_method', 'photo');
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch recent feedback
  const { data: recentFeedback, isLoading: recentFeedbackLoading } = useQuery({
    queryKey: ['recent-ai-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('id, feature, rating, feedback_text, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as RecentFeedback[];
    }
  });

  // Fetch recent corrections
  const { data: recentCorrections, isLoading: recentCorrectionsLoading } = useQuery({
    queryKey: ['recent-corrections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_analysis_corrections')
        .select('id, parameter_name, ai_detected_value, user_corrected_value, correction_delta, ai_confidence, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as RecentCorrection[];
    }
  });

  // Calculate KPIs
  const totalFeedback = feedbackData?.reduce((sum, f) => sum + f.total, 0) || 0;
  const totalPositive = feedbackData?.reduce((sum, f) => sum + f.positive, 0) || 0;
  const overallSatisfaction = totalFeedback > 0 ? Math.round((totalPositive / totalFeedback) * 100) : 0;
  
  // Calculate parameter accuracy stats
  const parameterStats: ParameterAccuracy[] = (() => {
    if (!correctionsData) return [];
    
    const paramMap: Record<string, { corrections: number; totalDelta: number }> = {};
    correctionsData.forEach(c => {
      if (!paramMap[c.parameter_name]) {
        paramMap[c.parameter_name] = { corrections: 0, totalDelta: 0 };
      }
      paramMap[c.parameter_name].corrections++;
      paramMap[c.parameter_name].totalDelta += c.correction_delta;
    });

    // Estimate total detections (corrections + uncorrected)
    // We'll assume each photo test detects ~7 parameters on average
    const avgParamsPerTest = 7;
    const estimatedTotalDetections = (photoTestsCount || 0) * avgParamsPerTest;
    const detectedParams = ['pH', 'Ammonia', 'Nitrite', 'Nitrate', 'GH', 'KH', 'Chlorine', 'Temperature'];
    
    return detectedParams.map(param => {
      const stats = paramMap[param] || { corrections: 0, totalDelta: 0 };
      const estimatedForParam = Math.round(estimatedTotalDetections / detectedParams.length);
      const accuracy = estimatedForParam > 0 
        ? Math.round(((estimatedForParam - stats.corrections) / estimatedForParam) * 100)
        : 100;
      
      return {
        parameter: param,
        totalDetections: estimatedForParam,
        corrections: stats.corrections,
        accuracy: Math.max(0, Math.min(100, accuracy)),
        avgDelta: stats.corrections > 0 ? stats.totalDelta / stats.corrections : 0
      };
    }).filter(p => p.totalDetections > 0 || p.corrections > 0);
  })();

  const totalCorrections = correctionsData?.length || 0;
  const photoAccuracy = photoTestsCount && photoTestsCount > 0
    ? Math.round(((photoTestsCount - totalCorrections) / photoTestsCount) * 100)
    : 100;

  // Chart data for feedback by feature
  const feedbackChartData = feedbackData?.map(f => ({
    name: featureLabels[f.feature] || f.feature,
    positive: f.positive,
    negative: f.negative,
  })) || [];

  // Pie chart data
  const pieData = [
    { name: 'Positive', value: totalPositive, fill: 'hsl(var(--chart-1))' },
    { name: 'Negative', value: totalFeedback - totalPositive, fill: 'hsl(var(--chart-2))' },
  ];

  const exportCorrections = () => {
    if (!recentCorrections?.length) return;
    const headers = ['Parameter', 'AI Value', 'User Value', 'Delta', 'Confidence', 'Date'];
    const csvContent = [
      headers.join(','),
      ...recentCorrections.map(c => [
        c.parameter_name,
        c.ai_detected_value,
        c.user_corrected_value,
        c.correction_delta.toFixed(2),
        c.ai_confidence?.toFixed(2) || 'N/A',
        formatDate(c.created_at, 'PP')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-corrections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (feedbackLoading || correctionsLoading) {
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
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AI Interactions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedback + (photoTestsCount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {totalFeedback} feedback + {photoTestsCount || 0} photo analyses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallSatisfaction}%</div>
            <p className="text-xs text-muted-foreground">
              {totalPositive} positive / {totalFeedback} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photo Analysis Accuracy</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photoAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              {totalCorrections} corrections made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parameters Corrected</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCorrections}</div>
            <p className="text-xs text-muted-foreground">
              Total corrections logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <TrendingUp className="mr-2 h-4 w-4" />
            Feedback Overview
          </TabsTrigger>
          <TabsTrigger value="photo">
            <Camera className="mr-2 h-4 w-4" />
            Photo Analysis
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Activity className="mr-2 h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        {/* Feedback Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Feature</CardTitle>
                <CardDescription>Positive vs negative feedback breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackChartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={feedbackChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="positive" fill="var(--color-positive)" radius={4} />
                      <Bar dataKey="negative" fill="var(--color-negative)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No feedback data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Sentiment</CardTitle>
                <CardDescription>Distribution of positive vs negative</CardDescription>
              </CardHeader>
              <CardContent>
                {totalFeedback > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No feedback data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead className="text-center">Positive</TableHead>
                    <TableHead className="text-center">Negative</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackData?.length ? feedbackData.map(f => (
                    <TableRow key={f.feature}>
                      <TableCell className="font-medium">
                        {featureLabels[f.feature] || f.feature}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          {f.positive}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                          {f.negative}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{f.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={f.satisfaction >= 80 ? 'default' : f.satisfaction >= 60 ? 'secondary' : 'destructive'}
                        >
                          {f.satisfaction}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No feedback data collected yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photo Analysis Tab */}
        <TabsContent value="photo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Parameter Accuracy</CardTitle>
                  <CardDescription>AI detection accuracy by water parameter</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCorrections}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Corrections
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="text-center">Est. Detections</TableHead>
                    <TableHead className="text-center">Corrections</TableHead>
                    <TableHead className="text-center">Accuracy</TableHead>
                    <TableHead className="text-center">Avg Delta</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameterStats.length > 0 ? parameterStats.map(p => (
                    <TableRow key={p.parameter}>
                      <TableCell className="font-medium">{p.parameter}</TableCell>
                      <TableCell className="text-center">{p.totalDetections}</TableCell>
                      <TableCell className="text-center">{p.corrections}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={p.accuracy >= 90 ? 'default' : p.accuracy >= 75 ? 'secondary' : 'destructive'}
                        >
                          {p.accuracy}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.avgDelta > 0 ? p.avgDelta.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.accuracy < 80 && (
                          <div className="flex items-center justify-center text-amber-500">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Needs attention</span>
                          </div>
                        )}
                        {p.accuracy >= 80 && p.accuracy < 90 && (
                          <span className="text-xs text-muted-foreground">Good</span>
                        )}
                        {p.accuracy >= 90 && (
                          <span className="text-xs text-green-600">Excellent</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No photo analysis data yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Confidence Calibration */}
          <Card>
            <CardHeader>
              <CardTitle>Confidence Calibration</CardTitle>
              <CardDescription>
                How well AI confidence scores predict actual accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {correctionsData && correctionsData.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">High Confidence (&gt;0.8)</div>
                      <div className="text-xl font-bold">
                        {correctionsData.filter(c => (c.ai_confidence || 0) > 0.8).length}
                      </div>
                      <div className="text-xs text-muted-foreground">corrections</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">Medium (0.5-0.8)</div>
                      <div className="text-xl font-bold">
                        {correctionsData.filter(c => {
                          const conf = c.ai_confidence || 0;
                          return conf >= 0.5 && conf <= 0.8;
                        }).length}
                      </div>
                      <div className="text-xs text-muted-foreground">corrections</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">Low (&lt;0.5)</div>
                      <div className="text-xl font-bold">
                        {correctionsData.filter(c => (c.ai_confidence || 0) < 0.5).length}
                      </div>
                      <div className="text-xs text-muted-foreground">corrections</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Lower corrections at higher confidence = well-calibrated model
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No correction data available for confidence analysis
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="recent" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Recent Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {recentFeedbackLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : recentFeedback?.length ? (
                    <div className="space-y-3">
                      {recentFeedback.map(f => (
                        <div key={f.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">
                              {featureLabels[f.feature] || f.feature}
                            </Badge>
                            {f.rating === 'positive' ? (
                              <ThumbsUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {f.feedback_text && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {f.feedback_text}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(f.created_at, 'PPp')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No feedback entries yet
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Corrections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Recent Corrections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {recentCorrectionsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : recentCorrections?.length ? (
                    <div className="space-y-3">
                      {recentCorrections.map(c => (
                        <div key={c.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{c.parameter_name}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Δ {c.correction_delta.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">AI: </span>
                              <span className="text-red-500">{c.ai_detected_value}</span>
                            </div>
                            <span>→</span>
                            <div>
                              <span className="text-muted-foreground">User: </span>
                              <span className="text-green-500">{c.user_corrected_value}</span>
                            </div>
                          </div>
                          {c.ai_confidence != null && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Confidence: {(c.ai_confidence * 100).toFixed(0)}%
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(c.created_at, 'PPp')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No corrections logged yet
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
