import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

FEW-SHOT EXAMPLES:

For HIGH priority "Can't log in" ticket:
{
  "templates": [
    {
      "title": "Password Reset Steps",
      "content": "Hi [Name],\\n\\nI understand how frustrating it is to be locked out of your account. Let's get you back in right away.\\n\\nPlease try these steps:\\n1. Go to the login page and click \\"Forgot Password\\"\\n2. Enter your email address\\n3. Check your inbox (and spam folder) for the reset link\\n4. Create a new password\\n\\nIf you don't receive the email within 5 minutes, please let me know and I'll manually reset it for you.\\n\\nBest regards"
    },
    {
      "title": "Request Account Details",
      "content": "Hi [Name],\\n\\nI'm sorry you're having trouble accessing your account. I'd like to help resolve this quickly.\\n\\nCould you please confirm:\\n- The email address associated with your account\\n- When you last successfully logged in\\n- Any error messages you're seeing\\n\\nOnce I have these details, I can investigate further and get you back into your account.\\n\\nThank you for your patience!"
    },
    {
      "title": "Escalation Notice",
      "content": "Hi [Name],\\n\\nThank you for reaching out. I can see this is preventing you from accessing your aquarium data, and I want to resolve this as quickly as possible.\\n\\nI'm escalating your case to our technical team for immediate investigation. You should hear back within the next 2 hours with a solution.\\n\\nIn the meantime, please don't hesitate to reply if you have any questions.\\n\\nWarm regards"
    }
  ]
}

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
    
    let templates = [];
    
    // Try to get structured output from tool_calls first
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const parsed = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        templates = parsed.templates || [];
        console.log('Parsed templates from tool call');
      } catch (e) {
        console.error('Error parsing tool call arguments:', e);
      }
    }
    
    // Fallback to content parsing if no tool calls
    if (templates.length === 0) {
      const content = data.choices[0]?.message?.content;
      
      if (content) {
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
      }
    }

    // Ensure we have at least one template
    if (templates.length === 0) {
      templates = [{
        title: "Default Response",
        content: "Thank you for reaching out. We're reviewing your request and will respond as soon as possible."
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
