/**
 * Plants Data Access Layer
 * 
 * Centralized Supabase queries for plant-related data.
 */

import { supabase } from '@/integrations/supabase/client';

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
  created_at: string;
  updated_at: string;
}

// Fetch all plants for an aquarium
export async function fetchPlants(aquariumId: string) {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('aquarium_id', aquariumId)
    .order('date_added', { ascending: false });

  if (error) throw error;
  return data as Plant[];
}

// Fetch a single plant
export async function fetchPlant(plantId: string) {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .single();

  if (error) throw error;
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
  const { data, error } = await supabase
    .from('plants')
    .insert(plant)
    .select()
    .single();

  if (error) throw error;
  return data as Plant;
}

// Update plant
export async function updatePlant(
  plantId: string,
  updates: Partial<Omit<Plant, 'id' | 'aquarium_id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('plants')
    .update(updates)
    .eq('id', plantId)
    .select()
    .single();

  if (error) throw error;
  return data as Plant;
}

// Delete plant
export async function deletePlant(plantId: string) {
  const { error } = await supabase
    .from('plants')
    .delete()
    .eq('id', plantId);

  if (error) throw error;
}
