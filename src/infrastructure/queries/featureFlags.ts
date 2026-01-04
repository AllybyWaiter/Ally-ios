/**
 * Feature Flags Data Access Layer
 * 
 * CRUD operations for feature flags and user overrides.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  target_tiers: string[];
  target_roles: AppRole[];
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagOverride {
  id: string;
  flag_id: string;
  user_id: string;
  enabled: boolean;
  created_at: string;
}

export interface CreateFeatureFlagData {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rollout_percentage?: number;
  target_tiers?: string[];
  target_roles?: AppRole[];
}

export interface UpdateFeatureFlagData {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  rollout_percentage?: number;
  target_tiers?: string[];
  target_roles?: AppRole[];
}

// Fetch all feature flags
export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FeatureFlag[];
}

// Fetch a single feature flag by key
export async function fetchFeatureFlagByKey(key: string): Promise<FeatureFlag | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as FeatureFlag;
}

// Create a new feature flag
export async function createFeatureFlag(data: CreateFeatureFlagData): Promise<FeatureFlag> {
  const insertData = {
    key: data.key,
    name: data.name,
    description: data.description || null,
    enabled: data.enabled ?? false,
    rollout_percentage: data.rollout_percentage ?? 0,
    target_tiers: data.target_tiers ?? [],
    target_roles: data.target_roles ?? [],
  };

  const { data: result, error } = await supabase
    .from('feature_flags')
    .insert(insertData)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!result) throw new Error('Failed to create feature flag');
  return result as FeatureFlag;
}

// Update a feature flag
export async function updateFeatureFlag(id: string, data: UpdateFeatureFlagData): Promise<FeatureFlag> {
  const { data: result, error } = await supabase
    .from('feature_flags')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!result) throw new Error('Feature flag not found');
  return result as FeatureFlag;
}

// Delete a feature flag
export async function deleteFeatureFlag(id: string): Promise<void> {
  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Fetch overrides for a specific flag
export async function fetchFlagOverrides(flagId: string): Promise<FeatureFlagOverride[]> {
  const { data, error } = await supabase
    .from('feature_flag_overrides')
    .select('*')
    .eq('flag_id', flagId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FeatureFlagOverride[];
}

// Fetch overrides for a specific user
export async function fetchUserOverrides(userId: string): Promise<FeatureFlagOverride[]> {
  const { data, error } = await supabase
    .from('feature_flag_overrides')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data as FeatureFlagOverride[];
}

// Create or update a user override
export async function upsertFlagOverride(
  flagId: string, 
  userId: string, 
  enabled: boolean
): Promise<FeatureFlagOverride> {
  const { data, error } = await supabase
    .from('feature_flag_overrides')
    .upsert(
      { flag_id: flagId, user_id: userId, enabled },
      { onConflict: 'flag_id,user_id' }
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to upsert flag override');
  return data as FeatureFlagOverride;
}

// Delete a user override
export async function deleteFlagOverride(flagId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('feature_flag_overrides')
    .delete()
    .eq('flag_id', flagId)
    .eq('user_id', userId);

  if (error) throw error;
}
