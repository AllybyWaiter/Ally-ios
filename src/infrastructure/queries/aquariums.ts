/**
 * Aquariums Data Access Layer
 *
 * Centralized Supabase queries for aquarium-related data.
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureFreshSession } from '@/lib/sessionUtils';
import {
  createAquariumSchema,
  validateOrThrow,
  aquariumResponseSchema,
} from '@/lib/validationSchemas';
import { logger } from '@/lib/logger';

export interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume_gallons: number | null;
  primary_photo_url?: string | null;
  status: string | null;
  setup_date: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
}

export interface AquariumWithTaskCount extends Aquarium {
  maintenance_tasks: { count: number }[];
}


/** Maximum number of aquariums to return in a single query */
const MAX_AQUARIUMS_LIMIT = 100;

// Fetch all aquariums for a user with pending task counts
export async function fetchAquariumsWithTaskCounts(userId: string, limit?: number) {
  await ensureFreshSession();

  // Apply limit with sensible default
  const effectiveLimit = limit ? Math.min(limit, MAX_AQUARIUMS_LIMIT) : MAX_AQUARIUMS_LIMIT;

  // First, fetch aquariums
  const { data: aquariums, error: aquariumError } = await supabase
    .from('aquariums')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(effectiveLimit);

  if (aquariumError) throw aquariumError;
  if (!aquariums || aquariums.length === 0) return [];

  // Then, fetch pending task counts separately for reliable filtering
  const aquariumIds = aquariums.map(a => a.id);
  const { data: taskCounts, error: taskError } = await supabase
    .from('maintenance_tasks')
    .select('aquarium_id')
    .in('aquarium_id', aquariumIds)
    .eq('status', 'pending');

  if (taskError) throw taskError;

  // Count tasks per aquarium
  const countMap = new Map<string, number>();
  (taskCounts || []).forEach(t => {
    countMap.set(t.aquarium_id, (countMap.get(t.aquarium_id) || 0) + 1);
  });

  // Merge counts with aquariums
  return aquariums.map(aq => ({
    ...aq,
    maintenance_tasks: [{ count: countMap.get(aq.id) || 0 }]
  })) as AquariumWithTaskCount[];
}

// Fetch a single aquarium by ID
export async function fetchAquarium(aquariumId: string) {
  const { data, error } = await supabase
    .from('aquariums')
    .select('*')
    .eq('id', aquariumId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Aquarium not found');

  // Validate response shape (logs warning if unexpected shape, doesn't throw)
  const parseResult = aquariumResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.warn('Aquarium response validation warning:', parseResult.error.flatten());
  }

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
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Aquarium not found');
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
  // Validate input before sending to database
  const validatedData = validateOrThrow(createAquariumSchema, aquarium, 'aquarium');

  const { data, error } = await supabase
    .from('aquariums')
    .insert(validatedData)
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
