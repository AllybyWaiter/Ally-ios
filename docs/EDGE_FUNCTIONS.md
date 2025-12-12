# Edge Functions Development Guide

This guide covers how to create and maintain Supabase Edge Functions for AquaDex.

## Table of Contents

1. [Overview](#overview)
2. [Shared Utilities](#shared-utilities)
3. [Creating a New Edge Function](#creating-a-new-edge-function)
4. [Input Validation](#input-validation)
5. [Rate Limiting](#rate-limiting)
6. [Logging](#logging)
7. [Error Handling](#error-handling)
8. [AI Integration](#ai-integration)
9. [Modular Function Structure](#modular-function-structure)

---

## Overview

Edge functions are serverless functions that run on Supabase's edge network. They're used for:

- AI/ML operations (chat, image analysis)
- External API integrations
- Sensitive operations requiring secrets
- Complex business logic

**Location**: `supabase/functions/`

**Deployment**: Automatic when code is pushed

---

## Shared Utilities

All edge functions should use the shared utilities in `supabase/functions/_shared/`.

### Importing Shared Utilities

```typescript
import { 
  corsHeaders, 
  handleCors,
  createLogger,
  validateString,
  validateNumber,
  validateObject,
  checkRateLimit,
  handleError,
  createErrorResponse,
  createSuccessResponse 
} from '../_shared/mod.ts';
```

### Available Modules

| Module | Purpose |
|--------|---------|
| `cors.ts` | CORS headers and preflight handling |
| `validation.ts` | Zod-based input validation |
| `rateLimit.ts` | Server-side rate limiting |
| `logger.ts` | Structured JSON logging |
| `errorHandler.ts` | Error handling and responses |
| `mod.ts` | Re-exports all utilities |

---

## Creating a New Edge Function

### 1. Create the Directory

```bash
supabase/functions/my-new-function/
└── index.ts
```

### 2. Basic Template

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  corsHeaders, 
  handleCors,
  createLogger,
  validateString,
  checkRateLimit,
  handleError,
  createSuccessResponse 
} from '../_shared/mod.ts';

const FUNCTION_NAME = 'my-new-function';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger(FUNCTION_NAME);
  logger.info('Function invoked');

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(clientIP, FUNCTION_NAME, {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    });
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const message = validateString(body.message, 'message', { minLength: 1, maxLength: 5000 });

    // Get auth header for Supabase client
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Your business logic here
    const result = await processMessage(message);

    logger.info('Function completed successfully');
    return createSuccessResponse({ result });

  } catch (error) {
    return handleError(error, logger);
  }
});
```

### 3. Register in config.toml

```toml
# supabase/config.toml

[functions.my-new-function]
verify_jwt = true  # Set to false for public endpoints
```

---

## Input Validation

Use Zod schemas via the validation utilities.

### String Validation

```typescript
import { validateString } from '../_shared/mod.ts';

// Basic string
const name = validateString(body.name, 'name');

// With constraints
const message = validateString(body.message, 'message', {
  minLength: 1,
  maxLength: 5000,
});

// Optional string
const notes = validateString(body.notes, 'notes', {
  optional: true,
});
```

### Number Validation

```typescript
import { validateNumber } from '../_shared/mod.ts';

const quantity = validateNumber(body.quantity, 'quantity', {
  min: 1,
  max: 100,
  integer: true,
});
```

### Object Validation with Zod

```typescript
import { validateObject } from '../_shared/mod.ts';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RequestSchema = z.object({
  message: z.string().min(1).max(5000),
  aquariumId: z.string().uuid(),
  options: z.object({
    stream: z.boolean().optional(),
    temperature: z.number().min(0).max(2).optional(),
  }).optional(),
});

const validatedData = validateObject(body, RequestSchema, 'request');
```

---

## Rate Limiting

Server-side rate limiting prevents abuse.

### Basic Rate Limiting

```typescript
import { checkRateLimit } from '../_shared/mod.ts';

const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
const result = checkRateLimit(clientIP, 'function-name', {
  maxRequests: 10,    // Max requests per window
  windowMs: 60000,    // Window in milliseconds (1 minute)
});

if (!result.allowed) {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded',
      retryAfter: result.retryAfter,
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter),
      } 
    }
  );
}
```

### Recommended Limits by Function Type

| Function Type | Max Requests | Window |
|--------------|--------------|--------|
| AI Chat | 30/min | 60s |
| Image Analysis | 10/min | 60s |
| Task Suggestions | 20/min | 60s |
| Support Chat | 20/min | 60s |
| Admin Functions | 50/min | 60s |

---

## Logging

Use structured JSON logging for observability.

### Creating a Logger

```typescript
import { createLogger } from '../_shared/mod.ts';

const logger = createLogger('my-function');
```

### Log Levels

```typescript
// Info - normal operations
logger.info('Processing request', { userId, aquariumId });

// Warning - potential issues
logger.warn('Slow API response', { duration: 5000 });

// Error - failures
logger.error('Database query failed', { error: error.message });
```

### Log Output Format

```json
{
  "timestamp": "2025-12-12T10:30:00.000Z",
  "level": "info",
  "message": "Processing request",
  "context": {
    "requestId": "abc123",
    "functionName": "my-function"
  },
  "data": {
    "userId": "user-123",
    "aquariumId": "aquarium-456"
  }
}
```

---

## Error Handling

Use centralized error handling for consistent responses.

### Using handleError

```typescript
import { handleError, createLogger } from '../_shared/mod.ts';

const logger = createLogger('my-function');

try {
  // Your code
} catch (error) {
  return handleError(error, logger);
}
```

### Custom Error Responses

```typescript
import { createErrorResponse, createSuccessResponse } from '../_shared/mod.ts';

// Error response
return createErrorResponse('Invalid aquarium ID', 400);

// Success response
return createSuccessResponse({ 
  data: result,
  message: 'Operation completed',
});
```

---

## AI Integration

### Using Lovable AI Gateway (Preferred)

No API key required - use Lovable AI supported models.

```typescript
const AI_GATEWAY_URL = Deno.env.get('AI_GATEWAY_URL') || 
  'https://ai-gateway.lovable.dev/v1';

const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-pro',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
  }),
});
```

### Available Models

| Model | Use Case |
|-------|----------|
| `google/gemini-2.5-pro` | Complex reasoning, vision+text |
| `google/gemini-2.5-flash` | Balanced cost/performance |
| `google/gemini-2.5-flash-lite` | Fast, simple tasks |
| `openai/gpt-5` | Powerful reasoning |
| `openai/gpt-5-mini` | Good performance, lower cost |
| `openai/gpt-5-nano` | Speed, simple tasks |

### Direct OpenAI API (Requires Secret)

```typescript
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openAIApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [...],
    temperature: 0.7,
  }),
});
```

---

## Modular Function Structure

For complex functions like `ally-chat`, use a modular structure.

### Directory Structure

```
supabase/functions/ally-chat/
├── index.ts          # Main orchestration
├── tools/
│   ├── index.ts      # Tool definitions
│   └── executor.ts   # Tool execution logic
├── context/
│   ├── index.ts      # Context building exports
│   ├── aquarium.ts   # Aquarium context
│   └── memory.ts     # Memory context
└── prompts/
    ├── index.ts      # Prompt exports
    └── system.ts     # System prompt
