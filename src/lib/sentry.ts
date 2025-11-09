import * as Sentry from "@sentry/react";

// Initialize Sentry only if DSN is configured
export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Error monitoring is disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions in development, adjust for production
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Always capture sessions with errors
    
    environment: import.meta.env.MODE,
    
    beforeSend(event) {
      // Filter out common browser extension errors
      if (event.exception?.values?.[0]?.value?.includes('Extension context invalidated')) {
        return null;
      }
      return event;
    },
  });
};

// Helper function to log custom errors
export const logError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
};

// Helper function to log custom messages
export const logMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console[level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'](message);
  }
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string, userName?: string) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      email: email,
      username: userName,
    });
  }
};

// Helper to clear user context (on logout)
export const clearUserContext = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

// Helper to add breadcrumb
export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
};
