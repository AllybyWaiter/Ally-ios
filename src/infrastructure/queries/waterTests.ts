/**
 * Water Tests Data Access Layer
 *
 * Centralized Supabase queries for water test-related data.
 */

import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';
import { ensureFreshSession } from '@/lib/sessionUtils';
import { createWaterTestSchema, testParameterSchema, validateOrThrow } from '@/lib/validationSchemas';
import { z } from 'zod';

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

/** Maximum number of water tests to return in a single query */
const MAX_WATER_TESTS_LIMIT = 1000;

/**
 * @deprecated Use fetchWaterTests with pagination instead
 * Fetch all water tests for an aquarium (legacy support)
 */
export async function fetchAllWaterTests(aquariumId: string, limit?: number) {
  await ensureFreshSession();

  // Apply max limit to prevent unbounded results
  const effectiveLimit = limit ? Math.min(limit, MAX_WATER_TESTS_LIMIT) : MAX_WATER_TESTS_LIMIT;

  const { data, error } = await supabase
    .from('water_tests')
    .select('*, test_parameters(*)')
    .eq('aquarium_id', aquariumId)
    .order('test_date', { ascending: false })
    .limit(effectiveLimit);

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

// Fetch a single water test (with ownership verification)
export async function fetchWaterTest(testId: string, userId: string) {
  const { data, error } = await supabase
    .from('water_tests')
    .select('*, test_parameters(*)')
    .eq('id', testId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Water test not found');
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
  // Validate test input
  const validatedTest = validateOrThrow(createWaterTestSchema, test, 'water test');

  // Validate parameters
  const parametersSchema = z.array(testParameterSchema).max(50, 'Maximum 50 parameters allowed');
  const validatedParams = validateOrThrow(parametersSchema, parameters, 'test parameters');

  // Create the water test
  const { data: testData, error: testError } = await supabase
    .from('water_tests')
    .insert({
      ...validatedTest,
      test_date: validatedTest.test_date || new Date().toISOString(),
    })
    .select()
    .single();

  if (testError) throw testError;

  // Create parameters if any
  if (validatedParams.length > 0) {
    const { error: paramsError } = await supabase
      .from('test_parameters')
      .insert(
        validatedParams.map((p) => ({
          test_id: testData.id,
          ...p,
        }))
      );

    if (paramsError) throw paramsError;
  }

  return testData as WaterTest;
}

// Delete a water test (with ownership verification)
export async function deleteWaterTest(testId: string, userId: string) {
  const { error } = await supabase
    .from('water_tests')
    .delete()
    .eq('id', testId)
    .eq('user_id', userId);

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// Upload photo for water test with retry logic
export async function uploadWaterTestPhoto(userId: string, file: File, maxRetries = 2) {
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large (max 10MB)');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');

  const parts = file.name.split('.');
  const fileExt = parts.length > 1 ? parts[parts.length - 1] : 'jpg'; // Default to jpg if no extension
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('water-test-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('water-test-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to upload photo after retries');
}
