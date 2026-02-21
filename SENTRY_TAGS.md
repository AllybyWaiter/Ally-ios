# Sentry Error Tags & Categorization

All errors in the application are now automatically tagged with feature areas and severity levels, making it much easier to filter and prioritize issues in your Sentry dashboard.

## Feature Areas

Errors are tagged with one of the following feature areas:

- **`auth`** - Authentication and user management errors
- **`aquarium`** - Aquarium creation, editing, and management
- **`water-tests`** - Water testing and parameter tracking
- **`equipment`** - Equipment management
- **`maintenance`** - Maintenance tasks and calendar
- **`chat`** - Ally chat functionality
- **`settings`** - User settings and preferences
- **`admin`** - Admin dashboard and management
- **`weather`** - Weather and location-refresh functionality
- **`general`** - General app functionality

## Severity Levels

Errors are assigned severity levels:

- **`low`** - Minor issues that don't affect core functionality
- **`medium`** - Issues that impact user experience but have workarounds
- **`high`** - Significant issues caught by error boundaries
- **`critical`** - App-breaking errors that need immediate attention

## How to Filter in Sentry

In your Sentry dashboard:

1. **By Feature Area:**
   - Search: `feature_area:auth`
   - Search: `feature_area:water-tests`
   - Search: `feature_area:chat`

2. **By Severity:**
   - Search: `severity:high`
   - Search: `severity:critical`

3. **Combined Filters:**
   - Search: `feature_area:auth AND severity:high`
   - This shows all high-severity authentication errors

## Using Tags in Code

When manually logging errors, you can specify the feature area and severity:

```typescript
import { logError, FeatureArea, ErrorSeverity } from '@/lib/sentry';

try {
  // Some water test operation
} catch (error) {
  logError(
    error as Error, 
    { context: 'additional info' },
    FeatureArea.WATER_TESTS,
    ErrorSeverity.HIGH
  );
}
```

## Breadcrumbs with Feature Areas

Breadcrumbs (user actions before errors) are also tagged:

```typescript
import { addBreadcrumb, FeatureArea } from '@/lib/sentry';

addBreadcrumb(
  'User started water test',
  'user-action',
  { aquariumId: 'abc123' },
  FeatureArea.WATER_TESTS
);
```

## Creating Alerts

You can set up Sentry alerts for specific combinations:

- Alert when `severity:critical` errors occur
- Alert when `feature_area:auth AND severity:high` errors spike
- Alert when error rate in `feature_area:water-tests` exceeds threshold

This makes it easy to monitor specific areas of your app and respond to issues quickly!

## Reliability Monitoring Events

Day 2 reliability telemetry adds searchable `monitoring_event` tags:

- **`api_failure`** - API/edge/rest request failed
- **`slow_operation`** - Response latency exceeded threshold
- **`weather_location_unavailable`** - Could not resolve location for weather refresh
- **`weather_geolocation_unsupported`** - Geolocation API unavailable
- **`chat_stream_payload_error`** - Ally chat stream returned explicit error payload

Recommended filters:

- `monitoring_event:api_failure feature_area:weather`
- `monitoring_event:api_failure feature_area:chat`
- `monitoring_event:slow_operation feature_area:weather`
- `monitoring_event:slow_operation feature_area:chat`
