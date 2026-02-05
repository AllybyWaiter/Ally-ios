/**
 * Livestock Data Access Layer
 *
 * Centralized Supabase queries for livestock-related data.
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureFreshSession } from '@/lib/sessionUtils';
import {
  createLivestockSchema,
  validateOrThrow,
  livestockResponseSchema,
} from '@/lib/validationSchemas';
import { logger } from '@/lib/logger';

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

// Fetch a single livestock item (with ownership verification)
export async function fetchLivestockItem(livestockId: string, userId: string) {
  const { data, error } = await supabase
    .from('livestock')
    .select('*')
    .eq('id', livestockId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Livestock not found');

  // Validate response shape (logs warning if unexpected shape, doesn't throw)
  const parseResult = livestockResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.warn('Livestock response validation warning:', parseResult.error.flatten());
  }

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
  // Validate input before sending to database
  const validatedData = validateOrThrow(createLivestockSchema, livestock, 'livestock');

  const { data, error } = await supabase
    .from('livestock')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw error;
  return data as Livestock;
}

// Update livestock (with ownership verification)
export async function updateLivestock(
  livestockId: string,
  userId: string,
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
    .eq('user_id', userId)
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
