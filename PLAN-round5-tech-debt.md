# Round 5 Tech Debt Cleanup — 25 Verified Bugs

## Context
Deep scan across the dashboard, hooks, components, queries, settings, and edge functions.
Each bug below was verified by reading current file contents — false positives eliminated.

---

## CRITICAL (4 bugs)

### 1. `SystemHealth.tsx:56–72` — Unchecked Supabase errors on all 6 table count queries
- **File:** `src/components/admin/SystemHealth.tsx`
- **Lines 56–63:** Six `Promise.all` queries, none check `.error`
- **Problem:** If any query fails, `.count` is `null` → falls through to `|| 0` silently. Admin sees "0 records" with no indication the system is actually broken. Also storage bucket errors logged with `console.error` instead of `logger`.
- **Fix:** Check `.error` on each result and set `systemStatus` to `degraded` for individual failures. Replace `console.error` with `logger.error`.

### 2. `TrendAlertsBanner.tsx:62` — Non-null assertion `user!.id` in queryFn
- **File:** `src/components/dashboard/TrendAlertsBanner.tsx`
- **Line 62:** `queryFn: () => fetchActiveAlerts(user!.id)`
- **Problem:** `user!.id` bypasses TypeScript safety. If `user` becomes null between the `enabled: !!user` check and execution, this crashes at runtime.
- **Fix:** Replace with `queryFn: () => { if (!user) return []; return fetchActiveAlerts(user.id); }`

### 3. `WaterTestHistory.tsx:49–68` — Race condition in paginated test accumulation
- **File:** `src/components/water-tests/WaterTestHistory.tsx`
- **Lines 49–68:** Two competing `useEffect`s — one resets state on aquariumId change (line 64), one accumulates data (line 49).
- **Problem:** React doesn't guarantee effect execution order. If aquariumId changes, the accumulation effect may run with stale data *before* the reset effect, merging tests from different aquariums. The `currentAquariumIdRef` guard on line 50 only checks the *current* value, but the ref update on line 65 may not have run yet.
- **Fix:** Consolidate into one effect: reset on aquariumId change, accumulate on data change. Add guard inside `setAccumulatedTests` callback.

### 4. `WeatherSettings.tsx:58–65` — Missing error check on profile update
- **File:** `src/components/settings/WeatherSettings.tsx`
- **Lines 58–65:** `await supabase.from('profiles').update({...}).eq('user_id', user.id)` — no error destructuring.
- **Problem:** If the update fails, "Weather Enabled" toast shows anyway — user thinks weather is enabled but their coordinates weren't saved. Weather will fail silently on next load.
- **Fix:** Add `const { error } = await ...` and throw on error (outer catch handles it).

---

## MEDIUM (13 bugs)

### 5. `WeatherCard.tsx:100–102` — NaN propagation from invalid `fetchedAt` date
- **File:** `src/components/dashboard/WeatherCard.tsx`
- **Lines 100–102:** `new Date(weather.fetchedAt).getTime()` — no invalid date check.
- **Problem:** If `fetchedAt` is a malformed string, `getTime()` returns `NaN`, `diffMinutes` becomes `NaN`, and all the `if` conditions fall through — function returns `undefined` which renders as empty text (harmless) but confusing.
- **Fix:** Add `if (isNaN(fetchedAt.getTime())) return '';` after line 100.

### 6. `usePlanLimits.tsx:40–42` — `console.error` instead of `logger.error`
- **File:** `src/hooks/usePlanLimits.tsx`
- **Line 41:** `console.error('Error fetching test count:', error);`
- **Problem:** Inconsistent with the rest of the codebase which uses `logger.error`. Won't appear in structured logs.
- **Fix:** Import `logger` and replace `console.error` with `logger.error`.

### 7. `useSessionMonitor.tsx:116` — Stale `toast` reference in closure
- **File:** `src/hooks/useSessionMonitor.tsx`
- **Line 116:** `toast({ title: "Session Expiring Soon"... })` — uses `toast` directly from outer scope.
- **Problem:** The `checkAndRefreshSession` callback has `[]` as deps (line 135). The `toast` function is captured once. If `toast` changes (e.g., provider re-renders), the callback uses a stale reference. Line 104 correctly uses `toastRef.current` for the "Session Expired" toast, but line 116 doesn't.
- **Fix:** Replace `toast({` on line 116 with `toastRef.current({`.

### 8. `useSessionMonitor.tsx:127–132` — Pending check race condition
- **File:** `src/hooks/useSessionMonitor.tsx`
- **Lines 127–132:** After clearing `isCheckingRef`, a `setTimeout` schedules a deferred re-check.
- **Problem:** Between `isCheckingRef.current = false` (line 124) and the `setTimeout` firing (line 132), a new call to `checkAndRefreshSession` can start — it won't be blocked because `isCheckingRef` is false. Then the setTimeout callback fires *another* check, creating duplicate concurrent checks.
- **Fix:** Set `isCheckingRef.current = true` again before the setTimeout, or use a `deferredCheckScheduled` flag.

