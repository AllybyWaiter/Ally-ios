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
  WEATHER: 'weather',
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

const COOKIE_PREFERENCES_KEY = "cookie-preferences";

// Check if user has consented to analytics cookies
const hasAnalyticsConsent = (): boolean => {
  try {
    const prefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!prefs) return false;
    const parsed = JSON.parse(prefs);
    return parsed.analytics === true;
  } catch {
    return false;
  }
};

let sentryInitialized = false;

// Initialize Sentry - only if user has consented to analytics
export const initSentry = () => {
  // Only initialize if user has explicitly consented to analytics cookies
  if (!hasAnalyticsConsent()) {
    console.log('[Sentry] Skipped initialization - no analytics consent');
    return;
  }

  if (sentryInitialized) {
    return;
  }

  Sentry.init({
    dsn: "https://b599641cc30d93761d7f7b7aeea5d9d9@o4510286001799168.ingest.us.sentry.io/4510332441329664",
    // Only send PII if user has explicitly consented
    sendDefaultPii: hasAnalyticsConsent(),
    environment: import.meta.env.MODE,
  });

  sentryInitialized = true;
  console.log('[Sentry] Initialized with user consent');
};

// Re-initialize Sentry when consent changes (call after user updates preferences)
export const updateSentryConsent = () => {
  if (hasAnalyticsConsent() && !sentryInitialized) {
    initSentry();
  } else if (!hasAnalyticsConsent() && sentryInitialized) {
    // Sentry doesn't have a built-in "disable" - we just stop sending new events
    Sentry.setUser(null);
    console.log('[Sentry] User revoked consent - stopped tracking');
  }
};

// Helper function to log custom errors - only if Sentry is initialized
export const logError = (
  error: Error, 
  context?: Record<string, any>,
  featureArea?: FeatureAreaType,
  severity?: ErrorSeverityType
) => {
  if (sentryInitialized && hasAnalyticsConsent()) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        feature_area: featureArea || FeatureArea.GENERAL,
        severity: severity || ErrorSeverity.MEDIUM,
      },
    });
  }
  console.error('Error:', error, context);
};

// Helper function to log custom messages
export const logMessage = (
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info',
  featureArea?: FeatureAreaType
) => {
  if (sentryInitialized && hasAnalyticsConsent()) {
    Sentry.captureMessage(message, {
      level,
      tags: {
        feature_area: featureArea || FeatureArea.GENERAL,
      },
    });
  }
  console[level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'](message);
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string, userName?: string) => {
  if (sentryInitialized && hasAnalyticsConsent()) {
    Sentry.setUser({
      id: userId,
      email: email,
      username: userName,
    });
  }
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
  if (sentryInitialized && hasAnalyticsConsent()) {
    Sentry.addBreadcrumb({
      message,
      category,
      data: {
        ...data,
        feature_area: featureArea,
      },
      level: 'info',
    });
  }
};
