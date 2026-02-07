// Centralized error handling for edge functions

import { corsHeaders, getCorsHeaders } from './cors.ts';
import type { Logger } from './logger.ts';

export interface ErrorResponseOptions {
  status?: number;
  includeStack?: boolean;
  request?: Request; // For proper CORS origin validation
}

export function createErrorResponse(
  error: unknown,
  logger?: Logger,
  options: ErrorResponseOptions = {}
): Response {
  const { status = 500, includeStack = false, request } = options;

  let message = 'An unexpected error occurred';
  let errorName = 'UnknownError';
  let stack: string | undefined;

  if (error instanceof Error) {
    message = error.message;
    errorName = error.name;
    stack = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  }

  logger?.error(message, error);

  const responseBody: Record<string, unknown> = {
    error: status >= 500 ? 'An unexpected error occurred' : message,
    type: errorName,
  };

  if (includeStack && stack) {
    responseBody.stack = stack;
  }

  // Use dynamic CORS headers if request is provided, otherwise fall back to static
  const cors = request ? getCorsHeaders(request) : corsHeaders;

  return new Response(
    JSON.stringify(responseBody),
    {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    }
  );
}

// Handle AI gateway specific errors
export function handleAIGatewayError(
  response: Response,
  logger?: Logger,
  request?: Request
): Response | null {
  if (response.ok) return null;

  // Use dynamic CORS headers if request is provided
  const cors = request ? getCorsHeaders(request) : corsHeaders;

  if (response.status === 429) {
    logger?.warn('AI gateway rate limit exceeded');
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
      {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  }

  if (response.status === 402) {
    logger?.warn('AI gateway payment required');
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
      {
        status: 402,
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  }

  logger?.error('AI gateway error', { status: response.status });
  return new Response(
    JSON.stringify({ error: 'Failed to process AI request' }),
    {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    }
  );
}

// Success response helper
export function createSuccessResponse(data: unknown, status = 200, request?: Request): Response {
  const cors = request ? getCorsHeaders(request) : corsHeaders;
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    }
  );
}

// Streaming response helper
export function createStreamResponse(body: ReadableStream<Uint8Array> | null, request?: Request): Response {
  const cors = request ? getCorsHeaders(request) : corsHeaders;
  return new Response(body, {
    headers: { ...cors, 'Content-Type': 'text/event-stream' },
  });
}