### 9. `UpgradePlanDialog.tsx:191` — Incomplete Stripe URL validation
- **File:** `src/components/settings/UpgradePlanDialog.tsx`
- **Line 191:** `if (!checkoutUrl.hostname.endsWith('stripe.com'))`
- **Problem:** `endsWith('stripe.com')` matches `evil-stripe.com`. Should check for `.stripe.com` or exact `stripe.com`.
- **Fix:** `if (checkoutUrl.hostname !== 'stripe.com' && !checkoutUrl.hostname.endsWith('.stripe.com'))`

### 10. `MemoryManager.tsx:73–77` — Missing `fetchMemories` in useEffect deps
- **File:** `src/components/settings/MemoryManager.tsx`
- **Lines 73–77:** `useEffect(() => { if (user) fetchMemories(); }, [user])`
- **Problem:** `fetchMemories` is defined outside the effect and is not in the dependency array. If the function reference changes, the effect won't re-run. React's exhaustive-deps rule flags this.
- **Fix:** Either wrap `fetchMemories` in `useCallback` and add to deps, or inline the fetch logic in the effect.

### 11. `SystemHealth.tsx:80–83` — Storage errors logged with `console.error`
- **File:** `src/components/admin/SystemHealth.tsx`
- **Lines 81–83:** `console.error(...)` instead of `logger.error`
- **Problem:** Inconsistent logging. Storage failures won't appear in structured logs/monitoring.
- **Fix:** Import `logger` from `@/lib/logger` and replace `console.error` with `logger.error`.

### 12. `SystemHealth.tsx:94–99` — Health status always set to "healthy" on success
- **File:** `src/components/admin/SystemHealth.tsx`
- **Lines 94–99:** After all queries run, status is hardcoded to `healthy` for all services.
- **Problem:** Even if individual storage queries failed (line 81), the system status is set to `storage: 'healthy'`. The admin dashboard always shows green even when storage is degraded.
- **Fix:** Track whether any storage errors occurred and set `storage: 'degraded'` conditionally.

### 13. `usePhotoAnalysis.ts:82–87` — FileReader error doesn't prevent stale preview
- **File:** `src/components/water-tests/hooks/usePhotoAnalysis.ts`
- **Lines 76–88:** `reader.onerror` logs the error and toasts, but `reader.onloadend` may still fire with `result = null`.
- **Problem:** `onloadend` fires regardless of success/failure. If it fires after `onerror`, `setPhotoPreview(reader.result as string)` sets preview to `"null"`.
- **Fix:** Add a success flag or check `reader.error` in `onloadend`: `if (!reader.error && reader.result) setPhotoPreview(...)`.

