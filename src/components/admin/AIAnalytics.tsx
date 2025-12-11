import { useState, useMemo } from 'react';
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
  TrendingDown,
  AlertTriangle,
  Download,
  Target,
  Activity,
  LineChart as LineChartIcon
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid, Legend, Tooltip } from 'recharts';
import { subDays, format, startOfDay, eachDayOfInterval } from 'date-fns';

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

interface DailyTrend {
  date: string;
  fullDate: string;
  satisfactionRate: number | null;
  positiveCount: number;
  negativeCount: number;
  totalFeedback: number;
}

interface DailyAccuracy {
  date: string;
  fullDate: string;
  accuracyRate: number | null;
  photoTests: number;
  corrections: number;
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

  // Fetch feedback trends (last 30 days)
  const { data: feedbackTrendsRaw } = useQuery({
    queryKey: ['ai-feedback-trends'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('rating, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch correction trends (last 30 days)
  const { data: correctionTrendsRaw } = useQuery({
    queryKey: ['correction-trends'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data, error } = await supabase
        .from('photo_analysis_corrections')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch photo test trends (last 30 days)
  const { data: photoTestTrendsRaw } = useQuery({
    queryKey: ['photo-test-trends'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data, error } = await supabase
        .from('water_tests')
        .select('created_at')
        .eq('entry_method', 'photo')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      return data;
    }
  });

  // Aggregate feedback trends by day
  const satisfactionTrends = useMemo((): DailyTrend[] => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
    
    const dayMap: Record<string, { positive: number; negative: number }> = {};
    days.forEach(day => {
      dayMap[format(day, 'yyyy-MM-dd')] = { positive: 0, negative: 0 };
    });
    
    feedbackTrendsRaw?.forEach(item => {
      const dayKey = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dayMap[dayKey]) {
        if (item.rating === 'positive') {
          dayMap[dayKey].positive++;
        } else {
          dayMap[dayKey].negative++;
        }
      }
    });
    
    return days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const stats = dayMap[dayKey];
      const total = stats.positive + stats.negative;
      return {
        date: format(day, 'MMM d'),
        fullDate: dayKey,
        satisfactionRate: total > 0 ? Math.round((stats.positive / total) * 100) : null,
        positiveCount: stats.positive,
        negativeCount: stats.negative,
        totalFeedback: total
      };
    });
  }, [feedbackTrendsRaw]);

  // Aggregate accuracy trends by day
  const accuracyTrends = useMemo((): DailyAccuracy[] => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
    
    const dayMap: Record<string, { photoTests: number; corrections: number }> = {};
    days.forEach(day => {
      dayMap[format(day, 'yyyy-MM-dd')] = { photoTests: 0, corrections: 0 };
    });
    
    photoTestTrendsRaw?.forEach(item => {
      const dayKey = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dayMap[dayKey]) {
        dayMap[dayKey].photoTests++;
      }
    });
    
    correctionTrendsRaw?.forEach(item => {
      const dayKey = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dayMap[dayKey]) {
        dayMap[dayKey].corrections++;
      }
    });
    
