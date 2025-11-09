import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing ticket priority for message:", message.substring(0, 100));

    const systemPrompt = `You are a support ticket priority analyzer. Analyze the user's message and determine the appropriate priority level based on urgency, impact, and severity.

Priority Levels:
- urgent: Critical issues affecting multiple users, complete system outages, data loss, security vulnerabilities, billing issues preventing service access
- high: Significant functionality broken, preventing user from completing core tasks, time-sensitive requests
- medium: Feature not working as expected, usability issues, general questions with some urgency
- low: General inquiries, feature requests, minor issues with workarounds available

Analyze the message sentiment, keywords, and context to determine priority. Consider:
- Urgency indicators: "urgent", "critical", "asap", "emergency", "immediately"
- Impact: "can't access", "broken", "not working", "error", "crash"
- Business impact: "losing money", "affecting customers", "deadline"
- Security: "hack", "breach", "unauthorized", "security"

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
        temperature: 0.3,
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ priority: "medium", error: "Rate limit exceeded" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ priority: "medium", error: "Service temporarily unavailable" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ priority: "medium", error: "Failed to analyze priority" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const priorityText = data.choices[0]?.message?.content?.trim().toLowerCase() || "medium";
    
    // Validate and normalize priority
    const validPriorities = ["urgent", "high", "medium", "low"];
    let priority = validPriorities.includes(priorityText) ? priorityText : "medium";
    
    console.log("Determined priority:", priority);

    return new Response(JSON.stringify({ priority }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Priority analysis error:", error);
    return new Response(
      JSON.stringify({ priority: "medium", error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