### 14. `useWaterTestForm.ts:259–264` — setTimeout not cleaned up on unmount
- **File:** `src/components/water-tests/hooks/useWaterTestForm.ts`
- **Lines 261–264:** `setTimeout(() => { queryClient.invalidateQueries(...) }, 2000)` in `onSuccess`.
- **Problem:** If the component unmounts within 2 seconds (e.g., user navigates away), the timeout fires on an unmounted component. The `queryClient.invalidateQueries` call itself is safe (it's on the client, not React state), but it's still unnecessary work.
- **Fix:** Store the timeout ID in a ref and clear it in a cleanup effect.

### 15. `analyze-water-test-photo/index.ts` — No JWT auth verification
- **File:** `supabase/functions/analyze-water-test-photo/index.ts`
- **Lines 111–132:** Function validates input and checks rate limit but never verifies the JWT token from the Authorization header.
- **Problem:** Rate limiting by IP alone is insufficient — anyone with the function URL can trigger expensive OpenAI API calls without being authenticated. Other edge functions (like `send-push-notification`) verify the JWT.
- **Fix:** Extract and verify the JWT from the Authorization header using `supabaseAdmin.auth.getUser(token)` before processing.

### 16. `CompactWeatherWidget.tsx:59–61` — `Math.min/max(...temps)` with potential NaN values
- **File:** `src/components/dashboard/CompactWeatherWidget.tsx`
- **Lines 59–61:** `Math.min(...temps)` / `Math.max(...temps)`
- **Problem:** If any `hour.temperature` in the hourly forecast is `null`, `undefined`, or `NaN`, the entire `Math.min/max` call returns `NaN`, and the formatted labels become empty strings or "NaN°F".
- **Fix:** Filter before spread: `const temps = chartData.map(d => d.temp).filter(t => !isNaN(t));`

### 17. `usePullToRefresh.tsx:84` — Missing `containerRef` in `handleTouchMove` deps
- **File:** `src/hooks/usePullToRefresh.tsx`
- **Line 84:** `}, [disabled, isRefreshing, maxPull]);` — `containerRef` is used on lines 54–56 but not in deps.
- **Problem:** If `containerRef.current` changes (unlikely with refs, but the `handleTouchStart` callback on line 48 correctly includes it), the scroll position check could use a stale reference.
- **Fix:** Add `containerRef` to the dependency array for consistency with `handleTouchStart`.

---

## LOW (8 bugs)

### 18. `useAdminDashboardStats.ts:189–211` — Unvalidated dates in trend data formatting
- **File:** `src/hooks/useAdminDashboardStats.ts`
- **Lines 189–211:** `format(new Date(item.created_at), 'MMM dd')` — no try/catch.
- **Problem:** If `created_at` is malformed, `date-fns` `format()` throws an error, crashing the entire query.
- **Fix:** Wrap in try/catch and skip invalid dates.

### 19. `AquariumOverview.tsx:189` — Untyped `param.id` used as React key
- **File:** `src/components/aquarium/AquariumOverview.tsx`
- **Line 189:** `latestTest.test_parameters?.slice(0, 6).map((param: { id: string; ... }) => ...`
- **Problem:** While technically typed inline, if `test_parameters` contains items without `id`, React key warnings occur.
- **Fix:** Use `key={param.id ?? param.parameter_name}` as fallback.

### 20. `useFeatureRateLimit.tsx:89` — Missing validation on `data.reset` field
- **File:** `src/hooks/useFeatureRateLimit.tsx`
- **Line 89:** Validates `data.count` and `data.timestamp` types but not `data.reset`.
- **Problem:** `data.reset` is used on line 95 without validation. If localStorage was corrupted and `reset` is not a number, `now + config.windowMs` saves NaN.
- **Fix:** Add `typeof data.reset === 'number'` to the validation check on line 89.

### 21. `useReferralLeaderboard.ts` — Inconsistent error handling strategy
- **File:** `src/hooks/useReferralLeaderboard.ts`
- **Problem:** First Supabase error throws (stops execution), but the profiles query error only logs and continues. Inconsistent: consumer gets partial data without knowing it's incomplete.
- **Fix:** Either throw all errors (let React Query handle) or log all and continue. Pick one strategy.

### 22. `SystemHealth.tsx:208` — `table.name.replace('_', ' ')` only replaces first underscore
- **File:** `src/components/admin/SystemHealth.tsx`
- **Line 208:** `table.name.replace('_', ' ')`
- **Problem:** `String.replace` with a string argument only replaces the first occurrence. "chat_messages" → "chat messages" (fine), but if there were a table like "user_role_audit" it would become "user role_audit".
- **Fix:** Use regex: `table.name.replace(/_/g, ' ')`

### 23. `SystemHealth.tsx:240` — Same single-replace bug for bucket names
- **File:** `src/components/admin/SystemHealth.tsx`
- **Line 240:** `bucket.bucket.replace('-', ' ')`
- **Problem:** Same issue as #22 but for dashes. "water-test-photos" → "water test-photos".
- **Fix:** Use regex: `bucket.bucket.replace(/-/g, ' ')`

### 24. `useSystemStatus.ts` — Silently dropped `Promise.allSettled` rejections
- **File:** `src/hooks/useSystemStatus.ts`
- **Problem:** Failed promises in `allSettled` are filtered out with no logging. If Supabase queries fail for incidents, they silently disappear.
- **Fix:** Log rejected results before filtering.

### 25. `useConversationManager.ts:~85` — `data as Conversation[]` without runtime validation
- **File:** `src/hooks/useConversationManager.ts`
- **Problem:** `data` from Supabase is cast directly to `Conversation[]` without checking it's actually an array or has the right shape. If the DB schema changes, this silently produces malformed data.
- **Fix:** Add `Array.isArray(data)` guard before the cast.

---

## Files to modify (16 files)

| # | File | Bugs |
|---|------|------|
| 1 | `src/components/admin/SystemHealth.tsx` | 1, 11, 12, 22, 23 |
| 2 | `src/components/dashboard/TrendAlertsBanner.tsx` | 2 |
| 3 | `src/components/water-tests/WaterTestHistory.tsx` | 3 |
| 4 | `src/components/settings/WeatherSettings.tsx` | 4 |
| 5 | `src/components/dashboard/WeatherCard.tsx` | 5 |
| 6 | `src/hooks/usePlanLimits.tsx` | 6 |
| 7 | `src/hooks/useSessionMonitor.tsx` | 7, 8 |
| 8 | `src/components/settings/UpgradePlanDialog.tsx` | 9 |
| 9 | `src/components/settings/MemoryManager.tsx` | 10 |
| 10 | `src/components/water-tests/hooks/usePhotoAnalysis.ts` | 13 |
| 11 | `src/components/water-tests/hooks/useWaterTestForm.ts` | 14 |
| 12 | `supabase/functions/analyze-water-test-photo/index.ts` | 15 |
| 13 | `src/components/dashboard/CompactWeatherWidget.tsx` | 16 |
| 14 | `src/hooks/usePullToRefresh.tsx` | 17 |
| 15 | `src/hooks/useAdminDashboardStats.ts` | 18 |
| 16 | `src/components/aquarium/AquariumOverview.tsx` | 19 |
| 17 | `src/hooks/useFeatureRateLimit.tsx` | 20 |
| 18 | `src/hooks/useReferralLeaderboard.ts` | 21 |
| 19 | `src/hooks/useSystemStatus.ts` | 24 |
| 20 | `src/hooks/useConversationManager.ts` | 25 |

## Verification
- Run `npx tsc --noEmit` after all edits — expect zero errors
- Run `npx vitest run` to confirm no test regressions
