-- Add nitrate reduction and temperature stress triage knowledge entries for Ally

WITH seed AS (
  SELECT
    'water_chemistry'::text AS category,
    'nitrate_management'::text AS subcategory,
    'High Nitrate Reduction Playbook (Aquarium)'::text AS title,
    $$Use a multi-layer nitrate strategy: reduce nutrient input (feeding and decay control), increase export (water changes and filtration maintenance), improve biological processing (plants/refugium/denitrification where appropriate), and prevent rebound with trend monitoring. Before nitrate correction, rule out acute emergencies: ammonia > 0, nitrite > 0, oxygen stress, and temperature instability. Reduce nitrate in steps, not crashes. Practical water-change sizing formula when source nitrate is near zero: required_change_fraction = 1 - (target/current). Track trendline over repeated tests and tune the least-intensive maintenance routine that keeps nitrate inside the chosen system-specific operating band.$$::text AS content,
    ARRAY['nitrate', 'high nitrate', 'water change', 'export', 'feeding', 'detritus', 'reef nutrients', 'freshwater']::text[] AS keywords,
    ARRAY['freshwater', 'saltwater', 'reef']::text[] AS water_types,
    ARRAY['beginner', 'intermediate', 'advanced']::text[] AS skill_levels,
    '{"source_doc": "docs/knowledge/high-nitrate-reduction-playbook.md"}'::jsonb AS metadata

  UNION ALL

  SELECT
    'fish_care',
    'temperature_stress',
    'Temperature Stress Triage Protocol (Aquarium and Pond Livestock)',
    $$Temperature emergencies are oxygen and stability emergencies. Immediate sequence: verify temperature with a second thermometer, increase aeration/surface agitation, stop feeding, and check flow/equipment status. For heat stress, reduce heat input and cool gradually with strong oxygenation; avoid rapid temperature crashes. For cold stress, restore heating and raise temperature progressively; avoid sudden warm jumps and maintain circulation to prevent local gradients. During recovery (0-24h), recheck temperature frequently, monitor respiration and behavior, and test ammonia/nitrite because secondary water-quality crashes are common after stress events. Escalate if severe distress persists after stabilization or if mass morbidity/mortality begins.$$::text,
    ARRAY['temperature stress', 'heat stress', 'cold stress', 'gasping', 'oxygenation', 'heater failure', 'thermal shock', 'triage']::text[],
    ARRAY['freshwater', 'saltwater', 'reef', 'brackish']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/temperature-stress-triage-protocol.md"}'::jsonb
)
INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels, metadata)
SELECT s.category, s.subcategory, s.title, s.content, s.keywords, s.water_types, s.skill_levels, s.metadata
FROM seed s
WHERE NOT EXISTS (
  SELECT 1
  FROM knowledge_base kb
  WHERE kb.title = s.title
);
