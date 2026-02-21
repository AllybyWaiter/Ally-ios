-- Add runbook-backed knowledge entries for Ally aquarium protocols

WITH seed AS (
  SELECT
    'water_chemistry'::text AS category,
    'emergency_response'::text AS subcategory,
    'Ammonia and Nitrite Emergency Runbook (Aquarium)'::text AS title,
    $$Treat ammonia/nitrite spikes as oxygen and toxicity emergencies. Immediate sequence: increase aeration and circulation, stop feeding, remove decay, verify measurements (temperature, pH, TAN, nitrite, KH/alkalinity), then perform dilution water changes sized by formula required_change_fraction = 1 - (target/current). Use ammonia binders only as short-term bridge support while root cause is fixed. For freshwater nitrite events, chloride support can reduce nitrite uptake when livestock is salt-tolerant, but this never replaces water changes and biofilter recovery. Stabilization window (6-48h): keep oxygen high, keep feeding minimal, maintain KH/alkalinity, protect/restore biofilter function, and retest every 12-24h until ammonia and nitrite remain zero for at least 48h.$$::text AS content,
    ARRAY['ammonia', 'nitrite', 'emergency', 'oxygen', 'water change', 'chloride', 'biofilter', 'gasping']::text[] AS keywords,
    ARRAY['freshwater', 'saltwater', 'reef']::text[] AS water_types,
    ARRAY['beginner', 'intermediate', 'advanced']::text[] AS skill_levels,
    '{"source_doc": "docs/knowledge/ammonia-nitrite-emergency-runbook.md"}'::jsonb AS metadata

  UNION ALL

  SELECT
    'water_chemistry',
    'cycling',
    'New Tank Cycling SOP (Fishless and Fish-In Guardrails)',
    $$Fishless cycling is preferred: run filtration and aeration, dose controlled ammonia (commonly about 2 ppm), test ammonia and nitrite every 1-2 days, and maintain KH to prevent pH crash and stalled nitrification. Completion challenge: after dosing, both ammonia and nitrite should return to zero in about 24 hours and nitrate should be present. Fish-in cycling is exception mode and requires strict guardrails: light feeding, daily testing, aggressive water changes when thresholds are crossed, and constant oxygen support. Conservative intervention thresholds: ammonia caution at or above 0.25 ppm, action at or above 0.50 ppm, emergency at or above 1.0 ppm; nitrite caution at or above 0.10 ppm, action at or above 0.25 ppm, emergency at or above 0.50 ppm.$$,
    ARRAY['cycling', 'fishless', 'fish-in', 'biofilter', 'new tank syndrome', 'ammonia', 'nitrite', 'KH'],
    ARRAY['freshwater', 'saltwater', 'reef'],
    ARRAY['beginner', 'intermediate', 'advanced'],
    '{"source_doc": "docs/knowledge/new-tank-cycling-sop.md"}'::jsonb

  UNION ALL

  SELECT
    'water_chemistry',
    'marine_targets',
    'Saltwater Parameter Targets and Corrective Actions',
    $$Marine stability priorities are: (1) immediate life support (temperature, salinity, oxygen, ammonia), (2) system stability drivers (alkalinity, pH, gas exchange, equipment), and (3) nutrient control (nitrate/phosphate balance). Practical reef-capable targets: temperature 76-80F with low swing, salinity near 35 ppt, pH about 7.8-8.3, alkalinity 7-11 dKH at a stable setpoint, calcium 400-450 ppm, magnesium 1200-1400 ppm, ammonia 0, nitrite 0, and dissolved oxygen preferably above 5 mg/L. Correction rules: verify measurement before major changes, correct salinity and temperature gradually, avoid rapid pH chasing, split dosing through the day, and retest after each correction block.$$,
    ARRAY['saltwater', 'reef', 'parameters', 'salinity', 'alkalinity', 'calcium', 'magnesium', 'oxygen', 'nitrate', 'phosphate'],
    ARRAY['saltwater', 'reef'],
    ARRAY['beginner', 'intermediate', 'advanced'],
    '{"source_doc": "docs/knowledge/saltwater-parameter-targets-corrective-actions.md"}'::jsonb

  UNION ALL

  SELECT
    'water_chemistry',
    'freshwater_targets',
    'Freshwater Parameter Targets and Corrective Actions',
    $$Freshwater aquarium control should prioritize stability and toxicity prevention. Baseline targets: ammonia 0, nitrite 0, nitrate typically under 20 ppm ideal and often under 40 ppm acceptable for many community systems, species-appropriate temperature, measurable stable KH, and species-appropriate GH. Triage order for issues: oxygen/flow first, then ammonia/nitrite, then temperature stability, then KH/pH stability, then long-term nitrate export. Recurrent pH swings are usually KH and gas-exchange problems, not stand-alone pH problems. For chronic nitrate: reduce input, increase export, remove detritus, and validate source-water contribution.$$,
    ARRAY['freshwater', 'targets', 'ammonia', 'nitrite', 'nitrate', 'KH', 'GH', 'pH stability'],
    ARRAY['freshwater'],
    ARRAY['beginner', 'intermediate', 'advanced'],
    '{"source_doc": "docs/knowledge/freshwater-parameter-targets-corrective-actions.md"}'::jsonb

  UNION ALL

  SELECT
    'water_chemistry',
    'reef_balancing',
    'Reef Alkalinity, Calcium, and Magnesium Balancing Protocol',
    $$Use alkalinity as the main control variable for reef dosing because it moves fastest and reveals demand changes first. Typical target bands: alkalinity 7-9 dKH (or chosen stable setpoint), calcium 400-450 ppm, magnesium 1250-1400 ppm. Useful demand approximation under calcification-dominant load: about 1 dKH alkalinity corresponds to about 7 ppm calcium. Safe correction sequence: verify salinity/testing first, correct magnesium when low, then correct alkalinity, then calcium, then switch to maintenance tuning. Conservative daily ceilings: alkalinity up to about 1.0-1.4 dKH/day, calcium up to about 20-50 ppm/day, magnesium up to about 50-100 ppm/day, with split doses to reduce precipitation and pH spikes.$$,
    ARRAY['reef', 'alkalinity', 'calcium', 'magnesium', 'dosing', 'precipitation', 'stability'],
    ARRAY['reef', 'saltwater'],
    ARRAY['intermediate', 'advanced'],
    '{"source_doc": "docs/knowledge/reef-alkalinity-calcium-magnesium-balancing-protocol.md"}'::jsonb

  UNION ALL

  SELECT
    'water_chemistry',
    'ph_kh_stability',
    'pH and KH Stabilization Workflow',
    $$pH stability is primarily a KH/alkalinity and CO2 management workflow. Measure baseline after water equilibrates with air, classify source water strategy (tap, RO/DI, blended), set a target KH range for livestock, and stabilize through buffered change-water strategy rather than large reactive in-tank pH swings. Useful freshwater dosing approximations: NaHCO3_g = 0.02975 * volume_L * delta_dKH and Na2CO3_g = 0.01983 * volume_L * delta_dKH. Sodium bicarbonate gives a gentler pH push; sodium carbonate gives a stronger pH push. Always stage corrections, increase aeration before aggressive pH chemicals, and re-test after each correction block.$$,
    ARRAY['pH', 'KH', 'alkalinity', 'CO2', 'bicarbonate', 'soda ash', 'buffering', 'stabilization'],
    ARRAY['freshwater', 'saltwater', 'reef'],
    ARRAY['beginner', 'intermediate', 'advanced'],
    '{"source_doc": "docs/knowledge/ph-kh-stabilization-workflow.md"}'::jsonb
)
INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels, metadata)
SELECT s.category, s.subcategory, s.title, s.content, s.keywords, s.water_types, s.skill_levels, s.metadata
FROM seed s
WHERE NOT EXISTS (
  SELECT 1
  FROM knowledge_base kb
  WHERE kb.title = s.title
);
