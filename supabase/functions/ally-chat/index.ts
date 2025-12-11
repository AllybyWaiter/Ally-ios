import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { validateString, validateUuid, collectErrors, validationErrorResponse } from '../_shared/validation.ts';
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from '../_shared/rateLimit.ts';
import { createErrorResponse, createSuccessResponse, createStreamResponse } from '../_shared/errorHandler.ts';

// Tool definitions for Ally's memory capabilities
const tools = [
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Save an important fact about the user's aquarium setup, preferences, products they use, or practices. Use this when the user shares information worth remembering for future conversations. Examples: water source (RO/DI, tap), products they use, feeding schedules, equipment brands, maintenance routines.",
      parameters: {
        type: "object",
        properties: {
          memory_key: { 
            type: "string", 
            enum: ["equipment", "product", "water_source", "feeding", "maintenance", "preference", "livestock_care", "other"],
            description: "Category of the memory"
          },
          memory_value: { 
            type: "string", 
            description: "The fact to remember (e.g., 'Uses BRS 4-stage RO/DI system for water purification')"
          },
          water_type: { 
            type: "string", 
            enum: ["freshwater", "saltwater", "brackish", "universal"],
            description: "Which water type this applies to. Use 'universal' if it applies to all their tanks."
          }
        },
        required: ["memory_key", "memory_value", "water_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "add_equipment",
      description: "Add a piece of equipment to the user's aquarium. Use when user mentions they have specific equipment that should be formally tracked in their tank profile.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium to add equipment to" },
          name: { type: "string", description: "Name of the equipment" },
          equipment_type: { 
            type: "string", 
            enum: ["Filter", "Heater", "Light", "Pump", "Skimmer", "CO2 System", "Air Pump", "Wavemaker", "RO/DI System", "Auto Top Off", "Dosing Pump", "Reactor", "UV Sterilizer", "Chiller", "Controller", "Other"],
            description: "Type of equipment"
          },
          brand: { type: "string", description: "Brand name if mentioned" },
          model: { type: "string", description: "Model name/number if mentioned" },
          notes: { type: "string", description: "Any additional details" }
        },
        required: ["aquarium_id", "name", "equipment_type"],
        additionalProperties: false
      }
    }
  }
];

