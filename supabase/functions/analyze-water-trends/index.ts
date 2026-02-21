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

// Parameter thresholds for different water types
const PARAMETER_THRESHOLDS: Record<string, Record<string, { min: number; max: number; critical_min?: number; critical_max?: number }>> = {
  freshwater: {
    pH: { min: 6.5, max: 7.5, critical_min: 6.0, critical_max: 8.0 },
    Ammonia: { min: 0, max: 0.25, critical_max: 0.5 },
    Nitrite: { min: 0, max: 0.25, critical_max: 0.5 },
    Nitrate: { min: 0, max: 40, critical_max: 80 },
    Temperature: { min: 72, max: 82, critical_min: 65, critical_max: 90 },
    GH: { min: 4, max: 12 },
    KH: { min: 3, max: 10 },
  },
  saltwater: {
    pH: { min: 8.1, max: 8.4, critical_min: 7.8, critical_max: 8.6 },
    Ammonia: { min: 0, max: 0.1, critical_max: 0.25 },
    Nitrite: { min: 0, max: 0.1, critical_max: 0.25 },
    Nitrate: { min: 0, max: 20, critical_max: 40 },
    Salinity: { min: 1.023, max: 1.026, critical_min: 1.020, critical_max: 1.028 },
    Calcium: { min: 380, max: 450 },
    Alkalinity: { min: 8, max: 12 },
    Magnesium: { min: 1250, max: 1350 },
    Temperature: { min: 76, max: 82, critical_min: 72, critical_max: 86 },
  },
  reef: {
    pH: { min: 8.1, max: 8.4, critical_min: 7.8, critical_max: 8.6 },
    Ammonia: { min: 0, max: 0.05, critical_max: 0.1 },
    Nitrite: { min: 0, max: 0.05, critical_max: 0.1 },
    Nitrate: { min: 0, max: 10, critical_max: 20 },
    Salinity: { min: 1.024, max: 1.026, critical_min: 1.022, critical_max: 1.028 },
    Calcium: { min: 400, max: 450, critical_min: 380, critical_max: 480 },
    Alkalinity: { min: 8, max: 11, critical_min: 7, critical_max: 13 },
    Magnesium: { min: 1280, max: 1350 },
    Phosphate: { min: 0, max: 0.03, critical_max: 0.1 },
    Temperature: { min: 76, max: 80, critical_min: 74, critical_max: 84 },
  },
  pool: {
    'Free Chlorine': { min: 1, max: 3, critical_min: 0.5, critical_max: 5 },
    'Total Chlorine': { min: 1, max: 5, critical_max: 10 },
    pH: { min: 7.2, max: 7.6, critical_min: 7.0, critical_max: 7.8 },
    Alkalinity: { min: 80, max: 120, critical_min: 60, critical_max: 180 },
    'Cyanuric Acid': { min: 30, max: 50, critical_max: 100 },
    'Calcium Hardness': { min: 200, max: 400, critical_min: 150, critical_max: 500 },
    Salt: { min: 2700, max: 3400 },
    Temperature: { min: 78, max: 84 },
  },
  pool_chlorine: {
    'Free Chlorine': { min: 1, max: 3, critical_min: 0.5, critical_max: 5 },
    'Total Chlorine': { min: 1, max: 5, critical_max: 10 },
    pH: { min: 7.2, max: 7.6, critical_min: 7.0, critical_max: 7.8 },
    Alkalinity: { min: 80, max: 120, critical_min: 60, critical_max: 180 },
    'Cyanuric Acid': { min: 30, max: 50, critical_max: 100 },
    'Calcium Hardness': { min: 200, max: 400, critical_min: 150, critical_max: 500 },
    Temperature: { min: 78, max: 84 },
  },
  pool_saltwater: {
    Salt: { min: 2700, max: 3400, critical_min: 2500, critical_max: 3600 },
    'Free Chlorine': { min: 1, max: 3, critical_min: 0.5, critical_max: 5 },
    pH: { min: 7.2, max: 7.6, critical_min: 7.0, critical_max: 7.8 },
    Alkalinity: { min: 80, max: 120, critical_min: 60, critical_max: 180 },
    'Cyanuric Acid': { min: 70, max: 80, critical_max: 100 },
    'Calcium Hardness': { min: 200, max: 400, critical_min: 150, critical_max: 500 },
    Temperature: { min: 78, max: 84 },
  },
  spa: {
    'Free Chlorine': { min: 3, max: 5, critical_min: 1, critical_max: 10 },
    Bromine: { min: 4, max: 6, critical_min: 2, critical_max: 10 },
    pH: { min: 7.2, max: 7.6, critical_min: 7.0, critical_max: 7.8 },
    Alkalinity: { min: 80, max: 120, critical_min: 60, critical_max: 180 },
    'Calcium Hardness': { min: 150, max: 250, critical_min: 100, critical_max: 400 },
    Temperature: { min: 100, max: 104, critical_max: 106 },
  },
};

