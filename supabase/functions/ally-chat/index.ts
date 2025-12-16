/**
 * Ally Chat Edge Function
 * 
 * Main orchestration for the AI aquarium assistant.
 * Modules: tools/, context/, prompts/
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

const AI_MODEL = "google/gemini-2.5-pro";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('ally-chat');

  try {
    // Parse and validate request
    const body = await req.json();
    const { messages, aquariumId } = body;
    
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

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('skill_level, subscription_tier')
      .eq('user_id', authUser.id)
      .single();
    
    const skillLevel = profile?.skill_level || 'beginner';
    const subscriptionTier = profile?.subscription_tier || 'free';
    const hasMemoryAccess = ['plus', 'gold', 'business', 'enterprise'].includes(subscriptionTier);

    // Build context using modules
    const aquariumResult = aquariumId 
      ? await buildAquariumContext(supabase, aquariumId)
      : { context: '', waterType: 'freshwater', aquariumData: null };

    const memoryResult = hasMemoryAccess
      ? await buildMemoryContext(supabase, authUser.id, aquariumResult.waterType)
      : { context: '', memories: [] };

    // Build system prompt using module
    const systemPrompt = buildSystemPrompt({
      hasMemoryAccess,
      aquariumId,
      memoryContext: memoryResult.context,
      aquariumContext: aquariumResult.context,
      skillLevel,
    });

    logger.info('Processing chat request', { 
      aquariumId: aquariumId || 'none',
      skillLevel,
      subscriptionTier,
      hasMemoryAccess,
      memoryCount: memoryResult.memories?.length || 0,
      messageCount: messages.length,
      hasImages
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

    // Initial API call (non-streaming to check for tool calls)
    const apiBody: Record<string, unknown> = {
      model: AI_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...formattedMessages],
      stream: false,
      temperature: 0.7,
    };
    
    if (hasMemoryAccess) {
      apiBody.tools = tools;
    }

    logger.debug('Calling AI gateway (initial)', { hasTools: hasMemoryAccess, hasImages });

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiBody),
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

    const initialResult = await response.json();
    const assistantMessage = initialResult.choices?.[0]?.message;

    // Handle tool calls using executor module
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      logger.info('Processing tool calls', { count: assistantMessage.tool_calls.length });
      
      const toolResults = await executeToolCalls(
        assistantMessage.tool_calls,
        supabase,
        authUser.id,
        logger
      );

      // Follow-up call with tool results
      const followUpMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
        assistantMessage,
        ...toolResults
      ];

      logger.debug('Calling AI gateway (follow-up with tool results)');

      const followUpResponse = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: followUpMessages,
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        logger.error('Follow-up AI gateway error', { status: followUpResponse.status, error: errorText });
        return createErrorResponse('Failed to process follow-up request', logger, { status: 502 });
      }

      logger.info('Streaming follow-up response');
      return createStreamResponse(followUpResponse.body);
    }

    // No tool calls - stream the response directly
    logger.debug('Calling AI gateway (streaming, no tools)');
    
    const streamResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...formattedMessages],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      logger.error('Stream AI gateway error', { status: streamResponse.status, error: errorText });
      return createErrorResponse('Failed to process stream request', logger, { status: 502 });
    }

    logger.info('Streaming response');
    return createStreamResponse(streamResponse.body);
  } catch (error) {
    logger.error('Unexpected error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return createErrorResponse(error, logger);
  }
});
