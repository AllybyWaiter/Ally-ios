import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  handleCors,
  createLogger,
  validateString,
  validateArray,
  validateEnum,
  collectErrors,
  validationErrorResponse,
  checkRateLimit,
  rateLimitExceededResponse,
  extractIdentifier,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";

// Tool definition for structured reply template output
const suggestRepliesTool = {
  type: "function",
  function: {
    name: "suggest_replies",
    description: "Generate professional reply templates for support tickets",
    parameters: {
      type: "object",
      properties: {
        templates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { 
                type: "string",
                description: "Brief descriptive title (max 5 words)"
              },
              content: { 
                type: "string",
                description: "The full reply text"
              }
            },
            required: ["title", "content"],
            additionalProperties: false
          }
        }
      },
      required: ["templates"],
      additionalProperties: false
    }
  }
};

const DEFAULT_TEMPLATE = {
  title: "Default Response",
  content: "Thank you for reaching out. We're reviewing your request and will respond as soon as possible."
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('suggest-ticket-reply');

  try {
    const body = await req.json();
    const { ticketContent, priority, messages } = body;

    // Input validation
    const errors = collectErrors(
      validateString(ticketContent, 'ticketContent', { minLength: 1, maxLength: 10000 }),
      validateEnum(priority, 'priority', ['urgent', 'high', 'medium', 'low']),
      validateArray(messages, 'messages', { required: false, maxLength: 100 })
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Rate limiting (15 requests per minute)
    const identifier = extractIdentifier(req);
    const rateLimitResult = checkRateLimit({
      maxRequests: 15,
      windowMs: 60 * 1000,
      identifier: `ticket-reply:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logger.info('Generating reply suggestions', { priority });

    const conversationHistory = (messages || []).map((msg: { sender_type: string; message: string }) => 
      `${msg.sender_type === 'user' ? 'Customer' : 'Admin'}: ${msg.message}`
    ).join('\n\n');

    const systemPrompt = `You are an expert support agent assistant for Ally, an aquarium management app. Generate 3 professional reply templates for support tickets.

TONE & STYLE:
- Professional yet friendly and empathetic
- Clear and action-oriented with concrete next steps
- Personalized to the specific issue (reference details from the ticket)
- Avoid jargon, be accessible to all skill levels

PRIORITY-SPECIFIC APPROACH:
- URGENT: Acknowledge immediately, express urgency, provide direct solution or escalation path, include timeline commitment
- HIGH: Show understanding of impact, provide concrete timeline, offer direct assistance, include workarounds if available
- MEDIUM: Be helpful and thorough, suggest solutions step-by-step, provide relevant resources
- LOW: Be friendly and informative, provide educational resources, suggest self-service options

TEMPLATE VARIETY:
1. Direct Solution - Provide immediate actionable steps
2. Information Request - Ask for clarifying details needed to help
3. Empathetic Follow-up - Acknowledge concern, provide reassurance, outline next steps

Use the suggest_replies tool to return exactly 3 templates.`;

    const userPrompt = `Priority: ${priority.toUpperCase()}

Original Ticket:
${ticketContent}

${conversationHistory ? `Conversation History:\n${conversationHistory}` : ''}

Generate 3 professional reply templates using the suggest_replies tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [suggestRepliesTool],
        tool_choice: { type: "function", function: { name: "suggest_replies" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      logger.warn('AI gateway error, returning default template', { status: response.status });
      return createSuccessResponse({ templates: [DEFAULT_TEMPLATE] });
    }

    const data = await response.json();
    
    let templates = [];
    
    // Try to get structured output from tool_calls first
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const parsed = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        templates = parsed.templates || [];
        logger.debug('Parsed templates from tool call');
      } catch (e) {
        logger.error('Error parsing tool call arguments', e);
      }
    }
    
    // Fallback to content parsing if no tool calls
    if (templates.length === 0) {
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        try {
          const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                           content.match(/(\{[\s\S]*\})/);
          const jsonStr = jsonMatch ? jsonMatch[1] : content;
          const parsed = JSON.parse(jsonStr);
          templates = parsed.templates || [];
        } catch (parseError) {
          logger.warn('Failed to parse JSON, using fallback', parseError);
          templates = [{
            title: "Suggested Reply",
            content: content.substring(0, 500)
          }];
        }
      }
    }

    // Ensure we have at least one template
    if (templates.length === 0) {
      templates = [DEFAULT_TEMPLATE];
    }

    logger.info('Generated reply suggestions', { count: templates.length });

    return createSuccessResponse({ templates });

  } catch (error) {
    logger.error('Reply suggestion failed', error);
    return createSuccessResponse({ templates: [DEFAULT_TEMPLATE] });
  }
});
