/**
 * AI Feedback Data Access Layer
 * 
 * Centralized Supabase queries for AI feedback data.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AIFeedback {
  id: string;
  user_id: string;
  feature: string;
  rating: string;
  feedback_text: string | null;
  message_id: string | null;
  water_test_id: string | null;
  context: Record<string, any> | null;
  created_at: string;
}

// Create AI feedback
export async function createFeedback(feedback: {
  user_id: string;
  feature: 'chat' | 'photo_analysis' | 'task_suggestions' | 'ticket_reply';
  rating: 'positive' | 'negative';
  message_id?: string | null;
  water_test_id?: string | null;
  context?: Record<string, any> | null;
  feedback_text?: string | null;
}) {
  const { data, error } = await supabase
    .from('ai_feedback')
    .insert(feedback)
    .select()
    .single();

  if (error) throw error;
  return data as AIFeedback;
}

// Fetch feedback for admin analytics
export async function fetchAllFeedback(limit = 100) {
  const { data, error } = await supabase
    .from('ai_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AIFeedback[];
}

// Fetch feedback by feature
export async function fetchFeedbackByFeature(feature: string) {
  const { data, error } = await supabase
    .from('ai_feedback')
    .select('*')
    .eq('feature', feature)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AIFeedback[];
}

// Fetch user's own feedback
export async function fetchUserFeedback(userId: string) {
  const { data, error } = await supabase
    .from('ai_feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AIFeedback[];
}
