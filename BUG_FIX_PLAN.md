# Bug Fix Plan - Ally iOS

## Summary
- **Critical:** 4 bugs ✅ All fixed
- **High:** 3 bugs ✅ All fixed
- **Medium:** 5 bugs ✅ All fixed
- **Low/Security:** 3 bugs (2 fixed, 1 remaining)

---

## 🔴 Critical (Fix Immediately)

### 1. ✅ Infinite Retry Loop in Session Refresh
**File:** `src/hooks/useStreamingResponse.ts:149`
**Issue:** 401 error triggers session refresh, but if retry also fails with 401, causes infinite recursion
**Fix:** Add max-retry counter (1 retry max)
**Status:** Fixed

### 2. ✅ Stale Closure in Chat Auto-Send
**File:** `src/pages/AllyChat.tsx:413-583`
**Issue:** `sendMessage` excluded from useEffect deps, uses stale `messages`, `selectedModel` state
**Fix:** Use ref to track latest sendMessage version
**Status:** Fixed

### 3. ✅ Missing Null Check on Conversation Load
**File:** `src/hooks/useConversationManager.ts:222-224`
**Issue:** `conversations.find()` returns undefined, then accesses properties without check
**Fix:** Add null check before property access
**Status:** Fixed

### 4. ✅ Race Condition - State Update After Unmount
**File:** `src/hooks/useAutoSave.tsx:64-92`
**Issue:** `setLastSaved` called after unmount if timeout fires during cleanup
**Fix:** Add `isMountedRef` check
**Status:** Fixed

---

## 🟠 High (Fix This Week)

### 5. ✅ Missing Array Check in Dashboard Data
**File:** `src/components/dashboard/useDashboardData.ts:38`
**Issue:** `data.map()` crashes if API returns null/undefined
**Fix:** Add `Array.isArray(data)` check
**Status:** Fixed

### 6. ✅ Unhandled Promise Rejection in Voice Recording
**File:** `src/hooks/useVoiceRecording.tsx:63-100`
**Issue:** `onerror` rejects promise, but `onstop` doesn't check if already rejected
**Fix:** Add `promiseResolved` flag to prevent double resolution
**Status:** Fixed

### 7. ✅ Silent Database Failures in Chat
**File:** `src/hooks/useConversationManager.ts:327-359`
**Issue:** Supabase writes have no error handling - users don't know if messages fail to save
**Fix:** Added error checking + toast notifications for pinConversation, renameConversation; fetchConversations now returns data for stale closure avoidance
**Status:** Fixed

---

## 🟡 Medium (Fix This Sprint)

### 8. ✅ NaN Display Risk in AnimatedCounter
**File:** `src/components/AnimatedCounter.tsx:79`
**Issue:** Custom `formatValue` callback could return NaN
**Fix:** Validate formatted value before display
**Status:** Fixed

### 9. ✅ Stale State in Rate Limiter
**File:** `src/hooks/useRateLimit.tsx`
**Issue:** `checkRateLimit` always returned true due to stale closure; side effects inside setState updater
**Fix:** Rewrote with ref-based synchronous state tracking
**Status:** Fixed

### 10. ✅ Missing Input Validation in Parameter Grid
**File:** `src/components/water-tests/ParameterInputGrid.tsx:47-53`
**Issue:** Temperature conversion can produce NaN
**Fix:** Validate conversion result
**Status:** Fixed

### 11. ✅ Invalid URL Parameter Handling
**File:** `src/pages/WaterTests.tsx:50-59`
**Issue:** Invalid aquariumId in URL silently falls back without validation
**Fix:** Validate URL param against aquariums array
**Status:** Fixed

### 12. ✅ Unreliable Key Generation
**File:** `src/components/dashboard/HourlyForecast.tsx:89`
**Issue:** `crypto.randomUUID()` not available in all environments
**Fix:** Use index-based key with time fallback
**Status:** Fixed

---

## 🟢 Low/Security (Fix When Possible)

