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

Authenticated full run (fails fast if auth cannot be established):

```bash
npm run load:test:auth
```

Dry-run config check (no network calls):

```bash
node scripts/load/run-load-tests.mjs --dry-run
```

## Profiles

Runner profiles set repeatable traffic envelopes:

- `standard` (default): baseline check
- `burst`: high-concurrency burst validation
- `soak`: 15-minute sustained run
- `failure-injection`: synthetic failure mode for resilience verification

Examples:

```bash
# Burst profile
npm run load:test -- --profile burst --require-auth

# 15-minute soak
npm run load:test -- --profile soak --duration-minutes 15 --require-auth

# Failure injection (0.5%)
npm run load:test -- --profile failure-injection --failure-rate 0.005 --require-auth
```

## Required Environment

The runner reads from process env first, then `.env` / `.env.local`.

Required:
- `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)

Optional (needed for auth-required scenarios like `chat` and dashboard reads):
- `LOAD_BEARER_TOKEN`
- or `SUPABASE_USER_JWT`
- or `SUPABASE_ACCESS_TOKEN`

Optional password-auth fallback for auto JWT fetch:
- `LOAD_AUTH_EMAIL`
- `LOAD_AUTH_PASSWORD`

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

## Useful Flags

- `--require-auth`: fail instead of skipping auth-required scenarios when no JWT is available
- `--bearer-token <jwt>`: pass a user JWT explicitly
- `--auth-email <email> --auth-password <password>`: fetch JWT before running scenarios
- `--profile <name>`: `standard|burst|soak|failure-injection`
- `--duration-minutes <n>`: duration-based execution for soak-style runs
- `--failure-rate <0..1>` / `--failure-status <http>`: synthetic failure injection mode

## CI Workflow

GitHub Actions workflow:

- `.github/workflows/load-tests.yml`

Triggers:

- Manual: `workflow_dispatch`
- Scheduled: every Monday at `13:00 UTC`

Scheduled workflow runs enforce gates across:

1. `burst` profile
2. `soak` profile (`15m`)
3. `failure-injection` profile (low-rate synthetic failures)

Required GitHub repository secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `LOAD_AUTH_EMAIL` and `LOAD_AUTH_PASSWORD` (or `LOAD_BEARER_TOKEN`)
