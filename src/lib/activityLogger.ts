import { supabase } from '@/integrations/supabase/client';

export type ActivityType = 
  | 'login'
  | 'logout'
  | 'aquarium_created'
  | 'aquarium_updated'
  | 'aquarium_deleted'
  | 'water_test_created'
  | 'livestock_added'
  | 'equipment_added'
  | 'maintenance_completed'
  | 'profile_updated'
  | 'settings_changed'
  | 'support_ticket_created'
  | 'chat_conversation_started';

interface LogActivityParams {
  actionType: ActivityType;
  actionDetails?: Record<string, any>;
  userId?: string;
}

// Maximum queue size to prevent memory issues
const MAX_QUEUE_SIZE = 100;

// Activity queue for batching
let activityQueue: Array<{
  user_id: string;
  action_type: ActivityType;
  action_details: Record<string, any>;
  user_agent: string | null;
}> = [];

let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// Flush the queue to the database
const flushQueue = async () => {
  if (activityQueue.length === 0) return;

  const toFlush = [...activityQueue];
  activityQueue = [];
  flushTimeout = null;

  try {
    await supabase.from('activity_logs').insert(toFlush);
  } catch {
    // Silently fail - activity logging should not disrupt user experience
  }
};

export const logActivity = async ({
  actionType,
  actionDetails,
  userId,
}: LogActivityParams): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userIdToLog = userId || user?.id;

    if (!userIdToLog) {
      // Silently skip logging if no user
      return;
    }

    // Get user agent (available client-side)
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    // Add to queue
    activityQueue.push({
      user_id: userIdToLog,
      action_type: actionType,
      action_details: actionDetails || {},
      user_agent: userAgent,
    });

    // If queue exceeds max size, flush immediately
    if (activityQueue.length >= MAX_QUEUE_SIZE) {
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
      await flushQueue();
      return;
    }

    // Schedule flush after 5 seconds of inactivity
    if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        flushQueue();
      }, 5000);
    }
  } catch {
    // Silently fail - activity logging should not disrupt user experience
  }
};

export const logLoginHistory = async (userId: string, success: boolean = true, failureReason?: string): Promise<void> => {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    // Note: IP address should be captured server-side via edge functions, not client-side
    await supabase.from('login_history').insert({
      user_id: userId,
      success,
      failure_reason: failureReason,
      user_agent: userAgent,
      // ip_address is intentionally omitted - should only be set server-side
    });
  } catch {
    // Silently fail - login history logging should not disrupt user experience
  }
};
