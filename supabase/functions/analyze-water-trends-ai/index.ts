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
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";

// Tiers that have access to AI-powered alerts
const AI_ALERT_TIERS = ['plus', 'gold', 'business', 'enterprise'];

interface TrendAlert {
  parameter: string;
  alert_type: 'rising' | 'falling' | 'unstable' | 'predictive' | 'seasonal' | 'stocking' | 'correlation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
  timeframe?: string;
  affected_inhabitants?: string[];
  confidence: number;
}

interface AIAnalysisResult {
  alerts: TrendAlert[];
  summary: string;
  next_test_recommendation: string;
}

// Rule-based fallback analysis (same logic as existing function)
function analyzeWithRules(
  parameterHistory: { name: string; value: number; date: string }[],
  waterType: string
): TrendAlert[] {
  const thresholds: Record<string, Record<string, { min: number; max: number }>> = {
    freshwater: {
      pH: { min: 6.5, max: 7.5 },
      Ammonia: { min: 0, max: 0.25 },
      Nitrite: { min: 0, max: 0.25 },
      Nitrate: { min: 0, max: 40 },
    },
    saltwater: {
      pH: { min: 8.1, max: 8.4 },
      Ammonia: { min: 0, max: 0.1 },
      Nitrite: { min: 0, max: 0.1 },
      Nitrate: { min: 0, max: 20 },
    },
    reef: {
      pH: { min: 8.1, max: 8.4 },
      Ammonia: { min: 0, max: 0.05 },
      Nitrite: { min: 0, max: 0.05 },
      Nitrate: { min: 0, max: 10 },
    },
    pool: {
      pH: { min: 7.2, max: 7.6 },
      'Free Chlorine': { min: 1, max: 3 },
    },
  };

  const alerts: TrendAlert[] = [];
  const threshold = thresholds[waterType] || thresholds.freshwater;

  // Group by parameter
  const groups = new Map<string, { value: number; date: string }[]>();
  for (const param of parameterHistory) {
    if (!groups.has(param.name)) groups.set(param.name, []);
    groups.get(param.name)!.push({ value: param.value, date: param.date });
  }

  for (const [name, values] of groups) {
    if (values.length < 3) continue;
    values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const recent = values.slice(-5).map(v => v.value);
    const current = recent[recent.length - 1];
    const first = recent[0];
    const percentChange = first !== 0 ? ((current - first) / Math.abs(first)) * 100 : 0;

    let direction: 'rising' | 'falling' | 'stable' = 'stable';
    let risingCount = 0, fallingCount = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i - 1]) risingCount++;
      else if (recent[i] < recent[i - 1]) fallingCount++;
    }

    if (risingCount >= recent.length - 1 && Math.abs(percentChange) > 10) direction = 'rising';
    if (fallingCount >= recent.length - 1 && Math.abs(percentChange) > 10) direction = 'falling';

    if (direction === 'stable') continue;

    const paramThreshold = threshold[name];
    let severity: 'info' | 'warning' | 'critical' = 'info';

    if (paramThreshold) {
      if (direction === 'rising' && current > paramThreshold.max) severity = 'warning';
      if (direction === 'falling' && current < paramThreshold.min) severity = 'warning';
      if (Math.abs(percentChange) > 30) severity = 'warning';
    }

    alerts.push({
      parameter: name,
      alert_type: direction,
      severity,
      message: `${name} is ${direction} (${percentChange.toFixed(0)}% change)`,
      recommendation: direction === 'rising' 
        ? `Consider actions to reduce ${name} levels.`
        : `Consider actions to increase ${name} levels.`,
      confidence: 0.7,
    });
  }

  return alerts;
}

function getWaterType(aquariumType: string): string {
  const type = aquariumType.toLowerCase();
  if (['pool'].includes(type)) return 'pool';
  if (['spa', 'hot_tub'].includes(type)) return 'spa';
  if (['saltwater', 'marine'].includes(type)) return 'saltwater';
  if (['reef'].includes(type)) return 'reef';
  return 'freshwater';
}

