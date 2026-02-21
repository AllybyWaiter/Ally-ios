import { corsHeaders, getCorsHeaders } from './cors.ts';
import type { Logger } from './logger.ts';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_FALLBACK_ENTRIES = 5000;

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
  backend?: 'redis' | 'memory' | 'strict';
  degraded?: boolean;
}

type FallbackMode = 'memory' | 'strict';

function parseFallbackMode(value: string | undefined): FallbackMode {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'strict') return 'strict';
  return 'memory';
}

function cleanupFallbackStore(now: number): void {
  let deleted = 0;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
      deleted += 1;
      if (deleted >= 200) break;
    }
  }

  if (rateLimitStore.size <= MAX_FALLBACK_ENTRIES) return;

  const ordered = Array.from(rateLimitStore.entries()).sort((a, b) => a[1].resetTime - b[1].resetTime);
  const overflow = rateLimitStore.size - MAX_FALLBACK_ENTRIES;
  for (let i = 0; i < overflow; i += 1) {
    const key = ordered[i]?.[0];
    if (key) {
      rateLimitStore.delete(key);
    }
  }
}

function runMemoryLimit(config: RateLimitConfig): RateLimitResult {
  const { maxRequests, windowMs, identifier } = config;
  const now = Date.now();

  cleanupFallbackStore(now);

  const entry = rateLimitStore.get(identifier);
  if (!entry || entry.resetTime <= now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetTime,
      backend: 'memory',
      degraded: true,
    };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterSeconds,
      backend: 'memory',
      degraded: true,
    };
  }

  entry.count += 1;
  rateLimitStore.set(identifier, entry);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime,
    backend: 'memory',
    degraded: true,
  };
}

function createStrictDegradedResult(windowMs: number): RateLimitResult {
  const resetTime = Date.now() + windowMs;
  return {
    allowed: false,
    remaining: 0,
    resetTime,
    retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
    backend: 'strict',
    degraded: true,
  };
}

function toRedisResult(value: unknown): unknown {
  if (value && typeof value === 'object' && 'result' in (value as Record<string, unknown>)) {
    return (value as { result: unknown }).result;
  }
  return value;
}

async function runRedisLimit(
  config: RateLimitConfig,
  redisUrl: string,
  redisToken: string
): Promise<RateLimitResult> {
  const key = config.identifier;
  const now = Date.now();

  const response = await fetch(`${redisUrl.replace(/\/+$/, '')}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, String(config.windowMs), 'NX'],
      ['PTTL', key],
    ]),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Redis pipeline failed (${response.status}) ${body.slice(0, 180)}`);
  }

  const payload = await response.json() as unknown;
  if (!Array.isArray(payload) || payload.length < 3) {
    throw new Error('Redis pipeline returned unexpected payload');
  }

  const count = Number(toRedisResult(payload[0]));
  let ttlMs = Number(toRedisResult(payload[2]));

  if (!Number.isFinite(count) || count <= 0) {
    throw new Error('Redis INCR result invalid');
  }

  if (!Number.isFinite(ttlMs) || ttlMs < 0) {
    ttlMs = config.windowMs;
  }

  const remaining = Math.max(0, config.maxRequests - count);
  const resetTime = now + ttlMs;
  const allowed = count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetTime,
    retryAfterSeconds: allowed ? undefined : Math.max(1, Math.ceil(ttlMs / 1000)),
    backend: 'redis',
    degraded: false,
  };
}

export async function checkRateLimit(config: RateLimitConfig, logger?: Logger): Promise<RateLimitResult> {
  const redisUrl = Deno.env.get('RATE_LIMIT_REDIS_URL');
  const redisToken = Deno.env.get('RATE_LIMIT_REDIS_TOKEN');
  const fallbackMode = parseFallbackMode(Deno.env.get('RATE_LIMIT_FALLBACK_MODE'));

  if (redisUrl && redisToken) {
    try {
      const redisResult = await runRedisLimit(config, redisUrl, redisToken);

      logger?.debug('Rate limit check completed', {
        identifier: config.identifier,
        backend: redisResult.backend,
        remaining: redisResult.remaining,
        resetTime: redisResult.resetTime,
      });

      return redisResult;
    } catch (error) {
      logger?.warn('Rate limit redis backend unavailable', {
        identifier: config.identifier,
        monitoring_event: 'rate_limit_backend_degraded',
        fallback_mode: fallbackMode,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    logger?.warn('Rate limit redis backend not configured', {
      identifier: config.identifier,
      monitoring_event: 'rate_limit_backend_degraded',
      fallback_mode: fallbackMode,
      reason: 'missing_redis_env',
    });
  }

  if (fallbackMode === 'strict') {
    return createStrictDegradedResult(config.windowMs);
  }

  return runMemoryLimit(config);
}

export function rateLimitExceededResponse(result: RateLimitResult, request?: Request): Response {
  const cors = request ? getCorsHeaders(request) : corsHeaders;
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfterSeconds: result.retryAfterSeconds,
      resetTime: new Date(result.resetTime).toISOString(),
      code: 'RATE_LIMIT_EXCEEDED',
      meta: {
        backend: result.backend ?? 'memory',
        degraded: Boolean(result.degraded),
      },
    }),
    {
      status: 429,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds || 60),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
        'X-RateLimit-Backend': String(result.backend ?? 'memory'),
        'X-RateLimit-Degraded': result.degraded ? '1' : '0',
      },
    }
  );
}

export function extractIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

