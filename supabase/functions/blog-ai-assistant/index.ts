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
    const { action, input } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    let tools: any[] = [];
    let toolChoice: any = undefined;

    switch (action) {
      case 'generate':
        systemPrompt = 'You are a professional blog writer specializing in aquarium care and fishkeeping. Write engaging, informative, and SEO-friendly blog posts.';
        userPrompt = `Write a complete blog post about: ${input.topic}

Write an engaging, well-structured article with:
- A catchy title (max 200 chars)
- A compelling excerpt (max 300 chars)
- Full article content with proper HTML formatting (use <h2> for sections, <h3> for subsections, <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis)
- SEO-optimized title (max 60 chars)
- SEO description (max 160 chars)
- 4-5 relevant tags`;

        tools = [{
          type: "function",
          function: {
            name: "generate_blog_post",
            description: "Generate a complete blog post with all required fields",
            parameters: {
              type: "object",
              properties: {
                title: { 
                  type: "string",
                  description: "Engaging blog post title (max 200 chars)"
                },
                excerpt: { 
                  type: "string",
                  description: "Compelling summary (max 300 chars)"
                },
                content: { 
                  type: "string",
                  description: "Full article content with HTML formatting"
                },
                seo_title: { 
                  type: "string",
                  description: "SEO-optimized title (max 60 chars)"
                },
                seo_description: { 
                  type: "string",
                  description: "SEO description (max 160 chars)"
                },
                tags: { 
                  type: "string",
                  description: "Comma-separated tags (4-5 tags)"
                }
              },
              required: ["title", "excerpt", "content", "seo_title", "seo_description", "tags"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "generate_blog_post" } };
        break;

      case 'improve':
        systemPrompt = 'You are a professional blog editor specializing in aquarium content. Improve and enhance existing blog posts while maintaining their core message.';
        userPrompt = `Improve this blog post content:

Title: ${input.title}
Current Content: ${input.content}

Enhance with:
- Better structure and flow
- More engaging language
- Additional helpful details
- Clean HTML formatting (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>)

Return only the improved HTML content.`;

        tools = [{
          type: "function",
          function: {
            name: "improve_content",
            description: "Improve blog post content",
            parameters: {
              type: "object",
              properties: {
                content: { 
                  type: "string",
                  description: "Improved HTML content"
                }
              },
              required: ["content"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "improve_content" } };
        break;

      case 'seo':
        systemPrompt = 'You are an SEO expert specializing in blog optimization.';
        userPrompt = `Generate SEO-optimized fields for this blog post:

Title: ${input.title}
Content: ${input.content}

Create:
- SEO title (max 60 chars)
- SEO description (max 160 chars)
- 4-5 relevant tags (comma-separated)`;

        tools = [{
          type: "function",
          function: {
            name: "generate_seo",
            description: "Generate SEO fields for blog post",
            parameters: {
              type: "object",
              properties: {
                seo_title: { 
                  type: "string",
                  description: "SEO title (max 60 chars)"
                },
                seo_description: { 
                  type: "string",
                  description: "SEO description (max 160 chars)"
                },
                tags: { 
                  type: "string",
                  description: "Comma-separated tags (4-5 tags)"
                }
              },
              required: ["seo_title", "seo_description", "tags"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "generate_seo" } };
        break;

      default:
        throw new Error('Invalid action');
    }

    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = toolChoice;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const message = data.choices[0].message;

    // Extract structured output from tool call
    let result;
    if (message.tool_calls && message.tool_calls[0]) {
      const toolCall = message.tool_calls[0];
      result = JSON.parse(toolCall.function.arguments);
    } else if (message.content) {
      // Fallback to content parsing
      try {
        result = JSON.parse(message.content);
      } catch {
        result = { content: message.content };
      }
    } else {
      throw new Error('No valid response from AI');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in blog-ai-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
