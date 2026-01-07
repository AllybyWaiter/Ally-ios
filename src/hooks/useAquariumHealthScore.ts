/**
 * Aquarium Health Score Calculation Hook
 * 
 * Calculates weighted health score from:
 * - Water Tests (40%): Recent test results and parameter status
 * - Livestock Health (25%): Health status of inhabitants
 * - Maintenance (20%): Task completion and overdue tasks
 * - Care Consistency (15%): Regular testing and maintenance patterns
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface HealthBreakdown {
  waterTests: number;
  livestockHealth: number;
  maintenance: number;
  careConsistency: number;
}

export interface HealthTrend {
  direction: 'up' | 'down' | 'stable';
  change: number;
}

export interface AquariumHealthData {
  score: number;
  label: string;
  color: string;
  breakdown: HealthBreakdown;
  trend: HealthTrend;
  alerts: number;
  lastWaterTest: string | null;
  overdueTasks: number;
  isLoading: boolean;
}

const WEIGHTS = {
  waterTests: 0.40,
  livestockHealth: 0.25,
  maintenance: 0.20,
  careConsistency: 0.15,
};

function getHealthLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Excellent', color: 'hsl(142, 76%, 36%)' };
  if (score >= 75) return { label: 'Good', color: 'hsl(142, 69%, 58%)' };
  if (score >= 50) return { label: 'Fair', color: 'hsl(48, 96%, 53%)' };
  if (score >= 25) return { label: 'Needs Attention', color: 'hsl(25, 95%, 53%)' };
  return { label: 'Critical', color: 'hsl(0, 84%, 60%)' };
}

interface WaterTestWithParams {
  test_date: string;
  test_parameters?: Array<{
    status?: string;
  }>;
}

interface LivestockItem {
  health_status: string;
  quantity: number;
}

interface MaintenanceTask {
  status: string;
  due_date: string;
}

function calculateWaterTestScore(tests: WaterTestWithParams[]): number {
  if (!tests || tests.length === 0) return 30; // No tests = low score
  
  const recentTest = tests[0];
  const daysSinceTest = Math.floor(
    (Date.now() - new Date(recentTest.test_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Penalize for old tests
  let recencyScore = 100;
  if (daysSinceTest > 14) recencyScore = 50;
  else if (daysSinceTest > 7) recencyScore = 75;
  else if (daysSinceTest > 3) recencyScore = 90;
  
  // Check parameter statuses
  const parameters = recentTest.test_parameters || [];
  if (parameters.length === 0) return recencyScore * 0.7;
  
  const statusScores: Record<string, number> = {
    'optimal': 100,
    'acceptable': 80,
    'warning': 50,
    'danger': 20,
    'critical': 0,
  };
  
  const paramScore = parameters.reduce((acc: number, param) => {
    return acc + (statusScores[param.status ?? ''] ?? 70);
  }, 0) / parameters.length;
  
  return (recencyScore * 0.4 + paramScore * 0.6);
}

function calculateLivestockScore(livestock: LivestockItem[]): number {
  if (!livestock || livestock.length === 0) return 100; // No livestock = perfect
  
  const healthScores: Record<string, number> = {
    'healthy': 100,
    'quarantine': 70,
    'stressed': 50,
    'sick': 25,
    'deceased': 0,
  };
  
  const totalScore = livestock.reduce((acc, animal) => {
    const score = healthScores[animal.health_status] ?? 70;
    return acc + (score * animal.quantity);
  }, 0);
  
  const totalCount = livestock.reduce((acc, animal) => acc + animal.quantity, 0);
  return totalCount > 0 ? totalScore / totalCount : 100;
}

function calculateMaintenanceScore(tasks: MaintenanceTask[]): number {
  if (!tasks || tasks.length === 0) return 80; // No tasks = okay
  
  const now = new Date();
  const overdue = tasks.filter(t => 
    t.status === 'pending' && new Date(t.due_date) < now
  ).length;
  
  const completed = tasks.filter(t => t.status === 'completed').length;
  
  // Score based on completion rate and overdue tasks
  const completionRate = tasks.length > 0 ? (completed / tasks.length) * 100 : 80;
  const overduepenalty = Math.min(overdue * 15, 60);
  
  return Math.max(0, Math.min(100, completionRate - overduepenalty));
}

function calculateConsistencyScore(tests: WaterTestWithParams[], tasks: MaintenanceTask[]): number {
  // Check testing frequency
  const testCount = tests?.length || 0;
  let testingScore = 50;
  if (testCount >= 8) testingScore = 100; // 2+ tests per week
  else if (testCount >= 4) testingScore = 85;
  else if (testCount >= 2) testingScore = 70;
  else if (testCount >= 1) testingScore = 55;
  
  // Check task completion consistency
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const taskScore = Math.min(100, completedTasks * 10 + 50);
  
  return (testingScore * 0.6 + taskScore * 0.4);
}

export function useAquariumHealthScore(aquariumId: string): AquariumHealthData {
  // Fetch all health-related data
  const { data, isLoading } = useQuery({
    queryKey: ['aquarium-health', aquariumId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [testsRes, livestockRes, tasksRes, alertsRes] = await Promise.all([
        supabase
          .from('water_tests')
          .select('*, test_parameters(*)')
          .eq('aquarium_id', aquariumId)
          .gte('test_date', thirtyDaysAgo.toISOString())
          .order('test_date', { ascending: false })
          .limit(10),
        supabase
          .from('livestock')
          .select('*')
          .eq('aquarium_id', aquariumId),
        supabase
          .from('maintenance_tasks')
          .select('*')
          .eq('aquarium_id', aquariumId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('water_test_alerts')
          .select('*')
          .eq('aquarium_id', aquariumId)
          .eq('is_dismissed', false),
      ]);
      
      return {
        tests: testsRes.data || [],
        livestock: livestockRes.data || [],
        tasks: tasksRes.data || [],
        alerts: alertsRes.data || [],
      };
    },
    staleTime: 60000, // 1 minute
    enabled: !!aquariumId,
  });

  return useMemo(() => {
    if (isLoading || !data) {
      return {
        score: 0,
        label: 'Loading',
        color: 'hsl(var(--muted))',
        breakdown: { waterTests: 0, livestockHealth: 0, maintenance: 0, careConsistency: 0 },
        trend: { direction: 'stable' as const, change: 0 },
        alerts: 0,
        lastWaterTest: null,
        overdueTasks: 0,
        isLoading: true,
      };
    }

    const { tests, livestock, tasks, alerts } = data;
    
    // Calculate component scores
    const breakdown: HealthBreakdown = {
      waterTests: Math.round(calculateWaterTestScore(tests)),
      livestockHealth: Math.round(calculateLivestockScore(livestock)),
      maintenance: Math.round(calculateMaintenanceScore(tasks)),
      careConsistency: Math.round(calculateConsistencyScore(tests, tasks)),
    };
    
    // Calculate weighted total
    const score = Math.round(
      breakdown.waterTests * WEIGHTS.waterTests +
      breakdown.livestockHealth * WEIGHTS.livestockHealth +
      breakdown.maintenance * WEIGHTS.maintenance +
      breakdown.careConsistency * WEIGHTS.careConsistency
    );
    
    // Get label and color
    const { label, color } = getHealthLabel(score);
    
    // Calculate trend (simplified - compare recent vs older tests)
    let trend: HealthTrend = { direction: 'stable', change: 0 };
    if (tests.length >= 3) {
      const recentAvg = calculateWaterTestScore(tests.slice(0, 2));
      const olderAvg = calculateWaterTestScore(tests.slice(2, 4));
      const change = recentAvg - olderAvg;
      if (change > 5) trend = { direction: 'up', change: Math.round(change) };
      else if (change < -5) trend = { direction: 'down', change: Math.round(Math.abs(change)) };
    }
    
    // Count overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => 
      t.status === 'pending' && new Date(t.due_date) < now
    ).length;
    
    return {
      score,
      label,
      color,
      breakdown,
      trend,
      alerts: alerts.length,
      lastWaterTest: tests[0]?.test_date || null,
      overdueTasks,
      isLoading: false,
    };
  }, [data, isLoading]);
}
