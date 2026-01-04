/**
 * Maintenance Tasks Data Access Layer
 * 
 * Centralized Supabase queries for maintenance task operations with iOS PWA session handling.
 */

import { supabase } from '@/integrations/supabase/client';

export interface MaintenanceTask {
  id: string;
  aquarium_id: string;
  task_name: string;
  task_type: string;
  due_date: string;
  completed_date: string | null;
  status: string;
  notes: string | null;
  is_recurring: boolean;
  recurrence_interval: string | null;
  recurrence_days: number | null;
  equipment_id: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to ensure session is fresh (iOS PWA fix)
async function ensureFreshSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    await supabase.auth.refreshSession();
  }
}

// Create maintenance task
export async function createMaintenanceTask(task: {
  aquarium_id: string;
  task_name: string;
  task_type: string;
  due_date: string;
  notes?: string | null;
  status?: string;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_days?: number | null;
  equipment_id?: string | null;
}) {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .insert({
      ...task,
      status: task.status || 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as MaintenanceTask;
}

// Fetch upcoming and overdue tasks for a user
export async function fetchUpcomingTasks(userId: string) {
  await ensureFreshSession();
  
  // Get tasks due within the next 7 days or overdue
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select(`
      id,
      aquarium_id,
      task_name,
      task_type,
      due_date,
      completed_date,
      status,
      notes,
      is_recurring,
      recurrence_interval,
      recurrence_days,
      equipment_id,
      created_at,
      updated_at,
      aquariums!inner(user_id)
    `)
    .eq('aquariums.user_id', userId)
    .neq('status', 'completed')
    .lte('due_date', weekFromNow.toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(20);

  if (error) throw error;
  return (data || []) as MaintenanceTask[];
}
