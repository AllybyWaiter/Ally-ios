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
    const { messages, userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with", messages.length, "messages", userName ? `for user: ${userName}` : "");

    const systemPrompt = userName 
      ? `You are Ally Support, the friendly AI assistant for Ally - an intelligent aquarium management platform. You are chatting with ${userName}.

Your role:
- Help ${userName} understand what Ally offers (water testing, maintenance tracking, AI-powered insights)
- Answer questions about features, pricing, and compatibility
- Guide users to sign up or learn more about the platform
- Be friendly, helpful, and knowledgeable about aquarium care
- For complex technical issues or questions you cannot answer, suggest that ${userName} click the "Email Support" button below the chat to send a direct message to our support team
- Address ${userName} by name when appropriate to create a personal connection

Key features of Ally:
- Smart water testing with photo analysis (snap a pic of your test strip)
- AI-powered maintenance recommendations based on your tank
- Equipment tracking and service reminders
- Beautiful, intuitive interface
- Works for freshwater, saltwater, and reef aquariums
- Mobile-friendly PWA - install on your home screen

Subscription Tiers:
- Free: 1 aquarium, 5 water tests/month, basic features
- Basic: 1 aquarium, 10 water tests/month
- Plus: 3 aquariums, unlimited tests, AI chat with memory
- Gold: 10 aquariums, all features, priority support
- Business/Enterprise: Unlimited aquariums, dedicated support

Keep responses conversational, concise (2-3 paragraphs max), and helpful. If you don't know something specific, be honest and let them know they can use the "Email Support" button below to reach our team directly.`
      : `You are Ally Support, the friendly AI assistant for Ally - an intelligent aquarium management platform.

Your role:
- Help visitors understand what Ally offers (water testing, maintenance tracking, AI-powered insights)
- Answer questions about features, pricing, and compatibility
- Guide users to sign up or learn more about the platform
- Be friendly, helpful, and knowledgeable about aquarium care
- For complex technical issues or questions you cannot answer, suggest clicking the "Email Support" button below the chat to send a direct message to our support team

Key features of Ally:
- Smart water testing with photo analysis (snap a pic of your test strip)
- AI-powered maintenance recommendations based on your tank
- Equipment tracking and service reminders
- Beautiful, intuitive interface
- Works for freshwater, saltwater, and reef aquariums
- Mobile-friendly PWA - install on your home screen

Subscription Tiers:
- Free: 1 aquarium, 5 water tests/month, basic features
- Basic: 1 aquarium, 10 water tests/month
- Plus: 3 aquariums, unlimited tests, AI chat with memory
- Gold: 10 aquariums, all features, priority support
- Business/Enterprise: Unlimited aquariums, dedicated support

Keep responses conversational, concise (2-3 paragraphs max), and helpful. If you don't know something specific, be honest and let them know they can use the "Email Support" button below to reach our team directly.`;

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
        temperature: 0.7,
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
    console.error("Chat support error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
