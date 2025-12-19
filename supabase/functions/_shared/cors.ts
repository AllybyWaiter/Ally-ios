// Shared CORS and security headers for all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Handle CORS preflight requests with security headers
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        ...securityHeaders,
      }
    });
  }
  return null;
}

// Create a JSON response with all security headers
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...responseHeaders,
    },
  });
}

// Create an error response with all security headers
export function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...responseHeaders,
    },
  });
}
