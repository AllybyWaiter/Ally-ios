/**
 * Single source of truth for all subscription plan definitions.
 * Import from this file to ensure consistency across the codebase.
 */

export type PlanTier = 'free' | 'basic' | 'plus' | 'gold' | 'business' | 'enterprise';

export interface PlanFeatures {
  maxAquariums: number;
  maxTestLogsPerMonth: number | null; // null = unlimited
  hasEquipmentTracking: boolean;
  hasAllyMemory: boolean;
  hasMultiTankManagement: boolean;
  hasExportHistory: boolean;
  hasReasoningModel: boolean;
  hasAITrendAlerts: boolean;
  hasSmartScheduling: 'none' | 'basic' | 'full';
  hasCustomNotifications: boolean;
  hasAIRecommendations: boolean;
  hasTeamDashboards: boolean;
  hasAPIIntegrations: boolean;
  hasPrioritySupport: boolean;
  hasConversationMode: boolean;
}

export interface PlanRateLimits {
  waterTestPhoto: { maxRequests: number; windowMs: number };
  aiChat: { maxRequests: number; windowMs: number };
  maintenanceSuggestions: { maxRequests: number; windowMs: number };
}

export interface PlanAdminLimits {
  chatLimit: number;   // -1 = unlimited
  photoLimit: number;  // -1 = unlimited
  memoryLimit: number; // -1 = unlimited
}

export interface PlanPricing {
  monthlyPrice: number; // in cents
  yearlyPrice: number;  // in cents
  displayMonthly: number; // for UI display ($X.XX)
  displayYearly: number;  // for UI display ($X.XX)
}

export interface PlanDefinition {
  name: string;
  description: string;
  features: PlanFeatures;
  rateLimits: PlanRateLimits;
  adminLimits: PlanAdminLimits;
  pricing: PlanPricing | null; // null for free/enterprise (contact sales)
  marketingFeatures: string[]; // Features shown on pricing page
}

