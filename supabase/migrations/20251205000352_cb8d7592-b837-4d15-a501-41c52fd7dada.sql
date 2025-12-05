-- Create user_memories table for Ally's memory layer
CREATE TABLE public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  water_type TEXT, -- 'freshwater', 'saltwater', 'brackish', or NULL for universal
  memory_key TEXT NOT NULL, -- categorization: 'equipment', 'product', 'water_source', 'feeding', 'maintenance', 'preference', 'livestock_care', 'other'
  memory_value TEXT NOT NULL, -- the actual fact
  source TEXT DEFAULT 'conversation', -- 'conversation', 'manual'
  confidence TEXT DEFAULT 'confirmed', -- 'confirmed', 'inferred'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_user_memories_user_water ON public.user_memories(user_id, water_type);

-- Enable RLS
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own memories
CREATE POLICY "Users can view their own memories"
  ON public.user_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
  ON public.user_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.user_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.user_memories FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_memories_updated_at
  BEFORE UPDATE ON public.user_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();