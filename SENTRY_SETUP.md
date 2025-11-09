# Sentry Error Monitoring Setup

This application is configured to use Sentry for global error monitoring and tracking.

## Setup Instructions

### 1. Create a Sentry Account
- Go to [sentry.io](https://sentry.io) and create a free account
- Create a new project and select "React" as the platform

### 2. Get Your DSN
- After creating the project, Sentry will provide you with a DSN (Data Source Name)
- It will look like: `https://examplePublicKey@o0.ingest.sentry.io/0`

### 3. Add DSN to Environment Variables
- In your Lovable project settings, add the environment variable:
  - Variable name: `VITE_SENTRY_DSN`
  - Variable value: Your Sentry DSN from step 2

**Note:** The Sentry DSN is a publishable key designed to be used in client-side code. It's safe to expose in your frontend.

## Features Enabled

✅ **Automatic Error Tracking**
- All uncaught errors are automatically sent to Sentry
- Error boundaries capture and log React component errors

✅ **Performance Monitoring**
- Track page load times and user interactions
- Identify performance bottlenecks

✅ **Session Replay**
- See exactly what users experienced when errors occurred
- 10% of normal sessions recorded, 100% of error sessions

✅ **User Context**
- Errors are tagged with user information (when logged in)
- Track which users are experiencing issues

✅ **Breadcrumbs**
- Authentication events logged
- User actions tracked before errors

## Manual Error Logging

You can manually log errors in your code:

```typescript
import { logError, logMessage, addBreadcrumb } from '@/lib/sentry';

// Log an error with context
try {
  // some code
} catch (error) {
  logError(error as Error, { 
    context: 'additional info' 
  });
}

// Log a message
logMessage('Important event occurred', 'info');

// Add a breadcrumb
addBreadcrumb('User clicked button', 'user-action', { 
  buttonId: 'submit' 
});
```

## Configuration

The Sentry configuration can be adjusted in `src/lib/sentry.ts`:
- `tracesSampleRate`: Percentage of transactions to track (1.0 = 100%)
- `replaysSessionSampleRate`: Percentage of normal sessions to record
- `replaysOnErrorSampleRate`: Percentage of error sessions to record

## Disabling Sentry

If you don't want to use Sentry, simply don't add the `VITE_SENTRY_DSN` environment variable. The app will continue to work normally with console logging as fallback.
