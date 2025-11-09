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
`;
      }
    }

    console.log("Processing Ally chat request", aquariumId ? `for aquarium: ${aquariumId}` : "");

    const systemPrompt = `You are Ally, an expert aquarium assistant with deep knowledge of:
- Freshwater and saltwater aquarium care
- Water chemistry and testing (pH, ammonia, nitrite, nitrate, GH, KH, temperature, etc.)
- Fish species, compatibility, and care requirements
- Plant care and aquascaping
- Equipment setup and maintenance
- Disease diagnosis and treatment
- Cycling new tanks
- Troubleshooting common issues

Your personality:
- Friendly, encouraging, and patient
- Provide clear, actionable advice
- Explain technical concepts in simple terms
- Ask clarifying questions when needed
- Celebrate successes and help through challenges
- Prioritize fish health and welfare

${aquariumContext}

Guidelines:
- Always consider the specific aquarium type (freshwater/saltwater)
- Recommend appropriate water parameters for the species
- Suggest maintenance schedules based on tank size and stocking
- Warn about compatibility issues
- Provide step-by-step guidance for complex tasks
- When discussing water tests, be specific about ideal ranges
- If you don't know something, admit it and suggest consulting a specialist`;

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
