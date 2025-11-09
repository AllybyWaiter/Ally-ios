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
    const { ticketContent, priority, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating reply suggestions for priority:", priority);

    const conversationHistory = messages.map((msg: any) => 
      `${msg.sender_type === 'user' ? 'Customer' : 'Admin'}: ${msg.message}`
    ).join('\n\n');

    const systemPrompt = `You are an expert support agent assistant. Generate 3 professional reply templates for support tickets based on the ticket content, priority level, and conversation history.

Each template should be:
- Professional and empathetic
- Tailored to the priority level
- Action-oriented with clear next steps
- Personalized to the specific issue

For URGENT tickets: Acknowledge immediately, show urgency, provide direct solutions or escalation paths
For HIGH priority: Show understanding, provide concrete timeline, offer direct assistance
For MEDIUM priority: Be helpful and thorough, suggest solutions
For LOW priority: Be friendly and informative, provide resources

Return EXACTLY 3 reply templates in JSON format:
{
  "templates": [
    {
      "title": "Brief descriptive title (max 5 words)",
      "content": "The full reply text"
    },
    {
      "title": "Brief descriptive title (max 5 words)",
      "content": "The full reply text"
    },
    {
      "title": "Brief descriptive title (max 5 words)",
      "content": "The full reply text"
    }
  ]
}`;

    const userPrompt = `Priority: ${priority.toUpperCase()}

Original Ticket:
${ticketContent}

${conversationHistory ? `Conversation History:\n${conversationHistory}` : ''}

Generate 3 professional reply templates that would be appropriate for this ticket.`;

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            templates: [
              {
                title: "Default Response",
                content: "Thank you for contacting us. We've received your request and will get back to you shortly."
              }
            ]
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI gateway responded with ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Try to parse JSON from the response
    let templates;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const parsed = JSON.parse(jsonStr);
      templates = parsed.templates || [];
    } catch (parseError) {
      console.error("Failed to parse JSON, attempting recovery:", parseError);
      // Fallback: create a single template from the content
      templates = [{
        title: "Suggested Reply",
        content: content.substring(0, 500)
      }];
    }

    console.log("Generated", templates.length, "reply suggestions");

    return new Response(JSON.stringify({ templates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reply suggestion error:", error);
    return new Response(
      JSON.stringify({ 
        templates: [
          {
            title: "Error - Default Response",
            content: "Thank you for reaching out. We're reviewing your request and will respond as soon as possible."
          }
        ],
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
