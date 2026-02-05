# Bug Fix Plan - Ally iOS

## Summary
- **Critical:** 4 bugs
- **High:** 3 bugs
- **Medium:** 5 bugs
- **Low/Security:** 3 bugs

---

## 🔴 Critical (Fix Immediately)

### 1. Infinite Retry Loop in Session Refresh
**File:** `src/hooks/useStreamingResponse.ts:149`
**Issue:** 401 error triggers session refresh, but if retry also fails with 401, causes infinite recursion
**Fix:** Add max-retry counter (1 retry max)

### 2. Stale Closure in Chat Auto-Send
**File:** `src/pages/AllyChat.tsx:413-583`
**Issue:** `sendMessage` excluded from useEffect deps, uses stale `messages`, `selectedModel` state
**Fix:** Use ref to track latest sendMessage version

### 3. Missing Null Check on Conversation Load
**File:** `src/hooks/useConversationManager.ts:222-224`
**Issue:** `conversations.find()` returns undefined, then accesses properties without check
**Fix:** Add null check before property access

### 4. Race Condition - State Update After Unmount
**File:** `src/hooks/useAutoSave.tsx:64-92`
**Issue:** `setLastSaved` called after unmount if timeout fires during cleanup
**Fix:** Add `isMountedRef` check

---

## 🟠 High (Fix This Week)

### 5. Missing Array Check in Dashboard Data
**File:** `src/components/dashboard/useDashboardData.ts:38`
**Issue:** `data.map()` crashes if API returns null/undefined
**Fix:** Add `Array.isArray(data)` check

### 6. Unhandled Promise Rejection in Voice Recording
**File:** `src/hooks/useVoiceRecording.tsx:63-100`
**Issue:** `onerror` rejects promise, but `onstop` doesn't check if already rejected
**Fix:** Add `promiseResolved` flag to prevent double resolution

### 7. Silent Database Failures in Chat
**File:** `src/hooks/useConversationManager.ts:327-359`
**Issue:** Supabase writes have no error handling - users don't know if messages fail to save
**Fix:** Add try/catch and error logging

---

## 🟡 Medium (Fix This Sprint)

### 8. NaN Display Risk in AnimatedCounter
**File:** `src/components/AnimatedCounter.tsx:79`
**Issue:** Custom `formatValue` callback could return NaN
**Fix:** Validate formatted value before display

### 9. Missing Dependency in Rate Limiter
**File:** `src/hooks/useRateLimit.tsx:89`
**Issue:** `attemptsRemaining` uses stale `attempts` state
**Fix:** Move to useMemo with proper deps

### 10. Missing Input Validation in Parameter Grid
**File:** `src/components/water-tests/ParameterInputGrid.tsx:47-53`
**Issue:** Temperature conversion can produce NaN
**Fix:** Validate conversion result

### 11. Invalid URL Parameter Handling
**File:** `src/pages/WaterTests.tsx:50-59`
**Issue:** Invalid aquariumId in URL silently falls back without validation
**Fix:** Validate URL param against aquariums array

### 12. Unreliable Key Generation
**File:** `src/components/dashboard/HourlyForecast.tsx:89`
**Issue:** `crypto.randomUUID()` not available in all environments
**Fix:** Use index-based key with time fallback

---

## 🟢 Low/Security (Fix When Possible)

### 13. Incomplete XSS Sanitization
**File:** `src/hooks/useConversationManager.ts:276-280`
**Issue:** Basic HTML stripping, should use DOMPurify consistently
**Fix:** Replace with DOMPurify sanitization

### 14. Empty Array Edge Case in Rate Limiter
**File:** `src/hooks/useRateLimit.tsx:43-45`
**Issue:** `Math.min(...[])` returns Infinity
**Fix:** Add empty array check

### 15. Inefficient Regex Pattern
**File:** `src/components/chat/MentionInput.tsx:32-41`
**Issue:** Global regex with exec() in while loop is error-prone
**Fix:** Use String.match() instead

---

## Execution Order

**Phase 1 - Critical (Today)**
1. useStreamingResponse.ts - retry limit
2. AllyChat.tsx - stale closure fix
3. useConversationManager.ts - null check
4. useAutoSave.tsx - unmount race condition

**Phase 2 - High (This Week)**
5. useDashboardData.ts - array check
6. useVoiceRecording.tsx - promise handling
7. useConversationManager.ts - error handling

**Phase 3 - Medium (This Sprint)**
8-12. UI validation and edge cases

**Phase 4 - Low (Backlog)**
13-15. Security hardening and optimization
