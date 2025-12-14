/**
 * Livestock Data Access Layer
 * 
 * Centralized Supabase queries for livestock-related data.
 */

import { supabase } from '@/integrations/supabase/client';

export interface Livestock {
  id: string;
  aquarium_id: string;
  user_id: string;
  name: string;
  species: string;
  category: string;
  quantity: number;
  date_added: string;
  health_status: string;
  notes: string | null;
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

// Fetch all livestock for an aquarium
export async function fetchLivestock(aquariumId: string) {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('livestock')
    .select('*')
    .eq('aquarium_id', aquariumId)
    .order('date_added', { ascending: false });

  if (error) throw error;
  return data as Livestock[];
}

// Fetch a single livestock item
export async function fetchLivestockItem(livestockId: string) {
  const { data, error } = await supabase
    .from('livestock')
    .select('*')
    .eq('id', livestockId)
    .single();

  if (error) throw error;
  return data as Livestock;
}

// Create livestock
export async function createLivestock(livestock: {
  aquarium_id: string;
  user_id: string;
  name: string;
  species: string;
  category: string;
  quantity?: number;
  date_added?: string;
  health_status?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('livestock')
    .insert(livestock)
    .select()
    .single();

  if (error) throw error;
  return data as Livestock;
}

// Update livestock
export async function updateLivestock(
  livestockId: string,
  updates: Partial<Omit<Livestock, 'id' | 'aquarium_id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('livestock')
    .update(updates)
    .eq('id', livestockId)
    .select()
    .single();

  if (error) throw error;
  return data as Livestock;
}

// Delete livestock
export async function deleteLivestock(livestockId: string) {
  const { error } = await supabase
    .from('livestock')
    .delete()
    .eq('id', livestockId);

  if (error) throw error;
}
