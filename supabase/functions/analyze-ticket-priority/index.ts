import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  handleCors,
  createLogger,
  validateString,
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

  const logger = createLogger('analyze-ticket-priority');

  try {
    const body = await req.json();
    const { message } = body;

    // Input validation
    const errors = collectErrors(
      validateString(message, 'message', { minLength: 1, maxLength: 5000 })
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Rate limiting (30 requests per minute)
    const identifier = extractIdentifier(req);
    const rateLimitResult = checkRateLimit({
      maxRequests: 30,
      windowMs: 60 * 1000,
      identifier: `ticket-priority:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logger.info('Analyzing ticket priority', {
      messagePreview: message.substring(0, 100),
    });

    const systemPrompt = `You are a support ticket priority analyzer. Analyze the user's message and determine the appropriate priority level based on urgency, impact, and severity.

Priority Levels:
- urgent: Critical issues affecting multiple users, complete system outages, data loss, security vulnerabilities, billing issues preventing service access
- high: Significant functionality broken, preventing user from completing core tasks, time-sensitive requests
- medium: Feature not working as expected, usability issues, general questions with some urgency
- low: General inquiries, feature requests, minor issues with workarounds available

ANALYSIS CRITERIA:

1. Urgency Indicators (weight: high)
   - "urgent", "critical", "asap", "emergency", "immediately" → likely urgent
   - "soon", "when possible", "at your convenience" → likely low/medium

2. Impact Assessment (weight: high)
   - "can't access", "broken", "not working", "error", "crash" → likely high
   - "would be nice", "suggestion", "wondering" → likely low

3. Business Impact (weight: very high)
   - "losing money", "affecting customers", "deadline", "presentation" → likely urgent/high
   - "losing data", "fish dying", "tank emergency" → likely urgent

4. Security Concerns (weight: very high)
   - "hack", "breach", "unauthorized", "security", "stolen" → urgent

5. User Emotion (weight: medium)
   - Frustrated tone with blocked workflow → consider bumping priority
   - Casual inquiry → likely low

FEW-SHOT EXAMPLES:

"I can't log into my account and I have dying fish that need parameter checks!" → urgent
"The app crashes every time I try to add a new aquarium" → high
"Water test photo analysis is giving weird results sometimes" → medium
"Would love to see a dark mode option" → low

Return ONLY one word: urgent, high, medium, or low`;

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
          { role: "user", content: `Analyze this support message and return only the priority level (urgent, high, medium, or low):\n\n${message}` }
        ],
        temperature: 0.2,
        max_tokens: 10
      }),
    });

    // Handle AI gateway errors with fallback to medium priority
    if (!response.ok) {
      logger.warn('AI gateway error, defaulting to medium priority', { status: response.status });
      return createSuccessResponse({ priority: "medium" });
    }

    const data = await response.json();
    const priorityText = data.choices[0]?.message?.content?.trim().toLowerCase() || "medium";
    
    // Validate and normalize priority
    const validPriorities = ["urgent", "high", "medium", "low"];
    const priority = validPriorities.includes(priorityText) ? priorityText : "medium";
    
    logger.info('Priority determined', { priority });

    return createSuccessResponse({ priority });

  } catch (error) {
    logger.error('Priority analysis failed', error);
    // Return medium priority as fallback instead of error
    return createSuccessResponse({ priority: "medium" });
  }
});
