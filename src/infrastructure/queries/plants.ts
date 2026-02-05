/**
 * Plants Data Access Layer
 *
 * Centralized Supabase queries for plant-related data.
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureFreshSession } from '@/lib/sessionUtils';
import {
  createPlantSchema,
  validateOrThrow,
  plantResponseSchema,
} from '@/lib/validationSchemas';
import { logger } from '@/lib/logger';

export interface Plant {
  id: string;
  aquarium_id: string;
  user_id: string;
  name: string;
  species: string;
  placement: string;
  quantity: number;
  date_added: string;
  condition: string;
  notes: string | null;
  primary_photo_url: string | null;
  created_at: string;
  updated_at: string;
}


// Fetch all plants for an aquarium
export async function fetchPlants(aquariumId: string) {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('aquarium_id', aquariumId)
    .order('date_added', { ascending: false });

  if (error) throw error;
  return data as Plant[];
}

// Fetch a single plant (with ownership verification)
export async function fetchPlant(plantId: string, userId: string) {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Plant not found');

  // Validate response shape (logs warning if unexpected shape, doesn't throw)
  const parseResult = plantResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.warn('Plant response validation warning:', parseResult.error.flatten());
  }

  return data as Plant;
}

// Create plant
export async function createPlant(plant: {
  aquarium_id: string;
  user_id: string;
  name: string;
  species: string;
  placement?: string;
  quantity?: number;
  date_added?: string;
  condition?: string;
  notes?: string;
}) {
  // Validate input before sending to database
  const validatedData = validateOrThrow(createPlantSchema, plant, 'plant');

  const { data, error } = await supabase
    .from('plants')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw error;
  return data as Plant;
}

// Update plant (with ownership verification)
export async function updatePlant(
  plantId: string,
  userId: string,
  updates: Partial<Omit<Plant, 'id' | 'aquarium_id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('plants')
    .update(updates)
    .eq('id', plantId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Plant;
}

// Delete plant (with user_id for defense in depth)
export async function deletePlant(plantId: string, userId: string) {
  const { error } = await supabase
    .from('plants')
    .delete()
    .eq('id', plantId)
    .eq('user_id', userId);

  if (error) throw error;
}
