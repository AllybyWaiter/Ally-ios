-- Add species profiles, pool/spa operations, and equipment protocols

WITH seed AS (
  SELECT
    'fish_care'::text AS category,
    'species_compatibility'::text AS subcategory,
    'Angelfish Compatibility and Aggression Profile'::text AS title,
    $$Angelfish compatibility is driven by adult size, hierarchy behavior, and pairing/spawning territory shifts. Lower-risk tankmates are calm non-nippers too large to be swallowed and with warm-parameter overlap. High-risk patterns are prey-sized fish, fin-nippers, and crowded layouts with poor sight breaks. Practical controls: tall structured tanks, visual barriers, multi-zone feeding, and rapid escalation when persistent chasing, mouth fighting, or feeding suppression appears.$$::text AS content,
    ARRAY['angelfish', 'aggression', 'compatibility', 'pairing', 'territory', 'fin nippers', 'community tank']::text[] AS keywords,
    ARRAY['freshwater']::text[] AS water_types,
    ARRAY['beginner', 'intermediate', 'advanced']::text[] AS skill_levels,
    '{"source_doc": "docs/knowledge/angelfish-compatibility-aggression-profile.md"}'::jsonb AS metadata

  UNION ALL

  SELECT
    'fish_care',
    'species_compatibility',
    'Betta Care and Compatibility Profile',
    $$Betta care success depends on stable warm water, zero ammonia and nitrite, gentle filtration, and structured cover. Compatibility is individual-dependent and fails most often with fin nippers, long-finned lookalikes, and undersized mixed systems. Use quarantine before introductions, maintain a separation fallback, and prioritize water-quality correction before medication stacking in stress or disease events.$$::text,
    ARRAY['betta', 'compatibility', 'warm water', 'low flow', 'quarantine', 'aggression', 'community setup']::text[],
    ARRAY['freshwater']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/betta-care-compatibility-profile.md"}'::jsonb

  UNION ALL

  SELECT
    'fish_care',
    'species_compatibility',
    'Goldfish Care and Compatibility Profile',
    $$Goldfish are high-waste systems animals requiring strong filtration headroom, high oxygenation, and strict ammonia/nitrite control. Core risks are chronic crowding, weak biofiltration, and tropical temperature mismatch in mixed tanks. Compatibility decisions should prioritize thermal overlap, predation risk, and competition dynamics, with larger systems and robust maintenance required for conditional mixed-species success.$$::text,
    ARRAY['goldfish', 'filtration', 'high waste', 'oxygenation', 'compatibility', 'temperature mismatch', 'nitrate control']::text[],
    ARRAY['freshwater']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/goldfish-care-compatibility-profile.md"}'::jsonb

  UNION ALL

  SELECT
    'fish_care',
    'species_behavior',
    'Neon Tetra Schooling and Stress Indicators Profile',
    $$Neon tetras are schooling fish and behavior should be interpreted with context: acute stress can temporarily tighten groups while chronic stress often fragments them. High-value stress signals are persistent isolation, repeated darting, abnormal water-column behavior, sustained feeding suppression, and persistent color dulling with physiologic distress signs. Use trend-based monitoring with water quality and oxygen checks to differentiate social stress from chemistry-driven failures.$$::text,
    ARRAY['neon tetra', 'schooling', 'stress indicators', 'group size', 'behavior monitoring', 'oxygen', 'water quality']::text[],
    ARRAY['freshwater']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/neon-tetra-schooling-stress-indicators-profile.md"}'::jsonb

  UNION ALL

  SELECT
    'fish_care',
    'quarantine',
    'Quarantine and Hospital Tank Setup SOP',
    $$Quarantine and hospital systems must run as closed, biosecure workflows with dedicated tools, frequent water testing, and strict separation from display systems. Core SOP pillars are seeded or supported biofiltration, continuous aeration, bare-bottom cleanability, and action on any measurable ammonia or nitrite. Medication workflows should be diagnosis-led, logged, and designed to account for biofilter disruption risk, with escalation for rapid mortality clusters or unresolved oxygen distress.$$::text,
    ARRAY['quarantine', 'hospital tank', 'biosecurity', 'dedicated equipment', 'ammonia control', 'treatment workflow', 'cohort isolation']::text[],
    ARRAY['freshwater', 'saltwater', 'reef', 'brackish']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/quarantine-hospital-tank-setup-sop.md"}'::jsonb

  UNION ALL

  SELECT
    'fish_care',
    'invertebrate_safety',
    'Shrimp and Snail Safety Profile (Copper and Medication Sensitivity)',
    $$Freshwater shrimp and snails are high-sensitivity groups for copper and mixed-medication errors. Invertebrate risk can occur at concentrations tolerated by fish treatment protocols, and toxicity varies with pH, hardness, DOC, temperature, and species life stage. Safest practice is treatment separation: move fish to hospital systems and keep invertebrate displays medication-free; if contamination occurs, stop dosing, perform large staged water changes, and deploy copper-removal media with repeated monitoring.$$::text,
    ARRAY['shrimp safety', 'snail safety', 'copper toxicity', 'medication sensitivity', 'hospital tank', 'invertebrate protection']::text[],
    ARRAY['freshwater']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/shrimp-snail-safety-profile-copper-med-sensitivity.md"}'::jsonb

  UNION ALL

  SELECT
    'equipment',
    'filtration_diagnostics',
    'Filter Troubleshooting Decision Tree',
    $$Filter troubleshooting should be measurement-led using pressure drop, flow, and downstream performance together. High pressure plus low flow suggests loading; low pressure with poor quality suggests bypass, leaks, or sensing faults. Always validate instrumentation before replacement decisions, isolate pressure hazards before opening equipment, and record post-fix baselines for trend-based maintenance rather than calendar-only swaps.$$::text,
    ARRAY['filter troubleshooting', 'differential pressure', 'flow diagnostics', 'bypass', 'media failure', 'preventive maintenance']::text[],
    ARRAY['freshwater', 'saltwater', 'reef', 'pool', 'spa']::text[],
    ARRAY['intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/filter-troubleshooting-decision-tree.md"}'::jsonb

  UNION ALL

  SELECT
    'equipment',
    'thermal_emergency',
    'Heater and Chiller Failure Emergency Protocol',
    $$Thermal-control failures should be handled as safety incidents first: classify hazards, protect occupants/livestock, and stabilize critical loads before invasive diagnostics. Immediate red flags include electrical fault indicators, refrigerant leak alarms, combustion anomalies, flooding near energized gear, or rapid temperature drift. Recovery requires verified hazard control, safe isolation for technical work, root-cause correction, and monitored restart with documented preventive actions.$$::text,
    ARRAY['heater failure', 'chiller failure', 'emergency protocol', 'thermal drift', 'load stabilization', 'safe isolation']::text[],
    ARRAY['freshwater', 'saltwater', 'reef', 'pool', 'spa']::text[],
    ARRAY['intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/heater-chiller-failure-emergency-protocol.md"}'::jsonb

  UNION ALL

  SELECT
    'pool',
    'water_balance',
    'Chlorine Pool Balancing Workflow',
    $$Chlorine pool balancing is a control loop: sample, test, threshold, dose, circulate, retest, and log. Primary controls are FC/CC and pH, with TA/CYA/CH as stability and risk modifiers. Trigger corrective action quickly on low FC, elevated CC, unsafe pH, high CYA drift, or clarity failures, and use formula-based dosing with safe chemical handling and label-compliant operations.$$::text,
    ARRAY['pool chlorine', 'pool balancing', 'fc', 'cc', 'ph', 'cya', 'ta', 'calcium hardness']::text[],
    ARRAY['pool']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/chlorine-pool-balancing-workflow.md"}'::jsonb

  UNION ALL

  SELECT
    'pool',
    'algae_control',
    'Pool Algae Outbreak Playbook (Green, Mustard, Black)',
    $$Algae outbreaks require combined chemistry and mechanical response: restore sanitizer effectiveness, brush to disrupt growth and biofilm, remove debris, run filtration continuously, and retest through kill-and-clear. Green algae usually clears fastest; mustard algae recurs in shaded low-flow zones; black algae is persistent biofilm and needs repeated physical disruption with prolonged chemistry control. Algaecides are adjuncts, not replacements for sanitizer control and circulation discipline.$$::text,
    ARRAY['pool algae', 'green algae', 'mustard algae', 'black algae', 'shock', 'brushing', 'filtration']::text[],
    ARRAY['pool']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/pool-algae-outbreak-playbook.md"}'::jsonb

  UNION ALL

  SELECT
    'pool',
    'scg_operations',
    'Saltwater Pool (SCG) Balancing and Cell Care Workflow',
    $$Saltwater pools remain chlorine pools; SCGs are generation tools that still require manual chemistry control. Daily FC/pH validation, salinity verification, and scale-risk management (via TA/CH/saturation index) are core controls. Cell care should be inspection-led: rinse first, acid-clean only when scale remains, use proper dilution/time limits, and avoid aggressive methods that shorten cell life. Most no-output events trace to flow, temperature cutoff, salinity range, scale, or runtime/output mismatch rather than immediate cell failure.$$::text,
    ARRAY['saltwater pool', 'scg', 'salt cell', 'cell cleaning', 'salinity', 'scale control', 'pool chlorine']::text[],
    ARRAY['pool']::text[],
    ARRAY['intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/saltwater-pool-scg-balancing-cell-care-workflow.md"}'::jsonb

  UNION ALL

  SELECT
    'spa',
    'sanitizer_management',
    'Spa Bromine and Chlorine Management Workflow',
    $$Spa chemistry requires high-frequency control because heat, aeration, and bather load can collapse sanitizer residual quickly. Maintain sanitizer minimums while open, keep pH in safe range, act on combined chlorine trends, and increase testing cadence during heavy use. Use bromine and chlorine pathways with clear operational targets, close immediately on imminent-hazard chemistry conditions, and trigger dedicated incident protocols for fecal/vomit or suspected Legionella scenarios.$$::text,
    ARRAY['spa', 'hot tub', 'bromine', 'chlorine', 'combined chlorine', 'pH', 'legionella risk']::text[],
    ARRAY['spa']::text[],
    ARRAY['beginner', 'intermediate', 'advanced']::text[],
    '{"source_doc": "docs/knowledge/spa-bromine-chlorine-management-workflow.md"}'::jsonb
)
INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels, metadata)
SELECT s.category, s.subcategory, s.title, s.content, s.keywords, s.water_types, s.skill_levels, s.metadata
FROM seed s
WHERE NOT EXISTS (
  SELECT 1
  FROM knowledge_base kb
  WHERE kb.title = s.title
);
