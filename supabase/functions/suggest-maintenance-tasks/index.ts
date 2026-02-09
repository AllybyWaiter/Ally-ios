import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import {
  handleCors,
  createLogger,
  validateUuid,
  collectErrors,
  validationErrorResponse,
  checkRateLimit,
  rateLimitExceededResponse,
  extractIdentifier,
  handleAIGatewayError,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";

const DEFAULT_AQUARIUM_SUGGESTIONS = [
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

const DEFAULT_POOL_SUGGESTIONS = [
  {
    title: "Test & Balance Water Chemistry",
    description: "Check chlorine, pH, and alkalinity levels. Adjust as needed.",
    priority: "high",
    category: "testing",
    reasoning: "Pool chemistry should be tested 2-3 times per week"
  },
  {
    title: "Weekly Shock Treatment",
    description: "Add pool shock to oxidize contaminants and boost chlorine levels. Use 1 lb per 10,000 gallons.",
    priority: "medium",
    category: "shock_treatment",
    reasoning: "Weekly shock treatment prevents algae and bacteria buildup"
  },
  {
    title: "Backwash Filter",
    description: "Backwash the filter when pressure gauge reads 8-10 PSI above clean baseline.",
    priority: "medium",
    category: "backwash",
    reasoning: "Regular backwashing maintains filter efficiency and water clarity"
  },
  {
    title: "Clean Pool Cover",
    description: "Remove debris, rinse with fresh water, and check for damage or wear.",
    priority: "low",
    category: "cover_cleaning",
    reasoning: "Clean covers last longer and prevent debris from entering the pool"
  },
  {
    title: "Empty Skimmer Baskets",
    description: "Remove debris from skimmer and pump baskets to maintain proper flow.",
    priority: "medium",
    category: "skimmer_basket",
    reasoning: "Keeps water flowing properly through filter system"
  }
];

const DEFAULT_SPA_SUGGESTIONS = [
  {
    title: "Test Sanitizer Levels",
    description: "Check chlorine or bromine levels before each use. Target: Chlorine 1-3 ppm, Bromine 3-5 ppm.",
    priority: "high",
    category: "testing",
    reasoning: "Hot water requires more frequent sanitizer monitoring"
  },
  {
    title: "Shock Treatment",
    description: "Apply spa shock after heavy use or weekly. Hot water accelerates chemical breakdown.",
    priority: "medium",
    category: "shock_treatment",
    reasoning: "Spas need more frequent shocking due to higher bather load relative to volume"
  },
  {
    title: "Clean Spa Cover",
    description: "Wipe down cover with mild cleaner, condition vinyl, and check for waterlogging or damage.",
    priority: "medium",
    category: "cover_cleaning",
    reasoning: "Spa covers trap heat and need regular maintenance to stay effective"
  },
  {
    title: "Drain and Refill",
    description: "Drain spa completely and refill with fresh water. Clean shell while empty.",
    priority: "low",
    category: "drain_refresh",
    reasoning: "Spas should be drained every 3-4 months to reset water chemistry"
  }
];

// Helper to determine current season based on hemisphere
function getSeasonalContext(hemisphere: string): { isFall: boolean; isSpring: boolean; seasonName: string } {
  const month = new Date().getMonth() + 1; // 1-12
  const isNorthern = hemisphere !== 'southern';
  
  // Fall: Sept-Nov (North) or Mar-May (South)
  const isFall = isNorthern ? (month >= 9 && month <= 11) : (month >= 3 && month <= 5);
  // Spring: Mar-May (North) or Sept-Nov (South)
  const isSpring = isNorthern ? (month >= 3 && month <= 5) : (month >= 9 && month <= 11);
  
  let seasonName = 'unknown';
  if (isNorthern) {
    if (month >= 3 && month <= 5) seasonName = 'spring';
    else if (month >= 6 && month <= 8) seasonName = 'summer';
    else if (month >= 9 && month <= 11) seasonName = 'fall';
    else seasonName = 'winter';
  } else {
    if (month >= 3 && month <= 5) seasonName = 'fall';
    else if (month >= 6 && month <= 8) seasonName = 'winter';
    else if (month >= 9 && month <= 11) seasonName = 'spring';
    else seasonName = 'summer';
  }
  
  return { isFall, isSpring, seasonName };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('suggest-maintenance-tasks');

  try {
    // ========== AUTHENTICATION FIRST ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return createErrorResponse('Authentication required', logger, { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create user-scoped client to verify auth
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      logger.warn('Authentication failed', { error: authError?.message });
      return createErrorResponse('Authentication failed', logger, { status: 401 });
    }

    logger.info('User authenticated', { userId: user.id });

    const body = await req.json();
    const { aquariumId } = body;

    // Input validation
    const errors = collectErrors(
      validateUuid(aquariumId, 'aquariumId')
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // ========== VERIFY USER OWNS THIS AQUARIUM ==========
    const { data: aquariumCheck, error: ownerError } = await supabaseAuth
      .from('aquariums')
      .select('id, user_id')
      .eq('id', aquariumId)
      .eq('user_id', user.id)
      .single();

    if (ownerError || !aquariumCheck) {
      logger.warn('Aquarium access denied', { aquariumId, userId: user.id });
      return createErrorResponse('Aquarium not found or access denied', logger, { status: 404 });
    }

    // Rate limiting (5 requests per minute - AI intensive)
    const identifier = extractIdentifier(req, user.id);
    const rateLimitResult = checkRateLimit({
      maxRequests: 5,
      windowMs: 60 * 1000,
      identifier: `maintenance-tasks:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // ========== NOW USE SERVICE ROLE FOR DATA FETCH ==========
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      logger.error('OPENAI_API_KEY not configured');
      return createErrorResponse('AI service not configured', logger, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Fetching aquarium data', { aquariumId, userId: user.id });

    // Fetch aquarium details
    const { data: aquarium, error: aquariumError } = await supabase
      .from('aquariums')
      .select('*')
      .eq('id', aquariumId)
      .single();

    if (aquariumError || !aquarium) {
      logger.error('Failed to fetch aquarium', { error: aquariumError?.message, aquariumId });
      return createErrorResponse('Aquarium not found', logger, { status: 404 });
    }

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

    // Fetch user's hemisphere and weather preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('hemisphere, weather_enabled, latitude, longitude')
      .eq('user_id', aquarium.user_id)
      .maybeSingle();

    const hemisphere = profile?.hemisphere || 'northern';
    const seasonalContext = getSeasonalContext(hemisphere);

    // Fetch weather data for pool/spa owners if location is available
    let weatherContext: {
      temperature: number;
      uvIndex: number;
      condition: string;
      windSpeed: number;
      humidity: number;
      forecast: Array<{ date: string; condition: string; tempMax: number; uvIndexMax: number }>;
    } | null = null;

    const isPoolOrSpaType = ['pool', 'spa', 'hot_tub'].includes((aquarium?.type || '').toLowerCase());
    
    if (isPoolOrSpaType && profile?.weather_enabled &&
        typeof profile?.latitude === 'number' && typeof profile?.longitude === 'number' &&
        isFinite(profile.latitude) && isFinite(profile.longitude) &&
        profile.latitude >= -90 && profile.latitude <= 90 &&
        profile.longitude >= -180 && profile.longitude <= 180) {
      try {
        logger.info('Fetching weather data for pool/spa', { 
          lat: profile.latitude, 
          lon: profile.longitude 
        });
        
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${profile.latitude}&longitude=${profile.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,uv_index_max&timezone=auto&forecast_days=3`;
        
        const weatherResponse = await fetch(weatherUrl);
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          
          // Map weather code to condition string
          const mapWeatherCode = (code: number): string => {
            if (code === 0) return 'clear';
            if (code <= 3) return 'partly_cloudy';
            if (code <= 49) return 'cloudy';
            if (code <= 69) return 'rain';
            if (code <= 79) return 'snow';
            if (code <= 99) return 'storm';
            return 'unknown';
          };
          
          weatherContext = {
            temperature: Math.round(weatherData.current?.temperature_2m || 0),
            uvIndex: Math.round(weatherData.current?.uv_index || 0),
            condition: mapWeatherCode(weatherData.current?.weather_code || 0),
            windSpeed: Math.round(weatherData.current?.wind_speed_10m || 0),
            humidity: Math.round(weatherData.current?.relative_humidity_2m || 0),
            forecast: (weatherData.daily?.time || []).map((date: string, i: number) => ({
              date,
              condition: mapWeatherCode(weatherData.daily?.weather_code?.[i] || 0),
              tempMax: Math.round(weatherData.daily?.temperature_2m_max?.[i] || 0),
              uvIndexMax: Math.round(weatherData.daily?.uv_index_max?.[i] || 0),
            })),
          };
          
          logger.info('Weather data fetched', { 
            temp: weatherContext.temperature, 
            uv: weatherContext.uvIndex,
            condition: weatherContext.condition 
          });
        }
      } catch (weatherError) {
        logger.warn('Failed to fetch weather data', { error: weatherError });
        // Continue without weather - graceful degradation
      }
    }

    // Build context for AI
    const context: Record<string, unknown> = {
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
        brand: eq.brand,
        model: eq.model,
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
      season: seasonalContext.seasonName,
      hemisphere: hemisphere,
    };
    
    // Add weather context for pool/spa if available
    if (weatherContext) {
      context.weather = weatherContext;
    }

    const today = new Date().toISOString().split('T')[0];

    logger.info('Calling AI for task suggestions', {
      aquariumType: aquarium?.type,
      waterTestCount: waterTests?.length || 0,
      equipmentCount: equipment?.length || 0,
      hasWeatherContext: !!weatherContext,
      weatherTemp: weatherContext?.temperature,
      weatherUV: weatherContext?.uvIndex,
    });

    const isPoolOrSpa = ['pool', 'spa', 'hot_tub'].includes((aquarium?.type || '').toLowerCase());
    const isSpa = ['spa', 'hot_tub'].includes((aquarium?.type || '').toLowerCase());

    // Build seasonal instructions for pools
    let seasonalInstructions = '';
    if (isPoolOrSpa && !isSpa) {
      if (seasonalContext.isFall) {
        seasonalInstructions = `
SEASONAL PRIORITY - FALL WINTERIZATION:
It is currently ${seasonalContext.seasonName} in the ${hemisphere} hemisphere. If the pool has not been winterized yet this season, include a high-priority winterization task. Check if "winterize" or "winterization" appears in recent completed tasks before suggesting.`;
      } else if (seasonalContext.isSpring) {
        seasonalInstructions = `
SEASONAL PRIORITY - SPRING OPENING:
It is currently ${seasonalContext.seasonName} in the ${hemisphere} hemisphere. If the pool has not been opened yet this season, include a high-priority spring opening task. Check if "opening" or "spring" appears in recent completed tasks before suggesting.`;
      }
    }

    // Build weather-based instructions for pools/spas
    let weatherInstructions = '';
    if (weatherContext && isPoolOrSpa) {
      const uvLevel = weatherContext.uvIndex >= 8 ? 'Very High' : 
                      weatherContext.uvIndex >= 6 ? 'High' :
                      weatherContext.uvIndex >= 3 ? 'Moderate' : 'Low';
      
      const rainForecast = weatherContext.forecast.find(f => f.condition === 'rain' || f.condition === 'storm');
      
      weatherInstructions = `
WEATHER-AWARE MAINTENANCE:
Current conditions: ${weatherContext.temperature}°F (UV Index: ${weatherContext.uvIndex} - ${uvLevel}), ${weatherContext.condition.replace('_', ' ')}, Wind: ${weatherContext.windSpeed} mph, Humidity: ${weatherContext.humidity}%
${rainForecast ? `Rain/storms expected: ${rainForecast.date}` : 'No rain in forecast'}

Weather-based recommendations to consider:
${weatherContext.uvIndex >= 8 ? '- VERY HIGH UV: Chlorine consumption increases 2-3x. Recommend daily sanitizer testing and possible extra shock.' : ''}
${weatherContext.uvIndex >= 6 && weatherContext.uvIndex < 8 ? '- HIGH UV: Chlorine degrades faster. Consider testing sanitizer levels more frequently.' : ''}
${weatherContext.temperature >= 90 ? '- HOT TEMPS (90°F+): Algae thrives in warm water. Increase shock frequency and monitor for algae.' : ''}
${weatherContext.temperature >= 85 && weatherContext.temperature < 90 ? '- WARM TEMPS: Higher water temps accelerate chemical breakdown. Keep sanitizer levels optimal.' : ''}
${weatherContext.temperature < 50 ? '- COLD TEMPS: Consider heating efficiency check and cover usage to retain heat.' : ''}
${weatherContext.windSpeed >= 15 ? '- HIGH WINDS: Expect more debris. Clean skimmer baskets more frequently.' : ''}
${rainForecast ? `- RAIN INCOMING: Plan to test and adjust pH after rain (typically drops pH).` : ''}
${weatherContext.humidity >= 80 ? '- HIGH HUMIDITY: Slower evaporation may affect water levels and chemistry balance.' : ''}

Include weather reasoning in your task suggestions when relevant. Mention specific weather conditions in the reasoning field.`;
    }

    const systemPrompt = isPoolOrSpa ? `You are an expert ${isSpa ? 'spa/hot tub' : 'pool'} maintenance advisor. Analyze the provided data and suggest 3-5 actionable maintenance tasks.

ANALYSIS PRIORITIES:
1. Water chemistry balance - Look for concerning chlorine/bromine levels, pH drift, alkalinity issues
2. Equipment maintenance schedules - Suggest maintenance based on intervals and last service dates
3. ${isSpa ? 'Spa-specific needs - Hot water degrades chemicals faster, drain/refill cycles, cover maintenance' : 'Seasonal considerations - Winterization, spring opening, algae prevention'}
4. Recent task history - Avoid duplicating recently completed tasks
${weatherContext ? '5. Current weather conditions - Factor in UV, temperature, and incoming weather' : ''}
${seasonalInstructions}
${weatherInstructions}

TASK CATEGORIES:
- testing: Water testing (specify which parameters)
- shock_treatment: Shock/oxidizer treatment
- chemical_balancing: pH, alkalinity, calcium adjustment
- filter_cleaning: Filter cleaning
- backwash: Backwash filter (if applicable)
- skimmer_basket: Empty skimmer and pump baskets
- vacuuming: Vacuuming
- brush_walls: Brush walls and floor
- cover_cleaning: Clean and maintain cover
- salt_cell_cleaning: Clean salt chlorine generator cell
- algae_treatment: Algae prevention or treatment
- drain_refresh: Drain and refill water (especially for spas every 3-4 months)
- equipment_maintenance: Pump, heater, SWG maintenance
- winterize: Winterization tasks
- opening: Spring opening tasks
- other: Other maintenance

${isSpa ? `SPA-SPECIFIC GUIDELINES:
- Recommend drain/refill every 3-4 months based on usage
- Bromine systems need 3-5 ppm, chlorine needs 1-3 ppm
- Cover maintenance is critical for heat retention
- Shock after every heavy use session` : `POOL-SPECIFIC GUIDELINES:
- Weekly shock treatment prevents algae
- Backwash when filter pressure rises 8-10 PSI above clean
- Salt cells need cleaning every 3-6 months
- Cover cleaning extends lifespan and prevents debris`}

PRIORITY GUIDELINES:
- high: Immediate action needed (low/high sanitizer, pH out of range, equipment failure, seasonal tasks, extreme weather conditions)
- medium: Should be done within the week (routine maintenance, slight imbalances, weather-related adjustments)
- low: Nice to do when convenient (optimization, aesthetic improvements)

Today's date is ${today}. Current season: ${seasonalContext.seasonName} (${hemisphere} hemisphere). Use this for calculating days since last maintenance and setting recommended dates.`
    : `You are an expert aquarium maintenance advisor. Analyze the provided aquarium data and suggest 3-5 actionable maintenance tasks.

ANALYSIS PRIORITIES:
1. Water parameter trends - Look for concerning patterns (rising nitrates, pH drift, ammonia spikes)
2. Equipment maintenance schedules - Suggest maintenance based on intervals and last service dates
3. Tank type and livestock needs - Consider species-specific requirements
4. Seasonal considerations - Temperature stability, algae prevention
5. Recent task history - Avoid duplicating recently completed tasks

TASK CATEGORIES:
- water_change: Partial water changes (suggest % based on parameters)
- cleaning: Glass cleaning, gravel vacuuming, decoration cleaning
- equipment_maintenance: Filter cleaning, impeller check, light bulb replacement
- testing: Water parameter testing (specify which parameters)
- feeding: Feeding schedule adjustments, food variety
- other: Plant trimming, quarantine checks, etc.

PRIORITY GUIDELINES:
- high: Immediate action needed (elevated ammonia/nitrite, overdue equipment service, health issues)
- medium: Should be done within the week (routine maintenance, mildly elevated parameters)
- low: Nice to do when convenient (optimization, aesthetic improvements)

Today's date is ${today}. Use this for calculating days since last maintenance and setting recommended dates.`;

    const userPrompt = `Analyze this ${isPoolOrSpa ? 'pool/spa' : 'aquarium'} and suggest 3-5 specific, actionable maintenance tasks:\n\n${JSON.stringify(context, null, 2)}`;

    const aiBody = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_tasks",
            description: "Return 3-5 actionable task suggestions based on aquarium analysis.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Clear, action-oriented task title" },
                      description: { type: "string", description: "Detailed instructions for completing the task" },
                      priority: { type: "string", enum: ["low", "medium", "high"], description: "Urgency level" },
              category: { 
                type: "string", 
                enum: isPoolOrSpa 
                  ? ["testing", "shock_treatment", "chemical_balancing", "filter_cleaning", "backwash", "skimmer_basket", "vacuuming", "brush_walls", "cover_cleaning", "salt_cell_cleaning", "algae_treatment", "drain_refresh", "equipment_maintenance", "winterize", "opening", "other"]
                  : ["water_change", "cleaning", "equipment_maintenance", "testing", "feeding", "other"], 
                description: "Task category" 
              },
                      recommendedDate: { type: "string", description: "ISO date string for when to do this task (YYYY-MM-DD)" },
                      reasoning: { type: "string", description: "Why this task is recommended based on the data" }
                    },
                    required: ["title", "description", "priority", "category", "reasoning"],
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
      tool_choice: { type: "function", function: { name: "suggest_tasks" } },
      temperature: 0.3
    };

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiBody),
    });

    const aiError = handleAIGatewayError(aiResponse, logger);
    if (aiError) return aiError;

    const aiData = await aiResponse.json();
    logger.debug('AI response received');

    let suggestions = [];
    
    // Try to get structured output from tool_calls
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const parsed = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
        suggestions = parsed.suggestions || [];
      } catch (e) {
        logger.error('Error parsing tool call arguments', e);
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
        logger.warn('Error parsing content', e);
      }
    }

    if (suggestions.length === 0) {
      logger.warn('No AI suggestions generated, using defaults');
      suggestions = isSpa ? DEFAULT_SPA_SUGGESTIONS : (isPoolOrSpa ? DEFAULT_POOL_SUGGESTIONS : DEFAULT_AQUARIUM_SUGGESTIONS);
    }

    logger.info('Task suggestions generated', { count: suggestions.length });

    return createSuccessResponse({ suggestions });

  } catch (error) {
    return createErrorResponse(error, logger);
  }
});
