/**
 * Application Constants
 * 
 * Centralized constants for the application.
 */

import { Zap, Brain } from 'lucide-react';

export type ModelType = 'standard' | 'thinking';

export interface ModelOption {
  id: ModelType;
  name: string;
  description: string;
  icon: typeof Zap | typeof Brain;
  requiresGold: boolean;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { 
    id: 'standard', 
    name: 'Ally 1.0', 
    description: 'Fast & helpful',
    icon: Zap,
    requiresGold: false 
  },
  { 
    id: 'thinking', 
    name: 'Ally 1.0 Thinking', 
    description: 'Deep reasoning',
    icon: Brain,
    requiresGold: true
  }
];

// Subscription tier limits
export const TIER_LIMITS = {
  free: {
    customTemplates: 0,
    aiChatsPerDay: 10,
    hasReasoningModel: false,
  },
  plus: {
    customTemplates: 10,
    aiChatsPerDay: 100,
    hasReasoningModel: false,
  },
  gold: {
    customTemplates: Infinity,
    aiChatsPerDay: Infinity,
    hasReasoningModel: true,
  },
  enterprise: {
    customTemplates: Infinity,
    aiChatsPerDay: Infinity,
    hasReasoningModel: true,
  },
} as const;
