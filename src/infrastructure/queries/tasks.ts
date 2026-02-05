/**
 * Maintenance Tasks Data Access Layer
 * 
 * Centralized Supabase queries for maintenance task-related data.
 */

import { supabase } from '@/integrations/supabase/client';

export interface MaintenanceTask {
  id: string;
  aquarium_id: string;
  equipment_id: string | null;
  task_name: string;
  task_type: string;
  due_date: string;
  completed_date: string | null;
  status: string | null;
  notes: string | null;
  is_recurring: boolean | null;
  recurrence_interval: string | null;
  recurrence_days: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch tasks for an aquarium
export async function fetchTasks(aquariumId: string) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('aquarium_id', aquariumId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as MaintenanceTask[];
}

// Fetch a single task (with ownership verification via aquarium)
export async function fetchTask(taskId: string, userId: string) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*, aquariums!inner(user_id)')
    .eq('id', taskId)
    .eq('aquariums.user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Task not found');
  // Remove the joined aquariums data before returning
  const { aquariums: _, ...task } = data;
  return task as MaintenanceTask;
}

// Create a new task
export async function createTask(task: {
  aquarium_id: string;
  task_name: string;
  task_type: string;
  due_date: string;
  equipment_id?: string;
  notes?: string;
  status?: string;
  is_recurring?: boolean;
  recurrence_interval?: string;
  recurrence_days?: number;
}) {
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

// Update a task (with ownership verification via aquarium)
export async function updateTask(
  taskId: string,
  userId: string,
  updates: Partial<Omit<MaintenanceTask, 'id' | 'aquarium_id' | 'created_at' | 'updated_at'>>
) {
  // First verify ownership via aquarium relationship
  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_tasks')
    .select('id, aquariums!inner(user_id)')
    .eq('id', taskId)
    .eq('aquariums.user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Task not found');

  const { data, error } = await supabase
    .from('maintenance_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as MaintenanceTask;
}

// Complete a task (with ownership verification via aquarium)
export async function completeTask(taskId: string, userId: string) {
  // First verify ownership via aquarium relationship
  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_tasks')
    .select('id, aquariums!inner(user_id)')
    .eq('id', taskId)
    .eq('aquariums.user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Task not found');

  const { data, error } = await supabase
    .from('maintenance_tasks')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as MaintenanceTask;
}

// Delete a task (with ownership verification via aquarium)
export async function deleteTask(taskId: string, userId: string) {
  // First verify ownership via aquarium relationship
  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_tasks')
    .select('id, aquariums!inner(user_id)')
    .eq('id', taskId)
    .eq('aquariums.user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Task not found');

  const { error } = await supabase
    .from('maintenance_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

// Fetch upcoming tasks across multiple aquariums
export async function fetchUpcomingTasks(
  aquariumIds: string[],
  daysAhead: number = 7
) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .in('aquarium_id', aquariumIds)
    .eq('status', 'pending')
    .lte('due_date', futureDate.toISOString())
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as MaintenanceTask[];
}
