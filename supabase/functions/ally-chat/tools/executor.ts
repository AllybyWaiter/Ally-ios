/**
 * Tool Executor
 * 
 * Handles execution of AI tool calls.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string;
}

interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

export async function executeToolCalls(
  toolCalls: ToolCall[],
  supabase: SupabaseClient,
  userId: string,
  logger: Logger
): Promise<ToolResult[]> {
  const toolResults: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    let functionArgs;

    try {
      functionArgs = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      logger.error('Failed to parse tool arguments', { toolName: functionName, error: String(e) });
      continue;
    }

    logger.debug('Executing tool', { toolName: functionName, args: functionArgs });

    let result: ToolResult;
    
    switch (functionName) {
      case 'save_memory':
        result = await executeSaveMemory(supabase, userId, functionArgs, toolCall.id, logger);
        break;
      case 'add_equipment':
        result = await executeAddEquipment(supabase, functionArgs, toolCall.id, logger);
        break;
      case 'create_task':
        result = await executeCreateTask(supabase, functionArgs, toolCall.id, logger);
        break;
      case 'log_water_test':
        result = await executeLogWaterTest(supabase, userId, functionArgs, toolCall.id, logger);
        break;
      case 'add_livestock':
        result = await executeAddLivestock(supabase, userId, functionArgs, toolCall.id, logger);
        break;
      case 'add_plant':
        result = await executeAddPlant(supabase, userId, functionArgs, toolCall.id, logger);
        break;
      case 'update_livestock':
        result = await executeUpdateLivestock(supabase, functionArgs, toolCall.id, logger);
        break;
      case 'update_plant':
        result = await executeUpdatePlant(supabase, functionArgs, toolCall.id, logger);
        break;
      case 'update_equipment':
        result = await executeUpdateEquipment(supabase, functionArgs, toolCall.id, logger);
        break;
      case 'calculate_pool_volume':
        result = await executeCalculatePoolVolume(supabase, functionArgs, toolCall.id, logger);
        break;
      default:
        logger.error('Unknown tool', { toolName: functionName });
        continue;
    }
    
    toolResults.push(result);
  }

  return toolResults;
}

async function executeSaveMemory(
  supabase: SupabaseClient,
  userId: string,
  args: { memory_key: string; memory_value: string; water_type: string },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    const { error } = await supabase
      .from('user_memories')
      .insert({
        user_id: userId,
        memory_key: args.memory_key,
        memory_value: args.memory_value,
        water_type: args.water_type === 'universal' ? null : args.water_type,
        source: 'conversation',
        confidence: 'confirmed'
      });

    if (error) {
      logger.error('Failed to save memory', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    logger.info('Memory saved successfully', { memoryKey: args.memory_key });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: true, message: `Memory saved: ${args.memory_value}` })
    };
  } catch (e) {
    logger.error('Error saving memory', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to save memory' })
    };
  }
}

async function executeAddEquipment(
  supabase: SupabaseClient,
  args: { 
    aquarium_id: string; 
    name: string; 
    equipment_type: string; 
    brand?: string; 
    model?: string; 
    notes?: string 
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    const { error } = await supabase
      .from('equipment')
      .insert({
        aquarium_id: args.aquarium_id,
        name: args.name,
        equipment_type: args.equipment_type,
        brand: args.brand || null,
        model: args.model || null,
        notes: args.notes || null
      });

    if (error) {
      logger.error('Failed to add equipment', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    logger.info('Equipment added successfully', { equipmentName: args.name });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: true, message: `Equipment added: ${args.name}` })
    };
  } catch (e) {
    logger.error('Error adding equipment', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to add equipment' })
    };
  }
}

async function executeCreateTask(
  supabase: SupabaseClient,
  args: {
    aquarium_id: string;
    task_name: string;
    task_type: string;
    due_date: string;
    notes?: string;
    is_recurring?: boolean;
    recurrence_interval?: string;
    recurrence_days?: number;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .insert({
        aquarium_id: args.aquarium_id,
        task_name: args.task_name,
        task_type: args.task_type,
        due_date: args.due_date,
        notes: args.notes || null,
        is_recurring: args.is_recurring || false,
        recurrence_interval: args.recurrence_interval || null,
        recurrence_days: args.recurrence_days || null,
        status: 'pending'
      });

    if (error) {
      logger.error('Failed to create task', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    const recurringNote = args.is_recurring ? ` (recurring ${args.recurrence_interval})` : '';
    logger.info('Task created successfully', { taskName: args.task_name, dueDate: args.due_date });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ 
        success: true, 
        message: `Task created: "${args.task_name}" due ${args.due_date}${recurringNote}` 
      })
    };
  } catch (e) {
    logger.error('Error creating task', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to create task' })
    };
  }
}

async function executeLogWaterTest(
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
        content: JSON.stringify({ success: false, error: testError?.message || 'Failed to create water test' })
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

async function executeAddLivestock(
  supabase: SupabaseClient,
  userId: string,
  args: {
    aquarium_id: string;
    name: string;
    species: string;
    category: string;
    quantity: number;
    notes?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    const { error } = await supabase
      .from('livestock')
      .insert({
        aquarium_id: args.aquarium_id,
        user_id: userId,
        name: args.name,
        species: args.species,
        category: args.category,
        quantity: args.quantity,
        notes: args.notes || null,
        health_status: 'healthy',
        date_added: new Date().toISOString().split('T')[0]
      });

    if (error) {
      logger.error('Failed to add livestock', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    logger.info('Livestock added successfully', { name: args.name, quantity: args.quantity });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ 
        success: true, 
        message: `Added ${args.quantity} ${args.name} (${args.species}) to the tank` 
      })
    };
  } catch (e) {
    logger.error('Error adding livestock', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to add livestock' })
    };
  }
}

async function executeAddPlant(
  supabase: SupabaseClient,
  userId: string,
  args: {
    aquarium_id: string;
    name: string;
    species: string;
    quantity: number;
    placement?: string;
    notes?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    const { error } = await supabase
      .from('plants')
      .insert({
        aquarium_id: args.aquarium_id,
        user_id: userId,
        name: args.name,
        species: args.species,
        quantity: args.quantity,
        placement: args.placement || 'midground',
        notes: args.notes || null,
        condition: 'healthy',
        date_added: new Date().toISOString().split('T')[0]
      });

    if (error) {
      logger.error('Failed to add plant', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    logger.info('Plant added successfully', { name: args.name, quantity: args.quantity });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ 
        success: true, 
        message: `Added ${args.quantity} ${args.name} (${args.species}) to the tank` 
      })
    };
  } catch (e) {
    logger.error('Error adding plant', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to add plant' })
    };
  }
}

async function executeUpdateLivestock(
  supabase: SupabaseClient,
  args: {
    livestock_id: string;
    quantity?: number;
    health_status?: string;
    name?: string;
    species?: string;
    notes?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (args.quantity !== undefined) updates.quantity = args.quantity;
    if (args.health_status) updates.health_status = args.health_status;
    if (args.name) updates.name = args.name;
    if (args.species) updates.species = args.species;
    if (args.notes !== undefined) updates.notes = args.notes;

    if (Object.keys(updates).length === 0) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'No fields to update' })
      };
    }

    const { data, error } = await supabase
      .from('livestock')
      .update(updates)
      .eq('id', args.livestock_id)
      .select('name, quantity, health_status')
      .single();

    if (error) {
      logger.error('Failed to update livestock', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    // Build confirmation message
    const changes: string[] = [];
    if (args.quantity !== undefined) changes.push(`quantity to ${args.quantity}`);
    if (args.health_status) changes.push(`status to ${args.health_status}`);
    if (args.name) changes.push(`name to ${args.name}`);
    if (args.species) changes.push(`species to ${args.species}`);

    logger.info('Livestock updated successfully', { livestockId: args.livestock_id, updates });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ 
        success: true, 
        message: `Updated ${data?.name || 'livestock'}: ${changes.join(', ')}`,
        updated: data
      })
    };
  } catch (e) {
    logger.error('Error updating livestock', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to update livestock' })
    };
  }
}

async function executeUpdatePlant(
  supabase: SupabaseClient,
  args: {
    plant_id: string;
    quantity?: number;
    condition?: string;
    placement?: string;
    name?: string;
    species?: string;
    notes?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (args.quantity !== undefined) updates.quantity = args.quantity;
    if (args.condition) updates.condition = args.condition;
    if (args.placement) updates.placement = args.placement;
    if (args.name) updates.name = args.name;
    if (args.species) updates.species = args.species;
    if (args.notes !== undefined) updates.notes = args.notes;

    if (Object.keys(updates).length === 0) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'No fields to update' })
      };
    }

    const { data, error } = await supabase
      .from('plants')
      .update(updates)
      .eq('id', args.plant_id)
      .select('name, quantity, condition, placement')
      .single();

    if (error) {
      logger.error('Failed to update plant', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    // Build confirmation message
    const changes: string[] = [];
    if (args.quantity !== undefined) changes.push(`quantity to ${args.quantity}`);
    if (args.condition) changes.push(`condition to ${args.condition}`);
    if (args.placement) changes.push(`placement to ${args.placement}`);
    if (args.name) changes.push(`name to ${args.name}`);
    if (args.species) changes.push(`species to ${args.species}`);

    logger.info('Plant updated successfully', { plantId: args.plant_id, updates });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ 
        success: true, 
        message: `Updated ${data?.name || 'plant'}: ${changes.join(', ')}`,
        updated: data
      })
    };
  } catch (e) {
    logger.error('Error updating plant', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to update plant' })
    };
  }
}

async function executeUpdateEquipment(
  supabase: SupabaseClient,
  args: {
    equipment_id: string;
    name?: string;
    equipment_type?: string;
    brand?: string;
    model?: string;
    maintenance_interval_days?: number;
    last_maintenance_date?: string;
    notes?: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (args.name) updates.name = args.name;
    if (args.equipment_type) updates.equipment_type = args.equipment_type;
    if (args.brand) updates.brand = args.brand;
    if (args.model) updates.model = args.model;
    if (args.maintenance_interval_days !== undefined) updates.maintenance_interval_days = args.maintenance_interval_days;
    if (args.last_maintenance_date) updates.last_maintenance_date = args.last_maintenance_date;
    if (args.notes !== undefined) updates.notes = args.notes;

    if (Object.keys(updates).length === 0) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'No fields to update' })
      };
    }

    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', args.equipment_id)
      .select('name, equipment_type, brand, model, last_maintenance_date, maintenance_interval_days')
      .single();

    if (error) {
      logger.error('Failed to update equipment', { error: error.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: error.message })
      };
    }

    // Build confirmation message
    const changes: string[] = [];
    if (args.last_maintenance_date) changes.push(`logged maintenance on ${args.last_maintenance_date}`);
    if (args.maintenance_interval_days !== undefined) changes.push(`maintenance interval to every ${args.maintenance_interval_days} days`);
    if (args.name) changes.push(`name to ${args.name}`);
    if (args.brand) changes.push(`brand to ${args.brand}`);
    if (args.model) changes.push(`model to ${args.model}`);
    if (args.equipment_type) changes.push(`type to ${args.equipment_type}`);

    logger.info('Equipment updated successfully', { equipmentId: args.equipment_id, updates });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ 
        success: true, 
        message: `Updated ${data?.name || 'equipment'}: ${changes.join(', ')}`,
        updated: data
      })
    };
  } catch (e) {
    logger.error('Error updating equipment', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to update equipment' })
    };
  }
}

// Pool volume calculation constants
const CUBIC_FT_TO_GALLONS = 7.48052;

async function executeCalculatePoolVolume(
  supabase: SupabaseClient,
  args: {
    aquarium_id: string;
    shape: 'round' | 'oval' | 'rectangle' | 'kidney';
    diameter_ft?: number;
    length_ft?: number;
    width_ft?: number;
    depth_type: 'flat' | 'sloped';
    single_depth_ft?: number;
    shallow_depth_ft?: number;
    deep_depth_ft?: number;
    water_inches_below_top?: number;
    has_steps?: boolean;
    has_bench?: boolean;
    has_sun_shelf?: boolean;
    save_to_profile?: boolean;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // Calculate average depth
    let avgDepth: number;
    if (args.depth_type === 'flat' && args.single_depth_ft) {
      avgDepth = args.single_depth_ft;
    } else if (args.depth_type === 'sloped' && args.shallow_depth_ft && args.deep_depth_ft) {
      avgDepth = (args.shallow_depth_ft + args.deep_depth_ft) / 2;
    } else {
      avgDepth = args.single_depth_ft || args.shallow_depth_ft || args.deep_depth_ft || 4;
    }

    // Calculate surface area based on shape
    let surfaceArea: number;
    switch (args.shape) {
      case 'round':
        if (!args.diameter_ft) {
          return {
            tool_call_id: toolCallId,
            role: 'tool',
            content: JSON.stringify({ success: false, error: 'Diameter is required for round pools' })
          };
        }
        const radius = args.diameter_ft / 2;
        surfaceArea = Math.PI * radius * radius;
        break;

      case 'oval':
        if (!args.length_ft || !args.width_ft) {
          return {
            tool_call_id: toolCallId,
            role: 'tool',
            content: JSON.stringify({ success: false, error: 'Length and width are required for oval pools' })
          };
        }
        surfaceArea = Math.PI * (args.length_ft / 2) * (args.width_ft / 2);
        break;

      case 'rectangle':
        if (!args.length_ft || !args.width_ft) {
          return {
            tool_call_id: toolCallId,
            role: 'tool',
            content: JSON.stringify({ success: false, error: 'Length and width are required for rectangle pools' })
          };
        }
        surfaceArea = args.length_ft * args.width_ft;
        break;

      case 'kidney':
        if (!args.length_ft || !args.width_ft) {
          return {
            tool_call_id: toolCallId,
            role: 'tool',
            content: JSON.stringify({ success: false, error: 'Length and width estimates are required for kidney/freeform pools' })
          };
        }
        // Kidney pools are approximately 80% of rectangle
        surfaceArea = args.length_ft * args.width_ft * 0.8;
        break;

      default:
        return {
          tool_call_id: toolCallId,
          role: 'tool',
          content: JSON.stringify({ success: false, error: 'Invalid pool shape' })
        };
    }

    // Calculate base volume
    const cubicFeet = surfaceArea * avgDepth;
    let gallons = cubicFeet * CUBIC_FT_TO_GALLONS;
    const reductions: string[] = [];

    // Apply adjustments
    if (args.water_inches_below_top && args.water_inches_below_top > 0) {
      const depthReductionPercent = (args.water_inches_below_top / 12) / avgDepth * 100;
      const reduction = gallons * (depthReductionPercent / 100);
      gallons -= reduction;
      reductions.push(`water level ${args.water_inches_below_top}" down: -${Math.round(reduction)} gal`);
    }

    if (args.has_steps) {
      const stepReduction = Math.min(350, gallons * 0.02);
      gallons -= stepReduction;
      reductions.push(`steps: -${Math.round(stepReduction)} gal`);
    }

    if (args.has_bench) {
      const benchReduction = Math.min(750, gallons * 0.03);
      gallons -= benchReduction;
      reductions.push(`bench: -${Math.round(benchReduction)} gal`);
    }

    if (args.has_sun_shelf) {
      const shelfReduction = Math.min(500, gallons * 0.025);
      gallons -= shelfReduction;
      reductions.push(`sun shelf: -${Math.round(shelfReduction)} gal`);
    }

    gallons = Math.max(0, gallons);

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (args.shape === 'kidney') {
      confidence = 'medium';
    } else if (reductions.length > 0) {
      confidence = 'high';
    } else {
      confidence = 'medium';
    }

    // Calculate range
    const rangePercent = { high: 5, medium: 10, low: 20 }[confidence];
    const variation = gallons * (rangePercent / 100);
    const minGallons = Math.round(gallons - variation);
    const maxGallons = Math.round(gallons + variation);
    const estimatedGallons = Math.round(gallons);

    // Build dimension string for explanation
    let dimensionStr: string;
    if (args.shape === 'round') {
      dimensionStr = `${args.diameter_ft}' diameter`;
    } else {
      dimensionStr = `${args.length_ft}' × ${args.width_ft}'`;
    }

    let depthStr: string;
    if (args.depth_type === 'sloped') {
      depthStr = `${args.shallow_depth_ft}'-${args.deep_depth_ft}' sloped depth (avg ${avgDepth.toFixed(1)}')`;
    } else {
      depthStr = `${args.single_depth_ft}' depth`;
    }

    // Build explanation
    let explanation = `Based on ${args.shape} shape (${dimensionStr}) with ${depthStr}`;
    if (reductions.length > 0) {
      explanation += `. Adjustments: ${reductions.join(', ')}`;
    }

    // Save to profile if requested
    if (args.save_to_profile) {
      const poolDimensions = {
        shape: args.shape,
        diameter_ft: args.diameter_ft,
        length_ft: args.length_ft,
        width_ft: args.width_ft,
        depth_type: args.depth_type,
        single_depth_ft: args.single_depth_ft,
        shallow_depth_ft: args.shallow_depth_ft,
        deep_depth_ft: args.deep_depth_ft
      };

      const poolAdjustments = {
        water_inches_below_top: args.water_inches_below_top,
        has_steps: args.has_steps,
        has_bench: args.has_bench,
        has_sun_shelf: args.has_sun_shelf
      };

      const volumeConfidenceRange = {
        min_gallons: minGallons,
        max_gallons: maxGallons,
        confidence_level: confidence
      };

      const { error } = await supabase
        .from('aquariums')
        .update({
          volume_gallons: estimatedGallons,
          volume_calculation_method: 'calculated',
          pool_shape: args.shape,
          pool_dimensions: poolDimensions,
          pool_adjustments: poolAdjustments,
          volume_confidence_range: volumeConfidenceRange
        })
        .eq('id', args.aquarium_id);

      if (error) {
        logger.error('Failed to save pool volume', { error: error.message });
        return {
          tool_call_id: toolCallId,
          role: 'tool',
          content: JSON.stringify({
            success: true,
            saved: false,
            error: `Calculated volume but failed to save: ${error.message}`,
            estimated_gallons: estimatedGallons,
            range: `${minGallons.toLocaleString()}-${maxGallons.toLocaleString()} gallons`,
            confidence,
            explanation
          })
        };
      }

      logger.info('Pool volume calculated and saved', { 
        aquariumId: args.aquarium_id, 
        gallons: estimatedGallons,
        confidence 
      });

      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: true,
          saved: true,
          estimated_gallons: estimatedGallons,
          range: `${minGallons.toLocaleString()}-${maxGallons.toLocaleString()} gallons`,
          confidence,
          explanation,
          message: `Pool volume saved: ${estimatedGallons.toLocaleString()} gallons (range: ${minGallons.toLocaleString()}-${maxGallons.toLocaleString()})`
        })
      };
    }

    // Return calculation without saving
    logger.info('Pool volume calculated', { gallons: estimatedGallons, confidence });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({
        success: true,
        saved: false,
        estimated_gallons: estimatedGallons,
        range: `${minGallons.toLocaleString()}-${maxGallons.toLocaleString()} gallons`,
        confidence,
        explanation
      })
    };
  } catch (e) {
    logger.error('Error calculating pool volume', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to calculate pool volume' })
    };
  }
}