    return days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const stats = dayMap[dayKey];
      return {
        date: format(day, 'MMM d'),
        fullDate: dayKey,
        accuracyRate: stats.photoTests > 0 
          ? Math.round(((stats.photoTests - stats.corrections) / stats.photoTests) * 100)
          : null,
        photoTests: stats.photoTests,
        corrections: stats.corrections
      };
    });
  }, [photoTestTrendsRaw, correctionTrendsRaw]);

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    const last7Days = satisfactionTrends.slice(-7);
    const prev7Days = satisfactionTrends.slice(-14, -7);
    
    const last7Satisfaction = last7Days.filter(d => d.satisfactionRate !== null);
    const prev7Satisfaction = prev7Days.filter(d => d.satisfactionRate !== null);
    
    const avgLast7 = last7Satisfaction.length > 0
      ? Math.round(last7Satisfaction.reduce((sum, d) => sum + (d.satisfactionRate || 0), 0) / last7Satisfaction.length)
      : null;
    const avgPrev7 = prev7Satisfaction.length > 0
      ? Math.round(prev7Satisfaction.reduce((sum, d) => sum + (d.satisfactionRate || 0), 0) / prev7Satisfaction.length)
      : null;
    
    const satisfactionTrend = avgLast7 !== null && avgPrev7 !== null 
      ? avgLast7 - avgPrev7 
      : null;
    
    // Accuracy trends
    const last7Accuracy = accuracyTrends.slice(-7).filter(d => d.accuracyRate !== null);
    const prev7Accuracy = accuracyTrends.slice(-14, -7).filter(d => d.accuracyRate !== null);
    
    const avgLast7Accuracy = last7Accuracy.length > 0
      ? Math.round(last7Accuracy.reduce((sum, d) => sum + (d.accuracyRate || 0), 0) / last7Accuracy.length)
      : null;
    const avgPrev7Accuracy = prev7Accuracy.length > 0
      ? Math.round(prev7Accuracy.reduce((sum, d) => sum + (d.accuracyRate || 0), 0) / prev7Accuracy.length)
      : null;
    
    const accuracyTrendVal = avgLast7Accuracy !== null && avgPrev7Accuracy !== null 
      ? avgLast7Accuracy - avgPrev7Accuracy 
      : null;
    
    // Overall averages
    const allSatisfaction = satisfactionTrends.filter(d => d.satisfactionRate !== null);
    const overallAvgSatisfaction = allSatisfaction.length > 0
      ? Math.round(allSatisfaction.reduce((sum, d) => sum + (d.satisfactionRate || 0), 0) / allSatisfaction.length)
      : null;
    
    const allAccuracy = accuracyTrends.filter(d => d.accuracyRate !== null);
    const overallAvgAccuracy = allAccuracy.length > 0
      ? Math.round(allAccuracy.reduce((sum, d) => sum + (d.accuracyRate || 0), 0) / allAccuracy.length)
      : null;
    
    return {
      satisfactionTrend,
      accuracyTrend: accuracyTrendVal,
      avgSatisfaction: overallAvgSatisfaction,
      avgAccuracy: overallAvgAccuracy,
      totalFeedbackPeriod: satisfactionTrends.reduce((sum, d) => sum + d.totalFeedback, 0),
      totalPhotoTestsPeriod: accuracyTrends.reduce((sum, d) => sum + d.photoTests, 0)
    };
  }, [satisfactionTrends, accuracyTrends]);


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
          <TabsTrigger value="trends">
            <LineChartIcon className="mr-2 h-4 w-4" />
            Trends
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

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Avg Satisfaction</div>
                  <div className="text-2xl font-bold">
                    {trendStats.avgSatisfaction !== null ? `${trendStats.avgSatisfaction}%` : '-'}
                  </div>
                  {trendStats.satisfactionTrend !== null && (
                    <div className={`flex items-center justify-center text-xs ${
                      trendStats.satisfactionTrend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trendStats.satisfactionTrend >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {trendStats.satisfactionTrend >= 0 ? '+' : ''}{trendStats.satisfactionTrend}% vs prev 7d
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Avg Accuracy</div>
                  <div className="text-2xl font-bold">
                    {trendStats.avgAccuracy !== null ? `${trendStats.avgAccuracy}%` : '-'}
                  </div>
                  {trendStats.accuracyTrend !== null && (
                    <div className={`flex items-center justify-center text-xs ${
                      trendStats.accuracyTrend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trendStats.accuracyTrend >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {trendStats.accuracyTrend >= 0 ? '+' : ''}{trendStats.accuracyTrend}% vs prev 7d
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Feedback (30d)</div>
                  <div className="text-2xl font-bold">{trendStats.totalFeedbackPeriod}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Photo Tests (30d)</div>
                  <div className="text-2xl font-bold">{trendStats.totalPhotoTestsPeriod}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Satisfaction Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Satisfaction Rate Over Time</CardTitle>
              <CardDescription>Daily user satisfaction rate for the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {satisfactionTrends.some(d => d.totalFeedback > 0) ? (
                <ChartContainer 
                  config={{
                    satisfactionRate: { label: 'Satisfaction Rate', color: 'hsl(var(--chart-1))' },
                    positiveCount: { label: 'Positive', color: 'hsl(var(--chart-1))' },
                    negativeCount: { label: 'Negative', color: 'hsl(var(--chart-2))' },
                  }} 
                  className="h-[300px]"
                >
                  <AreaChart data={satisfactionTrends}>
                    <defs>
                      <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      interval={4}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${value}%`}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as DailyTrend;
                          return (
                            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.date}</p>
                              {data.satisfactionRate !== null ? (
                                <>
                                  <p className="text-sm text-muted-foreground">
                                    Satisfaction: <span className="font-medium text-foreground">{data.satisfactionRate}%</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {data.positiveCount} positive, {data.negativeCount} negative
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">No data</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="satisfactionRate" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      fill="url(#satisfactionGradient)"
                      connectNulls
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No feedback data available for the past 30 days</p>
                    <p className="text-sm mt-1">Start collecting feedback to see trends here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accuracy Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Photo Analysis Accuracy Over Time</CardTitle>
              <CardDescription>Daily accuracy rate for AI photo analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {accuracyTrends.some(d => d.photoTests > 0) ? (
                <ChartContainer 
                  config={{
                    accuracyRate: { label: 'Accuracy Rate', color: 'hsl(var(--chart-3))' },
                    photoTests: { label: 'Photo Tests', color: 'hsl(var(--chart-3))' },
                    corrections: { label: 'Corrections', color: 'hsl(var(--chart-2))' },
                  }} 
                  className="h-[300px]"
                >
                  <AreaChart data={accuracyTrends}>
                    <defs>
                      <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      interval={4}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${value}%`}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as DailyAccuracy;
                          return (
                            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.date}</p>
                              {data.accuracyRate !== null ? (
                                <>
                                  <p className="text-sm text-muted-foreground">
                                    Accuracy: <span className="font-medium text-foreground">{data.accuracyRate}%</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {data.photoTests} tests, {data.corrections} corrections
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">No data</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="accuracyRate" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      fill="url(#accuracyGradient)"
                      connectNulls
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No photo analysis data available for the past 30 days</p>
                    <p className="text-sm mt-1">Start using photo analysis to see accuracy trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>AI Interactions Volume</CardTitle>
              <CardDescription>Daily volume of AI interactions over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer 
                config={{
                  totalFeedback: { label: 'Feedback Entries', color: 'hsl(var(--chart-1))' },
                  photoTests: { label: 'Photo Analyses', color: 'hsl(var(--chart-3))' },
                }} 
                className="h-[250px]"
              >
                <BarChart 
                  data={satisfactionTrends.map((item, i) => ({
                    date: item.date,
                    totalFeedback: item.totalFeedback,
                    photoTests: accuracyTrends[i]?.photoTests || 0
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    interval={4}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="totalFeedback" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="photoTests" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
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
