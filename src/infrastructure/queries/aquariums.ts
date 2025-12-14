/**
 * Aquariums Data Access Layer
 * 
 * Centralized Supabase queries for aquarium-related data.
 */

import { supabase } from '@/integrations/supabase/client';

export interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume_gallons: number | null;
  status: string | null;
  setup_date: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AquariumWithTaskCount extends Aquarium {
  maintenance_tasks: { count: number }[];
}

// Helper to ensure session is fresh (iOS PWA fix)
async function ensureFreshSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    await supabase.auth.refreshSession();
  }
}

// Fetch all aquariums for a user with pending task counts
export async function fetchAquariumsWithTaskCounts(userId: string) {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('aquariums')
    .select(`
      *,
      maintenance_tasks!aquarium_id(count)
    `)
    .eq('user_id', userId)
    .eq('maintenance_tasks.status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AquariumWithTaskCount[];
}

// Fetch a single aquarium by ID
export async function fetchAquarium(aquariumId: string) {
  const { data, error } = await supabase
    .from('aquariums')
    .select('*')
    .eq('id', aquariumId)
    .single();

  if (error) throw error;
  return data as Aquarium;
}

// Fetch aquarium with full details (equipment, livestock, plants, water tests)
export async function fetchAquariumWithDetails(aquariumId: string) {
  const { data, error } = await supabase
    .from('aquariums')
    .select(`
      *,
      equipment(*),
      livestock(*),
      plants(*),
      water_tests(*, test_parameters(*))
    `)
    .eq('id', aquariumId)
    .single();

  if (error) throw error;
  return data;
}

// Create a new aquarium
export async function createAquarium(aquarium: {
  name: string;
  type: string;
  volume_gallons?: number;
  status?: string;
  setup_date?: string;
  notes?: string;
  user_id: string;
}) {
  const { data, error } = await supabase
    .from('aquariums')
    .insert(aquarium)
    .select()
    .single();

  if (error) throw error;
  return data as Aquarium;
}

// Update an aquarium
export async function updateAquarium(
  aquariumId: string,
  updates: Partial<Omit<Aquarium, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('aquariums')
    .update(updates)
    .eq('id', aquariumId)
    .select()
    .single();

  if (error) throw error;
  return data as Aquarium;
}

// Delete an aquarium
export async function deleteAquarium(aquariumId: string) {
  const { error } = await supabase
    .from('aquariums')
    .delete()
    .eq('id', aquariumId);

  if (error) throw error;
}

// Fetch upcoming task count for multiple aquariums
export async function fetchUpcomingTaskCount(aquariumIds: string[], daysAhead: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { count, error } = await supabase
    .from('maintenance_tasks')
    .select('*', { count: 'exact', head: true })
    .in('aquarium_id', aquariumIds)
    .eq('status', 'pending')
    .lte('due_date', futureDate.toISOString());

  if (error) throw error;
  return count || 0;
}
