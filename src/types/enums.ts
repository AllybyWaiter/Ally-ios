/**
 * Centralized Type Enums
 *
 * Provides type-safe string literals for database enum fields.
 * Using const objects with 'as const' for better TypeScript inference.
 */

// ==================== Water Test Alert Types ====================

export const AlertType = {
  RISING: 'rising',
  FALLING: 'falling',
  UNSTABLE: 'unstable',
  APPROACHING_THRESHOLD: 'approaching_threshold',
  PREDICTIVE: 'predictive',
  SEASONAL: 'seasonal',
  STOCKING: 'stocking',
  CORRELATION: 'correlation',
} as const;

export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export const ALERT_TYPES = Object.values(AlertType);

// ==================== Alert Severity ====================

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const ALERT_SEVERITIES = Object.values(AlertSeverity);

// ==================== Analysis Model ====================

export const AnalysisModel = {
  RULE: 'rule',
  AI: 'ai',
} as const;

export type AnalysisModel = (typeof AnalysisModel)[keyof typeof AnalysisModel];

// ==================== Water Body Types ====================

export const WaterBodyType = {
  FRESHWATER: 'freshwater',
  SALTWATER: 'saltwater',
  REEF: 'reef',
  PLANTED: 'planted',
  BRACKISH: 'brackish',
  POND: 'pond',
  POOL: 'pool',
  POOL_CHLORINE: 'pool_chlorine',
  POOL_SALTWATER: 'pool_saltwater',
  SPA: 'spa',
  HOT_TUB: 'hot_tub',
} as const;

export type WaterBodyType = (typeof WaterBodyType)[keyof typeof WaterBodyType];

export const WATER_BODY_TYPES = Object.values(WaterBodyType);

/** Pool/Spa types - used for conditional UI logic */
export const POOL_TYPES: WaterBodyType[] = [
  WaterBodyType.POOL,
  WaterBodyType.POOL_CHLORINE,
  WaterBodyType.POOL_SALTWATER,
  WaterBodyType.SPA,
  WaterBodyType.HOT_TUB,
];

/** Aquarium types - used for conditional UI logic */
export const AQUARIUM_TYPES: WaterBodyType[] = [
  WaterBodyType.FRESHWATER,
  WaterBodyType.SALTWATER,
  WaterBodyType.REEF,
  WaterBodyType.PLANTED,
  WaterBodyType.BRACKISH,
  WaterBodyType.POND,
];

// ==================== Water Body Category ====================

export const WaterBodyCategory = {
  AQUARIUM: 'aquarium',
  POOL: 'pool',
  SPA: 'spa',
} as const;

export type WaterBodyCategory = (typeof WaterBodyCategory)[keyof typeof WaterBodyCategory];

// ==================== Aquarium Status ====================

export const AquariumStatus = {
  ACTIVE: 'active',
  CYCLING: 'cycling',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

export type AquariumStatus = (typeof AquariumStatus)[keyof typeof AquariumStatus];

export const AQUARIUM_STATUSES = Object.values(AquariumStatus);

// ==================== Livestock Health Status ====================

export const LivestockHealthStatus = {
  HEALTHY: 'healthy',
  SICK: 'sick',
  RECOVERING: 'recovering',
  QUARANTINE: 'quarantine',
} as const;

export type LivestockHealthStatus = (typeof LivestockHealthStatus)[keyof typeof LivestockHealthStatus];

export const LIVESTOCK_HEALTH_STATUSES = Object.values(LivestockHealthStatus);

// ==================== Plant Condition ====================

export const PlantCondition = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  NEW: 'new',
} as const;

export type PlantCondition = (typeof PlantCondition)[keyof typeof PlantCondition];

export const PLANT_CONDITIONS = Object.values(PlantCondition);

// ==================== Plant Placement ====================

export const PlantPlacement = {
  FOREGROUND: 'foreground',
  MIDGROUND: 'midground',
  BACKGROUND: 'background',
  FLOATING: 'floating',
  CARPETING: 'carpeting',
  OTHER: 'other',
} as const;

export type PlantPlacement = (typeof PlantPlacement)[keyof typeof PlantPlacement];

export const PLANT_PLACEMENTS = Object.values(PlantPlacement);

// ==================== Task Status ====================

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TASK_STATUSES = Object.values(TaskStatus);

// ==================== Confidence Levels ====================

export const ConfidenceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

// ==================== Entry Method ====================

export const EntryMethod = {
  MANUAL: 'manual',
  PHOTO: 'photo',
  API: 'api',
  IMPORT: 'import',
} as const;

export type EntryMethod = (typeof EntryMethod)[keyof typeof EntryMethod];

// ==================== Parameter Status ====================

export const ParameterStatus = {
  OPTIMAL: 'optimal',
  ACCEPTABLE: 'acceptable',
  WARNING: 'warning',
  DANGER: 'danger',
} as const;

export type ParameterStatus = (typeof ParameterStatus)[keyof typeof ParameterStatus];

export const PARAMETER_STATUSES = Object.values(ParameterStatus);

// ==================== AI Feedback Features ====================

export const FeedbackFeature = {
  CHAT: 'chat',
  PHOTO_ANALYSIS: 'photo_analysis',
  TASK_SUGGESTIONS: 'task_suggestions',
  TICKET_REPLY: 'ticket_reply',
} as const;

export type FeedbackFeature = (typeof FeedbackFeature)[keyof typeof FeedbackFeature];

// ==================== Feedback Rating ====================

export const FeedbackRating = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
} as const;

export type FeedbackRating = (typeof FeedbackRating)[keyof typeof FeedbackRating];

// ==================== Type Guards ====================

export function isAlertType(value: string): value is AlertType {
  return ALERT_TYPES.includes(value as AlertType);
}

export function isAlertSeverity(value: string): value is AlertSeverity {
  return ALERT_SEVERITIES.includes(value as AlertSeverity);
}

export function isWaterBodyType(value: string): value is WaterBodyType {
  return WATER_BODY_TYPES.includes(value as WaterBodyType);
}

export function isPoolType(value: string): boolean {
  return POOL_TYPES.includes(value as WaterBodyType);
}

export function isAquariumType(value: string): boolean {
  return AQUARIUM_TYPES.includes(value as WaterBodyType);
}

export function isLivestockHealthStatus(value: string): value is LivestockHealthStatus {
  return LIVESTOCK_HEALTH_STATUSES.includes(value as LivestockHealthStatus);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}
