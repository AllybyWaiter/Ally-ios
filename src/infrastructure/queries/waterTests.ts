/**
 * Water Tests Data Access Layer
 * 
 * Centralized Supabase queries for water test-related data.
 */

import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface WaterTest {
  id: string;
  aquarium_id: string;
  user_id: string;
  test_date: string;
  notes: string | null;
  tags: string[] | null;
  confidence: string | null;
  entry_method: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestParameter {
  id: string;
  test_id: string;
  parameter_name: string;
  value: number;
  unit: string;
  status: string | null;
  created_at: string;
}

export interface WaterTestWithParameters extends WaterTest {
  test_parameters: TestParameter[];
}

// Helper to ensure session is fresh (iOS PWA fix)
async function ensureFreshSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    await supabase.auth.refreshSession();
  }
}

// Fetch water tests for an aquarium with optional pagination
export async function fetchWaterTests(
  aquariumId: string, 
  options?: { limit?: number; offset?: number }
) {
  await ensureFreshSession();
  
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  
  const { data, error, count } = await supabase
    .from('water_tests')
    .select('*, test_parameters(*)', { count: 'exact' })
    .eq('aquarium_id', aquariumId)
    .order('test_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { 
    data: data as WaterTestWithParameters[], 
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + limit 
  };
}

// Fetch all water tests for an aquarium (legacy support)
export async function fetchAllWaterTests(aquariumId: string, limit?: number) {
  await ensureFreshSession();
  
  let query = supabase
    .from('water_tests')
    .select('*, test_parameters(*)')
    .eq('aquarium_id', aquariumId)
    .order('test_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as WaterTestWithParameters[];
}

// Fetch the latest water test for an aquarium
export async function fetchLatestWaterTest(aquariumId: string) {
  const { data, error } = await supabase
    .from('water_tests')
    .select('*, test_parameters(*)')
    .eq('aquarium_id', aquariumId)
    .order('test_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as WaterTestWithParameters | null;
}

// Fetch water tests for chart display
export async function fetchWaterTestsForChart(
  aquariumId: string, 
  dateRange: '7d' | '30d' | '90d' | '1y' | 'all'
) {
  let startDate: Date | null = null;
  const now = new Date();

  if (dateRange === '7d') startDate = subDays(now, 7);
  else if (dateRange === '30d') startDate = subDays(now, 30);
  else if (dateRange === '90d') startDate = subDays(now, 90);
  else if (dateRange === '1y') startDate = subDays(now, 365);

  let query = supabase
    .from('water_tests')
    .select('id, test_date, test_parameters(parameter_name, value, unit)')
    .eq('aquarium_id', aquariumId)
    .order('test_date', { ascending: true });

  if (startDate) {
    query = query.gte('test_date', startDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Fetch a single water test
export async function fetchWaterTest(testId: string) {
  const { data, error } = await supabase
    .from('water_tests')
    .select('*, test_parameters(*)')
    .eq('id', testId)
    .single();

  if (error) throw error;
  return data as WaterTestWithParameters;
}

// Create a water test with parameters
export async function createWaterTest(
  test: {
    aquarium_id: string;
    user_id: string;
    test_date?: string;
    notes?: string;
    tags?: string[];
    confidence?: string;
    entry_method?: string;
    photo_url?: string;
  },
  parameters: Array<{
    parameter_name: string;
    value: number;
    unit: string;
    status?: string;
  }>
) {
  // Create the water test
  const { data: testData, error: testError } = await supabase
    .from('water_tests')
    .insert({
      ...test,
      test_date: test.test_date || new Date().toISOString(),
    })
    .select()
    .single();

  if (testError) throw testError;

  // Create parameters if any
  if (parameters.length > 0) {
    const { error: paramsError } = await supabase
      .from('test_parameters')
      .insert(
        parameters.map((p) => ({
          test_id: testData.id,
          ...p,
        }))
      );

    if (paramsError) throw paramsError;
  }

  return testData as WaterTest;
}

// Delete a water test
export async function deleteWaterTest(testId: string) {
  const { error } = await supabase
    .from('water_tests')
    .delete()
    .eq('id', testId);

  if (error) throw error;
}

// Fetch monthly test count for a user
export async function fetchMonthlyTestCount(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('water_tests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('test_date', startOfMonth.toISOString());

  if (error) throw error;
  return count || 0;
}

// Upload photo for water test
export async function uploadWaterTestPhoto(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('water-test-photos')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('water-test-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