// Map aquarium types to water types
function getWaterType(aquariumType: string): string {
  const saltwaterTypes = ['reef', 'marine', 'saltwater', 'fowlr'];
  const brackishTypes = ['brackish'];
  
  if (saltwaterTypes.includes(aquariumType?.toLowerCase())) return 'saltwater';
  if (brackishTypes.includes(aquariumType?.toLowerCase())) return 'brackish';
  return 'freshwater';
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('ally-chat');

  try {
    const body = await req.json();
    const { messages, aquariumId } = body;
    
    // Input validation
    const errors = collectErrors(
      validateUuid(aquariumId, 'aquariumId', { required: false })
    );
    
    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      errors.push({ field: 'messages', message: 'messages must be a non-empty array' });
    } else {
      // Validate each message has role and content
      messages.forEach((msg, index) => {
        if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
          errors.push({ field: `messages[${index}].role`, message: 'Invalid message role' });
        }
        if (!msg.content && typeof msg.content !== 'string') {
          errors.push({ field: `messages[${index}].content`, message: 'Message content is required' });
        }
      });
    }
    
    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.error('No authorization header provided');
      return createErrorResponse('Authentication required', logger, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      logger.error('Authentication failed', { error: authError?.message });
      return createErrorResponse('Authentication failed', logger, { status: 401 });
    }
    
    logger.info('User authenticated', { userId: authUser.id });
    logger.setUserId(authUser.id);

    // Rate limiting - 10 requests per minute per user
    const rateLimitResult = checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: extractIdentifier(req, authUser.id),
    }, logger);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { userId: authUser.id });
      return rateLimitExceededResponse(rateLimitResult);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      logger.error('LOVABLE_API_KEY not configured');
      return createErrorResponse('AI service not configured', logger, { status: 500 });
    }

    // Get user's aquarium context if aquariumId provided
    let aquariumContext = '';
    let currentWaterType = 'freshwater';
    let aquariumData: any = null;
    
    if (aquariumId) {
      const { data: aquarium } = await supabase
        .from('aquariums')
        .select('*, water_tests(*), equipment(*)')
        .eq('id', aquariumId)
        .single();

      aquariumData = aquarium;

      // Fetch livestock and plants for this aquarium
      const { data: livestock } = await supabase
        .from('livestock')
        .select('*')
        .eq('aquarium_id', aquariumId);

      const { data: plants } = await supabase
        .from('plants')
        .select('*')
        .eq('aquarium_id', aquariumId);

      if (aquarium) {
        currentWaterType = getWaterType(aquarium.type);
        
        aquariumContext = `

Current Aquarium Context:
- Name: ${aquarium.name}
- Type: ${aquarium.type}
- Water Type: ${currentWaterType}
- Volume: ${aquarium.volume_gallons} gallons
- Status: ${aquarium.status}
${aquarium.notes ? `- Notes: ${aquarium.notes}` : ''}

Recent Water Tests: ${aquarium.water_tests?.length || 0} tests on record

Equipment (${aquarium.equipment?.length || 0} total):
${aquarium.equipment && aquarium.equipment.length > 0 
  ? aquarium.equipment.map((e: any) => `  - ${e.name} (${e.equipment_type})${e.brand ? ', Brand: ' + e.brand : ''}${e.model ? ', Model: ' + e.model : ''}${e.maintenance_interval_days ? ', Maintenance every ' + e.maintenance_interval_days + ' days' : ''}${e.notes ? ', Notes: ' + e.notes : ''}`).join('\n')
  : '  None added yet'}

Livestock (${livestock?.length || 0} total):
${livestock && livestock.length > 0 
  ? livestock.map(l => `  - ${l.quantity}x ${l.species} (${l.name}) - Category: ${l.category}, Health: ${l.health_status}${l.notes ? ', Notes: ' + l.notes : ''}`).join('\n')
  : '  None added yet'}

Plants (${plants?.length || 0} total):
${plants && plants.length > 0
  ? plants.map(p => `  - ${p.quantity}x ${p.species} (${p.name}) - Placement: ${p.placement}, Condition: ${p.condition}${p.notes ? ', Notes: ' + p.notes : ''}`).join('\n')
  : '  None added yet'}
`;
      }
    }

    // Fetch user's memories and profile
    let memories: any[] = [];
    let memoryContext = '';

    let skillLevel = 'beginner';
    let subscriptionTier = 'free';
    const { data: profile } = await supabase
      .from('profiles')
      .select('skill_level, subscription_tier')
      .eq('user_id', authUser.id)
      .single();
    
    if (profile?.skill_level) {
      skillLevel = profile.skill_level;
    }
    if (profile?.subscription_tier) {
      subscriptionTier = profile.subscription_tier;
    }
    
    const hasMemoryAccess = ['plus', 'gold', 'business', 'enterprise'].includes(subscriptionTier);

    if (hasMemoryAccess) {
      const { data: memoryData } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', authUser.id)
        .or(`water_type.eq.${currentWaterType},water_type.eq.universal,water_type.is.null`)
        .order('created_at', { ascending: false });

      if (memoryData && memoryData.length > 0) {
        memories = memoryData;
        const groupedMemories: Record<string, string[]> = {};
        memoryData.forEach(m => {
          const key = m.memory_key || 'other';
          if (!groupedMemories[key]) groupedMemories[key] = [];
          groupedMemories[key].push(`${m.memory_value}${m.water_type && m.water_type !== 'universal' ? ` (${m.water_type} only)` : ''}`);
        });

        memoryContext = `

User's Known Setup & Preferences (from previous conversations):
${Object.entries(groupedMemories).map(([key, values]) => 
  `[${key.toUpperCase()}]\n${values.map(v => `  • ${v}`).join('\n')}`
).join('\n\n')}

Use this information to provide personalized advice. You don't need to ask about things you already know.
`;
      }
    }

    // Customize explanation style based on skill level
    const explanationStyles: Record<string, string> = {
      beginner: `
Explanation Style for Beginners:
- Use simple, everyday language and avoid jargon
- When technical terms are necessary, explain them clearly
- Provide step-by-step instructions with details
- Include safety reminders and common mistakes to avoid
- Be extra encouraging and patient
- Explain the "why" behind recommendations to build understanding`,
      intermediate: `
Explanation Style for Intermediate Users:
- Balance technical accuracy with accessibility
- You can use common aquarium terminology
- Provide practical tips and optimization suggestions
- Include relevant parameter ranges and specifications
- Share best practices and intermediate techniques`,
      advanced: `
Explanation Style for Advanced Users:
- Use precise technical language and scientific terminology
- Focus on nuanced details, advanced techniques, and edge cases
- Provide in-depth explanations of biochemistry and biology
- Discuss trade-offs between different approaches
- Reference specific studies or advanced methods when relevant`
    };
    
    const explanationStyle = explanationStyles[skillLevel] || explanationStyles.beginner;

    logger.info('Processing chat request', { 
      aquariumId: aquariumId || 'none',
      skillLevel,
      subscriptionTier,
      hasMemoryAccess,
      memoryCount: memories?.length || 0,
      messageCount: messages.length
    });

    const systemPrompt = `You are Ally, an expert aquarium assistant with deep knowledge of:
- Freshwater and saltwater aquarium care
- Water chemistry and testing (pH, ammonia, nitrite, nitrate, GH, KH, temperature, etc.)
- Fish species, compatibility, and care requirements
- Invertebrate and coral care (for reef tanks)
- Plant care, CO2, lighting, and aquascaping
- Equipment setup and maintenance
- Disease diagnosis and treatment
- Cycling new tanks
- Troubleshooting common issues
- Species compatibility and stocking levels
- Bioload management and tank balance

Your personality:
- Friendly, encouraging, and patient
- Provide clear, actionable advice
- Ask clarifying questions when needed
- Celebrate successes and help through challenges
- Prioritize fish health and welfare
- Use the livestock, plants, AND EQUIPMENT context to give specific advice about compatibility, stocking, care, and maintenance

WATER PARAMETER REFERENCE RANGES:

FRESHWATER (Tropical):
- pH: 6.5-7.5 (ideal), 6.0-8.0 (acceptable)
- Ammonia: 0 ppm (any detectable is harmful)
- Nitrite: 0 ppm (any detectable is harmful)
- Nitrate: <20 ppm (ideal), <40 ppm (acceptable)
- Temperature: 75-80°F (24-27°C)
- GH: 4-12 dGH
- KH: 3-8 dKH

FRESHWATER (Livebearers/African Cichlids):
- pH: 7.5-8.5
- GH: 10-20 dGH
- KH: 10-15 dKH

SALTWATER/FOWLR:
- pH: 8.1-8.4
- Ammonia: 0 ppm
- Nitrite: 0 ppm
- Nitrate: <20 ppm (ideal), <40 ppm (acceptable)
- Salinity: 1.020-1.025 SG (35 ppt)
- Temperature: 75-80°F (24-27°C)

REEF:
- pH: 8.1-8.4
- Ammonia: 0 ppm
- Nitrite: 0 ppm
- Nitrate: <5 ppm (SPS), <10 ppm (LPS/soft corals)
- Phosphate: <0.03 ppm
- Salinity: 1.024-1.026 SG (35 ppt)
- Alkalinity: 8-12 dKH
- Calcium: 400-450 ppm
- Magnesium: 1300-1450 ppm
- Temperature: 76-78°F (ideal for corals)

Use these ranges to assess water test results and provide specific advice.

${hasMemoryAccess ? `MEMORY & LEARNING CAPABILITIES:
You have the ability to remember important facts about the user's setup using the save_memory tool.
- When users share information about their equipment, products, water source, feeding habits, maintenance routines, or preferences, USE THE save_memory TOOL to remember it.
- Be proactive about saving useful information that will help you give better advice in the future.
- You can also add equipment to their tank profile using the add_equipment tool.
- When you save a memory, briefly acknowledge it naturally in conversation (e.g., "I'll remember that you use RO/DI water").
- Don't ask about things you already know from the memory context.
${aquariumId ? `- Current aquarium ID for add_equipment tool: ${aquariumId}` : '- No aquarium selected, so you cannot add equipment but you can still save memories.'}` : `NOTE: This user is on the Basic plan. You can provide personalized advice based on their current aquarium data, but you cannot save memories or add equipment for them. If they share useful information, respond helpfully but do not mention saving it.`}

FORMATTING GUIDELINES (CRITICAL):
- Use clear spacing and line breaks between different points
- Use **bold** for important terms and key actions
- Use bullet points for lists (with blank lines between groups)
- Break up text into short paragraphs (2-3 sentences max)
- Use headers (##) to organize longer responses into sections
- Put the most important information first
- Add blank lines between sections for better readability

Example format:
**Quick Answer:** [Direct answer in 1-2 sentences]

**Why this matters:** [Brief explanation]

**What to do:**
- Step 1
- Step 2
- Step 3

${explanationStyle}
${memoryContext}
${aquariumContext}

Guidelines:
- Always consider the specific aquarium type (freshwater/saltwater/reef)
- Use the livestock list to assess stocking levels and compatibility
- Consider plant requirements when discussing lighting, CO2, and fertilization
- EQUIPMENT AWARENESS: Reference the user's specific equipment by name when discussing filters, heaters, lights, CO2 systems, or any gear
- If asked about equipment, ALWAYS refer to specific items from their equipment list (e.g., "Your Fluval 407 filter...")
- Provide equipment-specific maintenance advice based on brands and models they own
- Recommend appropriate water parameters for the actual species in the tank
- Warn about compatibility issues between existing and proposed livestock
- Suggest maintenance schedules based on tank size, stocking, bioload, AND their specific equipment
- Provide species-specific care advice based on what's actually in the tank
- When discussing water tests, be specific about ideal ranges for the inhabitants
- Consider the needs of all inhabitants (fish, inverts, corals, plants) when giving advice
- If you don't know something, admit it and suggest consulting a specialist
- Adjust your explanation depth and technical detail based on the user's skill level
- PRIORITIZE READABILITY: Use formatting to make information scannable and digestible`;

    // Initial API call - only include tools if user has memory access
    const apiBody: any = {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: false,
      temperature: 0.7,
    };
    
    if (hasMemoryAccess) {
      apiBody.tools = tools;
    }

    logger.debug('Calling AI gateway (initial)', { hasTools: hasMemoryAccess });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    // Check if there are tool calls
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      logger.info('Processing tool calls', { count: assistantMessage.tool_calls.length });
      
      const toolResults: any[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs;
        
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          logger.error('Failed to parse tool arguments', { toolName: functionName, error: e });
          continue;
        }

        logger.debug('Executing tool', { toolName: functionName, args: functionArgs });

        if (functionName === "save_memory") {
          try {
            const { error } = await supabase
              .from('user_memories')
              .insert({
                user_id: authUser.id,
                memory_key: functionArgs.memory_key,
                memory_value: functionArgs.memory_value,
                water_type: functionArgs.water_type === 'universal' ? null : functionArgs.water_type,
                source: 'conversation',
                confidence: 'confirmed'
              });

            if (error) {
              logger.error('Failed to save memory', { error: error.message });
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: JSON.stringify({ success: false, error: error.message })
              });
            } else {
              logger.info('Memory saved successfully', { memoryKey: functionArgs.memory_key });
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: JSON.stringify({ success: true, message: `Memory saved: ${functionArgs.memory_value}` })
              });
            }
          } catch (e) {
            logger.error('Error saving memory', { error: e });
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify({ success: false, error: "Failed to save memory" })
            });
          }
        } else if (functionName === "add_equipment") {
          try {
            const { error } = await supabase
              .from('equipment')
              .insert({
                aquarium_id: functionArgs.aquarium_id,
                name: functionArgs.name,
                equipment_type: functionArgs.equipment_type,
                brand: functionArgs.brand || null,
                model: functionArgs.model || null,
                notes: functionArgs.notes || null
              });

            if (error) {
              logger.error('Failed to add equipment', { error: error.message });
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: JSON.stringify({ success: false, error: error.message })
              });
            } else {
              logger.info('Equipment added successfully', { equipmentName: functionArgs.name });
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: JSON.stringify({ success: true, message: `Equipment added: ${functionArgs.name}` })
              });
            }
          } catch (e) {
            logger.error('Error adding equipment', { error: e });
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify({ success: false, error: "Failed to add equipment" })
            });
          }
        }
      }

      // Make follow-up call with tool results to get final response
      const followUpMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
        assistantMessage,
        ...toolResults
      ];

      logger.debug('Calling AI gateway (follow-up with tool results)');

      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
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
    
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
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
