import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { aquariumId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const systemPrompt = `You are an expert aquarium maintenance advisor. Analyze the provided aquarium data and suggest 3-5 actionable maintenance tasks.

Consider:
- Water parameter trends (look for concerning patterns)
- Equipment maintenance schedules (suggest maintenance based on intervals)
- Tank type and livestock needs
- Seasonal maintenance requirements
- Recent completed tasks (avoid duplicates)

For each suggestion, categorize as: water_change, cleaning, equipment_maintenance, testing, feeding, or other.
Prioritize tasks as: low, medium, or high based on urgency.`;

    const userPrompt = `Analyze this aquarium and suggest maintenance tasks:\n\n${JSON.stringify(context, null, 2)}`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_tasks",
            description: "Return 3-5 actionable task suggestions.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      category: { type: "string", enum: ["water_change", "cleaning", "equipment_maintenance", "testing", "feeding", "other"] },
                      recommendedDate: { type: "string", description: "ISO date string for when to do this task" },
                      reasoning: { type: "string" }
                    },
                    required: ["title", "description", "priority", "category"],
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
      tool_choice: { type: "function", function: { name: "suggest_tasks" } }
    };

    console.log('Calling Lovable AI for task suggestions...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    let suggestions = [];
    
    // Try to get structured output from tool_calls
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const parsed = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
        suggestions = parsed.suggestions || [];
      } catch (e) {
        console.error('Error parsing tool call arguments:', e);
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
        console.error('Error parsing content:', e);
      }
    }

    if (suggestions.length === 0) {
      suggestions = [
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
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-maintenance-tasks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
