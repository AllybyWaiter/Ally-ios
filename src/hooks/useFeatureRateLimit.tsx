import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { addBreadcrumb, FeatureArea } from '@/lib/sentry';

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

const RATE_LIMITS: Record<string, Record<string, RateLimitConfig>> = {
  free: {
    'water-test-photo': { maxRequests: 5, windowMs: 3600000, feature: 'Water Test Photo Analysis' },
    'ai-chat': { maxRequests: 10, windowMs: 3600000, feature: 'AI Chat' },
    'maintenance-suggestions': { maxRequests: 20, windowMs: 86400000, feature: 'Maintenance Suggestions' },
  },
  plus: {
    'water-test-photo': { maxRequests: 25, windowMs: 3600000, feature: 'Water Test Photo Analysis' },
    'ai-chat': { maxRequests: 50, windowMs: 3600000, feature: 'AI Chat' },
    'maintenance-suggestions': { maxRequests: 100, windowMs: 86400000, feature: 'Maintenance Suggestions' },
  },
  gold: {
    'water-test-photo': { maxRequests: 100, windowMs: 3600000, feature: 'Water Test Photo Analysis' },
    'ai-chat': { maxRequests: 200, windowMs: 3600000, feature: 'AI Chat' },
    'maintenance-suggestions': { maxRequests: 500, windowMs: 86400000, feature: 'Maintenance Suggestions' },
  },
  enterprise: {
    'water-test-photo': { maxRequests: 1000, windowMs: 3600000, feature: 'Water Test Photo Analysis' },
    'ai-chat': { maxRequests: 1000, windowMs: 3600000, feature: 'AI Chat' },
    'maintenance-suggestions': { maxRequests: 5000, windowMs: 86400000, feature: 'Maintenance Suggestions' },
  },
};

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
      const stored = localStorage.getItem(storageKey);
      const now = Date.now();

      if (stored) {
        const data = JSON.parse(stored);
        
        // Reset if window expired
        if (now - data.timestamp > config.windowMs) {
          const newData = {
            count: 0,
            timestamp: now,
            reset: now + config.windowMs,
          };
          localStorage.setItem(storageKey, JSON.stringify(newData));
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
        // First request
        const newData = {
          count: 0,
          timestamp: now,
          reset: now + config.windowMs,
        };
        localStorage.setItem(storageKey, JSON.stringify(newData));
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
    if (!user || !config) return false;

    const storageKey = `rate_limit_${user.id}_${endpoint}`;
    const stored = localStorage.getItem(storageKey);
    const now = Date.now();

    if (!stored) {
      const newData = {
        count: 1,
        timestamp: now,
        reset: now + config.windowMs,
      };
      localStorage.setItem(storageKey, JSON.stringify(newData));
      
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

    const data = JSON.parse(stored);

    // Reset if window expired
    if (now - data.timestamp > config.windowMs) {
      const newData = {
        count: 1,
        timestamp: now,
        reset: now + config.windowMs,
      };
      localStorage.setItem(storageKey, JSON.stringify(newData));
      
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
    localStorage.setItem(storageKey, JSON.stringify(newData));

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
    try {
      await supabase.from('activity_logs').insert({
        user_id: user!.id,
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
