-- Add RO/DI source-water quality SOP knowledge entry

WITH seed AS (
  SELECT
    'water_chemistry'::text AS category,
    'source_water'::text AS subcategory,
    'RO/DI and Source-Water Quality SOP'::text AS title,
    $$RO/DI operations are reliability systems where feedwater quality drives membrane and resin life. RO and DI must be monitored as separate stages: RO for rejection and pressure behavior, DI for ionic polishing breakthrough. Core controls are oxidant protection before RO, particulate and scaling control in pretreatment, stage-by-stage conductivity trend logging, and replacement decisions based on measured drift rather than calendar-only intervals. Rapid permeate-quality decline, rising pressure drop, or accelerated DI exhaustion should trigger immediate pretreatment and membrane diagnostics.$$::text AS content,
    ARRAY['ro/di', 'source water', 'reverse osmosis', 'deionization', 'pretreatment', 'chlorine breakthrough', 'conductivity', 'tds']::text[] AS keywords,
    ARRAY['freshwater', 'saltwater', 'reef']::text[] AS water_types,
    ARRAY['beginner', 'intermediate', 'advanced']::text[] AS skill_levels,
    '{"source_doc": "docs/knowledge/ro-di-source-water-quality-sop.md"}'::jsonb AS metadata
)
INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels, metadata)
SELECT s.category, s.subcategory, s.title, s.content, s.keywords, s.water_types, s.skill_levels, s.metadata
FROM seed s
WHERE NOT EXISTS (
  SELECT 1
  FROM knowledge_base kb
  WHERE kb.title = s.title
);
