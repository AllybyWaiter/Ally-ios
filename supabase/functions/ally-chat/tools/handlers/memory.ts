import type { SupabaseClient, ToolResult, Logger } from '../types.ts';
import { generateEmbedding, formatEmbeddingForPostgres } from '../../../_shared/embeddings.ts';

export async function executeSaveMemory(
  supabase: SupabaseClient,
  userId: string,
  args: {
    memory_key: string;
    category: string;
    memory_value: string;
    water_type: string;
    aquarium_id?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // Generate embedding for semantic search
    let embedding: string | null = null;
    try {
      const embeddingText = `${args.category}: ${args.memory_key} - ${args.memory_value}`;
      const embeddingResult = await generateEmbedding(embeddingText);
      embedding = formatEmbeddingForPostgres(embeddingResult.embedding);
      logger.debug('Generated embedding for memory', { tokens: embeddingResult.tokens });
    } catch (embError) {
      // Don't fail the save if embedding fails - just log and continue
      logger.error('Failed to generate embedding', { error: String(embError) });
    }

    const { error } = await supabase
      .from('user_memories')
      .insert({
        user_id: userId,
        memory_key: args.memory_key,
        category: args.category,
        memory_value: args.memory_value,
        water_type: args.water_type === 'universal' ? null : args.water_type,
        aquarium_id: args.aquarium_id || null,
        source: 'conversation',
        confidence: 'confirmed',
        embedding: embedding
      });

    if (error) {
      logger.error('Failed to save memory', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'Failed to save memory' })
      };
    }

    logger.info('Memory saved successfully', { memoryKey: args.memory_key, category: args.category });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: true, message: `Memory saved: ${args.memory_value}` })
    };
  } catch (e) {
    logger.error('Error saving memory', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to save memory' })
    };
  }
}
