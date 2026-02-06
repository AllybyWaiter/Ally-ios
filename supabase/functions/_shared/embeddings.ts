/**
 * Embedding Utilities
 *
 * Generate embeddings using OpenAI's text-embedding-3-small model.
 * Used for semantic search in memories and knowledge base.
 */

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions, fast & cheap

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Clean and truncate text (max ~8000 tokens for this model)
  const cleanText = text.trim().slice(0, 30000);

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanText,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    embedding: data.data[0].embedding,
    tokens: data.usage.total_tokens,
  };
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  if (texts.length === 0) return [];

  // Clean texts
  const cleanTexts = texts.map(t => t.trim().slice(0, 30000));

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanTexts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return data.data.map((item: any, index: number) => ({
    embedding: item.embedding,
    tokens: Math.floor(data.usage.total_tokens / texts.length), // Approximate per-text
  }));
}

/**
 * Format embedding array for Postgres vector type
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
