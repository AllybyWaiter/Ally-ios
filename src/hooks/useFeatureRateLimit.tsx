import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { addBreadcrumb, FeatureArea } from '@/lib/sentry';
import { PLAN_DEFINITIONS, type PlanTier } from '@/lib/planConstants';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  feature: string;
}

interface RateLimitState {
  remaining: number;
  reset: number;
  limited: boolean;
}

// Build rate limits from plan constants
const FEATURE_NAMES: Record<string, string> = {
  'water-test-photo': 'Water Test Photo Analysis',
  'ai-chat': 'AI Chat',
  'maintenance-suggestions': 'Maintenance Suggestions',
};

function buildRateLimits(): Record<string, Record<string, RateLimitConfig>> {
  const tiers: PlanTier[] = ['free', 'basic', 'plus', 'gold', 'business', 'enterprise'];
  const limits: Record<string, Record<string, RateLimitConfig>> = {};
  
  for (const tier of tiers) {
    const plan = PLAN_DEFINITIONS[tier];
    limits[tier] = {
      'water-test-photo': {
        maxRequests: plan.rateLimits.waterTestPhoto.maxRequests,
        windowMs: plan.rateLimits.waterTestPhoto.windowMs,
        feature: FEATURE_NAMES['water-test-photo'],
      },
      'ai-chat': {
        maxRequests: plan.rateLimits.aiChat.maxRequests,
        windowMs: plan.rateLimits.aiChat.windowMs,
        feature: FEATURE_NAMES['ai-chat'],
      },
      'maintenance-suggestions': {
        maxRequests: plan.rateLimits.maintenanceSuggestions.maxRequests,
        windowMs: plan.rateLimits.maintenanceSuggestions.windowMs,
        feature: FEATURE_NAMES['maintenance-suggestions'],
      },
    };
  }
  
  return limits;
}

const RATE_LIMITS = buildRateLimits();

export const useFeatureRateLimit = (endpoint: string) => {
  const { user, subscriptionTier } = useAuth();
  const [state, setState] = useState<RateLimitState>({
    remaining: 0,
    reset: Date.now(),
    limited: false,
  });

  const tier = subscriptionTier || 'free';
  const config = RATE_LIMITS[tier]?.[endpoint] || RATE_LIMITS.free[endpoint];

  useEffect(() => {
    if (!user || !config) return;

    const checkRateLimit = async () => {
      const storageKey = `rate_limit_${user.id}_${endpoint}`;
      const now = Date.now();
      
      // Safe localStorage parsing
      let data: { count: number; timestamp: number; reset: number } | null = null;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          data = JSON.parse(stored);
        }
      } catch {
        // Invalid JSON in localStorage - remove corrupted data
        localStorage.removeItem(storageKey);
        data = null;
      }

      if (data && typeof data.count === 'number' && typeof data.timestamp === 'number') {
        // Reset if window expired
        if (now - data.timestamp > config.windowMs) {
          const newData = {
            count: 0,
            timestamp: now,
            reset: now + config.windowMs,
          };
          try {
            localStorage.setItem(storageKey, JSON.stringify(newData));
          } catch {
            // Storage quota exceeded - continue without persisting
            console.warn('localStorage quota exceeded for rate limit');
          }
          setState({
            remaining: config.maxRequests,
            reset: newData.reset,
            limited: false,
          });
        } else {
          // Update remaining
          const remaining = Math.max(0, config.maxRequests - data.count);
          setState({
            remaining,
            reset: data.reset,
            limited: remaining === 0,
          });
        }
      } else {
        // First request or invalid data
        const newData = {
          count: 0,
          timestamp: now,
          reset: now + config.windowMs,
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(newData));
        } catch {
          // Storage quota exceeded - continue without persisting
          console.warn('localStorage quota exceeded for rate limit');
        }
        setState({
          remaining: config.maxRequests,
          reset: newData.reset,
          limited: false,
        });
      }
    };

    checkRateLimit();
  }, [user, endpoint, config]);

  const checkLimit = async (): Promise<boolean> => {
    // Allow operation if user not authenticated (rate limiting requires user context)
    // or if config is missing (fail-open to avoid blocking features)
    if (!user || !config) return true;

    const storageKey = `rate_limit_${user.id}_${endpoint}`;
    const now = Date.now();
    
    // Safe localStorage parsing
    let data: { count: number; timestamp: number; reset: number } | null = null;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        data = JSON.parse(stored);
      }
    } catch {
      // Invalid JSON - remove corrupted data
      localStorage.removeItem(storageKey);
      data = null;
    }

    if (!data || typeof data.count !== 'number' || typeof data.timestamp !== 'number') {
      const newData = {
        count: 1,
        timestamp: now,
        reset: now + config.windowMs,
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(newData));
      } catch {
        // Storage quota exceeded - continue without persisting
        console.warn('localStorage quota exceeded for rate limit');
      }
      
      addBreadcrumb(
        `Rate limit check: ${endpoint}`,
        'rate-limit',
        { remaining: config.maxRequests - 1, tier },
        FeatureArea.GENERAL
      );

      setState({
        remaining: config.maxRequests - 1,
        reset: newData.reset,
        limited: false,
      });

      // Track usage
      await trackUsage(endpoint, tier);
      
      return true;
    }

    // Reset if window expired
    if (now - data.timestamp > config.windowMs) {
      const newData = {
        count: 1,
        timestamp: now,
        reset: now + config.windowMs,
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(newData));
      } catch {
        // Storage quota exceeded - continue without persisting
        console.warn('localStorage quota exceeded for rate limit');
      }

      setState({
        remaining: config.maxRequests - 1,
        reset: newData.reset,
        limited: false,
      });

      await trackUsage(endpoint, tier);

      return true;
    }

    // Check if limit exceeded
    if (data.count >= config.maxRequests) {
      const resetIn = Math.ceil((data.reset - now) / 60000);
      
      toast.error("Rate Limit Reached", {
        description: `You've reached the ${config.feature} limit for your ${tier} plan. Resets in ${resetIn} minutes.`,
      });

      addBreadcrumb(
        `Rate limit exceeded: ${endpoint}`,
        'rate-limit',
        { tier, resetIn },
        FeatureArea.GENERAL
      );

      setState({
        remaining: 0,
        reset: data.reset,
        limited: true,
      });
      
      return false;
    }

    // Increment count
    const newData = {
      ...data,
      count: data.count + 1,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    } catch {
      // Storage quota exceeded - continue without persisting
      console.warn('localStorage quota exceeded for rate limit');
    }

    const remaining = config.maxRequests - newData.count;
    
    setState({
      remaining,
      reset: data.reset,
      limited: false,
    });

    // Warn when approaching limit
    if (remaining <= 3 && remaining > 0) {
      toast.warning("Approaching Rate Limit", {
        description: `Only ${remaining} ${config.feature} requests remaining this hour.`,
      });
    }

    await trackUsage(endpoint, tier);

    return true;
  };

  const trackUsage = async (feature: string, subscriptionTier: string) => {
    // Guard against null user (shouldn't happen but defensive coding)
    if (!user?.id) return;

    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action_type: 'feature_usage',
        action_details: {
          feature,
          subscription_tier: subscriptionTier,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  return {
    ...state,
    checkLimit,
    config,
    tier,
  };
};
