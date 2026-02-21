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

interface ToolSafetyContext {
  messages?: Array<{
    role: string;
    content?: string;
  }>;
  inputGate?: {
    requiresGate: boolean;
    missingInputs: string[];
    conversationType: string;
  };
}

const CONFIRMATION_REQUIRED_TOOLS = new Set([
  'add_equipment',
  'add_equipment_batch',
  'create_task',
  'log_water_test',
  'add_livestock',
  'add_plant',
  'update_livestock',
  'update_plant',
  'update_equipment',
]);

const DOSING_TASK_TYPES = new Set(['dosing', 'shock_treatment', 'chemical_balance']);

function getLastUserMessage(messages?: ToolSafetyContext['messages']): string {
  if (!messages || messages.length === 0) return '';
  const lastUser = [...messages].reverse().find(msg => msg.role === 'user');
  return (lastUser?.content || '').trim().toLowerCase();
}

function hasExplicitConfirmation(lastUserMessage: string): boolean {
  if (!lastUserMessage) return false;

  return [
    /^(yes|yeah|yep|sure|ok|okay|confirm|confirmed|proceed|continue|do it|go ahead|please do|sounds good)[.!?\s]*$/i,
    /\b(go ahead|please (save|log|create|add|update)|confirm(ed)?|proceed)\b/i,
  ].some(pattern => pattern.test(lastUserMessage));
}

function hasToolSpecificIntent(toolName: string, lastUserMessage: string, functionArgs: Record<string, unknown>): boolean {
  if (!lastUserMessage) return false;

  switch (toolName) {
    case 'add_equipment':
    case 'add_equipment_batch':
      return /\b(add|save|log|track|put)\b.*\b(equipment|filter|heater|light|pump|skimmer|controller|ato|ro\/di)\b/i.test(lastUserMessage);
    case 'create_task':
      return /\b(create|add|schedule|set|remind)\b.*\b(task|reminder|maintenance|water change|cleaning|dosing|shock)\b/i.test(lastUserMessage);
    case 'log_water_test':
      return /\b(log|record|save)\b.*\b(test|results?|readings?|parameters?)\b/i.test(lastUserMessage);
    case 'add_livestock':
      return /\b(add|save|log|track)\b.*\b(fish|livestock|coral|invertebrate|shrimp|snail)\b/i.test(lastUserMessage);
    case 'add_plant':
      return /\b(add|save|log|track|planted)\b.*\b(plant|plants)\b/i.test(lastUserMessage);
    case 'update_livestock':
    case 'update_plant':
    case 'update_equipment':
      return /\b(update|change|correct|mark|set)\b/i.test(lastUserMessage);
    case 'calculate_pool_volume':
      return Boolean(functionArgs.save_to_profile) &&
        /\b(save|update profile|store)\b.*\b(volume|gallons?)\b/i.test(lastUserMessage);
    default:
      return false;
  }
}

function requiresConfirmation(toolName: string, functionArgs: Record<string, unknown>): boolean {
  if (toolName === 'calculate_pool_volume') {
    return Boolean(functionArgs.save_to_profile);
  }
  return CONFIRMATION_REQUIRED_TOOLS.has(toolName);
}

function blockToolResult(
  toolCallId: string,
  toolName: string,
  message: string
): ToolResult {
  return {
    tool_call_id: toolCallId,
    role: 'tool',
    content: JSON.stringify({
      success: false,
      confirmation_required: true,
      tool: toolName,
      message,
    }),
  };
}

export async function executeToolCalls(
  toolCalls: ToolCall[],
  supabase: SupabaseClient,
  userId: string,
  logger: Logger,
  safetyContext?: ToolSafetyContext
): Promise<ToolResult[]> {
  const toolResults: ToolResult[] = [];
  const lastUserMessage = getLastUserMessage(safetyContext?.messages);

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    let functionArgs: Record<string, unknown>;

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

    if (
      safetyContext?.inputGate?.requiresGate &&
      functionName === 'create_task' &&
      typeof functionArgs.task_type === 'string' &&
      DOSING_TASK_TYPES.has(functionArgs.task_type)
    ) {
      logger.warn('Blocked dosing-related task creation due to missing critical inputs', {
        toolName: functionName,
        taskType: functionArgs.task_type,
        conversationType: safetyContext.inputGate.conversationType,
        missingInputs: safetyContext.inputGate.missingInputs,
      });
      toolResults.push(blockToolResult(
        toolCall.id,
        functionName,
        `I still need critical details before creating a dosing task: ${safetyContext.inputGate.missingInputs.join(', ')}.`
      ));
      continue;
    }

    if (requiresConfirmation(functionName, functionArgs)) {
      const confirmed =
        hasExplicitConfirmation(lastUserMessage) ||
        hasToolSpecificIntent(functionName, lastUserMessage, functionArgs);

      if (!confirmed) {
        logger.warn('Blocked write tool call pending explicit user confirmation', {
          toolName: functionName,
          lastUserMessage,
        });
        toolResults.push(blockToolResult(
          toolCall.id,
          functionName,
          `Please ask the user for explicit confirmation before calling ${functionName}.`
        ));
        continue;
      }
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
