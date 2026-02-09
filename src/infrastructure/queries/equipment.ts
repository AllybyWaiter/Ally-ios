/**
 * Equipment Data Access Layer
 *
 * Centralized Supabase queries for equipment-related data.
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureFreshSession } from '@/lib/sessionUtils';
import { createEquipmentSchema, validateOrThrow } from '@/lib/validationSchemas';

export interface Equipment {
  id: string;
  aquarium_id: string;
  name: string;
  equipment_type: string;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  last_maintenance_date: string | null;
  maintenance_interval_days: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}


// Fetch all equipment for an aquarium
export async function fetchEquipment(aquariumId: string) {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('aquarium_id', aquariumId)
    .order('install_date', { ascending: false });

  if (error) throw error;
  return data as Equipment[];
}

// Fetch equipment count for an aquarium
export async function fetchEquipmentCount(aquariumId: string) {
  const { count, error } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true })
    .eq('aquarium_id', aquariumId);

  if (error) throw error;
  return count || 0;
}

// Fetch a single equipment item (with ownership verification via aquarium)
export async function fetchEquipmentItem(equipmentId: string, userId: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*, aquariums!inner(user_id)')
    .eq('id', equipmentId)
    .eq('aquariums.user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Equipment not found');
  // Remove the joined aquariums data before returning
  const { aquariums: _, ...equipment } = data;
  return equipment as Equipment;
}

// Create equipment
export async function createEquipment(equipment: {
  aquarium_id: string;
  name: string;
  equipment_type: string;
  brand?: string;
  model?: string;
  install_date?: string;
  maintenance_interval_days?: number;
  notes?: string;
}) {
  // Validate input before sending to database
  const validatedData = validateOrThrow(createEquipmentSchema, equipment, 'equipment');

  const { data, error } = await supabase
    .from('equipment')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw error;
  return data as Equipment;
}

// Update equipment (with ownership verification via aquarium)
export async function updateEquipment(
  equipmentId: string,
  userId: string,
  updates: Partial<Omit<Equipment, 'id' | 'aquarium_id' | 'created_at' | 'updated_at'>>
) {
  // First verify ownership via aquarium relationship
  const { data: existing, error: fetchError } = await supabase
    .from('equipment')
    .select('id, aquariums!inner(user_id)')
    .eq('id', equipmentId)
    .eq('aquariums.user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Equipment not found');

  const { data, error } = await supabase
    .from('equipment')
    .update(updates)
    .eq('id', equipmentId)
    .select()
    .single();

  if (error) throw error;
  return data as Equipment;
}

// Delete equipment (with ownership verification via aquarium)
export async function deleteEquipment(equipmentId: string, userId: string) {
  // Verify ownership and get the aquarium_id so we can scope the delete
  const { data: existing, error: fetchError } = await supabase
    .from('equipment')
    .select('id, aquarium_id, aquariums!inner(user_id)')
    .eq('id', equipmentId)
    .eq('aquariums.user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Equipment not found');

  // Include aquarium_id in the delete to prevent TOCTOU race conditions
  const { error } = await supabase
    .from('equipment')
    .delete()
    .match({ id: equipmentId, aquarium_id: existing.aquarium_id });

  if (error) throw error;
}
