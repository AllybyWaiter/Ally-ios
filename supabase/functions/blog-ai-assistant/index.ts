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

    switch (action) {
      case 'generate':
        systemPrompt = 'You are a professional blog writer specializing in aquarium care and fishkeeping. Write engaging, informative, and SEO-friendly blog posts.';
        userPrompt = `Write a complete blog post about: ${input.topic}

Include:
- An engaging title (max 200 chars)
- A compelling excerpt (max 300 chars)
- Full article content with proper formatting (use HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>)
- SEO title (max 60 chars)
- SEO description (max 160 chars)
- 4-5 relevant tags (comma-separated)

Return as JSON:
{
  "title": "Blog post title",
  "excerpt": "Brief summary",
  "content": "Full HTML content",
  "seo_title": "SEO title",
  "seo_description": "SEO description",
  "tags": "tag1, tag2, tag3"
}`;
        break;

      case 'improve':
        systemPrompt = 'You are a professional blog editor specializing in aquarium content. Improve and enhance existing blog posts while maintaining their core message.';
        userPrompt = `Improve this blog post:

Title: ${input.title}
Content: ${input.content}

Enhance the content with:
- Better structure and flow
- More engaging language
- Additional helpful details
- Proper HTML formatting (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>)

Return the improved content as HTML.`;
        break;

      case 'seo':
        systemPrompt = 'You are an SEO expert specializing in blog optimization.';
        userPrompt = `Generate SEO-optimized fields for this blog post:

Title: ${input.title}
Content: ${input.content}

Return as JSON:
{
  "seo_title": "SEO title (max 60 chars)",
  "seo_description": "SEO description (max 160 chars)",
  "tags": "tag1, tag2, tag3, tag4, tag5"
}`;
        break;

      default:
        throw new Error('Invalid action');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
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
    const content = data.choices[0].message.content;

    // Try to parse as JSON for structured responses
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // If not JSON, return as plain text (for 'improve' action)
      result = { content };
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
