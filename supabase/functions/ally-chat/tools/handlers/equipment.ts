import type { SupabaseClient, ToolResult, Logger } from '../types.ts';

export async function executeAddEquipment(
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
        content: JSON.stringify({ success: false, error: 'Failed to add equipment' })
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

export async function executeAddEquipmentBatch(
  supabase: SupabaseClient,
  args: {
    aquarium_id: string;
    equipment_list: Array<{
      name: string;
      equipment_type: string;
      brand?: string;
      model?: string;
      notes?: string;
    }>;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    if (!args.equipment_list || args.equipment_list.length === 0) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({ success: false, error: 'No equipment items provided' })
      };
    }

    const results: Array<{ name: string; success: boolean; error?: string }> = [];
    const successfulItems: string[] = [];
    const failedItems: string[] = [];

    // Insert each equipment item
    for (const item of args.equipment_list) {
      const { error } = await supabase
        .from('equipment')
        .insert({
          aquarium_id: args.aquarium_id,
          name: item.name,
          equipment_type: item.equipment_type,
          brand: item.brand || null,
          model: item.model || null,
          notes: item.notes || null
        });

      if (error) {
        logger.error('Failed to add equipment item', { name: item.name, error: error.message });
        results.push({ name: item.name, success: false, error: 'Failed to add this equipment' });
        failedItems.push(item.name);
      } else {
        results.push({ name: item.name, success: true });
        successfulItems.push(item.name);
      }
    }

    const totalCount = args.equipment_list.length;
    const successCount = successfulItems.length;
    const failCount = failedItems.length;

    logger.info('Batch equipment add completed', {
      total: totalCount,
      success: successCount,
      failed: failCount
    });

    // Build response message
    let message: string;
    if (failCount === 0) {
      message = `Successfully added ${successCount} equipment item${successCount > 1 ? 's' : ''}: ${successfulItems.join(', ')}`;
    } else if (successCount === 0) {
      message = `Failed to add any equipment. Errors occurred for: ${failedItems.join(', ')}`;
    } else {
      message = `Added ${successCount} of ${totalCount} items. Success: ${successfulItems.join(', ')}. Failed: ${failedItems.join(', ')}`;
    }

    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({
        success: successCount > 0,
        message,
        summary: {
          total: totalCount,
          successful: successCount,
          failed: failCount
        },
        results,
        added_items: successfulItems,
        failed_items: failedItems
      })
    };
  } catch (e) {
    logger.error('Error in batch equipment add', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to add equipment batch' })
    };
  }
}

export async function executeUpdateEquipment(
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
        content: JSON.stringify({ success: false, error: 'Failed to update equipment' })
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