function getCurrentSeason(hemisphere: string | null): string {
  const month = new Date().getMonth();
  const isNorthern = hemisphere !== 'southern';
  
  if (month >= 2 && month <= 4) return isNorthern ? 'spring' : 'fall';
  if (month >= 5 && month <= 7) return isNorthern ? 'summer' : 'winter';
  if (month >= 8 && month <= 10) return isNorthern ? 'fall' : 'spring';
  return isNorthern ? 'winter' : 'summer';
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('analyze-water-trends-ai');

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return createErrorResponse('Authentication required', logger, { status: 401 });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authUser) {
      logger.warn('Authentication failed', { error: authError?.message });
      return createErrorResponse('Authentication failed', logger, { status: 401 });
    }

    // Use authenticated user ID — never trust client-supplied userId
    const userId = authUser.id;

    const body = await req.json();
    const { aquariumId } = body;

    // Input validation
    const errors = collectErrors(
      validateUuid(aquariumId, 'aquariumId'),
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Rate limiting
    const identifier = extractIdentifier(req, userId);
    const rateLimitResult = checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: `water-trends-ai:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile for tier check and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, skill_level, hemisphere')
      .eq('user_id', userId)
      .single();

    const subscriptionTier = profile?.subscription_tier || 'free';
    const hasAIAlertAccess = AI_ALERT_TIERS.includes(subscriptionTier);

    logger.info('Checking AI alert access', { tier: subscriptionTier, hasAccess: hasAIAlertAccess });

    // Fetch aquarium data — verify the authenticated user owns this aquarium
    const { data: aquarium } = await supabase
      .from('aquariums')
      .select('type, name, volume_gallons, setup_date')
      .eq('id', aquariumId)
      .eq('user_id', userId)
      .single();

    if (!aquarium) {
      return createErrorResponse('Aquarium not found', logger, { status: 404 });
    }

    const waterType = getWaterType(aquarium.type);

    // Fetch last 30 days of water tests
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: waterTests } = await supabase
      .from('water_tests')
      .select('id, test_date, test_parameters(*)')
      .eq('aquarium_id', aquariumId)
      .gte('test_date', thirtyDaysAgo.toISOString())
      .order('test_date', { ascending: false });

    if (!waterTests || waterTests.length < 3) {
      logger.info('Not enough tests for analysis', { count: waterTests?.length || 0 });
      return createSuccessResponse({ 
        alerts: [], 
        message: 'Need at least 3 tests for trend analysis',
        model: 'none'
      });
    }

    // Flatten parameters
    const parameterHistory: { name: string; value: number; date: string }[] = [];
    for (const test of waterTests) {
      if (test.test_parameters) {
        for (const param of test.test_parameters as { parameter_name: string; value: number | string; unit?: string }[]) {
          parameterHistory.push({
            name: param.parameter_name,
            value: Number(param.value),
            date: test.test_date,
          });
        }
      }
    }

    // If user doesn't have AI access, use rule-based fallback
    if (!hasAIAlertAccess) {
      logger.info('Using rule-based analysis for non-Plus user');
      const ruleAlerts = analyzeWithRules(parameterHistory, waterType);
      
      // Save rule-based alerts
      await saveAlerts(supabase, ruleAlerts, aquariumId, userId, aquarium.name, 'rule', logger);
      
      return createSuccessResponse({
        alerts: ruleAlerts,
        model: 'rule',
        message: 'Upgrade to Plus for AI-powered predictive alerts with personalized recommendations',
        upgradeRequired: true,
      });
    }

    // Fetch livestock and plants for context
    const [{ data: livestock }, { data: plants }, { data: equipment }] = await Promise.all([
      supabase.from('livestock').select('name, species, quantity, health_status').eq('aquarium_id', aquariumId),
      supabase.from('plants').select('name, species, quantity, condition').eq('aquarium_id', aquariumId),
      supabase.from('equipment').select('name, equipment_type, brand, model').eq('aquarium_id', aquariumId),
    ]);

    // Format test history for AI
    const formattedHistory = waterTests.slice(0, 10).map(test => {
      const params = (test.test_parameters as { parameter_name: string; value: number | string; unit?: string }[])?.map(p => `${p.parameter_name}: ${p.value}${p.unit || ''}`).join(', ') || 'No parameters';
      return `${test.test_date}: ${params}`;
    }).join('\n');

    const livestockContext = livestock?.map(l => `${l.quantity}x ${l.name} (${l.species}) - ${l.health_status}`).join('\n') || 'None';
    const plantContext = plants?.map(p => `${p.quantity}x ${p.name} (${p.species}) - ${p.condition}`).join('\n') || 'None';
    const equipmentContext = equipment?.map(e => `${e.name} (${e.equipment_type}) - ${e.brand || ''} ${e.model || ''}`).join('\n') || 'None';

    const tankAge = aquarium.setup_date 
      ? Math.floor((Date.now() - new Date(aquarium.setup_date).getTime()) / (30 * 24 * 60 * 60 * 1000))
      : null;
    
    const currentSeason = getCurrentSeason(profile?.hemisphere || null);

    // Build AI prompt
    const analysisPrompt = `Analyze water quality trends for this water body and identify concerns:

AQUARIUM PROFILE:
- Name: ${aquarium.name}
- Type: ${aquarium.type} (${waterType})
- Volume: ${aquarium.volume_gallons || 'Unknown'} gallons
- Setup Date: ${aquarium.setup_date || 'Unknown'} (${tankAge ? `${tankAge} months old` : 'Age unknown'})

WATER TEST HISTORY (Last 30 days, newest first):
${formattedHistory}

LIVESTOCK (consider species sensitivities):
${livestockContext}

PLANTS:
${plantContext}

EQUIPMENT:
${equipmentContext}

USER PREFERENCES:
- Skill Level: ${profile?.skill_level || 'Unknown'}
- Hemisphere: ${profile?.hemisphere || 'northern'} (Season: ${currentSeason})

ANALYSIS TASKS:
1. Identify concerning trends (not just threshold violations)
2. Predict problems BEFORE they become critical
3. Consider livestock-specific sensitivities (e.g., discus need pH 6.5-7.0)
4. Account for seasonal factors and tank maturity
5. Suggest proactive actions with specific timing
6. For pools/spas, consider UV degradation of chlorine in summer

Respond using the analyze_trends tool with your findings. Include:
- Predictive alerts for problems that may occur in the next 7-14 days
- Species-specific concerns based on livestock sensitivities
- Seasonal considerations where relevant
- Confidence scores (0.0-1.0) for each alert`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      logger.warn('LOVABLE_API_KEY not set, falling back to rules');
      const ruleAlerts = analyzeWithRules(parameterHistory, waterType);
      await saveAlerts(supabase, ruleAlerts, aquariumId, userId, aquarium.name, 'rule', logger);
      return createSuccessResponse({ alerts: ruleAlerts, model: 'rule' });
    }

    // Call Lovable AI with tool calling
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert aquarist and water chemistry analyst. Analyze water quality trends and predict potential problems before they occur. Be specific about which inhabitants are affected and provide actionable recommendations.' },
          { role: 'user', content: analysisPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_trends',
            description: 'Return water quality trend analysis with alerts and recommendations',
            parameters: {
              type: 'object',
              properties: {
                alerts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      parameter: { type: 'string', description: 'Water parameter name' },
                      alert_type: { 
                        type: 'string', 
                        enum: ['rising', 'falling', 'unstable', 'predictive', 'seasonal', 'stocking', 'correlation'],
                        description: 'Type of alert'
                      },
                      severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
                      message: { type: 'string', description: 'Clear description of the issue' },
                      recommendation: { type: 'string', description: 'Specific actionable recommendation' },
                      timeframe: { type: 'string', description: 'When action should be taken' },
                      affected_inhabitants: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Names of affected livestock/plants'
                      },
                      confidence: { type: 'number', description: 'Confidence score 0.0-1.0' }
                    },
                    required: ['parameter', 'alert_type', 'severity', 'message', 'recommendation', 'confidence']
                  }
                },
                summary: { type: 'string', description: 'Brief overall assessment' },
                next_test_recommendation: { type: 'string', description: 'When to test next and what to focus on' }
              },
              required: ['alerts', 'summary', 'next_test_recommendation']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_trends' } },
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('AI gateway error', { status: aiResponse.status, error: errorText });
      
      // Fallback to rules
      const ruleAlerts = analyzeWithRules(parameterHistory, waterType);
      await saveAlerts(supabase, ruleAlerts, aquariumId, userId, aquarium.name, 'rule', logger);
      return createSuccessResponse({ alerts: ruleAlerts, model: 'rule', fallbackReason: 'AI unavailable' });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      logger.warn('No tool call in AI response, falling back to rules');
      const ruleAlerts = analyzeWithRules(parameterHistory, waterType);
      await saveAlerts(supabase, ruleAlerts, aquariumId, userId, aquarium.name, 'rule', logger);
      return createSuccessResponse({ alerts: ruleAlerts, model: 'rule' });
    }

    let analysisResult: AIAnalysisResult;
    try {
      analysisResult = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      logger.error('Failed to parse AI response', parseError);
      const ruleAlerts = analyzeWithRules(parameterHistory, waterType);
      await saveAlerts(supabase, ruleAlerts, aquariumId, userId, aquarium.name, 'rule', logger);
      return createSuccessResponse({ alerts: ruleAlerts, model: 'rule' });
    }

    logger.info('AI analysis complete', { alertCount: analysisResult.alerts.length });

    // Save AI alerts
    await saveAlerts(supabase, analysisResult.alerts, aquariumId, userId, aquarium.name, 'ai', logger);

    return createSuccessResponse({
      alerts: analysisResult.alerts,
      summary: analysisResult.summary,
      nextTestRecommendation: analysisResult.next_test_recommendation,
      model: 'ai',
    });

  } catch (error) {
    logger.error('Error in AI trend analysis', error);
    return createErrorResponse(error, logger);
  }
});

async function saveAlerts(
  supabase: ReturnType<typeof createClient>,
  alerts: TrendAlert[],
  aquariumId: string,
  userId: string,
  aquariumName: string,
  model: 'ai' | 'rule',
  logger: ReturnType<typeof createLogger>
): Promise<void> {
  if (alerts.length === 0) return;

  // Check for existing undismissed alerts
  const { data: existingAlerts } = await supabase
    .from('water_test_alerts')
    .select('parameter_name, alert_type')
    .eq('aquarium_id', aquariumId)
    .eq('is_dismissed', false);

  const existingKeys = new Set(
    (existingAlerts || []).map((a: { parameter_name: string; alert_type: string }) => `${a.parameter_name}:${a.alert_type}`)
  );

  const newAlerts = alerts
    .filter(alert => !existingKeys.has(`${alert.parameter}:${alert.alert_type}`))
    .map(alert => ({
      user_id: userId,
      aquarium_id: aquariumId,
      parameter_name: alert.parameter,
      alert_type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      recommendation: alert.recommendation,
      timeframe: alert.timeframe || null,
      affected_inhabitants: alert.affected_inhabitants || null,
      confidence: alert.confidence,
      analysis_model: model,
      details: { aquariumName },
    }));

  if (newAlerts.length > 0) {
    const { error } = await supabase
      .from('water_test_alerts')
      .insert(newAlerts);

    if (error) {
      logger.error('Failed to save alerts', error);
    } else {
      logger.info('Saved alerts', { count: newAlerts.length, model });
    }
  }
}
