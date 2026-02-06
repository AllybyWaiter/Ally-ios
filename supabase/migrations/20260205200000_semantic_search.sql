-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to user_memories for semantic search
ALTER TABLE user_memories
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search on memories
CREATE INDEX IF NOT EXISTS user_memories_embedding_idx
ON user_memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Knowledge base table for domain expertise (RAG)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'fish_care', 'water_chemistry', 'disease', 'equipment', 'pool', 'spa', 'plants'
  subcategory TEXT, -- More specific grouping
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[], -- For hybrid search
  water_types TEXT[], -- ['freshwater', 'saltwater', 'reef', 'pool', 'spa']
  skill_levels TEXT[] DEFAULT ARRAY['beginner', 'intermediate', 'advanced'],
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast similarity search on knowledge
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS knowledge_base_category_idx ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS knowledge_base_water_types_idx ON knowledge_base USING GIN(water_types);

-- Function to search memories by semantic similarity
CREATE OR REPLACE FUNCTION search_memories_semantic(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_aquarium_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  memory_key TEXT,
  memory_value TEXT,
  aquarium_id UUID,
  water_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id,
    um.category,
    um.memory_key,
    um.memory_value,
    um.aquarium_id,
    um.water_type,
    1 - (um.embedding <=> p_query_embedding) AS similarity
  FROM user_memories um
  WHERE um.user_id = p_user_id
    AND um.embedding IS NOT NULL
    AND (p_aquarium_id IS NULL OR um.aquarium_id IS NULL OR um.aquarium_id = p_aquarium_id)
  ORDER BY um.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- Function to search knowledge base
CREATE OR REPLACE FUNCTION search_knowledge(
  p_query_embedding vector(1536),
  p_water_types TEXT[] DEFAULT NULL,
  p_categories TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  subcategory TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.category,
    kb.subcategory,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> p_query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.embedding IS NOT NULL
    AND (p_water_types IS NULL OR kb.water_types && p_water_types)
    AND (p_categories IS NULL OR kb.category = ANY(p_categories))
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- Trigger to update updated_at on knowledge_base
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_base_updated_at();
