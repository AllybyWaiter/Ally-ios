/**
 * Aquarium Context Builder
 * 
 * Fetches and formats aquarium data for AI context.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getWaterType } from '../tools/index.ts';

export interface AquariumContext {
  context: string;
  waterType: string;
  aquariumData: any;
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

  const context = `

Current Aquarium Context:
- Name: ${aquarium.name}
- Type: ${aquarium.type}
- Water Type: ${waterType}
- Volume: ${aquarium.volume_gallons} gallons
- Status: ${aquarium.status}
${aquarium.notes ? `- Notes: ${aquarium.notes}` : ''}

Recent Water Tests: ${waterTests?.length || 0} tests on record (showing last 10)

Equipment (${aquarium.equipment?.length || 0} total):
${aquarium.equipment && aquarium.equipment.length > 0 
  ? aquarium.equipment.map((e: any) => `  - ${e.name} (${e.equipment_type})${e.brand ? ', Brand: ' + e.brand : ''}${e.model ? ', Model: ' + e.model : ''}${e.maintenance_interval_days ? ', Maintenance every ' + e.maintenance_interval_days + ' days' : ''}${e.notes ? ', Notes: ' + e.notes : ''}`).join('\n')
  : '  None added yet'}

Livestock (${livestock?.length || 0} total):
${livestock && livestock.length > 0 
  ? livestock.map((l: any) => `  - ${l.quantity}x ${l.species} (${l.name}) - Category: ${l.category}, Health: ${l.health_status}${l.notes ? ', Notes: ' + l.notes : ''}`).join('\n')
  : '  None added yet'}

Plants (${plants?.length || 0} total):
${plants && plants.length > 0
  ? plants.map((p: any) => `  - ${p.quantity}x ${p.species} (${p.name}) - Placement: ${p.placement}, Condition: ${p.condition}${p.notes ? ', Notes: ' + p.notes : ''}`).join('\n')
  : '  None added yet'}

Active Trend Alerts (${alerts?.length || 0}):
${alerts && alerts.length > 0
  ? alerts.map((a: any) => `  - [${a.severity.toUpperCase()}] ${a.parameter_name}: ${a.message}`).join('\n')
  : '  No active alerts'}
`;

  return {
    context,
    waterType,
    aquariumData: aquariumWithTests,
  };
}
