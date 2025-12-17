/**
 * Ally Chat Edge Function
 * 
 * Main orchestration for the AI aquarium assistant.
 * Modules: tools/, context/, prompts/
 * 
 * Performance optimizations:
 * - Single streaming API call with tool detection (eliminates double-call pattern)
 * - Parallel context fetching (profile + aquarium in parallel)
 * - Limited water test queries (last 10 only)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { validateUuid, collectErrors, validationErrorResponse } from '../_shared/validation.ts';
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from '../_shared/rateLimit.ts';
import { createErrorResponse, createStreamResponse } from '../_shared/errorHandler.ts';

// Modular imports
import { tools } from './tools/index.ts';
import { executeToolCalls } from './tools/executor.ts';
import { buildAquariumContext } from './context/aquarium.ts';
import { buildMemoryContext } from './context/memory.ts';
import { buildSystemPrompt } from './prompts/system.ts';
import { parseStreamForToolCalls, createContentStream } from './utils/streamParser.ts';

// Model configuration
const AI_MODELS = {
  standard: "google/gemini-2.5-flash",  // Fast, balanced
  thinking: "openai/gpt-5"              // Powerful reasoning for Gold users
};

const GOLD_TIERS = ['gold', 'business', 'enterprise'];
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// GPT-5 models require max_completion_tokens instead of max_tokens
const USES_COMPLETION_TOKENS = ['openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5-nano'];

// Only Gemini models support custom temperature (GPT-5 only supports default 1.0)
const SUPPORTS_TEMPERATURE = ['google/gemini-2.5-flash', 'google/gemini-2.5-pro'];

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('ally-chat');

  try {
    // Parse and validate request
    const body = await req.json();
    const { messages, aquariumId, model: requestedModel } = body;
    
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
        if (!msg.content && typeof msg.content !== 'string' && !msg.imageUrl) {
          errors.push({ field: `messages[${index}].content`, message: 'Message content or image is required' });
        }
      });
    }
    
    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }
    
    // Check if any message contains an image
    const hasImages = messages.some((msg: { imageUrl?: string }) => msg.imageUrl);
    logger.debug('Request contains images', { hasImages });

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.error('No authorization header provided');
      return createErrorResponse('Authentication required', logger, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      logger.error('Authentication failed', { error: authError?.message });
      return createErrorResponse('Authentication failed', logger, { status: 401 });
    }
    
    logger.info('User authenticated', { userId: authUser.id });
    logger.setUserId(authUser.id);

    // Rate limiting
    const rateLimitResult = checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: extractIdentifier(req, authUser.id),
    }, logger);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { userId: authUser.id });
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Check API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      logger.error('LOVABLE_API_KEY not configured');
      return createErrorResponse('AI service not configured', logger, { status: 500 });
    }

    // Fetch profile and context in parallel for better performance
    const profilePromise = supabase
      .from('profiles')
      .select('skill_level, subscription_tier')
      .eq('user_id', authUser.id)
      .single();
    
    // Start aquarium context fetch immediately (doesn't depend on profile)
    const aquariumPromise = aquariumId 
      ? buildAquariumContext(supabase, aquariumId)
      : Promise.resolve({ context: '', waterType: 'freshwater', aquariumData: null });

    // Wait for profile first to determine memory access
    const { data: profile } = await profilePromise;
    
    const skillLevel = profile?.skill_level || 'beginner';
    const subscriptionTier = profile?.subscription_tier || 'free';
    const hasMemoryAccess = ['plus', 'gold', 'business', 'enterprise'].includes(subscriptionTier);
    
    // Validate model selection - server-side check for Gold access
    const canUseThinking = GOLD_TIERS.includes(subscriptionTier);
    const selectedModel = (requestedModel === 'thinking' && canUseThinking) 
      ? 'thinking' 
      : 'standard';
    const aiModel = AI_MODELS[selectedModel];
    const usesCompletionTokens = USES_COMPLETION_TOKENS.includes(aiModel);
    
    logger.info('Model selection', { 
      requested: requestedModel, 
      selected: selectedModel, 
      aiModel,
      canUseThinking,
      subscriptionTier 
    });

    // Wait for aquarium context (was started in parallel with profile fetch)
    const aquariumResult = await aquariumPromise;

    // Now fetch memory context (depends on aquarium waterType)
    const memoryResult = hasMemoryAccess
      ? await buildMemoryContext(supabase, authUser.id, aquariumResult.waterType)
      : { context: '', memories: [] };

    // Build system prompt using module (water-type-specific for reduced token usage)
    const systemPrompt = buildSystemPrompt({
      hasMemoryAccess,
      aquariumId,
      memoryContext: memoryResult.context,
      aquariumContext: aquariumResult.context,
      skillLevel,
      waterType: aquariumResult.waterType as 'freshwater' | 'saltwater' | 'brackish' | 'pool' | 'spa' | null,
      aquariumType: aquariumResult.aquariumData?.type,
    });

    logger.info('Processing chat request', { 
      aquariumId: aquariumId || 'none',
      skillLevel,
      subscriptionTier,
      hasMemoryAccess,
      memoryCount: memoryResult.memories?.length || 0,
      messageCount: messages.length,
      hasImages,
      selectedModel,
      usesCompletionTokens
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

    // Build streaming API request with tools enabled
    // Single streaming call eliminates the previous double-call pattern (500-1500ms savings)
    const streamingApiBody: Record<string, unknown> = {
      model: aiModel,
      messages: [{ role: "system", content: systemPrompt }, ...formattedMessages],
      stream: true,
    };
    
    // Only include temperature for models that support it (GPT-5 doesn't)
    if (SUPPORTS_TEMPERATURE.includes(aiModel)) {
      streamingApiBody.temperature = 0.7;
    }
    
    // Use max_completion_tokens for GPT-5 models
    if (usesCompletionTokens) {
      streamingApiBody.max_completion_tokens = 4096;
    }
    
    // Include tools for users with memory access
    if (hasMemoryAccess) {
      streamingApiBody.tools = tools;
    }

    logger.debug('Calling AI gateway (single streaming call)', { 
      hasTools: hasMemoryAccess, 
      hasImages,
      model: aiModel 
    });

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(streamingApiBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('AI gateway error', { status: response.status, error: errorText });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return createErrorResponse('Failed to process AI request', logger, { status: 502 });
    }

    // If no tools enabled, stream directly without parsing
    if (!hasMemoryAccess) {
      logger.info('Streaming response (no tools)', { model: aiModel });
      return createStreamResponse(response.body);
    }

    // Parse stream to detect tool calls (buffering strategy for reliability)
    logger.debug('Parsing stream for tool calls');
    const parseResult = await parseStreamForToolCalls(response);
    
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
        logger
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
        ...formattedMessages,
        assistantMessageWithTools,
        ...toolResults
      ];

      logger.debug('Calling AI gateway (follow-up with tool results)');

      const followUpApiBody: Record<string, unknown> = {
        model: aiModel,
        messages: followUpMessages,
        stream: true,
      };
      
      if (SUPPORTS_TEMPERATURE.includes(aiModel)) {
        followUpApiBody.temperature = 0.7;
      }
      
      if (usesCompletionTokens) {
        followUpApiBody.max_completion_tokens = 4096;
      }

      const followUpResponse = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(followUpApiBody),
      });

      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        logger.error('Follow-up AI gateway error', { status: followUpResponse.status, error: errorText });
        return createErrorResponse('Failed to process follow-up request', logger, { status: 502 });
      }

      logger.info('Streaming follow-up response');
      return createStreamResponse(followUpResponse.body);
    }

    // No tool calls - return buffered content as SSE stream
    logger.info('Streaming response (no tools detected)', { 
      model: aiModel,
      contentLength: parseResult.contentBuffer.length 
    });
    
    return createStreamResponse(createContentStream(parseResult.contentBuffer));
  } catch (error) {
    logger.error('Unexpected error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return createErrorResponse(error, logger);
  }
});
