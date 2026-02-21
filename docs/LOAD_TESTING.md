# Load Testing

Date: February 21, 2026

## Purpose

Measure p95 latency and error rate for Day 2 scale checks:
- Weather edge function
- Chat edge function
- Dashboard read paths

## Runner

Use the Node-based runner:

```bash
npm run load:test
```

Quick smoke run:

```bash
npm run load:test:quick
```

Dry-run config check (no network calls):

```bash
node scripts/load/run-load-tests.mjs --dry-run
```

## Required Environment

The runner reads from process env first, then `.env` / `.env.local`.

Required:
- `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)

Optional (needed for auth-required scenarios like `chat` and dashboard reads):
- `LOAD_BEARER_TOKEN`
- or `SUPABASE_USER_JWT`
- or `SUPABASE_SERVICE_ROLE_KEY` (use carefully; bypasses RLS)

Optional weather coordinates:
- `LOAD_WEATHER_LAT`
- `LOAD_WEATHER_LON`

## Scenarios

- `weather` -> `POST /functions/v1/get-weather`
- `chat` -> `POST /functions/v1/ally-chat` (first chunk timing)
- `dashboard-aquariums` -> `GET /rest/v1/aquariums`
- `dashboard-tasks` -> `GET /rest/v1/maintenance_tasks`

## Targets

- Weather p95: `<= 1200ms`, error rate `<= 1%`
- Dashboard reads p95: `<= 800ms`, error rate `<= 1%`
- Chat (first chunk) p95: `<= 4000ms`, error rate `<= 1%`

## Output

Reports are written to:

`artifacts/load-tests/load-report-<timestamp>.json`

Use `--out` to override the output path.
