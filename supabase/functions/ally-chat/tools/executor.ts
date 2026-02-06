/**
 * Tool Executor
 *
 * Routes AI tool calls to the appropriate handler.
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import type { ToolResult, Logger } from './types.ts';

import { executeSaveMemory } from './handlers/memory.ts';
import { executeAddEquipment, executeAddEquipmentBatch, executeUpdateEquipment } from './handlers/equipment.ts';
import { executeCreateTask } from './handlers/tasks.ts';
import { executeLogWaterTest, executeShowWaterData } from './handlers/waterTests.ts';
import { executeAddLivestock, executeUpdateLivestock, executeAddPlant, executeUpdatePlant } from './handlers/livestock.ts';
import { executeCalculatePoolVolume } from './handlers/poolVolume.ts';
import { executeCheckFishCompatibility } from './handlers/compatibility.ts';
import { executeSearchKnowledge } from './handlers/knowledge.ts';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
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
      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'Failed to parse tool arguments' })
      });
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
      case 'add_equipment_batch':
        result = await executeAddEquipmentBatch(supabase, functionArgs, toolCall.id, logger);
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
      case 'check_fish_compatibility':
        result = await executeCheckFishCompatibility(supabase, functionArgs, toolCall.id, logger);
        break;
      case 'show_water_data':
        result = await executeShowWaterData(supabase, functionArgs, toolCall.id, logger);
        break;
      case 'search_knowledge':
        result = await executeSearchKnowledge(supabase, functionArgs, toolCall.id, logger);
        break;
      default:
        logger.error('Unknown tool', { toolName: functionName });
        result = {
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify({ success: false, error: `Unknown tool: ${functionName}` })
        };
    }

    toolResults.push(result);
  }

  return toolResults;
}
