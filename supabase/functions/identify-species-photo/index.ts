/**
 * Identify Species Photo Edge Function
 *
 * Uses OpenAI GPT-4o Vision to identify fish, coral, invertebrates, or aquatic plants
 * from user-submitted photos. Returns structured species data.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { validateString, collectErrors, validationErrorResponse } from '../_shared/validation.ts';
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from '../_shared/rateLimit.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Tool definition for structured species identification output
const identifySpeciesTool = {
  type: "function",
  function: {
    name: "identify_species",
    description: "Return structured identification results for an aquatic species photo",
    parameters: {
      type: "object",
      properties: {
        identified: {
          type: "boolean",
          description: "Whether an aquatic species was identified in the image"
        },
        top_matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              common_name: { type: "string", description: "Common name (e.g., 'Neon Tetra')" },
              scientific_name: { type: "string", description: "Scientific name (e.g., 'Paracheirodon innesi')" },
              category: {
                type: "string",
                enum: ["fish", "invertebrate", "coral", "plant"],
                description: "Category of the organism"
              },
              confidence: { type: "number", description: "Confidence score between 0 and 1" },
              water_type: {
                type: "string",
                enum: ["freshwater", "saltwater", "brackish"],
                description: "Native/preferred water type"
              },
              care_level: {
                type: "string",
                enum: ["beginner", "intermediate", "advanced", "expert"],
                description: "Care difficulty"
              },
              temperament: {
                type: "string",
                enum: ["peaceful", "semi-aggressive", "aggressive"],
                description: "General temperament"
              },
              adult_size_inches: { type: "number", description: "Typical adult size in inches" },
              min_tank_gallons: { type: "number", description: "Minimum recommended tank size in gallons" },
              diet: { type: "string", description: "Primary diet type (e.g., 'omnivore', 'herbivore', 'carnivore')" },
              notes: { type: "string", description: "Brief care notes or interesting facts" }
            },
            required: ["common_name", "scientific_name", "category", "confidence", "water_type", "care_level"],
            additionalProperties: false
          }
        },
        unable_reason: {
          type: "string",
          description: "Reason identification failed (if identified=false)"
        }
      },
      required: ["identified", "top_matches"],
      additionalProperties: false
    }
  }
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('identify-species-photo');

  try {
    logger.info('Function invoked');

    const body = await req.json();
    const { imageUrl } = body;

    // Input validation
    const errors = collectErrors(
      validateString(imageUrl, 'imageUrl', { required: true, minLength: 10 })
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Check base64 image size (limit to ~4MB encoded = ~3MB actual)
    if (imageUrl?.startsWith('data:')) {
      const base64Part = imageUrl.split(',')[1] || '';
      const estimatedSize = (base64Part.length * 3) / 4;
      const maxSize = 4 * 1024 * 1024;
      if (estimatedSize > maxSize) {
        logger.warn('Base64 image too large', { estimatedSize });
        return validationErrorResponse([{ field: 'imageUrl', message: 'Image is too large. Please use an image under 4MB.' }]);
      }
    }

    logger.info('Request validated', { imageUrlLength: imageUrl?.length || 0 });

    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing Authorization header');
      return createErrorResponse('Authorization required', logger, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      logger.error('Missing required environment variables');
      return createErrorResponse('Server configuration error', logger, { status: 500 });
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      logger.warn('Invalid or expired JWT');
      return createErrorResponse('Invalid or expired token', logger, { status: 401 });
    }

    // Rate limiting - 5 requests per minute
    const rateLimitResult = checkRateLimit({
      maxRequests: 5,
      windowMs: 60 * 1000,
      identifier: extractIdentifier(req),
    }, logger);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded');
      return rateLimitExceededResponse(rateLimitResult);
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      logger.error('OPENAI_API_KEY not configured');
      return createErrorResponse('AI service not configured', logger, { status: 500 });
    }

    const systemPrompt = `You are an expert aquatic species identification system. Your job is to identify fish, coral, invertebrates, or aquatic plants from photos.

INSTRUCTIONS:
1. Carefully examine the photo for any aquatic organisms
2. Identify the species as specifically as possible
3. Provide your top matches ranked by confidence (highest first)
4. For each match, include care information: water type, care level, temperament, adult size, minimum tank size, diet, and notes
5. If you cannot confidently identify the species, still provide your best guesses with lower confidence scores
6. If the image does not contain an aquatic organism, set identified=false and explain why

IDENTIFICATION TIPS:
- Look at body shape, fin structure, coloration, patterns, and markings
- Consider size context clues from the environment
- For corals: note polyp structure, growth form, and coloration
- For invertebrates: note shell shape, appendages, and coloration
- For plants: note leaf shape, growth pattern, and coloration

Return your results using the identify_species tool. Always provide at least one match if you can see any aquatic organism.`;

    logger.debug('Calling OpenAI for species identification');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify the aquatic species in this photo using the identify_species tool.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        tools: [identifySpeciesTool],
        tool_choice: { type: "function", function: { name: "identify_species" } },
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('AI gateway error', { status: aiResponse.status, error: errorText });

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return createErrorResponse('AI Gateway error', logger, { status: 502 });
    }

    const aiData = await aiResponse.json();
    logger.debug('AI response received', {
      hasToolCalls: !!aiData.choices?.[0]?.message?.tool_calls,
      hasContent: !!aiData.choices?.[0]?.message?.content
    });

    let result;

    // Try to get structured output from tool_calls first
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        result = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
        logger.debug('Parsed from tool call successfully');
      } catch (e) {
        logger.error('Error parsing tool call arguments', { error: e });
      }
    }

    // Fallback to content parsing if no tool calls
    if (!result) {
      const content = aiData.choices?.[0]?.message?.content;

      if (!content) {
        logger.error('No content in AI response');
        return createSuccessResponse({
          identified: false,
          top_matches: [],
          unable_reason: 'Unable to analyze image. Please try again with a clearer photo.',
        });
      }

      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      try {
        result = JSON.parse(cleanContent);
      } catch (parseError) {
        logger.error('JSON parse error', { error: parseError, content: cleanContent.substring(0, 200) });
        result = {
          identified: false,
          top_matches: [],
          unable_reason: 'Unable to process identification results. Please try again.',
        };
      }
    }

    // Validate structure
    if (!result.top_matches) {
      result.top_matches = [];
    }

    // Clamp confidence values
    result.top_matches = result.top_matches.map((match: Record<string, unknown>) => ({
      ...match,
      confidence: typeof match.confidence === 'number' ? Math.min(1, Math.max(0, match.confidence)) : 0.5,
    }));

    // Sort by confidence descending
    result.top_matches.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence);

    logger.info('Species identification complete', {
      identified: result.identified,
      matchCount: result.top_matches.length,
      topMatch: result.top_matches[0]?.common_name || 'none',
    });

    return createSuccessResponse(result);

  } catch (error) {
    logger.error('Unexpected error', {
      errorType: error?.constructor?.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return new Response(
      JSON.stringify({
        error: 'Unable to identify species. Please try again later.',
        identified: false,
        top_matches: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