```

### Main Index (Orchestration)

```typescript
// index.ts
import { buildAquariumContext } from './context/aquarium.ts';
import { buildMemoryContext } from './context/memory.ts';
import { getSystemPrompt } from './prompts/system.ts';
import { availableTools, executeTool } from './tools/index.ts';

serve(async (req) => {
  // ... setup code ...

  // Build context from modules
  const aquariumContext = await buildAquariumContext(supabase, userId, aquariumId);
  const memoryContext = await buildMemoryContext(supabase, userId);
  
  // Get system prompt
  const systemPrompt = getSystemPrompt(aquariumContext, memoryContext);

  // Call AI with tools
  const response = await callAI({
    messages: [...],
    tools: availableTools,
    systemPrompt,
  });

  // Handle tool calls
  if (response.tool_calls) {
    for (const call of response.tool_calls) {
      await executeTool(call, supabase, userId);
    }
  }

  // ... response handling ...
});
```

### Tool Definitions

```typescript
// tools/index.ts
export const availableTools = [
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Save a fact about the user for future reference',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Memory category' },
          value: { type: 'string', description: 'Information to remember' },
        },
        required: ['key', 'value'],
      },
    },
  },
  // ... more tools
];
```

---

## Testing Edge Functions

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve my-function --env-file .env.local
```

### Calling from Frontend

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('my-function', {
  body: { message: 'Hello' },
});
```

### Checking Logs

View logs in Lovable Cloud dashboard or use:

```typescript
// Add detailed logging during development
logger.info('Step 1 complete', { intermediateResult });
logger.info('Step 2 complete', { finalResult });
```
