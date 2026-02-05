import * as Sentry from "@sentry/react";
import { logger } from "@/lib/logger";

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
    logger.log('[Sentry] Skipped initialization - no analytics consent');
    return;
  }

  if (sentryInitialized) {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    logger.warn('[Sentry] No DSN configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    // Only send PII if user has explicitly consented
    sendDefaultPii: hasAnalyticsConsent(),
    environment: import.meta.env.MODE,
  });

  sentryInitialized = true;
  logger.log('[Sentry] Initialized with user consent');
};

// Re-initialize Sentry when consent changes (call after user updates preferences)
export const updateSentryConsent = () => {
  if (hasAnalyticsConsent() && !sentryInitialized) {
    initSentry();
  } else if (!hasAnalyticsConsent() && sentryInitialized) {
    // Sentry doesn't have a built-in "disable" - we just stop sending new events
    Sentry.setUser(null);
    logger.log('[Sentry] User revoked consent - stopped tracking');
  }
};

// Typed context for error logging
export interface ErrorContext {
  component?: string;
  action?: string;
  user_id?: string;
  aquarium_id?: string;
  request_id?: string;
  url?: string;
  [key: string]: string | number | boolean | undefined;
}

// Typed context for breadcrumbs
export interface BreadcrumbData {
  page?: string;
  action?: string;
  target?: string;
  value?: string | number;
  [key: string]: string | number | boolean | undefined;
}

// Helper function to log custom errors - only if Sentry is initialized
export const logError = (
  error: Error,
  context?: ErrorContext,
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
  logger.error('Error:', error, context);
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
  logger[level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'](message);
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
  data?: BreadcrumbData,
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

// ==================== Specialized Breadcrumb Helpers ====================

/**
 * Track navigation events
 */
export const trackNavigation = (from: string, to: string) => {
  addBreadcrumb(`Navigated from ${from} to ${to}`, 'navigation', { from, to });
};

/**
 * Track user actions (clicks, form submissions, etc.)
 */
export const trackUserAction = (
  action: string,
  target?: string,
  featureArea?: FeatureAreaType,
  additionalData?: Record<string, string | number | boolean>
) => {
  addBreadcrumb(
    `User action: ${action}`,
    'user',
    { action, target, ...additionalData },
    featureArea
  );
};

/**
 * Track form submissions
 */
export const trackFormSubmission = (
  formName: string,
  success: boolean,
  featureArea?: FeatureAreaType
) => {
  addBreadcrumb(
    `Form ${success ? 'submitted' : 'submission failed'}: ${formName}`,
    'form',
    { form_name: formName, success: success ? 'true' : 'false' },
    featureArea
  );
};

/**
 * Track API/data operations
 */
export const trackDataOperation = (
  operation: 'fetch' | 'create' | 'update' | 'delete',
  entity: string,
  success: boolean,
  count?: number
) => {
  addBreadcrumb(
    `${operation} ${entity} ${success ? 'succeeded' : 'failed'}`,
    'data',
    { operation, entity, success: success ? 'true' : 'false', count }
  );
};

/**
 * Track aquarium-related actions
 */
export const trackAquariumAction = (
  action: 'view' | 'create' | 'update' | 'delete' | 'add_test' | 'add_task',
  aquariumId?: string,
  aquariumName?: string
) => {
  addBreadcrumb(
    `Aquarium ${action}${aquariumName ? `: ${aquariumName}` : ''}`,
    'aquarium',
    { action, aquarium_id: aquariumId, aquarium_name: aquariumName },
    FeatureArea.AQUARIUM
  );
};

/**
 * Track water test actions
 */
export const trackWaterTestAction = (
  action: 'view' | 'create' | 'delete' | 'photo_upload',
  aquariumId?: string,
  testId?: string
) => {
  addBreadcrumb(
    `Water test ${action}`,
    'water_test',
    { action, aquarium_id: aquariumId, test_id: testId },
    FeatureArea.WATER_TESTS
  );
};

/**
 * Track chat/AI interactions
 */
export const trackChatAction = (
  action: 'send_message' | 'receive_response' | 'feedback' | 'new_conversation',
  conversationId?: string,
  messageLength?: number
) => {
  addBreadcrumb(
    `Chat ${action}`,
    'chat',
    { action, conversation_id: conversationId, message_length: messageLength },
    FeatureArea.CHAT
  );
};

/**
 * Track subscription/billing events
 */
export const trackSubscriptionEvent = (
  event: 'view_plans' | 'start_checkout' | 'complete_purchase' | 'cancel',
  plan?: string
) => {
  addBreadcrumb(
    `Subscription ${event}${plan ? `: ${plan}` : ''}`,
    'subscription',
    { event, plan }
  );
};

/**
 * Track authentication events
 */
export const trackAuthEvent = (
  event: 'login' | 'logout' | 'signup' | 'password_reset' | 'session_refresh',
  method?: string
) => {
  addBreadcrumb(
    `Auth ${event}${method ? ` via ${method}` : ''}`,
    'auth',
    { event, method },
    FeatureArea.AUTH
  );
};
