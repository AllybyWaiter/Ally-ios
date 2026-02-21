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

## Usage notes

- These are operational guides, not veterinary diagnosis.
- Prioritize stability and safety over aggressive corrections.
- For any severe distress (gasping, collapse, mass mortality), treat as an emergency and escalate immediately.

## Database sync

- Migration: `supabase/migrations/20260221100000_add_runbook_knowledge_entries.sql`
- After migration, generate embeddings for new rows with the `embed-knowledge` edge function.
