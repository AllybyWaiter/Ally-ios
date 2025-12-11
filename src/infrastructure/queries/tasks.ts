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

// Fetch a single task
export async function fetchTask(taskId: string) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data as MaintenanceTask;
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

// Update a task
export async function updateTask(
  taskId: string,
  updates: Partial<Omit<MaintenanceTask, 'id' | 'aquarium_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as MaintenanceTask;
}

// Complete a task
export async function completeTask(taskId: string) {
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

// Delete a task
export async function deleteTask(taskId: string) {
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
