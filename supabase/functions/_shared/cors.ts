// Shared CORS and security headers for all edge functions

// Production origins - always allowed
const productionOrigins = [
  'https://allybywaiter.com',
  'https://www.allybywaiter.com',
  'capacitor://localhost', // iOS Capacitor app
];

// Development origins - only in development mode
const developmentOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
];

// Get allowed origins based on environment
function getAllowedOrigins(): string[] {
  const customOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (customOrigins) {
    return customOrigins.split(',').map(o => o.trim());
  }

  // Always include both production and development origins
  // Development origins (localhost) are safe to include since they only work locally
  return [...productionOrigins, ...developmentOrigins];
}

const allowedOrigins = getAllowedOrigins();

// Get CORS headers with origin validation
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    'Vary': 'Origin', // Important for caching with dynamic origins
  };
}

// Legacy static headers - use getCorsHeaders(request) instead for proper origin validation
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://allybywaiter.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
};

// Security headers to include in all responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
};

// Combined headers for responses
export const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
};

// Handle CORS preflight requests with security headers and origin validation
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...getCorsHeaders(req),
        ...securityHeaders,
      }
    });
  }
  return null;
}

// Get combined response headers with proper origin validation
export function getResponseHeaders(request: Request): Record<string, string> {
  return {
    ...getCorsHeaders(request),
    ...securityHeaders,
  };
}

// Create a JSON response with all security headers and origin validation
export function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  const headers = request
    ? { 'Content-Type': 'application/json', ...getResponseHeaders(request) }
    : { 'Content-Type': 'application/json', ...responseHeaders };

  return new Response(JSON.stringify(data), { status, headers });
}

// Create an error response with all security headers and origin validation
export function errorResponse(message: string, status = 400, request?: Request): Response {
  const headers = request
    ? { 'Content-Type': 'application/json', ...getResponseHeaders(request) }
    : { 'Content-Type': 'application/json', ...responseHeaders };

  return new Response(JSON.stringify({ error: message }), { status, headers });
}
