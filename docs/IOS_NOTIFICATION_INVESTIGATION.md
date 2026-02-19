# iOS Notification Investigation (TestFlight)

This runbook is for the issue where the notification master toggle does not complete enablement on iOS TestFlight.

## 1. Fast triage checklist

Capture these first:
1. App build number + version (from TestFlight build metadata).
2. Device model + iOS version.
3. UTC timestamp for one enable attempt.
4. Whether non-notification toggles (for example Weather) still work.

## 2. Inspect archived IPA

Run:

```bash
./scripts/inspect_testflight_push.sh /path/to/Ally.ipa
```

Artifacts are written to `artifacts/push-investigation/<timestamp>/`.

Read these files in order:
1. `summary.txt`
2. `signed-entitlements.plist`
3. `push-symbols.txt`
4. `xcodeproj-wiring.txt`

Interpretation:
1. `aps-environment missing` => archive is not signed with push entitlements.
2. `push-related symbols missing` => native push plugin is not linked in build.
3. Both present => move to runtime registration tracing.

## 3. Runtime registration trace

On a physical device running TestFlight build:
1. Attach device logs from macOS Console or Xcode Devices and Simulators.
2. Filter by app process and terms:
   - `PushNotifications`
   - `registration`
   - `registrationError`
   - `aps-environment`
3. Attempt enable in app once.
4. Capture first failure line and timestamp.

Decision mapping:
1. `registrationError` entitlement-related => signing/capability mismatch.
2. plugin unavailable/`UNIMPLEMENTED` => project/package linkage issue.
3. instant denied => OS permission state issue.
4. no registration events => client handler path issue.

## 4. DB validation (after attempt)

Run in Supabase SQL editor:

```sql
select id, user_id, platform, endpoint, device_token, created_at, updated_at
from public.push_subscriptions
where user_id = '<USER_UUID>'
order by created_at desc;

select *
from public.notification_preferences
where user_id = '<USER_UUID>';
```

Interpretation:
1. No iOS subscription row and no DB error => fail is pre-persistence (native/UI path).
2. DB errors => schema or RLS drift.
3. iOS row exists => enablement worked; investigate delivery next.

## 5. Delivery verification

Trigger in-app test notification and inspect function logs for:
1. `send-push-notification started`
2. APNs send result and status code
3. final `{ sent: true/false }`

If APNs fails, capture status/body for topic/token/environment diagnosis.

## Notes

Repo wiring now includes entitlements in both iOS project files:
1. `ios/App/ALLY.xcodeproj/project.pbxproj`
2. `ios/App/App.xcodeproj/project.pbxproj`

Client hook now includes native Capacitor push flow with failure diagnostics in:
1. `src/hooks/usePushNotifications.ts`
2. `src/components/settings/NotificationSettings.tsx`
