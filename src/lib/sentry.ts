import * as Sentry from "@sentry/react";

// Feature areas for error categorization
export const FeatureArea = {
  AUTH: 'auth',
  AQUARIUM: 'aquarium',
  WATER_TESTS: 'water-tests',
  EQUIPMENT: 'equipment',
  MAINTENANCE: 'maintenance',
  CHAT: 'chat',
  SETTINGS: 'settings',
  ADMIN: 'admin',
  GENERAL: 'general',
} as const;

export type FeatureAreaType = typeof FeatureArea[keyof typeof FeatureArea];

// Severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];

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
export const logError = (
  error: Error, 
  context?: Record<string, any>,
  featureArea?: FeatureAreaType,
  severity?: ErrorSeverityType
) => {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      feature_area: featureArea || FeatureArea.GENERAL,
      severity: severity || ErrorSeverity.MEDIUM,
    },
  });
  console.error('Error:', error, context);
};

// Helper function to log custom messages
export const logMessage = (
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info',
  featureArea?: FeatureAreaType
) => {
  Sentry.captureMessage(message, {
    level,
    tags: {
      feature_area: featureArea || FeatureArea.GENERAL,
    },
  });
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
export const addBreadcrumb = (
  message: string, 
  category?: string, 
  data?: Record<string, any>,
  featureArea?: FeatureAreaType
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data: {
      ...data,
      feature_area: featureArea,
    },
    level: 'info',
  });
};
