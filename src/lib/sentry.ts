import * as Sentry from "@sentry/react";

// Initialize Sentry only if DSN is configured
export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664';
  
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
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664';
  if (sentryDsn) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
};

// Helper function to log custom messages
export const logMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664';
  if (sentryDsn) {
    Sentry.captureMessage(message, level);
  } else {
    console[level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'](message);
  }
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string, userName?: string) => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664';
  if (sentryDsn) {
    Sentry.setUser({
      id: userId,
      email: email,
      username: userName,
    });
  }
};

// Helper to clear user context (on logout)
export const clearUserContext = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664';
  if (sentryDsn) {
    Sentry.setUser(null);
  }
};

// Helper to add breadcrumb
export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664';
  if (sentryDsn) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
};
