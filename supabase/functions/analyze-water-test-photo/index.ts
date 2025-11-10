import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { imageUrl, aquariumType } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const systemPrompt = `You are an expert aquarium water test analyzer. Analyze the provided image of water test strips or liquid test results.

IMPORTANT: Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO backticks.

Your task:
1. Identify the type of test (strip, liquid, digital display)
2. Read the parameter values shown in the image
3. Match colors to their corresponding values based on the test kit color chart
4. Return structured data for each detected parameter

Common parameters to look for:
- pH (typically 6.0-8.5)
- Ammonia (NH3/NH4+, typically 0-8 ppm)
- Nitrite (NO2, typically 0-5 ppm)
- Nitrate (NO3, typically 0-160 ppm)
- GH (General Hardness, 0-300 ppm or 0-17 dGH)
- KH (Carbonate Hardness, 0-240 ppm or 0-14 dKH)
- Chlorine (0-10 ppm)

Aquarium type: ${aquariumType}

Return JSON format:
{
  "parameters": [
    {
      "name": "pH",
      "value": 7.2,
      "unit": "",
      "status": "normal",
      "confidence": 0.95
    }
  ],
  "testType": "strip" | "liquid" | "digital",
  "notes": "Brief observation about the test"
}

Status should be: "normal", "warning", or "critical" based on typical aquarium ranges.`;

    console.log('Calling Lovable AI for water test analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this water test image and extract all parameter values. Return only valid JSON.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent output
      }),
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

    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    let result;
    try {
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', cleanContent);
      
      // Fallback response
      result = {
        parameters: [],
        testType: "unknown",
        notes: "Unable to parse test results. Please ensure the image is clear and shows the test kit with good lighting.",
        error: "Failed to analyze image accurately"
      };
    }

    // Validate and ensure we have the right structure
    if (!result.parameters) {
      result.parameters = [];
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-water-test-photo:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        parameters: [],
        testType: "unknown",
        notes: "Error analyzing image"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
