# Ally Knowledge Runbooks

This folder contains protocol-level guidance used to seed and maintain Ally's aquarium knowledge base.

## Included runbooks

- `ammonia-nitrite-emergency-runbook.md`
- `new-tank-cycling-sop.md`
- `saltwater-parameter-targets-corrective-actions.md`
- `freshwater-parameter-targets-corrective-actions.md`
- `reef-alkalinity-calcium-magnesium-balancing-protocol.md`
- `ph-kh-stabilization-workflow.md`
- `high-nitrate-reduction-playbook.md`
- `temperature-stress-triage-protocol.md`
- `fin-rot-diagnosis-staged-treatment.md`
- `antibiotic-compatibility-contraindication-matrix.md`
- `columnaris-red-flag-triage-escalation.md`
- `freshwater-ich-differential-diagnosis-treatment.md`
- `marine-ich-vs-velvet-differential-protocol.md`
- `angelfish-compatibility-aggression-profile.md`
- `betta-care-compatibility-profile.md`
- `goldfish-care-compatibility-profile.md`
- `neon-tetra-schooling-stress-indicators-profile.md`
- `quarantine-hospital-tank-setup-sop.md`
- `shrimp-snail-safety-profile-copper-med-sensitivity.md`
- `filter-troubleshooting-decision-tree.md`
- `heater-chiller-failure-emergency-protocol.md`
- `chlorine-pool-balancing-workflow.md`
- `pool-algae-outbreak-playbook.md`
- `saltwater-pool-scg-balancing-cell-care-workflow.md`
- `spa-bromine-chlorine-management-workflow.md`
- `ro-di-source-water-quality-sop.md`

## Source imports

Original source drafts are preserved in:

- `sources/ammonia-nitrite-emergency-runbook.source.md`
- `sources/new-tank-cycling-sop-fishless-fish-in.source.md`
- `sources/saltwater-parameter-targets-corrective-actions.source.md`
- `sources/freshwater-parameter-targets-corrective-actions.source.md`
- `sources/reef-alkalinity-calcium-magnesium-balancing-protocol.source.md`
- `sources/ph-kh-stabilization-workflow.source.md`
- `sources/high-nitrate-reduction-playbook.source.md`
- `sources/temperature-stress-triage-protocol.source.md`
- `sources/fin-rot-diagnosis-staged-treatment.source.md`
- `sources/antibiotic-compatibility-contraindication-matrix.source.md`
- `sources/columnaris-red-flag-triage-escalation.source.md`
- `sources/freshwater-ich-differential-diagnosis-treatment.source.md`
- `sources/marine-ich-vs-velvet-differential-protocol.source.md`
- `sources/angelfish-compatibility-aggression-profile.source.md`
- `sources/betta-care-compatibility-profile.source.md`
- `sources/goldfish-care-compatibility-profile.source.md`
- `sources/neon-tetra-schooling-stress-indicators-profile.source.md`
- `sources/quarantine-hospital-tank-setup-sop.source.md`
- `sources/shrimp-snail-safety-profile-copper-med-sensitivity.source.md`
- `sources/filter-troubleshooting-decision-tree.source.md`
- `sources/heater-chiller-failure-emergency-protocol.source.md`
- `sources/chlorine-pool-balancing-workflow.source.md`
- `sources/pool-algae-outbreak-playbook-green-mustard-black.source.md`
- `sources/saltwater-pool-scg-balancing-cell-care-workflow.source.md`
- `sources/spa-bromine-chlorine-management-workflow.source.md`
- `sources/ro-di-source-water-quality-sop.source.md`
- `sources/cya-fc-decision-guide-safe-action-thresholds.source.md` (not seeded)
- `sources/discus-advanced-care-profile.source.md` (not seeded)

## Usage notes

- These are operational guides, not veterinary diagnosis.
- Prioritize stability and safety over aggressive corrections.
- For any severe distress (gasping, collapse, mass mortality), treat as an emergency and escalate immediately.

## Database sync

- Migration: `supabase/migrations/20260221100000_add_runbook_knowledge_entries.sql`
- Migration: `supabase/migrations/20260221103000_add_nitrate_and_temperature_knowledge_entries.sql`
- Migration: `supabase/migrations/20260221120000_add_disease_knowledge_entries.sql`
- Migration: `supabase/migrations/20260221143000_add_species_pool_and_ops_knowledge_entries.sql`
- Migration: `supabase/migrations/20260221160000_add_rodi_source_water_knowledge_entry.sql`
- After migration, generate embeddings for new rows with the `embed-knowledge` edge function.
