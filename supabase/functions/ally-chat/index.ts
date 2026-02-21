/**
 * Ally Chat Edge Function
 * 
 * Main orchestration for the AI aquatics assistant.
 * Modules: tools/, context/, prompts/
 * 
 * Performance optimizations:
 * - Single streaming API call with tool detection (eliminates double-call pattern)
 * - Parallel context fetching (profile + aquarium in parallel)
 * - Limited water test queries (last 10 only)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { validateUuid, collectErrors } from '../_shared/validation.ts';
import { checkRateLimit, extractIdentifier } from '../_shared/rateLimit.ts';

// Modular imports
import { tools } from './tools/index.ts';
import { executeToolCalls } from './tools/executor.ts';
import { buildAquariumContext } from './context/aquarium.ts';
import { buildMemoryContext } from './context/memory.ts';
import { buildSystemPrompt } from './prompts/system.ts';
import { parseStreamForToolCalls, createContentStream, createToolExecutionStream, DataCardPayload } from './utils/streamParser.ts';
import { validateAquaticScope, validateRequiredInputs } from './utils/inputGate.ts';
import { trimConversationHistory } from './utils/conversationTrimmer.ts';

// Model configuration - Using OpenAI directly
const AI_MODELS = {
  standard: "gpt-4o-mini",    // Fast, cost-effective
  thinking: "gpt-4o"          // Powerful reasoning for Gold users
};

const GOLD_TIERS = ['gold', 'business', 'enterprise'];
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_TIMEOUT_MS = Math.max(5000, Number(Deno.env.get('OPENAI_TIMEOUT_MS') || 30000));
const OPENAI_MAX_ATTEMPTS = Math.max(1, Number(Deno.env.get('OPENAI_RETRY_ATTEMPTS') || 3));
const OPENAI_STREAM_BUFFER_CAP_BYTES = Math.max(250000, Number(Deno.env.get('OPENAI_STREAM_BUFFER_CAP_BYTES') || 2_000_000));
const OPENAI_RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

interface ChatMetaEvent {
  type: 'meta';
  requestId: string;
  model: string;
  degraded: {
    rateLimitBackend: boolean;
    upstreamRetried: boolean;
  };
  retryAttempts: {
    initial: number;
    followUp: number;
  };
}

class UpstreamRequestError extends Error {
  status?: number;
  code: string;
  attempts: number;

  constructor(message: string, options: { status?: number; code: string; attempts: number }) {
    super(message);
    this.name = 'UpstreamRequestError';
    this.status = options.status;
    this.code = options.code;
    this.attempts = options.attempts;
  }
}

function delayWithJitter(attempt: number): Promise<void> {
  const backoffMs = Math.min(300 * (2 ** Math.max(0, attempt - 1)) + Math.floor(Math.random() * 160), 2200);
  return new Promise((resolve) => setTimeout(resolve, backoffMs));
}

function createChatErrorResponse(
  req: Request,
  status: number,
  code: string,
  message: string,
  requestId: string,
  extra?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code,
      correlationId: requestId,
      ...(extra || {}),
    }),
    {
      status,
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    }
  );
}

function createChatStreamResponse(stream: ReadableStream<Uint8Array>, req: Request, requestId: string): Response {
  return new Response(stream, {
    headers: {
      ...getCorsHeaders(req),
      'Content-Type': 'text/event-stream',
      'X-Request-ID': requestId,
    },
  });
}

function prependMetaEvent(
  stream: ReadableStream<Uint8Array>,
  meta: ChatMetaEvent
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`));

      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } finally {
        reader.releaseLock();
      }

      controller.close();
    },
  });
}

async function fetchOpenAIWithRetry(
  apiKey: string,
  body: Record<string, unknown>,
  requestId: string,
  logger: ReturnType<typeof createLogger>
): Promise<{ response: Response; attempts: number }> {
  let lastError: UpstreamRequestError | null = null;

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.ok) {
        return { response, attempts: attempt };
      }

      const errorText = await response.text().catch(() => '');
      const code = response.status === 429
        ? 'UPSTREAM_RATE_LIMIT'
        : response.status === 408
          ? 'UPSTREAM_TIMEOUT'
          : response.status >= 500
            ? 'UPSTREAM_UNAVAILABLE'
            : 'UPSTREAM_FAILURE';

      lastError = new UpstreamRequestError(
        `OpenAI request failed with status ${response.status}`,
        { status: response.status, code, attempts: attempt }
      );

      const retryable = OPENAI_RETRYABLE_STATUSES.has(response.status);
      logger.warn('OpenAI upstream failure', {
        requestId,
        status: response.status,
        attempt,
        retryable,
        error: errorText.slice(0, 180),
      });

      if (!retryable || attempt >= OPENAI_MAX_ATTEMPTS) {
        throw lastError;
      }

      await delayWithJitter(attempt);
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      if (error instanceof UpstreamRequestError) {
        throw error;
      }

      lastError = new UpstreamRequestError(
        isTimeout ? 'OpenAI request timed out' : 'OpenAI network failure',
        {
          code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK_FAILURE',
          attempts: attempt,
        }
      );

      logger.warn('OpenAI request transport failure', {
        requestId,
        attempt,
        isTimeout,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt >= OPENAI_MAX_ATTEMPTS) {
        throw lastError;
      }

      await delayWithJitter(attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new UpstreamRequestError('OpenAI request failed', {
    code: 'UPSTREAM_FAILURE',
    attempts: OPENAI_MAX_ATTEMPTS,
  });
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const logger = createLogger('ally-chat', requestId);

  try {
    // Parse and validate request
    const body = await req.json();
    const { messages, aquariumId, model: requestedModel, conversationHint, userAquariums } = body;
    
    const errors = collectErrors(
      validateUuid(aquariumId, 'aquariumId', { required: false })
    );
    
    if (!Array.isArray(messages) || messages.length === 0) {
      errors.push({ field: 'messages', message: 'messages must be a non-empty array' });
    } else {
      messages.forEach((msg, index) => {
        if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
          errors.push({ field: `messages[${index}].role`, message: 'Invalid message role' });
        }
        // Content can be empty if there's an image
        if (!msg.content && !msg.imageUrl) {
          errors.push({ field: `messages[${index}].content`, message: 'Message content or image is required' });
        }
      });
    }
    
    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return createChatErrorResponse(
        req,
        400,
        'VALIDATION_ERROR',
        'Invalid request payload',
        requestId,
        { details: errors }
      );
    }
    
    // Check if any message contains an image
    const hasImages = messages.some((msg: { imageUrl?: string }) => msg.imageUrl);
    logger.debug('Request contains images', { hasImages });

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.error('No authorization header provided');
      return createChatErrorResponse(req, 401, 'AUTH_REQUIRED', 'Authentication required', requestId);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    logger.info('Attempting auth', {
      hasToken: !!token,
      supabaseUrl: Deno.env.get('SUPABASE_URL')?.slice(0, 30),
      hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY')
    });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      logger.error('Authentication failed', {
        error: authError?.message,
        errorCode: authError?.code,
        errorStatus: authError?.status,
        hasUser: !!authUser
      });
      return createChatErrorResponse(req, 401, 'AUTH_FAILED', 'Authentication failed', requestId);
    }
    
    logger.info('User authenticated', { userId: authUser.id });
    logger.setUserId(authUser.id);

    // Rate limiting
    const rateLimitResult = await checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: extractIdentifier(req, authUser.id),
    }, logger);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { userId: authUser.id });
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          correlationId: requestId,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
          meta: {
            backend: rateLimitResult.backend ?? 'memory',
            degraded: Boolean(rateLimitResult.degraded),
          },
        }),
        {
          status: 429,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfterSeconds || 60),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
            'X-RateLimit-Backend': String(rateLimitResult.backend ?? 'memory'),
            'X-RateLimit-Degraded': rateLimitResult.degraded ? '1' : '0',
            'X-Request-ID': requestId,
          },
        }
      );
    }

    // Check API key
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY not configured');
      return createChatErrorResponse(req, 500, 'AI_SERVICE_NOT_CONFIGURED', 'AI service not configured', requestId);
    }

    // Enforce aquatics-only conversation scope
    const scopeValidation = validateAquaticScope(messages);
    if (!scopeValidation.isInScope) {
      logger.info('Aquatic scope gate triggered', { reason: scopeValidation.reason });
      const scopeStream = prependMetaEvent(
        createContentStream(
          scopeValidation.redirectMessage ??
            "I can only help with aquatics topics: aquariums, pools, spas, and ponds."
        ),
        {
          type: 'meta',
          requestId,
          model: 'scope-gate',
          degraded: {
            rateLimitBackend: Boolean(rateLimitResult.degraded),
            upstreamRetried: false,
          },
          retryAttempts: {
            initial: 0,
            followUp: 0,
          },
        }
      );
      return createChatStreamResponse(scopeStream, req, requestId);
    }

    // Fetch profile and context in parallel for better performance
    const profilePromise = supabase
      .from('profiles')
      .select('skill_level, subscription_tier, name')
      .eq('user_id', authUser.id)
      .single();
    
    // Start aquarium context fetch immediately (doesn't depend on profile)
    const aquariumPromise = aquariumId 
      ? buildAquariumContext(supabase, aquariumId)
      : Promise.resolve({ context: '', waterType: 'freshwater', aquariumData: null });

    // Wait for profile first to determine memory access
    const { data: profile, error: profileError } = await profilePromise;

    if (profileError) {
      logger.error('Failed to fetch user profile', { error: profileError.message });
    }

    const skillLevel = profile?.skill_level || 'beginner';
    const subscriptionTier = profile?.subscription_tier || 'free';
    const userName = profile?.name || null;
    const hasToolAccess = ['plus', 'gold', 'business', 'enterprise'].includes(subscriptionTier);
    
    // Validate model selection - server-side check for Gold access
    const canUseThinking = GOLD_TIERS.includes(subscriptionTier);
    const selectedModel = (requestedModel === 'thinking' && canUseThinking) 
      ? 'thinking' 
      : 'standard';
    const aiModel = AI_MODELS[selectedModel];

    logger.info('Model selection', {
      requested: requestedModel,
      selected: selectedModel,
      aiModel,
      canUseThinking,
      subscriptionTier
    });

    // Wait for aquarium context (was started in parallel with profile fetch)
    const aquariumResult = await aquariumPromise;

    // Extract conversation context from the last few user messages for semantic memory search
    const userMessages = messages
      .filter((m: { role: string }) => m.role === 'user')
      .slice(-3)
      .map((m: { content: string }) => m.content)
      .join(' ');

    // Now fetch memory context (depends on aquarium waterType) — available to all users
    const memoryResult = await buildMemoryContext(supabase, authUser.id, aquariumResult.waterType, aquariumId, userMessages);

    // Validate required inputs for dosing/treatment conversations
    const inputValidation = validateRequiredInputs(
      messages,
      {
        waterType: aquariumResult.waterType,
        aquariumData: aquariumResult.aquariumData
      }
    );

    if (inputValidation.requiresGate) {
      logger.info('Input gate triggered', {
        conversationType: inputValidation.conversationType,
        missingInputs: inputValidation.missingInputs
      });
    }

    // Build system prompt using module (water-type-specific for reduced token usage)
    // Validate userAquariums if provided — lightweight array of {id, name, type}
    const validatedUserAquariums = Array.isArray(userAquariums)
      ? userAquariums
          .filter((a: Record<string, unknown>) => typeof a.id === 'string' && typeof a.name === 'string')
          .map((a: Record<string, unknown>) => ({ id: a.id as string, name: a.name as string, type: (a.type as string) || '' }))
      : undefined;

    const systemPrompt = buildSystemPrompt({
      hasMemoryAccess: true,
      hasToolAccess,
      aquariumId,
      memoryContext: memoryResult.context,
      aquariumContext: aquariumResult.context,
      skillLevel,
      waterType: aquariumResult.waterType as 'freshwater' | 'saltwater' | 'brackish' | 'pool' | 'spa' | null,
      aquariumType: aquariumResult.aquariumData?.type,
      inputGateInstructions: inputValidation.gateInstructions,
      userName,
      conversationHint: typeof conversationHint === 'string' ? conversationHint : undefined,
      userAquariums: validatedUserAquariums,
    });

    logger.info('Processing chat request', {
      aquariumId: aquariumId || 'none',
      skillLevel,
      subscriptionTier,
      hasToolAccess,
      memoryCount: memoryResult.memories?.length || 0,
      messageCount: messages.length,
      hasImages,
      selectedModel
    });

    // Format messages for the API - handle multi-modal content
    const formatMessageForApi = (msg: { role: string; content: string; imageUrl?: string }) => {
      if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
        // Multi-modal message with image
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content || "Please analyze this image" },
            { type: "image_url", image_url: { url: msg.imageUrl } }
          ]
        };
      }
      return { role: msg.role, content: msg.content };
    };

    const formattedMessages = messages.map(formatMessageForApi);

    // Trim conversation history for long conversations (saves 40-60% tokens)
    const { trimmedMessages, wasTrimmed } = await trimConversationHistory(
      formattedMessages,
      OPENAI_API_KEY,
      logger
    );

    if (wasTrimmed) {
      logger.info('Conversation trimmed', {
        originalCount: formattedMessages.length,
        trimmedCount: trimmedMessages.length,
      });
    }

    // Build streaming API request with tools enabled
    // Single streaming call eliminates the previous double-call pattern (500-1500ms savings)
    const streamingApiBody: Record<string, unknown> = {
      model: aiModel,
      messages: [{ role: "system", content: systemPrompt }, ...trimmedMessages],
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    };

    // All users get save_memory; paid users get all tools
    if (hasToolAccess) {
      streamingApiBody.tools = tools;
    } else {
      // Free/basic users only get the memory tool
      streamingApiBody.tools = tools.filter(
        (t: { function: { name: string } }) => t.function.name === 'save_memory'
      );
    }

    logger.debug('Calling AI gateway (single streaming call)', {
      hasTools: true,
      hasAllTools: hasToolAccess,
      hasImages,
      model: aiModel
    });

    const initialCall = await fetchOpenAIWithRetry(
      OPENAI_API_KEY,
      streamingApiBody,
      requestId,
      logger
    );
    const response = initialCall.response;

    // All users now have at least save_memory, so always parse for tool calls

    // Parse stream to detect tool calls (buffering strategy for reliability)
    logger.debug('Parsing stream for tool calls');
    const parseResult = await parseStreamForToolCalls(response, {
      maxStreamBytes: OPENAI_STREAM_BUFFER_CAP_BYTES,
    });
    
    logger.debug('Stream parse result', { 
      hasToolCalls: parseResult.hasToolCalls,
      toolCallCount: parseResult.toolCalls.length,
      contentLength: parseResult.contentBuffer.length,
      finishReason: parseResult.finishReason
    });

    // Handle tool calls if present
    if (parseResult.hasToolCalls) {
      logger.info('Processing tool calls', { count: parseResult.toolCalls.length });
      
      // Convert to format expected by executor
      const toolCallsForExecutor = parseResult.toolCalls.map(tc => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }));
      
      const toolResults = await executeToolCalls(
        toolCallsForExecutor,
        supabase,
        authUser.id,
        logger,
        {
          messages,
          inputGate: {
            requiresGate: inputValidation.requiresGate,
            missingInputs: inputValidation.missingInputs,
            conversationType: inputValidation.conversationType,
          },
        }
      );

      // Build assistant message with tool calls for follow-up
      const assistantMessageWithTools = {
        role: "assistant",
        content: parseResult.contentBuffer || null,
        tool_calls: parseResult.toolCalls.map(tc => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
      };

      // Follow-up streaming call with tool results
      const followUpMessages = [
        { role: "system", content: systemPrompt },
        ...trimmedMessages,
        assistantMessageWithTools,
        ...toolResults
      ];

      logger.debug('Calling AI gateway (follow-up with tool results)');

      const followUpApiBody: Record<string, unknown> = {
        model: aiModel,
        messages: followUpMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      };

      const followUpCall = await fetchOpenAIWithRetry(
        OPENAI_API_KEY,
        followUpApiBody,
        requestId,
        logger
      );
      const followUpAttempts = followUpCall.attempts;
      const followUpResponse = followUpCall.response;

      // Extract tool execution feedback and data cards from results
      const toolExecutions: Array<{ toolName: string; success: boolean; message: string }> = [];
      const dataCards: DataCardPayload[] = [];

      toolResults.forEach((result, index) => {
        const toolCall = toolCallsForExecutor[index];
        try {
          const parsed = JSON.parse(result.content);

          // Check if this is a data card from show_water_data
          if (toolCall.function.name === 'show_water_data' && parsed.data_card) {
            dataCards.push(parsed.data_card as DataCardPayload);
            // Don't show tool execution feedback for data cards
            return;
          }

          toolExecutions.push({
            toolName: toolCall.function.name,
            success: parsed.success ?? true,
            message: parsed.message || `${toolCall.function.name} completed`,
          });
        } catch {
          toolExecutions.push({
            toolName: toolCall.function.name,
            success: true,
            message: `${toolCall.function.name} completed`,
          });
        }
      });

      logger.info('Streaming follow-up response with tool feedback', {
        toolCount: toolExecutions.length,
        dataCardCount: dataCards.length
      });

      // Stream tool execution feedback and data cards first, then the AI response
      const stream = prependMetaEvent(
        createToolExecutionStream(toolExecutions, followUpResponse.body, dataCards),
        {
          type: 'meta',
          requestId,
          model: aiModel,
          degraded: {
            rateLimitBackend: Boolean(rateLimitResult.degraded),
            upstreamRetried: initialCall.attempts > 1 || followUpAttempts > 1,
          },
          retryAttempts: {
            initial: initialCall.attempts,
            followUp: followUpAttempts,
          },
        }
      );
      return createChatStreamResponse(stream, req, requestId);
    }

    // No tool calls - return buffered content as SSE stream
    logger.info('Streaming response (no tools detected)', { 
      model: aiModel,
      contentLength: parseResult.contentBuffer.length 
    });
    
    const noToolStream = prependMetaEvent(
      createContentStream(parseResult.contentBuffer),
      {
        type: 'meta',
        requestId,
        model: aiModel,
        degraded: {
          rateLimitBackend: Boolean(rateLimitResult.degraded),
          upstreamRetried: initialCall.attempts > 1,
        },
        retryAttempts: {
          initial: initialCall.attempts,
          followUp: 0,
        },
      }
    );
    return createChatStreamResponse(noToolStream, req, requestId);
  } catch (error) {
    if (error instanceof UpstreamRequestError) {
      const status = error.status === 429
        ? 429
        : error.status && error.status >= 400 && error.status < 500
          ? 502
          : 503;

      logger.error('Upstream OpenAI failure', {
        code: error.code,
        status: error.status,
        attempts: error.attempts,
      });

      return createChatErrorResponse(
        req,
        status,
        error.code,
        'AI service temporarily unavailable. Please try again.',
        requestId,
        {
          meta: {
            attempts: error.attempts,
            upstreamStatus: error.status ?? null,
          },
        }
      );
    }

    if (error instanceof Error && error.message === 'OPENAI_STREAM_BUFFER_EXCEEDED') {
      return createChatErrorResponse(
        req,
        502,
        'STREAM_BUFFER_EXCEEDED',
        'Response stream exceeded safety limits. Please retry with a shorter prompt.',
        requestId
      );
    }

    logger.error('Unexpected error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return createChatErrorResponse(
      req,
      500,
      'INTERNAL_ERROR',
      'Failed to process request',
      requestId
    );
  }
});
