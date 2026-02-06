import type { SupabaseClient, ToolResult, Logger } from '../types.ts';

export async function executeCreateTask(
  supabase: SupabaseClient,
  userId: string,
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
    // Verify user owns this aquarium
    const { data: aquarium } = await supabase
      .from('aquariums')
      .select('id')
      .eq('id', args.aquarium_id)
      .eq('user_id', userId)
      .single();

    if (!aquarium) {
      logger.warn('Aquarium ownership check failed', { aquariumId: args.aquarium_id, userId });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'Aquarium not found or access denied' })
      };
    }

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
        content: JSON.stringify({ success: false, error: 'Failed to create task' })
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
