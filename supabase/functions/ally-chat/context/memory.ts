/**
 * User Memory Context Builder
 * 
 * Fetches and formats user memories for AI context.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export interface MemoryContext {
  context: string;
  memories: any[];
}

export async function buildMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  waterType: string
): Promise<MemoryContext> {
  const { data: memoryData } = await supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .or(`water_type.eq.${waterType},water_type.eq.universal,water_type.is.null`)
    .order('created_at', { ascending: false });

  if (!memoryData || memoryData.length === 0) {
    return {
      context: '',
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

User's Known Setup & Preferences (from previous conversations):
${Object.entries(groupedMemories)
  .map(([key, values]) => `[${key.toUpperCase()}]\n${values.map((v) => `  • ${v}`).join('\n')}`)
  .join('\n\n')}

Use this information to provide personalized advice. You don't need to ask about things you already know.
`;

  return {
    context,
    memories: memoryData,
  };
}
