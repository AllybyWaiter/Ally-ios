/**
 * User Memory Context Builder
 * 
 * Fetches and formats user memories for AI context.
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface MemoryContext {
  context: string;
  memories: any[];
}

export async function buildMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  waterType: string
): Promise<MemoryContext> {
  // Fetch user memories
  const { data: memoryData } = await supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .or(`water_type.eq.${waterType},water_type.eq.universal,water_type.is.null`)
    .order('created_at', { ascending: false });

  // Fetch user's hemisphere for seasonal context
  const { data: profile } = await supabase
    .from('profiles')
    .select('hemisphere')
    .eq('user_id', userId)
    .maybeSingle();

  const hemisphere = profile?.hemisphere || 'northern';
  const month = new Date().getMonth() + 1;
  const isNorthern = hemisphere !== 'southern';
  
  let seasonName = 'unknown';
  if (isNorthern) {
    if (month >= 3 && month <= 5) seasonName = 'spring';
    else if (month >= 6 && month <= 8) seasonName = 'summer';
    else if (month >= 9 && month <= 11) seasonName = 'fall';
    else seasonName = 'winter';
  } else {
    if (month >= 3 && month <= 5) seasonName = 'fall';
    else if (month >= 6 && month <= 8) seasonName = 'winter';
    else if (month >= 9 && month <= 11) seasonName = 'spring';
    else seasonName = 'summer';
  }

  if (!memoryData || memoryData.length === 0) {
    return {
      context: `\nUser Location: ${hemisphere} hemisphere (current season: ${seasonName})\n`,
      memories: [],
    };
  }

  const groupedMemories: Record<string, string[]> = {};
  memoryData.forEach((m) => {
    const key = m.memory_key || 'other';
    if (!groupedMemories[key]) groupedMemories[key] = [];
    groupedMemories[key].push(
      `${m.memory_value}${m.water_type && m.water_type !== 'universal' ? ` (${m.water_type} only)` : ''}`
    );
  });

  const context = `

User Location: ${hemisphere} hemisphere (current season: ${seasonName})

User's Known Setup & Preferences (from previous conversations):
${Object.entries(groupedMemories)
  .map(([key, values]) => `[${key.toUpperCase()}]\n${values.map((v) => `  • ${v}`).join('\n')}`)
  .join('\n\n')}

Use this information to provide personalized advice. You don't need to ask about things you already know. For pools and spas, consider seasonal timing for maintenance recommendations.
`;

  return {
    context,
    memories: memoryData,
  };
}
