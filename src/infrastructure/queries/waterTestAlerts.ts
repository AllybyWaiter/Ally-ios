/**
 * Water Test Alerts Data Access Layer
 * 
 * Handles CRUD operations for water test trend alerts.
 */

import { supabase } from '@/integrations/supabase/client';

export interface WaterTestAlert {
  id: string;
  user_id: string;
  aquarium_id: string;
  parameter_name: string;
  alert_type: 'rising' | 'falling' | 'unstable' | 'approaching_threshold' | 'predictive' | 'seasonal' | 'stocking' | 'correlation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: {
    values?: number[];
    dates?: string[];
    percentChange?: number;
    currentValue?: number;
    threshold?: number;
    thresholdType?: 'min' | 'max';
    aquariumName?: string;
  } | null;
  is_dismissed: boolean;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
  // AI-powered alert fields (Plus/Gold only)
  recommendation: string | null;
  timeframe: string | null;
  affected_inhabitants: string[] | null;
  confidence: number | null;
  analysis_model: 'rule' | 'ai' | null;
  predicted_impact: string | null;
}

/**
 * Fetch all active (undismissed) alerts for a user
 */
export async function fetchActiveAlerts(userId: string): Promise<WaterTestAlert[]> {
  const { data, error } = await supabase
    .from('water_test_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active alerts:', error);
    throw error;
  }

  return (data || []) as WaterTestAlert[];
}

/**
 * Fetch active alerts for a specific aquarium
 */
export async function fetchAquariumAlerts(aquariumId: string): Promise<WaterTestAlert[]> {
  const { data, error } = await supabase
    .from('water_test_alerts')
    .select('*')
    .eq('aquarium_id', aquariumId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching aquarium alerts:', error);
    throw error;
  }

  return (data || []) as WaterTestAlert[];
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('water_test_alerts')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('Error dismissing alert:', error);
    throw error;
  }
}

/**
 * Dismiss all alerts for an aquarium
 */
export async function dismissAquariumAlerts(aquariumId: string): Promise<void> {
  const { error } = await supabase
    .from('water_test_alerts')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('aquarium_id', aquariumId)
    .eq('is_dismissed', false);

  if (error) {
    console.error('Error dismissing aquarium alerts:', error);
    throw error;
  }
}

/**
 * Trigger trend analysis for an aquarium
 * Routes to AI or rule-based function based on tier
 */
export async function triggerTrendAnalysis(
  aquariumId: string, 
  userId: string,
  hasAITrendAlerts: boolean = false
): Promise<void> {
  const functionName = hasAITrendAlerts ? 'analyze-water-trends-ai' : 'analyze-water-trends';
  
  const { error } = await supabase.functions.invoke(functionName, {
    body: { aquariumId, userId },
  });

  if (error) {
    console.error(`Error triggering trend analysis (${functionName}):`, error);
    // Don't throw - trend analysis is non-critical
  }
}

/**
 * Get alert count by severity for a user
 */
export async function getAlertCountsBySeverity(userId: string): Promise<{ critical: number; warning: number; info: number }> {
  const { data, error } = await supabase
    .from('water_test_alerts')
    .select('severity')
    .eq('user_id', userId)
    .eq('is_dismissed', false);

  if (error) {
    console.error('Error fetching alert counts:', error);
    return { critical: 0, warning: 0, info: 0 };
  }

  const counts = { critical: 0, warning: 0, info: 0 };
  for (const alert of data || []) {
    if (alert.severity in counts) {
      counts[alert.severity as keyof typeof counts]++;
    }
  }

  return counts;
}
