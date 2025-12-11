import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid parameter ranges for validation
const validRanges: Record<string, { min: number; max: number }> = {
  pH: { min: 4.0, max: 10.0 },
  Ammonia: { min: 0, max: 10 },
  Nitrite: { min: 0, max: 10 },
  Nitrate: { min: 0, max: 200 },
  GH: { min: 0, max: 500 },
  KH: { min: 0, max: 400 },
  Chlorine: { min: 0, max: 10 },
  Temperature: { min: 32, max: 100 },
};

// Validate and filter parameters within reasonable ranges
function validateWaterParameters(params: any[]): any[] {
  return params.filter(p => {
    const range = validRanges[p.name];
    if (!range) return true; // Allow unknown parameters
    if (typeof p.value !== 'number' || isNaN(p.value)) return false;
    return p.value >= range.min && p.value <= range.max;
  }).map(p => ({
    ...p,
    // Ensure status is valid
    status: ['good', 'warning', 'critical'].includes(p.status) ? p.status : 'warning',
    // Ensure confidence is between 0 and 1
    confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0.5
  }));
}

// Tool definition for structured water test analysis output
const analyzeWaterTestTool = {
  type: "function",
  function: {
    name: "analyze_water_test",
    description: "Extract water test parameters from image analysis",
    parameters: {
      type: "object",
      properties: {
        parameters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { 
                type: "string", 
                enum: ["pH", "Ammonia", "Nitrite", "Nitrate", "GH", "KH", "Chlorine", "Temperature"],
                description: "Parameter name"
              },
              value: { 
                type: "number",
                description: "Numeric value read from the test"
              },
              unit: { 
                type: "string",
                description: "Unit of measurement (ppm, dGH, dKH, °F, or empty for pH)"
              },
              status: { 
                type: "string", 
                enum: ["good", "warning", "critical"],
                description: "Status based on typical aquarium ranges"
              },
              confidence: { 
                type: "number",
                description: "Confidence score between 0 and 1"
              }
            },
            required: ["name", "value", "status", "confidence"],
            additionalProperties: false
          }
        },
        testType: { 
          type: "string", 
          enum: ["strip", "liquid", "digital"],
          description: "Type of test kit detected"
        },
        notes: { 
          type: "string",
          description: "Brief observation about the test or any issues"
        }
      },
      required: ["parameters", "testType"],
      additionalProperties: false
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== analyze-water-test-photo invoked ===');
    
    const { imageUrl, aquariumType } = await req.json();
    console.log('Request received - aquariumType:', aquariumType, 'imageUrl length:', imageUrl?.length || 0);
    
    if (!imageUrl) {
      console.error('Missing imageUrl in request');
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    console.log('LOVABLE_API_KEY present:', !!lovableApiKey);

    const systemPrompt = `You are an expert aquarium water test analyzer with extensive experience reading test strips and liquid test kits. Analyze the provided image carefully and extract all parameter values.

CRITICAL INSTRUCTIONS:
1. Look for the color chart/legend on the test kit packaging
2. Compare each test pad/vial color to the reference chart
3. Be precise - small color differences matter
4. If a reading is unclear, provide lower confidence

PARAMETER IDENTIFICATION:
- pH: Usually shows range 6.0-8.5, look for color gradient from yellow (acidic) to purple (alkaline)
- Ammonia (NH3/NH4+): 0-8 ppm, typically green to yellow gradient. 0 should be green/teal
- Nitrite (NO2): 0-5 ppm, usually light pink to dark pink/purple
- Nitrate (NO3): 0-160 ppm, often yellow to orange to red gradient
- GH (General Hardness): 0-300 ppm or 0-17 dGH, color varies by brand
- KH (Carbonate Hardness): 0-240 ppm or 0-14 dKH, color varies by brand
- Chlorine: 0-10 ppm, typically yellow to pink

STATUS DETERMINATION for ${aquariumType || 'freshwater'} aquarium:
- pH 6.5-7.5: good, <6.2 or >8.0: critical, otherwise: warning
- Ammonia 0: good, 0.1-0.5: warning, >0.5: critical
- Nitrite 0: good, 0.1-0.5: warning, >0.5: critical  
- Nitrate <20: good, 20-40: warning, >40: critical
- Chlorine 0: good, any detectable: critical

FEW-SHOT EXAMPLE:
For a 5-in-1 test strip showing: green pH pad, teal ammonia, light pink nitrite, light orange nitrate, blue GH:
{
  "parameters": [
    {"name": "pH", "value": 7.0, "unit": "", "status": "good", "confidence": 0.9},
    {"name": "Ammonia", "value": 0, "unit": "ppm", "status": "good", "confidence": 0.95},
    {"name": "Nitrite", "value": 0, "unit": "ppm", "status": "good", "confidence": 0.85},
    {"name": "Nitrate", "value": 20, "unit": "ppm", "status": "warning", "confidence": 0.8},
    {"name": "GH", "value": 120, "unit": "ppm", "status": "good", "confidence": 0.75}
  ],
  "testType": "strip",
  "notes": "API 5-in-1 strip, colors well saturated and readable"
}

For a liquid test kit with amber nitrate vial:
{
  "parameters": [
    {"name": "Nitrate", "value": 40, "unit": "ppm", "status": "warning", "confidence": 0.9}
  ],
  "testType": "liquid",
  "notes": "API liquid nitrate test, color matches 40ppm reference well"
}

Use the analyze_water_test tool to return your analysis.`;

    console.log('Calling Lovable AI (gemini-2.5-pro) for water test analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this water test image and extract all parameter values using the analyze_water_test tool.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        tools: [analyzeWaterTestTool],
        tool_choice: { type: "function", function: { name: "analyze_water_test" } },
        temperature: 0.2,
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

    let result;
    
    // Try to get structured output from tool_calls first
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        result = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
        console.log('Parsed from tool call successfully');
      } catch (e) {
        console.error('Error parsing tool call arguments:', e);
      }
    }
    
    // Fallback to content parsing if no tool calls
    if (!result) {
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
    }

    // Validate and ensure we have the right structure
    if (!result.parameters) {
      result.parameters = [];
    }
    
    // Apply validation layer to filter out invalid readings
    result.parameters = validateWaterParameters(result.parameters);
    
    console.log('Final validated result:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== Error in analyze-water-test-photo ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        parameters: [],
        testType: "unknown",
        notes: "Error analyzing image. Please try again or enter values manually."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
