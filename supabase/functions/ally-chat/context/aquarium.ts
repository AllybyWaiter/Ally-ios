/**
 * Aquarium Context Builder
 * 
 * Fetches and formats aquarium data for AI context.
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { getWaterType } from '../tools/index.ts';
import { computeAquariumInsights } from './insights.ts';

export interface AquariumContext {
  context: string;
  waterType: string;
  aquariumData: Record<string, unknown> | null;
}

const MAX_PROACTIVE_SUMMARY_CHARS = 2500;
type ComputeInsightsArgs = Parameters<typeof computeAquariumInsights>;

async function fetchFishSpeciesData(
  supabase: SupabaseClient,
  livestock: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const speciesNames = Array.from(
    new Set(
      livestock
        .map((item) => (typeof item.species === 'string' ? item.species.trim() : ''))
        .filter((name) => name.length > 0)
    )
  );

  if (speciesNames.length === 0) return [];

  const [scientificResult, commonResult] = await Promise.all([
    supabase.from('fish_species').select('*').in('scientific_name', speciesNames),
    supabase.from('fish_species').select('*').in('common_name', speciesNames),
  ]);

  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of [...(scientificResult.data || []), ...(commonResult.data || [])]) {
    const id = typeof row.id === 'string' ? row.id : null;
    if (id) deduped.set(id, row as Record<string, unknown>);
  }

  return Array.from(deduped.values());
}

export async function buildAquariumContext(
  supabase: SupabaseClient,
  aquariumId: string
): Promise<AquariumContext> {
  // Fetch aquarium with equipment (water tests fetched separately with limit)
  const { data: aquarium } = await supabase
    .from('aquariums')
    .select('*, equipment(*)')
    .eq('id', aquariumId)
    .single();

  if (!aquarium) {
    return {
      context: '',
      waterType: 'freshwater',
      aquariumData: null,
    };
  }

  // Fetch livestock, plants, alerts, and recent water tests in parallel
  // Limit water tests to last 10 for performance (most relevant for context)
  const [
    { data: livestock }, 
    { data: plants }, 
    { data: alerts },
    { data: waterTests }
  ] = await Promise.all([
    supabase.from('livestock').select('*').eq('aquarium_id', aquariumId),
    supabase.from('plants').select('*').eq('aquarium_id', aquariumId),
    supabase.from('water_test_alerts').select('*').eq('aquarium_id', aquariumId).eq('is_dismissed', false),
    supabase.from('water_tests')
      .select('*, test_parameters(*)')
      .eq('aquarium_id', aquariumId)
      .order('test_date', { ascending: false })
      .limit(10),
  ]);
  
  // Attach water tests to aquarium object for context building
  const aquariumWithTests = { ...aquarium, water_tests: waterTests };

  const waterType = getWaterType(aquarium.type);
  let proactiveSummary = '';

  try {
    const fishSpeciesData = await fetchFishSpeciesData(
      supabase,
      (livestock || []) as Record<string, unknown>[]
    );

    const waterTestsForInsights = (waterTests || []) as unknown as ComputeInsightsArgs[0];
    const livestockForInsights = (livestock || []) as unknown as ComputeInsightsArgs[1];
    const fishSpeciesForInsights = fishSpeciesData as unknown as ComputeInsightsArgs[2];
    const equipmentForInsights = ((aquarium.equipment as Record<string, unknown>[]) || []) as unknown as ComputeInsightsArgs[3];
    const plantsForInsights = (plants || []) as unknown as ComputeInsightsArgs[6];

    const insights = computeAquariumInsights(
      waterTestsForInsights,
      livestockForInsights,
      fishSpeciesForInsights,
      equipmentForInsights,
      typeof aquarium.volume_gallons === 'number' ? aquarium.volume_gallons : null,
      waterType,
      plantsForInsights
    );

    const summary = insights.proactiveSummary?.trim() || '';
    if (summary) {
      proactiveSummary = summary.length > MAX_PROACTIVE_SUMMARY_CHARS
        ? `${summary.slice(0, MAX_PROACTIVE_SUMMARY_CHARS).trimEnd()}...`
        : summary;
    }
  } catch {
    // Keep chat context generation resilient if insights computation fails.
    proactiveSummary = '';
  }

  const context = `

Current Aquarium Context:
- ID: ${aquarium.id}
- Name: ${aquarium.name}
- Type: ${aquarium.type}
- Water Type: ${waterType}
- Volume: ${aquarium.volume_gallons} gallons
- Status: ${aquarium.status}
${aquarium.notes ? `- Notes: ${aquarium.notes}` : ''}

Recent Water Tests (${waterTests?.length || 0} total):
${waterTests && waterTests.length > 0 
  ? waterTests.slice(0, 5).map((test: Record<string, unknown>) => {
      const testDate = new Date(test.test_date);
      const daysAgo = Math.floor((Date.now() - testDate.getTime()) / (1000 * 60 * 60 * 24));
      const dateStr = testDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const params = test.test_parameters?.map((p: Record<string, unknown>) => 
        `${p.parameter_name}: ${p.value}${p.unit || ''} (${p.status || 'unknown'})`
      ).join(', ') || 'No parameters recorded';
      return `  - ${dateStr} (${daysAgo} days ago): ${params}`;
    }).join('\n')
  : '  No water tests recorded yet'}

Equipment (${aquarium.equipment?.length || 0} total):
${aquarium.equipment && aquarium.equipment.length > 0 
  ? aquarium.equipment.map((e: Record<string, unknown>) => `  - ${e.name} (${e.equipment_type})${e.brand ? ', Brand: ' + e.brand : ''}${e.model ? ', Model: ' + e.model : ''}${e.maintenance_interval_days ? ', Maintenance every ' + e.maintenance_interval_days + ' days' : ''}${e.notes ? ', Notes: ' + e.notes : ''}`).join('\n')
  : '  None added yet'}

Livestock (${livestock?.length || 0} total):
${livestock && livestock.length > 0 
  ? livestock.map((l: Record<string, unknown>) => `  - ${l.quantity}x ${l.species} (${l.name}) - Category: ${l.category}, Health: ${l.health_status}${l.notes ? ', Notes: ' + l.notes : ''}`).join('\n')
  : '  None added yet'}

Plants (${plants?.length || 0} total):
${plants && plants.length > 0
  ? plants.map((p: Record<string, unknown>) => `  - ${p.quantity}x ${p.species} (${p.name}) - Placement: ${p.placement}, Condition: ${p.condition}${p.notes ? ', Notes: ' + p.notes : ''}`).join('\n')
  : '  None added yet'}

Active Trend Alerts (${alerts?.length || 0}):
${alerts && alerts.length > 0
  ? alerts.map((a: Record<string, unknown>) => `  - [${a.severity.toUpperCase()}] ${a.parameter_name}: ${a.message}`).join('\n')
  : '  No active alerts'}
${proactiveSummary ? `\n\n${proactiveSummary}` : ''}
`;

  return {
    context,
    waterType,
    aquariumData: aquariumWithTests,
  };
}
