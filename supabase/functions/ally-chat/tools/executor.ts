/**
 * Tool Executor
 * 
 * Handles execution of AI tool calls (save_memory, add_equipment).
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

    if (functionName === 'save_memory') {
      const result = await executeSaveMemory(supabase, userId, functionArgs, toolCall.id, logger);
      toolResults.push(result);
    } else if (functionName === 'add_equipment') {
      const result = await executeAddEquipment(supabase, functionArgs, toolCall.id, logger);
      toolResults.push(result);
    }
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