### 13. Incomplete XSS Sanitization
**File:** `src/hooks/useConversationManager.ts:276-280`
**Issue:** Basic HTML stripping, should use DOMPurify consistently
**Fix:** Replace with DOMPurify sanitization

### 14. ✅ Empty Array Edge Case in Rate Limiter
**File:** `src/hooks/useRateLimit.tsx:43-45`
**Issue:** `Math.min(...[])` returns Infinity
**Fix:** Add empty array check
**Status:** Fixed

### 15. ✅ Inefficient Regex Pattern
**File:** `src/components/chat/MentionInput.tsx:32-41`
**Issue:** Global regex with exec() in while loop is error-prone
**Fix:** Use String.match() instead
**Status:** Fixed

---

## Phase 2: Extended Bug Fixes (32 additional bugs found via audit)

### HIGH Severity — All Fixed ✅

| # | Bug | File | Fix |
|---|-----|------|-----|
| H1 | initializeChat stale closure + no error handling | AllyChat.tsx | try/catch + use returned conversations |
| H2 | handleRegenerateResponse stale closure | AllyChat.tsx | Rewrote to avoid edit state intermediary |
| H3 | Non-null assertions on push subscription keys | usePushNotifications.ts | Added null validation before save |
| H4 | AllySupportChat drops message `id` during streaming | AllySupportChat.tsx | Spread existing message to preserve `id` |
| H5 | PreferencesOnboarding upserts unchecked | PreferencesOnboarding.tsx | Added error checking + null guards |
| H6 | JSON.parse crash on corrupted sessionStorage | App.tsx | Wrapped in try/catch |
| H7 | MemoryManager empty catch hides subscription tier errors | MemoryManager.tsx | Added logger.error |
| H8 | useRateLimit checkRateLimit always returns true | useRateLimit.tsx | Ref-based synchronous tracking |

### MEDIUM Severity — All Fixed ✅

| # | Bug | File | Fix |
|---|-----|------|-----|
| M1 | Settings fetchSkillLevel missing error check | Settings.tsx | Added error destructuring + check |
| M2 | Settings handleThemeChange unchecked + console.error | Settings.tsx | Added error check + logger |
| M3 | Settings handleToggleWeather unchecked | Settings.tsx | Added error check |
| M4 | NotificationBell unchecked queries + console.error | NotificationBell.tsx | Added error checks + logger |
| M5 | useAdminDashboardStats 22 unchecked queries | useAdminDashboardStats.ts | Added error logging for all query batches |
| M6 | SupportTickets unchecked messages query | SupportTickets.tsx | Added error check + logger |
| M7 | BlogEditor parseInt without radix + console.error | BlogEditor.tsx | Added radix 10 + logger |
| M8 | useAquariumHealthScore unchecked queries | useAquariumHealthScore.ts | Added error logging |
| M9 | UpgradePlanDialog open redirect + console.error | UpgradePlanDialog.tsx | Stripe domain validation + logger |
| M10 | useWeather unchecked profile queries | useWeather.tsx | Added error checks + logger |
| M11 | useTTS console.error calls | useTTS.tsx | Replaced with logger |
| M12 | useFeatureRateLimit console.warn/error | useFeatureRateLimit.tsx | Replaced with logger |

### LOW Severity — Fixed ✅

| # | Bug | File | Fix |
|---|-----|------|-----|
| L1 | useWaterWand console.log/warn/error leaking debug data | useWaterWand.ts | Replaced with logger |
| L2 | AllyChat console.error calls | AllyChat.tsx | Replaced with logger |
| L3 | Settings console.error calls | Settings.tsx | Replaced with logger |
| L4 | PreferencesOnboarding console.error calls | PreferencesOnboarding.tsx | Replaced with logger |

---

## Execution Order

**Phase 1 - Original Bug Plan** ✅ All fixed
1-15. See sections above

**Phase 2 - Extended Audit** ✅ All fixed (except #13 XSS sanitization)
H1-H8, M1-M12, L1-L4. See table above
