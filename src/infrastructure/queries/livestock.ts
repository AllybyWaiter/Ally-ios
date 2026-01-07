/**
 * Livestock Data Access Layer
 * 
 * Centralized Supabase queries for livestock-related data.
 */

import { supabase } from '@/integrations/supabase/client';

// Valid health status values for livestock
export type LivestockHealthStatus = 'healthy' | 'sick' | 'recovering' | 'quarantine';

const VALID_HEALTH_STATUSES: LivestockHealthStatus[] = ['healthy', 'sick', 'recovering', 'quarantine'];

// Type guard for health status validation
export function isValidHealthStatus(status: string): status is LivestockHealthStatus {
  return VALID_HEALTH_STATUSES.includes(status as LivestockHealthStatus);
}

export interface Livestock {
  id: string;
  aquarium_id: string;
  user_id: string;
  name: string;
  species: string;
  category: string;
  quantity: number;
  date_added: string;
  health_status: LivestockHealthStatus;
  notes: string | null;
  primary_photo_url: string | null;
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
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Livestock not found');
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
  health_status?: LivestockHealthStatus;
  notes?: string;
}) {
  // Validate health status if provided
  if (livestock.health_status && !isValidHealthStatus(livestock.health_status)) {
    throw new Error(`Invalid health status: ${livestock.health_status}. Must be one of: ${VALID_HEALTH_STATUSES.join(', ')}`);
  }

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
  // Validate health status if provided
  if (updates.health_status && !isValidHealthStatus(updates.health_status)) {
    throw new Error(`Invalid health status: ${updates.health_status}. Must be one of: ${VALID_HEALTH_STATUSES.join(', ')}`);
  }

  const { data, error } = await supabase
    .from('livestock')
    .update(updates)
    .eq('id', livestockId)
    .select()
    .single();

  if (error) throw error;
  return data as Livestock;
}

// Delete livestock (with user_id for defense in depth)
export async function deleteLivestock(livestockId: string, userId: string) {
  const { error } = await supabase
    .from('livestock')
    .delete()
    .eq('id', livestockId)
    .eq('user_id', userId);

  if (error) throw error;
}
