// Centralized error handling for edge functions

import { corsHeaders } from './cors.ts';
import type { Logger } from './logger.ts';

export interface ErrorResponseOptions {
  status?: number;
  includeStack?: boolean;
}

export function createErrorResponse(
  error: unknown,
  logger?: Logger,
  options: ErrorResponseOptions = {}
): Response {
  const { status = 500, includeStack = false } = options;
  
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
    error: message,
    type: errorName,
  };
  
  if (includeStack && stack) {
    responseBody.stack = stack;
  }
  
  return new Response(
    JSON.stringify(responseBody),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handle AI gateway specific errors
export function handleAIGatewayError(
  response: Response,
  logger?: Logger
): Response | null {
  if (response.ok) return null;
  
  if (response.status === 429) {
    logger?.warn('AI gateway rate limit exceeded');
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  
  if (response.status === 402) {
    logger?.warn('AI gateway payment required');
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
      {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  
  logger?.error('AI gateway error', { status: response.status });
  return new Response(
    JSON.stringify({ error: 'Failed to process AI request' }),
    {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Success response helper
export function createSuccessResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Streaming response helper
export function createStreamResponse(body: ReadableStream<Uint8Array> | null): Response {
  return new Response(body, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
  });
}
