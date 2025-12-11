import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import {
  corsHeaders,
  handleCors,
  createLogger,
  validateUuid,
  collectErrors,
  validationErrorResponse,
  checkRateLimit,
  rateLimitExceededResponse,
  extractIdentifier,
  handleAIGatewayError,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";

const DEFAULT_SUGGESTIONS = [
  {
    title: "Weekly Water Change",
    description: "Perform routine 25% water change to maintain water quality",
    priority: "medium",
    category: "water_change",
    reasoning: "Standard maintenance practice"
  },
  {
    title: "Test Water Parameters",
    description: "Check pH, ammonia, nitrite, and nitrate levels",
    priority: "high",
    category: "testing",
    reasoning: "Regular testing is essential for tank health"
  }
];

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('suggest-maintenance-tasks');

  try {
    const body = await req.json();
    const { aquariumId } = body;

    // Input validation
    const errors = collectErrors(
      validateUuid(aquariumId, 'aquariumId')
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Rate limiting (5 requests per minute - AI intensive)
    const identifier = extractIdentifier(req);
    const rateLimitResult = checkRateLimit({
      maxRequests: 5,
      windowMs: 60 * 1000,
      identifier: `maintenance-tasks:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Fetching aquarium data', { aquariumId });

    // Fetch aquarium details
    const { data: aquarium } = await supabase
      .from('aquariums')
      .select('*')
      .eq('id', aquariumId)
      .single();

    // Fetch recent water tests (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: waterTests } = await supabase
      .from('water_tests')
      .select('*, test_parameters(*)')
      .eq('aquarium_id', aquariumId)
      .gte('test_date', thirtyDaysAgo.toISOString())
      .order('test_date', { ascending: false });

    // Fetch equipment
    const { data: equipment } = await supabase
      .from('equipment')
      .select('*')
      .eq('aquarium_id', aquariumId);

    // Fetch livestock
    const { data: livestock } = await supabase
      .from('livestock')
      .select('*')
      .eq('aquarium_id', aquariumId);

    // Fetch recent completed tasks
    const { data: recentTasks } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('aquarium_id', aquariumId)
      .eq('status', 'completed')
      .order('completed_date', { ascending: false })
      .limit(10);

    // Build context for AI
    const context = {
      aquarium: {
        type: aquarium?.type,
        volume: aquarium?.volume_gallons,
        setupDate: aquarium?.setup_date,
      },
      waterTests: waterTests?.map(test => ({
        date: test.test_date,
        parameters: test.test_parameters,
      })),
      equipment: equipment?.map(eq => ({
        type: eq.equipment_type,
        name: eq.name,
        brand: eq.brand,
        model: eq.model,
        lastMaintenance: eq.last_maintenance_date,
        maintenanceInterval: eq.maintenance_interval_days,
      })),
      livestock: livestock?.map(l => ({
        category: l.category,
        species: l.species,
        quantity: l.quantity,
        healthStatus: l.health_status,
      })),
      recentTasks: recentTasks?.map(t => ({
        name: t.task_name,
        type: t.task_type,
        completedDate: t.completed_date,
      })),
    };

    const today = new Date().toISOString().split('T')[0];

    logger.info('Calling AI for task suggestions', {
      aquariumType: aquarium?.type,
      waterTestCount: waterTests?.length || 0,
      equipmentCount: equipment?.length || 0,
    });

    const systemPrompt = `You are an expert aquarium maintenance advisor. Analyze the provided aquarium data and suggest 3-5 actionable maintenance tasks.

ANALYSIS PRIORITIES:
1. Water parameter trends - Look for concerning patterns (rising nitrates, pH drift, ammonia spikes)
2. Equipment maintenance schedules - Suggest maintenance based on intervals and last service dates
3. Tank type and livestock needs - Consider species-specific requirements
4. Seasonal considerations - Temperature stability, algae prevention
5. Recent task history - Avoid duplicating recently completed tasks

TASK CATEGORIES:
- water_change: Partial water changes (suggest % based on parameters)
- cleaning: Glass cleaning, gravel vacuuming, decoration cleaning
- equipment_maintenance: Filter cleaning, impeller check, light bulb replacement
- testing: Water parameter testing (specify which parameters)
- feeding: Feeding schedule adjustments, food variety
- other: Plant trimming, quarantine checks, etc.

PRIORITY GUIDELINES:
- high: Immediate action needed (elevated ammonia/nitrite, overdue equipment service, health issues)
- medium: Should be done within the week (routine maintenance, mildly elevated parameters)
- low: Nice to do when convenient (optimization, aesthetic improvements)

Today's date is ${today}. Use this for calculating days since last maintenance and setting recommended dates.`;

    const userPrompt = `Analyze this aquarium and suggest 3-5 specific, actionable maintenance tasks:\n\n${JSON.stringify(context, null, 2)}`;

    const aiBody = {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_tasks",
            description: "Return 3-5 actionable task suggestions based on aquarium analysis.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Clear, action-oriented task title" },
                      description: { type: "string", description: "Detailed instructions for completing the task" },
                      priority: { type: "string", enum: ["low", "medium", "high"], description: "Urgency level" },
                      category: { type: "string", enum: ["water_change", "cleaning", "equipment_maintenance", "testing", "feeding", "other"], description: "Task category" },
                      recommendedDate: { type: "string", description: "ISO date string for when to do this task (YYYY-MM-DD)" },
                      reasoning: { type: "string", description: "Why this task is recommended based on the data" }
                    },
                    required: ["title", "description", "priority", "category", "reasoning"],
                    additionalProperties: false
                  }
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "suggest_tasks" } },
      temperature: 0.3
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiBody),
    });

    const aiError = handleAIGatewayError(aiResponse, logger);
    if (aiError) return aiError;

    const aiData = await aiResponse.json();
    logger.debug('AI response received');

    let suggestions = [];
    
    // Try to get structured output from tool_calls
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const parsed = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
        suggestions = parsed.suggestions || [];
      } catch (e) {
        logger.error('Error parsing tool call arguments', e);
      }
    }

    // Fallback to content parsing if no tool calls
    if (suggestions.length === 0 && aiData.choices?.[0]?.message?.content) {
      try {
        const content = aiData.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          suggestions = parsed.suggestions || [];
        }
      } catch (e) {
        logger.warn('Error parsing content', e);
      }
    }

    if (suggestions.length === 0) {
      logger.warn('No AI suggestions generated, using defaults');
      suggestions = DEFAULT_SUGGESTIONS;
    }

    logger.info('Task suggestions generated', { count: suggestions.length });

    return createSuccessResponse({ suggestions });

  } catch (error) {
    return createErrorResponse(error, logger);
  }
});
