// Server-side rate limiting using in-memory store
// Note: In production, use Redis or Supabase for distributed rate limiting

import { corsHeaders, getCorsHeaders } from './cors.ts';
import type { Logger } from './logger.ts';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (per edge function instance)
// Note: This works per-instance. For production scale, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries lazily during rate limit checks
// (removed setInterval to prevent memory leak in edge functions)

export interface RateLimitConfig {
  maxRequests: number;      // Max requests per window
  windowMs: number;         // Time window in milliseconds
  identifier: string;       // Unique identifier (user ID, IP, etc.)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(config: RateLimitConfig, logger?: Logger): RateLimitResult {
  const { maxRequests, windowMs, identifier } = config;
  const now = Date.now();
  const key = identifier;
  
  // Lazy cleanup: remove expired entries on each check (max 10 to prevent slowdown)
  let cleanupCount = 0;
  for (const [k, e] of rateLimitStore.entries()) {
    if (e.resetTime < now) {
      rateLimitStore.delete(k);
      cleanupCount++;
      if (cleanupCount >= 10) break;
    }
  }
  
  const entry = rateLimitStore.get(key);
  
  // No existing entry or window expired
  if (!entry || entry.resetTime < now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    
    logger?.debug('Rate limit check passed (new window)', {
      identifier,
      remaining: maxRequests - 1,
      resetTime,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }
  
  // Within existing window
  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    
    logger?.warn('Rate limit exceeded', {
      identifier,
      count: entry.count,
      maxRequests,
      retryAfterSeconds,
    });
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterSeconds,
    };
  }
  
  // Increment counter
  entry.count += 1;
  rateLimitStore.set(key, entry);
  
  logger?.debug('Rate limit check passed', {
    identifier,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  });
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Create rate limit exceeded response
export function rateLimitExceededResponse(result: RateLimitResult, request?: Request): Response {
  const cors = request ? getCorsHeaders(request) : corsHeaders;
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfterSeconds: result.retryAfterSeconds,
      resetTime: new Date(result.resetTime).toISOString(),
    }),
    {
      status: 429,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds || 60),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
      },
    }
  );
}

// Helper to extract user identifier from request
export function extractIdentifier(req: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 
             req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-real-ip') ||
             'unknown';
  
  return `ip:${ip}`;
}
