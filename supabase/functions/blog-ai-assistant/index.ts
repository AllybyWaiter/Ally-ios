import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  handleCors,
  createLogger,
  validateString,
  validateEnum,
  collectErrors,
  validationErrorResponse,
  checkRateLimit,
  rateLimitExceededResponse,
  extractIdentifier,
  handleAIGatewayError,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('blog-ai-assistant');

  try {
    const body = await req.json();
    const { action, input } = body;

    // Input validation
    const errors = collectErrors(
      validateEnum(action, 'action', ['generate', 'improve', 'seo'])
    );

    // Validate input based on action
    if (action === 'generate') {
      errors.push(...collectErrors(
        validateString(input?.topic, 'input.topic', { minLength: 3, maxLength: 500 })
      ));
    } else if (action === 'improve' || action === 'seo') {
      errors.push(...collectErrors(
        validateString(input?.title, 'input.title', { minLength: 1, maxLength: 500 }),
        validateString(input?.content, 'input.content', { minLength: 10, maxLength: 100000 })
      ));
    }

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Rate limiting (10 requests per minute - more intensive AI operations)
    const identifier = extractIdentifier(req);
    const rateLimitResult = checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: `blog-ai:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    logger.info('Processing blog AI request', { action });

    let systemPrompt = '';
    let userPrompt = '';
    let tools: unknown[] = [];
    let toolChoice: unknown = undefined;

    switch (action) {
      case 'generate':
        systemPrompt = `You are a professional blog writer specializing in aquarium care and fishkeeping. Write engaging, informative, and SEO-friendly blog posts.

WRITING STYLE:
- Conversational yet authoritative
- Use concrete examples and practical advice
- Break up content with clear sections and subheadings
- Include actionable takeaways for readers
- Avoid overly technical jargon unless explained`;
        userPrompt = `Write a complete blog post about: ${input.topic}

Write an engaging, well-structured article with:
- A catchy title (max 200 chars)
- A compelling excerpt (max 300 chars)
- Full article content with proper HTML formatting (use <h2> for sections, <h3> for subsections, <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis)
- SEO-optimized title (max 60 chars)
- SEO description (max 160 chars)
- 4-5 relevant tags`;

        tools = [{
          type: "function",
          function: {
            name: "generate_blog_post",
            description: "Generate a complete blog post with all required fields",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Engaging blog post title (max 200 chars)" },
                excerpt: { type: "string", description: "Compelling summary (max 300 chars)" },
                content: { type: "string", description: "Full article content with HTML formatting" },
                seo_title: { type: "string", description: "SEO-optimized title (max 60 chars)" },
                seo_description: { type: "string", description: "SEO description (max 160 chars)" },
                tags: { type: "string", description: "Comma-separated tags (4-5 tags)" }
              },
              required: ["title", "excerpt", "content", "seo_title", "seo_description", "tags"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "generate_blog_post" } };
        break;

      case 'improve':
        systemPrompt = `You are a professional blog editor specializing in aquarium content. Improve and enhance existing blog posts while maintaining their core message.

IMPROVEMENT FOCUS:
- Better structure and flow
- More engaging language
- Additional helpful details
- Clean HTML formatting`;
        userPrompt = `Improve this blog post content:

Title: ${input.title}
Current Content: ${input.content}

Enhance with better structure, engaging language, and clean HTML formatting.
Return only the improved HTML content.`;

        tools = [{
          type: "function",
          function: {
            name: "improve_content",
            description: "Improve blog post content",
            parameters: {
              type: "object",
              properties: {
                content: { type: "string", description: "Improved HTML content" }
              },
              required: ["content"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "improve_content" } };
        break;

      case 'seo':
        systemPrompt = `You are an SEO expert specializing in blog optimization for aquarium and fishkeeping content.

SEO BEST PRACTICES:
- Include primary keyword in title and description
- Write compelling meta descriptions that encourage clicks
- Use relevant, searchable tags`;
        userPrompt = `Generate SEO-optimized fields for this blog post:

Title: ${input.title}
Content: ${input.content}

Create SEO title (max 60 chars), SEO description (max 160 chars), and 4-5 relevant tags.`;

        tools = [{
          type: "function",
          function: {
            name: "generate_seo",
            description: "Generate SEO fields for blog post",
            parameters: {
              type: "object",
              properties: {
                seo_title: { type: "string", description: "SEO title (max 60 chars)" },
                seo_description: { type: "string", description: "SEO description (max 160 chars)" },
                tags: { type: "string", description: "Comma-separated tags (4-5 tags)" }
              },
              required: ["seo_title", "seo_description", "tags"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "generate_seo" } };
        break;

      default:
        throw new Error('Invalid action');
    }

    const requestBody: Record<string, unknown> = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = toolChoice;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const aiError = handleAIGatewayError(response, logger);
    if (aiError) return aiError;

    const data = await response.json();
    const message = data.choices[0].message;

    let result;
    if (message.tool_calls && message.tool_calls[0]) {
      const toolCall = message.tool_calls[0];
      result = JSON.parse(toolCall.function.arguments);
      logger.debug('Parsed result from tool call');
    } else if (message.content) {
      try {
        result = JSON.parse(message.content);
      } catch {
        result = { content: message.content };
      }
    } else {
      throw new Error('No valid response from AI');
    }

    logger.info('Blog AI request completed', { action });

    return createSuccessResponse(result);

  } catch (error) {
    return createErrorResponse(error, logger);
  }
});
