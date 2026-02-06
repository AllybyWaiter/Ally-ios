/**
 * Knowledge Base Search Handler
 *
 * Semantic search over the domain knowledge base for RAG.
 */

import type { SupabaseClient, ToolResult, Logger } from '../types.ts';
import { generateEmbedding, formatEmbeddingForPostgres } from '../../../_shared/embeddings.ts';

export async function executeSearchKnowledge(
  supabase: SupabaseClient,
  args: {
    query: string;
    water_types?: string[];
    categories?: string[];
    limit?: number;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // Generate embedding for the search query
    const embeddingResult = await generateEmbedding(args.query);
    const queryEmbedding = formatEmbeddingForPostgres(embeddingResult.embedding);

    logger.debug('Generated query embedding', { tokens: embeddingResult.tokens });

    // Call the semantic search function
    const { data, error } = await supabase.rpc('search_knowledge', {
      p_query_embedding: queryEmbedding,
      p_water_types: args.water_types || null,
      p_categories: args.categories || null,
      p_limit: args.limit || 5
    });

    if (error) {
      logger.error('Knowledge search failed', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: 'Failed to search knowledge base'
        })
      };
    }

    if (!data || data.length === 0) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: true,
          results: [],
          message: 'No relevant knowledge found for this query.'
        })
      };
    }

    // Format results for the AI
    const results = data.map((item: {
      id: string;
      category: string;
      subcategory?: string;
      title: string;
      content: string;
      similarity: number;
    }) => ({
      title: item.title,
      category: item.category,
      subcategory: item.subcategory,
      content: item.content,
      relevance: Math.round(item.similarity * 100) + '%'
    }));

    logger.info('Knowledge search completed', {
      query: args.query.slice(0, 50),
      resultCount: results.length,
      topRelevance: results[0]?.relevance
    });

    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({
        success: true,
        results,
        message: `Found ${results.length} relevant knowledge articles.`
      })
    };
  } catch (e) {
    logger.error('Error searching knowledge', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({
        success: false,
        error: 'Failed to search knowledge base'
      })
    };
  }
}
