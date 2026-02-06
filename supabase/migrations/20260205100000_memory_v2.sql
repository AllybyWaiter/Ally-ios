-- Memory V2: Multi-memory support with categories and aquarium scoping
-- Adds category column for grouping, aquarium_id for tank-specific memories

-- 1. Add category column (grouping dimension)
ALTER TABLE public.user_memories ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Add aquarium_id column for tank-specific memories
ALTER TABLE public.user_memories ADD COLUMN IF NOT EXISTS aquarium_id UUID REFERENCES public.aquariums(id) ON DELETE SET NULL;

-- 3. Migrate existing data: copy memory_key → category where not already set
UPDATE public.user_memories SET category = memory_key WHERE category IS NULL;

-- 4. Index for aquarium-specific queries
CREATE INDEX IF NOT EXISTS idx_user_memories_aquarium ON public.user_memories(aquarium_id) WHERE aquarium_id IS NOT NULL;

-- 5. Index for category queries
CREATE INDEX IF NOT EXISTS idx_user_memories_category ON public.user_memories(category);
