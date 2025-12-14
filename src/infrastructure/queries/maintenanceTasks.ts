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
