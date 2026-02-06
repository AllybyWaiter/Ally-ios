import type { SupabaseClient, ToolResult, Logger } from '../types.ts';
import { getParameterStatus, calculateTrend, mapAquariumTypeToWaterType } from '../parameterRanges.ts';

export async function executeLogWaterTest(
  supabase: SupabaseClient,
  userId: string,
  args: {
    aquarium_id: string;
    ph?: number;
    ammonia?: number;
    nitrite?: number;
    nitrate?: number;
    temperature?: number;
    gh?: number;
    kh?: number;
    salinity?: number;
    alkalinity?: number;
    calcium?: number;
    magnesium?: number;
    phosphate?: number;
    free_chlorine?: number;
    total_chlorine?: number;
    bromine?: number;
    cyanuric_acid?: number;
    calcium_hardness?: number;
    salt?: number;
    notes?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // Create the water test entry
    const { data: waterTest, error: testError } = await supabase
      .from('water_tests')
      .insert({
        aquarium_id: args.aquarium_id,
        user_id: userId,
        test_date: new Date().toISOString(),
        entry_method: 'conversation',
        notes: args.notes || 'Logged via Ally Chat'
      })
      .select('id')
      .single();

    if (testError || !waterTest) {
      logger.error('Failed to create water test', { error: testError?.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'Failed to create water test' })
      };
    }

    // Map parameters to their units and insert them
    const parameterMap: Record<string, { value: number | undefined; unit: string }> = {
      'pH': { value: args.ph, unit: 'pH' },
      'Ammonia': { value: args.ammonia, unit: 'ppm' },
      'Nitrite': { value: args.nitrite, unit: 'ppm' },
      'Nitrate': { value: args.nitrate, unit: 'ppm' },
      'Temperature': { value: args.temperature, unit: '°F' },
      'GH': { value: args.gh, unit: 'dGH' },
      'KH': { value: args.kh, unit: 'dKH' },
      'Salinity': { value: args.salinity, unit: 'ppt' },
      'Alkalinity': { value: args.alkalinity, unit: 'dKH' },
      'Calcium': { value: args.calcium, unit: 'ppm' },
      'Magnesium': { value: args.magnesium, unit: 'ppm' },
      'Phosphate': { value: args.phosphate, unit: 'ppm' },
      'Free Chlorine': { value: args.free_chlorine, unit: 'ppm' },
      'Total Chlorine': { value: args.total_chlorine, unit: 'ppm' },
      'Bromine': { value: args.bromine, unit: 'ppm' },
      'Cyanuric Acid': { value: args.cyanuric_acid, unit: 'ppm' },
      'Calcium Hardness': { value: args.calcium_hardness, unit: 'ppm' },
      'Salt': { value: args.salt, unit: 'ppm' }
    };

    const parameters = Object.entries(parameterMap)
      .filter(([_, param]) => param.value !== undefined && param.value !== null)
      .map(([name, param]) => ({
        test_id: waterTest.id,
        parameter_name: name,
        value: param.value!,
        unit: param.unit
      }));

    if (parameters.length > 0) {
      const { error: paramError } = await supabase
        .from('test_parameters')
        .insert(parameters);

      if (paramError) {
        logger.error('Failed to insert parameters', { error: paramError.message });
      }
    }

    const loggedParams = parameters.map(p => `${p.parameter_name}: ${p.value}`).join(', ');
    logger.info('Water test logged successfully', { testId: waterTest.id, paramCount: parameters.length });

    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({
        success: true,
        message: `Water test logged: ${loggedParams || 'No parameters provided'}`,
        test_id: waterTest.id
      })
    };
  } catch (e) {
    logger.error('Error logging water test', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to log water test' })
    };
  }
}

