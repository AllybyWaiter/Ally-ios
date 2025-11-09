import * as Sentry from "@sentry/react";

// Initialize Sentry
export const initSentry = () => {
  Sentry.init({
    dsn: "https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    environment: import.meta.env.MODE,
  });
};

// Helper function to log custom errors
export const logError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
  console.error('Error:', error, context);
};

// Helper function to log custom messages
export const logMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
  console[level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'](message);
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string, userName?: string) => {
  Sentry.setUser({
    id: userId,
    email: email,
    username: userName,
  });
};

// Helper to clear user context (on logout)
export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Helper to add breadcrumb
export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};
