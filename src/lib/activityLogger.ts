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

export const logActivity = async ({
  actionType,
  actionDetails,
  userId,
}: LogActivityParams): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userIdToLog = userId || user?.id;

    if (!userIdToLog) {
      console.warn('No user ID available for activity logging');
      return;
    }

    // Get user agent
    const userAgent = navigator.userAgent;

    await supabase.from('activity_logs').insert({
      user_id: userIdToLog,
      action_type: actionType,
      action_details: actionDetails || {},
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const logLoginHistory = async (userId: string, success: boolean = true, failureReason?: string): Promise<void> => {
  try {
    const userAgent = navigator.userAgent;

    await supabase.from('login_history').insert({
      user_id: userId,
      success,
      failure_reason: failureReason,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Failed to log login history:', error);
  }
};