interface TrendAnalysis {
  parameter: string;
  direction: 'rising' | 'falling' | 'stable' | 'unstable';
  percentChange: number;
  values: number[];
  dates: string[];
  isApproachingThreshold: boolean;
  severity: 'info' | 'warning' | 'critical';
  thresholdType?: 'min' | 'max';
  currentValue: number;
  threshold?: number;
}

function getWaterType(aquariumType: string): string {
  const type = aquariumType.toLowerCase();
  if (['pool_chlorine'].includes(type)) return 'pool_chlorine';
  if (['pool_saltwater'].includes(type)) return 'pool_saltwater';
  if (['pool'].includes(type)) return 'pool';
  if (['spa', 'hot_tub'].includes(type)) return 'spa';
  if (['saltwater', 'marine'].includes(type)) return 'saltwater';
  if (['reef'].includes(type)) return 'reef';
  return 'freshwater';
}

function analyzeTrends(
  parameterHistory: { name: string; value: number; date: string }[],
  waterType: string
): TrendAnalysis[] {
  const thresholds = PARAMETER_THRESHOLDS[waterType] || PARAMETER_THRESHOLDS.freshwater;
  const analyses: TrendAnalysis[] = [];

  // Group by parameter
  const parameterGroups = new Map<string, { value: number; date: string }[]>();
  for (const param of parameterHistory) {
    if (!parameterGroups.has(param.name)) {
      parameterGroups.set(param.name, []);
    }
    parameterGroups.get(param.name)!.push({ value: param.value, date: param.date });
  }

  for (const [paramName, values] of parameterGroups) {
    // Need at least 3 data points for trend analysis
    if (values.length < 3) continue;

    // Sort by date ascending
    values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const recentValues = values.slice(-5); // Last 5 tests
    const numericValues = recentValues.map(v => v.value);
    const dates = recentValues.map(v => v.date);
    const currentValue = numericValues[numericValues.length - 1];

    // Calculate direction
    let risingCount = 0;
    let fallingCount = 0;
    for (let i = 1; i < numericValues.length; i++) {
      if (numericValues[i] > numericValues[i - 1]) risingCount++;
      else if (numericValues[i] < numericValues[i - 1]) fallingCount++;
    }

    // Calculate percent change from first to last
    const firstValue = numericValues[0];
    const percentChange = firstValue !== 0 
      ? ((currentValue - firstValue) / Math.abs(firstValue)) * 100 
      : currentValue > 0 ? 100 : 0;

    // Calculate variance for instability detection
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
    const coefficientOfVariation = mean !== 0 ? (Math.sqrt(variance) / Math.abs(mean)) * 100 : 0;

    // Determine direction
    let direction: 'rising' | 'falling' | 'stable' | 'unstable' = 'stable';
    if (coefficientOfVariation > 30) {
      direction = 'unstable';
    } else if (risingCount >= numericValues.length - 1 && Math.abs(percentChange) > 10) {
      direction = 'rising';
    } else if (fallingCount >= numericValues.length - 1 && Math.abs(percentChange) > 10) {
      direction = 'falling';
    }

    // Skip stable parameters
    if (direction === 'stable') continue;

    // Check if approaching threshold
    const paramThresholds = thresholds[paramName];
    let isApproachingThreshold = false;
    let severity: 'info' | 'warning' | 'critical' = 'info';
    let thresholdType: 'min' | 'max' | undefined;
    let threshold: number | undefined;

    if (paramThresholds) {
      const warningMargin = 0.2; // 20% of range
      const range = paramThresholds.max - paramThresholds.min;

      // Check approaching max
      if (direction === 'rising' && currentValue > paramThresholds.max - range * warningMargin) {
        isApproachingThreshold = true;
        thresholdType = 'max';
        threshold = paramThresholds.max;
        
        if (paramThresholds.critical_max && currentValue >= paramThresholds.critical_max) {
          severity = 'critical';
        } else if (currentValue >= paramThresholds.max) {
          severity = 'warning';
        } else {
          severity = 'info';
        }
      }

      // Check approaching min
      if (direction === 'falling' && currentValue < paramThresholds.min + range * warningMargin) {
        isApproachingThreshold = true;
        thresholdType = 'min';
        threshold = paramThresholds.min;
        
        if (paramThresholds.critical_min && currentValue <= paramThresholds.critical_min) {
          severity = 'critical';
        } else if (currentValue <= paramThresholds.min) {
          severity = 'warning';
        } else {
          severity = 'info';
        }
      }

      // Unstable is always at least warning
      if (direction === 'unstable') {
        severity = 'warning';
      }

      // Strong trends without threshold proximity still deserve attention
      if (!isApproachingThreshold && Math.abs(percentChange) > 25) {
        severity = 'warning';
      }
    }

    // Only include concerning trends (direction is already non-stable at this point)
    if (Math.abs(percentChange) > 15 || isApproachingThreshold || direction === 'unstable') {
      analyses.push({
        parameter: paramName,
        direction,
        percentChange,
        values: numericValues,
        dates,
        isApproachingThreshold,
        severity,
        thresholdType,
        currentValue,
        threshold,
      });
    }
  }

  return analyses;
}

