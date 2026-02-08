/**
 * Fish Species Data Access Layer
 *
 * Queries for fish species compatibility data.
 */

import { supabase } from '@/integrations/supabase/client';
import type { FishSpecies } from '@/lib/fishCompatibility';

/** Escape special characters for PostgREST ILIKE/filter values */
function escapePostgrestValue(value: string): string {
  return value.replace(/[%_\\,().]/g, '\\$&');
}

/**
 * Search for fish species by name (common or scientific)
 */
export async function searchFishSpecies(
  query: string,
  waterType?: string,
  limit: number = 10
): Promise<FishSpecies[]> {
  const escaped = escapePostgrestValue(query);
  let queryBuilder = supabase
    .from('fish_species')
    .select('*')
    .or(`common_name.ilike.%${escaped}%,scientific_name.ilike.%${escaped}%`)
    .limit(limit);

  if (waterType) {
    // Map aquarium types to water types
    const isFreshwater = ['freshwater', 'planted', 'coldwater'].some(t => 
      waterType.toLowerCase().includes(t)
    );
    const isSaltwater = ['saltwater', 'reef', 'marine'].some(t => 
      waterType.toLowerCase().includes(t)
    );
    
    if (isFreshwater) {
      queryBuilder = queryBuilder.in('water_type', ['freshwater', 'brackish']);
    } else if (isSaltwater) {
      queryBuilder = queryBuilder.in('water_type', ['saltwater', 'brackish']);
    }
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;
  return data as FishSpecies[];
}

/**
 * Get fish species by exact name match
 */
export async function getFishSpeciesByName(name: string): Promise<FishSpecies | null> {
  const escaped = escapePostgrestValue(name);
  const { data, error } = await supabase
    .from('fish_species')
    .select('*')
    .or(`common_name.ilike.${escaped},scientific_name.ilike.${escaped}`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as FishSpecies | null;
}

/**
 * Get multiple fish species by names
 */
export async function getFishSpeciesByNames(names: string[]): Promise<FishSpecies[]> {
  if (names.length === 0) return [];
  
  // Build OR conditions for each name (escaped for PostgREST safety)
  const conditions = names.map(name => {
    const escaped = escapePostgrestValue(name);
    return `common_name.ilike.${escaped},scientific_name.ilike.${escaped}`;
  }).join(',');

  const { data, error } = await supabase
    .from('fish_species')
    .select('*')
    .or(conditions);

  if (error) throw error;
  return data as FishSpecies[];
}

/**
 * Get all fish species with pagination (for admin/reference)
 */
export async function getAllFishSpecies(
  page: number = 0,
  pageSize: number = 100
): Promise<{ data: FishSpecies[]; hasMore: boolean; total: number }> {
  // First get total count
  const { count, error: countError } = await supabase
    .from('fish_species')
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;

  const { data, error } = await supabase
    .from('fish_species')
    .select('*')
    .order('common_name')
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  
  return {
    data: data as FishSpecies[],
    hasMore: (count || 0) > (page + 1) * pageSize,
    total: count || 0
  };
}

/**
 * Get fish species by water type
 */
export async function getFishSpeciesByWaterType(waterType: 'freshwater' | 'saltwater' | 'brackish'): Promise<FishSpecies[]> {
  const { data, error } = await supabase
    .from('fish_species')
    .select('*')
    .eq('water_type', waterType)
    .order('common_name');

  if (error) throw error;
  return data as FishSpecies[];
}

/**
 * Get compatible species suggestions for a tank
 */
export async function getCompatibleSpecies(
  existingSpeciesNames: string[],
  waterType: string,
  tankGallons: number | null,
  limit: number = 10
): Promise<FishSpecies[]> {
  // Get existing species data
  const _existingData = await getFishSpeciesByNames(existingSpeciesNames);
  
  // Determine if tank is freshwater or saltwater
  const isFreshwater = ['freshwater', 'planted', 'coldwater'].some(t => 
    waterType.toLowerCase().includes(t)
  );
  
  // Build base query
  let queryBuilder = supabase
    .from('fish_species')
    .select('*')
    .eq('water_type', isFreshwater ? 'freshwater' : 'saltwater')
    .eq('temperament', 'peaceful');

  // Filter by tank size if known
  if (tankGallons) {
    queryBuilder = queryBuilder.lte('min_tank_gallons', tankGallons);
  }

  // Exclude species already in tank (escape each name for PostgREST safety)
  if (existingSpeciesNames.length > 0) {
    const lowerNames = existingSpeciesNames.map(n =>
      `"${n.toLowerCase().replace(/"/g, '""')}"`
    );
    queryBuilder = queryBuilder.not('common_name', 'in', `(${lowerNames.join(',')})`);
  }

  const { data, error } = await queryBuilder
    .limit(limit)
    .order('common_name');

  if (error) throw error;
  return data as FishSpecies[];
}