export async function executeShowWaterData(
  supabase: SupabaseClient,
  args: {
    card_type: 'latest_test' | 'parameter_trend' | 'tank_summary';
    parameters?: string[];
    days?: number;
    aquarium_id?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    const { card_type, parameters: requestedParams, days = 30 } = args;

    const aquariumId = args.aquarium_id;

    if (!aquariumId) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: 'No aquarium selected. Please ask the user to select a tank or pool first.'
        })
      };
    }

    // 1. Fetch aquarium details
    const { data: aquarium, error: aquariumError } = await supabase
      .from('aquariums')
      .select('id, name, type')
      .eq('id', aquariumId)
      .single();

    if (aquariumError || !aquarium) {
      logger.error('Failed to fetch aquarium', { error: aquariumError?.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: 'Could not find the specified aquarium'
        })
      };
    }

    const waterType = mapAquariumTypeToWaterType(aquarium.type);

    // 2. Calculate date range for query
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 3. Fetch water tests with parameters
    const { data: waterTests, error: testsError } = await supabase
      .from('water_tests')
      .select(`
        id,
        test_date,
        test_parameters (
          parameter_name,
          value,
          unit
        )
      `)
      .eq('aquarium_id', aquariumId)
      .gte('test_date', startDate.toISOString())
      .order('test_date', { ascending: true })
      .limit(card_type === 'latest_test' ? 1 : 30);

    if (testsError) {
      logger.error('Failed to fetch water tests', { error: testsError.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: 'Failed to fetch water test data'
        })
      };
    }

    if (!waterTests || waterTests.length === 0) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: true,
          has_data: false,
          card_type,
          aquarium_name: aquarium.name,
          message: `No water tests found for ${aquarium.name} in the last ${days} days. Would you like to log a water test?`
        })
      };
    }

    // 4. Aggregate parameters across all tests
    const parameterHistory: Record<string, { values: number[]; unit: string; dates: string[] }> = {};

    for (const test of waterTests) {
      const params = test.test_parameters as Array<{ parameter_name: string; value: number; unit: string }>;
      if (!params) continue;

      for (const param of params) {
        if (!parameterHistory[param.parameter_name]) {
          parameterHistory[param.parameter_name] = { values: [], unit: param.unit, dates: [] };
        }
        parameterHistory[param.parameter_name].values.push(param.value);
        parameterHistory[param.parameter_name].dates.push(test.test_date);
      }
    }

    // 5. Determine which parameters to show
    const availableParams = Object.keys(parameterHistory);
    let paramsToShow = requestedParams?.filter(p => availableParams.includes(p)) || availableParams;

    // If no specific params requested, show the most relevant
    if (!requestedParams) {
      const priorityParams: Record<string, string[]> = {
        freshwater: ['pH', 'Ammonia', 'Nitrite', 'Nitrate', 'Temperature', 'GH', 'KH'],
        saltwater: ['pH', 'Ammonia', 'Nitrite', 'Nitrate', 'Salinity', 'Temperature'],
        reef: ['pH', 'Alkalinity', 'Calcium', 'Magnesium', 'Nitrate', 'Phosphate', 'Salinity'],
        pool: ['Free Chlorine', 'pH', 'Alkalinity', 'Cyanuric Acid', 'Calcium Hardness'],
        spa: ['Free Chlorine', 'Bromine', 'pH', 'Alkalinity', 'Temperature'],
      };

      const priority = priorityParams[waterType] || priorityParams.freshwater;
      paramsToShow = priority.filter(p => availableParams.includes(p)).slice(0, 6);

      // Add any remaining available params if we have less than 4
      if (paramsToShow.length < 4) {
        const remaining = availableParams.filter(p => !paramsToShow.includes(p));
        paramsToShow = [...paramsToShow, ...remaining].slice(0, 6);
      }
    }

    // 6. Build parameter data with status, trend, and sparkline
    const latestTest = waterTests[waterTests.length - 1];
    const latestParams = (latestTest.test_parameters as Array<{ parameter_name: string; value: number; unit: string }>) || [];

    const parametersData = paramsToShow.map(paramName => {
      const history = parameterHistory[paramName];
      const latestParam = latestParams.find(p => p.parameter_name === paramName);
      const latestValue = latestParam?.value ?? history?.values[history.values.length - 1];

      if (latestValue === undefined) return null;

      const status = getParameterStatus(paramName, latestValue, waterType);
      const trend = calculateTrend(history?.values || []);
      const sparkline = history?.values.slice(-7) || [latestValue];

      // Calculate change percentage
      let change: number | undefined;
      if (history?.values.length >= 2) {
        const prevValue = history.values[history.values.length - 2];
        change = prevValue ? Math.round(((latestValue - prevValue) / prevValue) * 100) : 0;
      }

      return {
        name: paramName,
        value: latestValue,
        unit: history?.unit || latestParam?.unit || '',
        status,
        trend,
        sparkline,
        change,
      };
    }).filter(Boolean);

    // 7. Build title based on card type
    let title: string;
    switch (card_type) {
      case 'latest_test':
        title = 'Latest Water Test';
        break;
      case 'parameter_trend':
        title = `Parameter Trends (${days} days)`;
        break;
      case 'tank_summary':
        title = 'Tank Health Summary';
        break;
    }

    logger.info('Water data card generated', {
      aquariumId,
      cardType: card_type,
      paramCount: parametersData.length,
      testCount: waterTests.length
    });

    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({
        success: true,
        has_data: true,
        data_card: {
          card_type,
          title,
          aquarium_name: aquarium.name,
          timestamp: latestTest.test_date,
          test_count: waterTests.length,
          parameters: parametersData
        },
        // Provide text summary for AI to reference
        summary: `${aquarium.name}: ${parametersData.map(p =>
          `${p?.name} ${p?.value}${p?.unit} (${p?.status})`
        ).join(', ')}`
      })
    };
  } catch (e) {
    logger.error('Error generating water data card', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to generate water data card' })
    };
  }
}