function generateAlertMessage(trend: TrendAnalysis): string {
  const values = trend.values;
  const valueStr = values.map(v => v.toFixed(1)).join(' → ');

  switch (trend.direction) {
    case 'rising':
      if (trend.isApproachingThreshold) {
        return `${trend.parameter} is rising toward the ${trend.thresholdType === 'max' ? 'maximum' : 'minimum'} threshold: ${valueStr}. Current: ${trend.currentValue.toFixed(1)}, Target max: ${trend.threshold?.toFixed(1)}`;
      }
      return `${trend.parameter} has increased ${Math.abs(trend.percentChange).toFixed(0)}% over your last ${values.length} tests: ${valueStr}`;

    case 'falling':
      if (trend.isApproachingThreshold) {
        return `${trend.parameter} is dropping toward the ${trend.thresholdType === 'max' ? 'maximum' : 'minimum'} threshold: ${valueStr}. Current: ${trend.currentValue.toFixed(1)}, Target min: ${trend.threshold?.toFixed(1)}`;
      }
      return `${trend.parameter} has decreased ${Math.abs(trend.percentChange).toFixed(0)}% over your last ${values.length} tests: ${valueStr}`;

    case 'unstable':
      return `${trend.parameter} levels are fluctuating: ${valueStr}. Consider checking for environmental factors affecting stability.`;

    default:
      return `${trend.parameter} trend detected: ${valueStr}`;
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('analyze-water-trends');

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

    // Use authenticated user's ID, not from request body
    const userId = user.id;
    logger.info('User authenticated', { userId });

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
      .eq('user_id', userId)
      .single();

    if (ownerError || !aquariumCheck) {
      logger.warn('Aquarium access denied', { aquariumId, userId });
      return createErrorResponse('Aquarium not found or access denied', logger, { status: 404 });
    }

    // Rate limiting (10 requests per minute)
    const identifier = extractIdentifier(req, userId);
    const rateLimitResult = await checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: `water-trends:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // ========== NOW USE SERVICE ROLE FOR DATA ACCESS ==========
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Fetching water test data for trend analysis', { aquariumId, userId });

    // Fetch aquarium to get type
    const { data: aquarium } = await supabase
      .from('aquariums')
      .select('type, name')
      .eq('id', aquariumId)
      .single();

    if (!aquarium) {
      return createErrorResponse('Aquarium not found', logger, { status: 404 });
    }

    const waterType = getWaterType(aquarium.type);

    // Fetch last 30 days of water tests with parameters
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: waterTests } = await supabase
      .from('water_tests')
      .select('id, test_date, test_parameters(*)')
      .eq('aquarium_id', aquariumId)
      .gte('test_date', thirtyDaysAgo.toISOString())
      .order('test_date', { ascending: false });

    if (!waterTests || waterTests.length < 3) {
      logger.info('Not enough water tests for trend analysis', { count: waterTests?.length || 0 });
      return createSuccessResponse({ alerts: [], message: 'Need at least 3 tests for trend analysis' });
    }

    // Flatten parameters with dates
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

    logger.info('Analyzing trends', { parameterCount: parameterHistory.length, waterType });

    // Analyze trends
    const trends = analyzeTrends(parameterHistory, waterType);

    if (trends.length === 0) {
      logger.info('No concerning trends detected');
      return createSuccessResponse({ alerts: [], message: 'No concerning trends detected' });
    }

    logger.info('Trends detected', { count: trends.length });

    // Check for existing undismissed alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('water_test_alerts')
      .select('parameter_name, alert_type')
      .eq('aquarium_id', aquariumId)
      .eq('is_dismissed', false);

    const existingAlertKeys = new Set(
      (existingAlerts || []).map(a => `${a.parameter_name}:${a.alert_type}`)
    );

    // Create new alerts
    const newAlerts = [];
    for (const trend of trends) {
      const alertKey = `${trend.parameter}:${trend.direction}`;
      
      // Skip if similar alert already exists
      if (existingAlertKeys.has(alertKey)) {
        logger.debug('Skipping duplicate alert', { alertKey });
        continue;
      }

      const alert = {
        user_id: userId,
        aquarium_id: aquariumId,
        parameter_name: trend.parameter,
        alert_type: trend.direction,
        severity: trend.severity,
        message: generateAlertMessage(trend),
        details: {
          values: trend.values,
          dates: trend.dates,
          percentChange: trend.percentChange,
          currentValue: trend.currentValue,
          threshold: trend.threshold,
          thresholdType: trend.thresholdType,
          aquariumName: aquarium.name,
        },
      };

      newAlerts.push(alert);
    }

    if (newAlerts.length > 0) {
      const { error: insertError } = await supabase
        .from('water_test_alerts')
        .insert(newAlerts);

      if (insertError) {
        logger.error('Failed to insert alerts', insertError);
        return createErrorResponse('Failed to save alerts', logger);
      }

      logger.info('Created new alerts', { count: newAlerts.length });
    }

    return createSuccessResponse({ 
      alerts: newAlerts,
      message: `Created ${newAlerts.length} new trend alert(s)`,
      totalTrends: trends.length,
    });

  } catch (error) {
    logger.error('Error analyzing water trends', error);
    return createErrorResponse(error, logger);
  }
});