// One hour in milliseconds
const HOUR_MS = 3600000;
// One day in milliseconds
const DAY_MS = 86400000;

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  free: {
    name: 'Free',
    description: 'Get started with basic features',
    features: {
      maxAquariums: 1,
      maxTestLogsPerMonth: 5,
      hasEquipmentTracking: false,
      hasAllyMemory: false,
      hasMultiTankManagement: false,
      hasExportHistory: false,
      hasReasoningModel: false,
      hasAITrendAlerts: false,
      hasSmartScheduling: 'none',
      hasCustomNotifications: false,
      hasAIRecommendations: true,
      hasTeamDashboards: false,
      hasAPIIntegrations: false,
      hasPrioritySupport: false,
      hasConversationMode: false,
    },
    rateLimits: {
      waterTestPhoto: { maxRequests: 5, windowMs: HOUR_MS },
      aiChat: { maxRequests: 10, windowMs: HOUR_MS },
      maintenanceSuggestions: { maxRequests: 20, windowMs: DAY_MS },
    },
    adminLimits: {
      chatLimit: 10,
      photoLimit: 5,
      memoryLimit: 0,
    },
    pricing: null,
    marketingFeatures: [
      '1 water body',
      '5 test logs per month',
      'AI recommendations',
    ],
  },
  basic: {
    name: 'Basic',
    description: 'Perfect for getting started',
    features: {
      maxAquariums: 1,
      maxTestLogsPerMonth: 10,
      hasEquipmentTracking: false,
      hasAllyMemory: false,
      hasMultiTankManagement: false,
      hasExportHistory: false,
      hasReasoningModel: false,
      hasAITrendAlerts: false,
      hasSmartScheduling: 'basic',
      hasCustomNotifications: false,
      hasAIRecommendations: true,
      hasTeamDashboards: false,
      hasAPIIntegrations: false,
      hasPrioritySupport: false,
      hasConversationMode: false,
    },
    rateLimits: {
      waterTestPhoto: { maxRequests: 10, windowMs: HOUR_MS },
      aiChat: { maxRequests: 20, windowMs: HOUR_MS },
      maintenanceSuggestions: { maxRequests: 40, windowMs: DAY_MS },
    },
    adminLimits: {
      chatLimit: 20,
      photoLimit: 10,
      memoryLimit: 0,
    },
    pricing: {
      monthlyPrice: 999,
      yearlyPrice: 9590,
      displayMonthly: 9.99,
      displayYearly: 95.90,
    },
    marketingFeatures: [
      '1 water body (pool, spa, aquarium, or pond)',
      '10 test logs per month',
      'AI recommendations',
      'Basic smart scheduling',
    ],
  },
  plus: {
    name: 'Plus',
    description: 'Most popular for hobbyists',
    features: {
      maxAquariums: 3,
      maxTestLogsPerMonth: null,
      hasEquipmentTracking: true,
      hasAllyMemory: true,
      hasMultiTankManagement: false,
      hasExportHistory: false,
      hasReasoningModel: false,
      hasAITrendAlerts: true,
      hasSmartScheduling: 'full',
      hasCustomNotifications: true,
      hasAIRecommendations: true,
      hasTeamDashboards: false,
      hasAPIIntegrations: false,
      hasPrioritySupport: false,
      hasConversationMode: true,
    },
    rateLimits: {
      waterTestPhoto: { maxRequests: 25, windowMs: HOUR_MS },
      aiChat: { maxRequests: 50, windowMs: HOUR_MS },
      maintenanceSuggestions: { maxRequests: 100, windowMs: DAY_MS },
    },
    adminLimits: {
      chatLimit: 100,
      photoLimit: 50,
      memoryLimit: 50,
    },
    pricing: {
      monthlyPrice: 1499,
      yearlyPrice: 14390,
      displayMonthly: 14.99,
      displayYearly: 143.90,
    },
    marketingFeatures: [
      '3 water bodies',
      'Unlimited test logs',
      'AI recommendations',
      'Ally remembers your setup',
      'Smart scheduling',
      'Equipment tracking',
      'Custom notifications',
      'Hands-free voice conversation',
    ],
  },
  gold: {
    name: 'Gold',
    description: 'For serious enthusiasts',
    features: {
      maxAquariums: 10,
      maxTestLogsPerMonth: null,
      hasEquipmentTracking: true,
      hasAllyMemory: true,
      hasMultiTankManagement: true,
      hasExportHistory: true,
      hasReasoningModel: true,
      hasAITrendAlerts: true,
      hasSmartScheduling: 'full',
      hasCustomNotifications: true,
      hasAIRecommendations: true,
      hasTeamDashboards: false,
      hasAPIIntegrations: false,
      hasPrioritySupport: false,
      hasConversationMode: true,
    },
    rateLimits: {
      waterTestPhoto: { maxRequests: 100, windowMs: HOUR_MS },
      aiChat: { maxRequests: 200, windowMs: HOUR_MS },
      maintenanceSuggestions: { maxRequests: 500, windowMs: DAY_MS },
    },
    adminLimits: {
      chatLimit: 500,
      photoLimit: 200,
      memoryLimit: 200,
    },
    pricing: {
      monthlyPrice: 1999,
      yearlyPrice: 19190,
      displayMonthly: 19.99,
      displayYearly: 191.90,
    },
    marketingFeatures: [
      '10 water bodies',
      'Unlimited test logs',
      'AI recommendations',
      'Smart scheduling',
      'Equipment tracking',
      'Multi-system management',
      'AI habit learning',
      'Connected device integration',
      'Export water history (PDF/CSV)',
    ],
  },
  business: {
    name: 'Business',
    description: 'For teams and enterprises',
    features: {
      maxAquariums: Infinity,
      maxTestLogsPerMonth: null,
      hasEquipmentTracking: true,
      hasAllyMemory: true,
      hasMultiTankManagement: true,
      hasExportHistory: true,
      hasReasoningModel: true,
      hasAITrendAlerts: true,
      hasSmartScheduling: 'full',
      hasCustomNotifications: true,
      hasAIRecommendations: true,
      hasTeamDashboards: true,
      hasAPIIntegrations: true,
      hasPrioritySupport: true,
      hasConversationMode: true,
    },
    rateLimits: {
      waterTestPhoto: { maxRequests: 1000, windowMs: HOUR_MS },
      aiChat: { maxRequests: 1000, windowMs: HOUR_MS },
      maintenanceSuggestions: { maxRequests: 5000, windowMs: DAY_MS },
    },
    adminLimits: {
      chatLimit: -1,
      photoLimit: -1,
      memoryLimit: -1,
    },
    pricing: null, // Contact sales
    marketingFeatures: [
      'Unlimited water bodies',
      'Everything in Gold, plus:',
      'Team dashboards',
      'Multi-location support',
      'API integrations',
      'Dedicated Ally rep',
      'Priority AI support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    features: {
      maxAquariums: Infinity,
      maxTestLogsPerMonth: null,
      hasEquipmentTracking: true,
      hasAllyMemory: true,
      hasMultiTankManagement: true,
      hasExportHistory: true,
      hasReasoningModel: true,
      hasAITrendAlerts: true,
      hasSmartScheduling: 'full',
      hasCustomNotifications: true,
      hasAIRecommendations: true,
      hasTeamDashboards: true,
      hasAPIIntegrations: true,
      hasPrioritySupport: true,
      hasConversationMode: true,
    },
    rateLimits: {
      waterTestPhoto: { maxRequests: 1000, windowMs: HOUR_MS },
      aiChat: { maxRequests: 1000, windowMs: HOUR_MS },
      maintenanceSuggestions: { maxRequests: 5000, windowMs: DAY_MS },
    },
    adminLimits: {
      chatLimit: -1,
      photoLimit: -1,
      memoryLimit: -1,
    },
    pricing: null, // Contact sales
    marketingFeatures: [
      'Custom limits and features',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom integrations',
    ],
  },
};

// Helper to get plan by tier with fallback to free
export function getPlanDefinition(tier: string | null | undefined): PlanDefinition {
  const normalizedTier = (tier?.toLowerCase() || 'free') as PlanTier;
  return PLAN_DEFINITIONS[normalizedTier] || PLAN_DEFINITIONS.free;
}

// Get all paid plans for display (excludes free and enterprise)
export function getPaidPlans(): Array<{ tier: PlanTier; definition: PlanDefinition }> {
  return (['basic', 'plus', 'gold'] as PlanTier[]).map(tier => ({
    tier,
    definition: PLAN_DEFINITIONS[tier],
  }));
}

// Get tier display name
export function getTierDisplayName(tier: string | null | undefined): string {
  return getPlanDefinition(tier).name;
}
