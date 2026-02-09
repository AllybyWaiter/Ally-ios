/**
 * AI Feedback Data Access Layer
 *
 * Centralized Supabase queries for AI feedback data.
 */

import { supabase } from '@/integrations/supabase/client';

// Typed context for AI feedback - captures relevant info about the interaction
export interface FeedbackContext {
  // Core identifiers
  aquarium_id?: string;
  aquarium_name?: string;
  water_body_type?: string;
  conversation_id?: string;
  message_count?: number;
  // Media context
  photo_url?: string;
  // Task context
  task_type?: string;
  task_id?: string;
  // Support ticket context
  ticket_id?: string;
  // Analysis context
  parameter_name?: string;
  parameter_value?: number;
  // Chat context
  model_version?: string;
  response_time_ms?: number;
  // Photo analysis context
  analysis_type?: string;
  detected_issues?: string;
  // Session info
  session_id?: string;
  user_tier?: string;
}

export interface AIFeedback {
  id: string;
  user_id: string;
  feature: string;
  rating: string;
  feedback_text: string | null;
  message_id: string | null;
  water_test_id: string | null;
  context: FeedbackContext | null;
  created_at: string;
}

// Create AI feedback
export async function createFeedback(feedback: {
  user_id: string;
  feature: 'chat' | 'photo_analysis' | 'task_suggestions' | 'ticket_reply';
  rating: 'positive' | 'negative';
  message_id?: string | null;
  water_test_id?: string | null;
  context?: FeedbackContext | null;
  feedback_text?: string | null;
}) {
  const { data, error } = await supabase
    .from('ai_feedback')
    .insert(feedback)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create feedback');
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

// Training data interfaces
export interface TrainingDataEntry {
  id: string;
  feature: string;
  rating: string;
  feedback_text: string | null;
  created_at: string;
  context: FeedbackContext | null;
  message_id: string | null;
  water_test_id: string | null;
  user_message?: string | null;
  assistant_message?: string | null;
  conversation_id?: string | null;
}

// Fetch training data with full message context for chat feedback
export async function fetchTrainingData(options?: {
  feature?: string;
  rating?: 'positive' | 'negative';
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<TrainingDataEntry[]> {
  let query = supabase
    .from('ai_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.feature) {
    query = query.eq('feature', options.feature);
  }
  if (options?.rating) {
    query = query.eq('rating', options.rating);
  }
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data: feedbackData, error: feedbackError } = await query;
  if (feedbackError) throw feedbackError;

  // For chat feedback, fetch the associated messages
  const chatFeedback = feedbackData?.filter(f => f.feature === 'chat' && f.message_id) || [];
  const messageIds = chatFeedback.map(f => f.message_id).filter(Boolean) as string[];

  const messagesMap: Record<string, { content: string; conversation_id: string }> = {};
  const conversationMessagesMap: Record<string, Array<{ role: string; content: string; created_at: string }>> = {};

  if (messageIds.length > 0) {
    // Fetch the assistant messages that were rated
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, content, conversation_id, role, created_at')
      .in('id', messageIds);

    if (messagesError) throw messagesError;

    messages?.forEach(m => {
      messagesMap[m.id] = { content: m.content, conversation_id: m.conversation_id };
    });

    // Get unique conversation IDs to fetch preceding user messages
    const conversationIds = [...new Set(messages?.map(m => m.conversation_id) || [])];

    if (conversationIds.length > 0) {
      const { data: allMessages, error: allMessagesError } = await supabase
        .from('chat_messages')
        .select('id, content, conversation_id, role, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      if (allMessagesError) throw allMessagesError;

      // Group messages by conversation
      allMessages?.forEach(m => {
        if (!conversationMessagesMap[m.conversation_id]) {
          conversationMessagesMap[m.conversation_id] = [];
        }
        conversationMessagesMap[m.conversation_id].push({
          role: m.role,
          content: m.content,
          created_at: m.created_at
        });
      });
    }
  }

  // Enrich feedback with message content
  return (feedbackData || []).map(feedback => {
    const entry: TrainingDataEntry = {
      id: feedback.id,
      feature: feedback.feature,
      rating: feedback.rating,
      feedback_text: feedback.feedback_text,
      created_at: feedback.created_at,
      context: feedback.context as FeedbackContext | null,
      message_id: feedback.message_id,
      water_test_id: feedback.water_test_id,
      user_message: null,
      assistant_message: null,
      conversation_id: null
    };

    if (feedback.feature === 'chat' && feedback.message_id && messagesMap[feedback.message_id]) {
      const messageInfo = messagesMap[feedback.message_id];
      entry.assistant_message = messageInfo.content;
      entry.conversation_id = messageInfo.conversation_id;

      // Find the preceding user message
      const conversationMessages = conversationMessagesMap[messageInfo.conversation_id] || [];
      const assistantMsgIndex = conversationMessages.findIndex(
        m => m.content === messageInfo.content && m.role === 'assistant'
      );
      
      if (assistantMsgIndex > 0) {
        // Find the last user message before this assistant message
        for (let i = assistantMsgIndex - 1; i >= 0; i--) {
          if (conversationMessages[i].role === 'user') {
            entry.user_message = conversationMessages[i].content;
            break;
          }
        }
      }
    }

    return entry;
  });
}
