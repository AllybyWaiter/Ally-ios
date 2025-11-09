import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, aquariumId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

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

    // Get user's aquarium context if aquariumId provided
    let aquariumContext = '';
    if (aquariumId) {
      const { data: aquarium } = await supabase
        .from('aquariums')
        .select('*, water_tests(*), equipment(*)')
        .eq('id', aquariumId)
        .single();

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
        aquariumContext = `

Current Aquarium Context:
- Name: ${aquarium.name}
- Type: ${aquarium.type}
- Volume: ${aquarium.volume_gallons} gallons
- Status: ${aquarium.status}
${aquarium.notes ? `- Notes: ${aquarium.notes}` : ''}

Recent Water Tests: ${aquarium.water_tests?.length || 0} tests on record
Equipment: ${aquarium.equipment?.length || 0} items tracked

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

    // Get user's skill level
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let skillLevel = 'beginner';
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('skill_level')
        .eq('user_id', authUser.id)
        .single();
      
      if (profile?.skill_level) {
        skillLevel = profile.skill_level;
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

    console.log("Processing Ally chat request", aquariumId ? `for aquarium: ${aquariumId}` : "", `| Skill level: ${skillLevel}`);

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
- Use the livestock and plants context to give specific advice about compatibility, stocking, and care

CRITICAL: Keep responses CONCISE and to the point. Only provide longer explanations when:
- The user asks for detailed information
- Safety or fish health requires thorough explanation
- Complex procedures need step-by-step guidance
Otherwise, be brief and direct. Users prefer quick, actionable answers.

${explanationStyle}

${aquariumContext}

Guidelines:
- Always consider the specific aquarium type (freshwater/saltwater/reef)
- Use the livestock list to assess stocking levels and compatibility
- Consider plant requirements when discussing lighting, CO2, and fertilization
- Recommend appropriate water parameters for the actual species in the tank
- Warn about compatibility issues between existing and proposed livestock
- Suggest maintenance schedules based on tank size, stocking, and bioload
- Provide species-specific care advice based on what's actually in the tank
- When discussing water tests, be specific about ideal ranges for the inhabitants
- Consider the needs of all inhabitants (fish, inverts, corals, plants) when giving advice
- If you don't know something, admit it and suggest consulting a specialist
- Adjust your explanation depth and technical detail based on the user's skill level
- KEEP IT SHORT: Give the essential information first, then ask if they want more details`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to process request" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Ally chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
