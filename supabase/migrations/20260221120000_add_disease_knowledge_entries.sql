-- Add disease and treatment safety knowledge entries for Ally

WITH seed AS (
  SELECT
    'disease'::text AS category,
    'fin_rot'::text AS subcategory,
    'Fin Rot Diagnosis and Staged Treatment Protocol'::text AS title,
    $$Fin rot should be triaged as a staged syndrome: correct water quality and stressors first, then match treatment intensity to severity. Objective staging: Stage 1 mild fraying (about <=25%), Stage 2 moderate erosion (about 25-50%), Stage 3 severe necrosis (about 50-75%), Stage 4 complicated disease (>75%, fin-base necrosis, ulcers, systemic decline, or mortality). Differentiate mechanical damage, parasites, columnaris-like disease, and water-mold overgrowth before broad antimicrobial escalation. Escalate immediately if progression continues over 48-72 hours, hemorrhage/ulcers appear, respiratory distress emerges, or multi-fish involvement is detected.$$::text AS content,
    ARRAY['fin rot', 'tail rot', 'staged treatment', 'fin erosion', 'ulcers', 'columnaris differential', 'wet mount']::text[] AS keywords,
    ARRAY['freshwater', 'saltwater', 'reef', 'brackish']::text[] AS water_types,
    ARRAY['beginner', 'intermediate', 'advanced']::text[] AS skill_levels,
    '{"source_doc": "docs/knowledge/fin-rot-diagnosis-staged-treatment.md"}'::jsonb AS metadata

  UNION ALL

  SELECT
    'disease',
    'antibiotic_safety',
    'Antibiotic Compatibility and Contraindication Matrix',
    $$Antibiotic compatibility decisions must separate systemic interaction risk, IV/contact compatibility, and intentional combination therapy. High-risk patterns include aminoglycoside and beta-lactam co-contact in shared lines, precipitation risk for some vancomycin line contacts, nephrotoxic stacking (for example combinations including vancomycin, aminoglycosides, or polymyxins), additive QT-risk combinations, and rifamycin-mediated reduction of companion drug exposure. Default workflow when evidence is unclear: avoid co-contact, use separate lumen or sequential administration with flush, and intensify renal/cardiac/response monitoring in high-risk combinations. This entry is for clinician-supervised systemic therapy safety context, not standalone hobby dosing.$$::text,
    ARRAY['antibiotic compatibility', 'contraindication', 'drug interaction', 'iv compatibility', 'nephrotoxicity', 'qt risk', 'stewardship']::text[],
    ARRAY['freshwater', 'saltwater', 'reef', 'brackish']::text[],
    ARRAY['advanced']::text[],
    '{"source_doc": "docs/knowledge/antibiotic-compatibility-contraindication-matrix.md"}'::jsonb

  UNION ALL

  SELECT
    'disease',
    'columnaris',
    'Columnaris Red-Flag Triage and Escalation Protocol',
    $$Columnaris triage should prioritize gill involvement, oxygen compromise, and outbreak acceleration. Emergency criteria include respiratory distress, moribund fish, rapidly rising mortality over hours to 1-2 days, or spread across connected systems. First response sequence: maximize aeration and circulation, reduce handling/crowding, remove dead fish, stabilize temperature and nitrogenous waste, and run fresh wet mounts from skin and gills. Early escalation is required when mortality rises despite first-line response or when diagnosis remains uncertain. When systemic involvement is suspected and fish are still feeding, veterinarian-directed medicated feed pathways may be needed in addition to environmental control.$$::text,
    ARRAY['columnaris', 'flavobacterium', 'gill necrosis', 'respiratory distress', 'outbreak triage', 'wet mount', 'mortality spike']::text[],
    ARRAY['freshwater', 'brackish']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/columnaris-red-flag-triage-escalation.md"}'::jsonb

  UNION ALL

  SELECT
    'disease',
    'freshwater_ich',
    'Freshwater Ich Differential Diagnosis and Treatment Protocol',
    $$Freshwater ich treatment success depends on lifecycle timing: most protected stages are less susceptible, so repeated temperature-timed treatment cycles are required to intercept free-swimming infective stages. Confirm with wet mounts from skin, fins, and gills when possible, and differentiate common mimics such as velvet-like dusting, columnaris-like plaques, water-mold lesions, flukes, and costia/trichodina burdens. Core workflow: stabilize oxygen and water quality first, choose system-compatible therapy, repeat by temperature window, and reduce reinfection pressure by debris control and biosecurity. Do not use antibiotics or metronidazole as primary ich therapy; reserve antibiotics for diagnosed secondary bacterial disease.$$::text,
    ARRAY['ich', 'white spot disease', 'ichthyophthirius', 'wet mount', 'temperature timed treatment', 'differential diagnosis', 'flukes']::text[],
    ARRAY['freshwater', 'brackish']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/freshwater-ich-differential-diagnosis-treatment.md"}'::jsonb

  UNION ALL

  SELECT
    'disease',
    'marine_ich_velvet',
    'Marine Ich vs Velvet Differential and Treatment Protocol',
    $$Marine ich and marine velvet require rapid differential assessment because velvet typically progresses faster with higher short-window mortality risk. Practical workflow: triage respiratory compromise first, run immediate wet mounts from skin/fin and gill tissue, then maintain sustained treatment exposure long enough to cover protected lifecycle stages. When uncertain and disease is rapidly progressing, use a velvet-high-risk posture while confirmatory diagnostics proceed. Reef and invertebrate systems are generally incompatible with therapeutic copper and many bath medications, so fish treatment usually requires a dedicated hospital system plus fishless/fallow display management and strict quarantine-biosecurity controls.$$::text,
    ARRAY['marine ich', 'cryptocaryon', 'marine velvet', 'amyloodinium', 'gill distress', 'copper treatment', 'fallow']::text[],
    ARRAY['saltwater', 'reef', 'brackish']::text[],
    ARRAY['intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/marine-ich-vs-velvet-differential-protocol.md"}'::jsonb
)
INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels, metadata)
SELECT s.category, s.subcategory, s.title, s.content, s.keywords, s.water_types, s.skill_levels, s.metadata
FROM seed s
WHERE NOT EXISTS (
  SELECT 1
  FROM knowledge_base kb
  WHERE kb.title = s.title
);
