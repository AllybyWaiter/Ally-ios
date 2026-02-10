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
import { validateUuid, collectErrors, validationErrorResponse } from '../_shared/validation.ts';
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from '../_shared/rateLimit.ts';
import { createErrorResponse, createStreamResponse } from '../_shared/errorHandler.ts';

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

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('ally-chat');

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
      return validationErrorResponse(errors);
    }
    
    // Check if any message contains an image
    const hasImages = messages.some((msg: { imageUrl?: string }) => msg.imageUrl);
    logger.debug('Request contains images', { hasImages });

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.error('No authorization header provided');
      return createErrorResponse('Authentication required', logger, { status: 401, request: req });
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
      return createErrorResponse('Authentication failed', logger, { status: 401, request: req });
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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY not configured');
      return createErrorResponse('AI service not configured', logger, { status: 500, request: req });
    }

    // Enforce aquatics-only conversation scope
    const scopeValidation = validateAquaticScope(messages);
    if (!scopeValidation.isInScope) {
      logger.info('Aquatic scope gate triggered', { reason: scopeValidation.reason });
      return createStreamResponse(
        createContentStream(
          scopeValidation.redirectMessage ??
            "I can only help with aquatics topics: aquariums, pools, spas, and ponds."
        ),
        req
      );
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

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
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
          { status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
      
      return createErrorResponse('Failed to process AI request', logger, { status: 502, request: req });
    }

    // All users now have at least save_memory, so always parse for tool calls

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

      const followUpResponse = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(followUpApiBody),
      });

      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        logger.error('Follow-up AI gateway error', { status: followUpResponse.status, error: errorText });
        return createErrorResponse('Failed to process follow-up request', logger, { status: 502, request: req });
      }

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
      return createStreamResponse(
        createToolExecutionStream(toolExecutions, followUpResponse.body, dataCards),
        req
      );
    }

    // No tool calls - return buffered content as SSE stream
    logger.info('Streaming response (no tools detected)', { 
      model: aiModel,
      contentLength: parseResult.contentBuffer.length 
    });
    
    return createStreamResponse(createContentStream(parseResult.contentBuffer), req);
  } catch (error) {
    logger.error('Unexpected error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return createErrorResponse(error, logger, { request: req });
  }
});
