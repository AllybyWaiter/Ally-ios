/**
 * Equipment Data Access Layer
 * 
 * Centralized Supabase queries for equipment-related data.
 */

import { supabase } from '@/integrations/supabase/client';

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

// Fetch a single equipment item
export async function fetchEquipmentItem(equipmentId: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', equipmentId)
    .single();

  if (error) throw error;
  return data as Equipment;
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
  const { data, error } = await supabase
    .from('equipment')
    .insert(equipment)
    .select()
    .single();

  if (error) throw error;
  return data as Equipment;
}

// Update equipment
export async function updateEquipment(
  equipmentId: string,
  updates: Partial<Omit<Equipment, 'id' | 'aquarium_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('equipment')
    .update(updates)
    .eq('id', equipmentId)
    .select()
    .single();

  if (error) throw error;
  return data as Equipment;
}

// Delete equipment
export async function deleteEquipment(equipmentId: string) {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', equipmentId);

  if (error) throw error;
}
