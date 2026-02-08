/**
 * User Memory Context Builder
 *
 * Fetches and formats user memories for AI context.
 * Supports semantic search with embeddings and aquarium-scoped memories.
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { generateEmbedding, formatEmbeddingForPostgres } from '../../_shared/embeddings.ts';

interface UserMemoryRecord {
  id: string;
  memory_key: string;
  memory_value: string;
  water_type: string | null;
  aquarium_id?: string | null;
  category?: string;
  similarity?: number;
  updated_at?: string;
}

export interface MemoryContext {
  context: string;
  memories: UserMemoryRecord[];
}

/**
 * Search memories semantically based on conversation context
 */
async function searchMemoriesSemantic(
  supabase: SupabaseClient,
  userId: string,
  queryText: string,
  aquariumId?: string,
  limit: number = 20
): Promise<UserMemoryRecord[]> {
  try {
    const embeddingResult = await generateEmbedding(queryText);
    const queryEmbedding = formatEmbeddingForPostgres(embeddingResult.embedding);

    const { data, error } = await supabase.rpc('search_memories_semantic', {
      p_user_id: userId,
      p_query_embedding: queryEmbedding,
      p_aquarium_id: aquariumId || null,
      p_limit: limit
    });

    if (error || !data) {
      return [];
    }

    // Filter to only include reasonably relevant memories (>40% similarity)
    return data.filter((m: { similarity: number }) => m.similarity > 0.4);
  } catch {
    return [];
  }
}

export async function buildMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  waterType: string,
  aquariumId?: string,
  conversationContext?: string
): Promise<MemoryContext> {
  let memoryData: UserMemoryRecord[] = [];

  // If we have conversation context, try semantic search first
  if (conversationContext && conversationContext.length > 10) {
    memoryData = await searchMemoriesSemantic(
      supabase,
      userId,
      conversationContext,
      aquariumId,
      30
    );
  }

  // Fallback to traditional query if semantic search returned nothing
  if (memoryData.length === 0) {
    // Whitelist valid water types to prevent PostgREST filter injection
    const validWaterTypes = ['freshwater', 'saltwater', 'brackish', 'pond', 'pool', 'spa', 'reef', 'planted', 'universal'];
    const safeWaterType = validWaterTypes.includes(waterType.toLowerCase()) ? waterType.toLowerCase() : 'freshwater';

    let query = supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .or(`water_type.eq.${safeWaterType},water_type.eq.universal,water_type.is.null`)
      .order('updated_at', { ascending: false })
      .limit(50);

    // If aquarium selected, include both global and aquarium-specific memories
    // Validate aquariumId is a UUID to prevent PostgREST filter injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (aquariumId && uuidRegex.test(aquariumId)) {
      query = supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', userId)
        .or(`water_type.eq.${safeWaterType},water_type.eq.universal,water_type.is.null`)
        .or(`aquarium_id.eq.${aquariumId},aquarium_id.is.null`)
        .order('updated_at', { ascending: false })
        .limit(50);
    }

    const { data } = await query;
    memoryData = data || [];
  }

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

  // Group by category (falling back to memory_key for old data)
  const groupedMemories: Record<string, string[]> = {};
  memoryData.forEach((m) => {
    const key = m.category || m.memory_key || 'other';
    if (!groupedMemories[key]) groupedMemories[key] = [];
    const scope = m.aquarium_id ? ' [tank-specific]' : '';
    const relevance = m.similarity ? ` (${Math.round(m.similarity * 100)}% relevant)` : '';
    groupedMemories[key].push(
      `${m.memory_value}${m.water_type && m.water_type !== 'universal' ? ` (${m.water_type} only)` : ''}${scope}${relevance}`
    );
  });

  const context = `

User Location: ${hemisphere} hemisphere (current season: ${seasonName})

User's Known Setup & Preferences (from previous conversations):
${Object.entries(groupedMemories)
  .map(([key, values]) => `[${key.toUpperCase()}]\n${values.map((v) => `  - ${v}`).join('\n')}`)
  .join('\n\n')}

Use this information to provide personalized advice. You don't need to ask about things you already know. For pools and spas, consider seasonal timing for maintenance recommendations.
`;

  return {
    context,
    memories: memoryData,
  };
}
