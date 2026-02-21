# Scale Readiness

Date: February 21, 2026
Scope: Day 1 baseline and release gates

## Release Gates (Target)

### Reliability
- Crash-free sessions: `>= 99.7%`
- API error rate (5xx + edge function failures): `<= 1.0%`
- Weather/location refresh failures: `<= 1.0%`

### Latency
- Read API p95: `<= 800ms`
- Write API p95: `<= 1200ms`
- Weather edge function p95: `<= 1200ms`

### Quality
- Lint: `0 errors`
- Test run: `100% pass`
- Coverage thresholds (global): `>= 70%` statements/branches/functions/lines

### Client Performance
- Initial route JS budget (gzip): `<= 350KB`
- No individual production chunk > `500KB` (gzip warning threshold proxy)

## Day 1 Baseline (Current)

### Commands Run
```bash
npm ci
npm run lint
npm run test:run
npm run test:coverage
npm run build
du -sh dist
find dist/assets -maxdepth 1 -name "*.js" -print0 | xargs -0 ls -lh | sort -k5 -h | tail -n 20
```

### Results Summary
| Check | Result | Notes |
|---|---|---|
| `npm ci` | PASS | Installed 983 packages; 22 vulnerabilities reported (5 moderate, 17 high). |
| `npm run lint` | FAIL | 8 errors, 48 warnings. |
| `npm run test:run` | PASS | 39 test files passed, 553 tests passed, duration 8.97s. |
| `npm run test:coverage` | FAIL | Coverage below enforced 70% thresholds. |
| `npm run build` | PASS (with warnings) | Build completed; warns on chunks >500KB. |
| `du -sh dist` | BASELINE | `26M` total dist size. |

### Coverage Baseline
- Statements: `42.43%` (target: `>= 70%`)
- Branches: `35.37%` (target: `>= 70%`)
- Functions: `41.59%` (target: `>= 70%`)
- Lines: `44.03%` (target: `>= 70%`)

### Largest JS Assets (Current)
| File | Size |
|---|---|
| `dist/assets/vendor-markdown-BTSCDX82.js` | `1.7M` |
| `dist/assets/App-BTIR6q1W.js` | `889K` |
| `dist/assets/vendor-recharts-ajjwPe_U.js` | `556K` |
| `dist/assets/Admin-BIi4V8NK.js` | `251K` |
| `dist/assets/vendor-leaflet-Bwlxei4c.js` | `150K` |
| `dist/assets/index-BXP59hei.js` | `146K` |
| `dist/assets/vendor-framer-DLypAklr.js` | `119K` |
| `dist/assets/Settings-Bynr7SqH.js` | `116K` |
| `dist/assets/AllyChat-BFGfhJgh.js` | `101K` |
| `dist/assets/Dashboard-Bl9dU4_3.js` | `81K` |

## Gate Status Snapshot

| Gate | Status |
|---|---|
| Crash-free sessions >=99.7% | NOT MEASURED (needs prod/staging telemetry) |
| API error rate <=1% | NOT MEASURED (needs load + telemetry) |
| Read/Write p95 targets | NOT MEASURED (needs load testing) |
| Lint 0 errors | FAIL |
| Tests 100% pass | PASS |
| Coverage >=70% | FAIL |
| Initial JS budget <=350KB gzip | FAIL |
| No huge chunks (>500KB warning proxy) | FAIL |

## Day 2 Priorities
1. Fix lint errors to unblock quality gate.
2. Start chunk reduction plan for `vendor-markdown`, `App`, and `vendor-recharts`.
3. Add/load test scripts for weather/chat/dashboard and capture p95 + error rate.
4. Add crash-free and API error dashboards (Sentry + edge function logs) and wire alert thresholds.

## Day 2 Progress (Current)

### Quality Gate Progress
- Lint errors: `8 -> 0` (warnings remain: `48`)
- Test run: `553/553` passing
- Build: PASS

### Bundle Split Progress
- `vendor-markdown`: `~1.7M -> ~120.65k`
- Added dedicated `vendor-syntax`: `~68.85k`
- Remaining oversized chunks:
  - `vendor-recharts`: `~568.86k`
  - `App`: `~910.54k`
