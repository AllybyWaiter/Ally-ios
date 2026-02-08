import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { validateUrl, validateString, collectErrors, validationErrorResponse } from '../_shared/validation.ts';
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from '../_shared/rateLimit.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Valid parameter ranges for validation (aquarium + pool parameters)
const validRanges: Record<string, { min: number; max: number }> = {
  // Aquarium parameters
  pH: { min: 4.0, max: 10.0 },
  Ammonia: { min: 0, max: 10 },
  Nitrite: { min: 0, max: 10 },
  Nitrate: { min: 0, max: 200 },
  GH: { min: 0, max: 500 },
  KH: { min: 0, max: 400 },
  Chlorine: { min: 0, max: 10 },
  Temperature: { min: 32, max: 120 },
  // Pool/Spa parameters
  "Free Chlorine": { min: 0, max: 15 },
  "Total Chlorine": { min: 0, max: 20 },
  "Combined Chlorine": { min: 0, max: 5 },
  Alkalinity: { min: 0, max: 300 },
  "Total Alkalinity": { min: 0, max: 300 },
  "Calcium Hardness": { min: 0, max: 1000 },
  "Cyanuric Acid": { min: 0, max: 200 },
  CYA: { min: 0, max: 200 },
  Salt: { min: 0, max: 6000 },
  Bromine: { min: 0, max: 20 },
  TDS: { min: 0, max: 5000 },
};

// Validate and filter parameters within reasonable ranges
interface WaterParam { name: string; value: number; status?: string; confidence?: number }

function validateWaterParameters(params: WaterParam[]): WaterParam[] {
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
                enum: [
                  "pH", "Ammonia", "Nitrite", "Nitrate", "GH", "KH", "Chlorine", "Temperature",
                  "Free Chlorine", "Total Chlorine", "Combined Chlorine", "Alkalinity", "Total Alkalinity",
                  "Calcium Hardness", "Cyanuric Acid", "CYA", "Salt", "Bromine", "TDS"
                ],
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
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('analyze-water-test-photo');

  try {
    logger.info('Function invoked');
    
    const body = await req.json();
    const { imageUrl, aquariumType } = body;
    
    // Input validation
    const errors = collectErrors(
      validateUrl(imageUrl, 'imageUrl', { required: true }),
      validateString(aquariumType, 'aquariumType', { required: false, maxLength: 50 })
    );
    
    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }
    
    // Check base64 image size (limit to ~4MB encoded = ~3MB actual)
    if (imageUrl?.startsWith('data:')) {
      const base64Part = imageUrl.split(',')[1] || '';
      const estimatedSize = (base64Part.length * 3) / 4;
      const maxSize = 4 * 1024 * 1024; // 4MB
      if (estimatedSize > maxSize) {
        logger.warn('Base64 image too large', { estimatedSize });
        return validationErrorResponse([{ field: 'imageUrl', message: 'Image is too large. Please use an image under 4MB.' }]);
      }
    }

    logger.info('Request validated', { 
      aquariumType: aquariumType || 'freshwater',
      imageUrlLength: imageUrl?.length || 0
    });

    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing Authorization header');
      return createErrorResponse('Authorization required', logger, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      logger.warn('Invalid or expired JWT');
      return createErrorResponse('Invalid or expired token', logger, { status: 401 });
    }

    // Rate limiting - 5 requests per minute (photo analysis is resource-intensive)
    const rateLimitResult = checkRateLimit({
      maxRequests: 5,
      windowMs: 60 * 1000,
      identifier: extractIdentifier(req),
    }, logger);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded');
      return rateLimitExceededResponse(rateLimitResult);
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      logger.error('LOVABLE_API_KEY not configured');
      return createErrorResponse('AI service not configured', logger, { status: 500 });
    }

    const isPoolOrSpa = ['pool', 'spa', 'hot_tub'].includes((aquariumType || '').toLowerCase());

    const systemPrompt = isPoolOrSpa ? `You are an expert pool and spa water test analyzer with extensive experience reading test strips and liquid test kits. Analyze the provided image carefully and extract all parameter values.

CRITICAL INSTRUCTIONS:
1. Look for the color chart/legend on the test kit packaging
2. Compare each test pad/vial color to the reference chart
3. Be precise - small color differences matter
4. If a reading is unclear, provide lower confidence

POOL/SPA PARAMETER IDENTIFICATION:
- Free Chlorine: 0-10 ppm, typically yellow to pink/red gradient
- Total Chlorine: 0-10 ppm, similar color range to Free Chlorine
- pH: Usually shows range 6.2-8.4, look for color gradient
- Total Alkalinity: 0-240 ppm, varies by brand
- Calcium Hardness: 0-1000 ppm, color varies by brand
- Cyanuric Acid (CYA/Stabilizer): 0-150 ppm
- Bromine: 0-20 ppm (for spas using bromine)
- Salt: 0-5000 ppm (for saltwater pools), digital readers or color strips available

STATUS DETERMINATION for ${aquariumType || 'pool'}:
- Free Chlorine 1-3: good, <1 or >5: warning, 0 or >10: critical
- pH 7.2-7.6: good, 7.0-7.8: warning, <7.0 or >8.0: critical
- Total Alkalinity 80-120: good, 60-150: warning, <60 or >180: critical
- Calcium Hardness 200-400: good, 150-500: warning, <100 or >600: critical
- Cyanuric Acid 30-50: good, 20-80: warning, <20 or >100: critical
- Salt 2700-3400: good (for saltwater pools), <2500 or >3600: warning, <2000 or >4000: critical

Use the analyze_water_test tool to return your analysis.` : `You are an expert aquarium water test analyzer with extensive experience reading test strips and liquid test kits. Analyze the provided image carefully and extract all parameter values.

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

    logger.debug('Calling AI gateway for water test analysis');

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
      logger.error('AI gateway error', { status: aiResponse.status, error: errorText });
      
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
      
      return createErrorResponse('AI Gateway error', logger, { status: 502 });
    }

    const aiData = await aiResponse.json();
    logger.debug('AI response received', { 
      hasToolCalls: !!aiData.choices?.[0]?.message?.tool_calls,
      hasContent: !!aiData.choices?.[0]?.message?.content
    });

    let result;
    
    // Try to get structured output from tool_calls first
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        result = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
        logger.debug('Parsed from tool call successfully');
      } catch (e) {
        logger.error('Error parsing tool call arguments', { error: e });
      }
    }
    
    // Fallback to content parsing if no tool calls
    if (!result) {
      const content = aiData.choices?.[0]?.message?.content;
      
      if (!content) {
        logger.error('No content in AI response');
        return createSuccessResponse({
          parameters: [],
          testType: "unknown",
          notes: "Unable to analyze image. Please try again or enter values manually."
        });
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
        logger.error('JSON parse error', { error: parseError, content: cleanContent.substring(0, 200) });
        
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
    const originalCount = result.parameters.length;
    result.parameters = validateWaterParameters(result.parameters);
    
    logger.info('Analysis complete', { 
      parameterCount: result.parameters.length,
      filteredOut: originalCount - result.parameters.length,
      testType: result.testType
    });

    return createSuccessResponse(result);

  } catch (error) {
    logger.error('Unexpected error', { 
      errorType: error?.constructor?.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return new Response(
      JSON.stringify({
        error: 'Unable to analyze image. Please try again later.',
        parameters: [],
        testType: "unknown",
        notes: "Error analyzing image. Please try again or enter values manually."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
