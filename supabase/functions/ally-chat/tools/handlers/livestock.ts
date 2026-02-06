import type { SupabaseClient, ToolResult, Logger } from '../types.ts';

export async function executeAddLivestock(
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
        content: JSON.stringify({ success: false, error: 'Failed to add livestock' })
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

export async function executeUpdateLivestock(
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
        content: JSON.stringify({ success: false, error: 'Failed to update livestock' })
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

export async function executeAddPlant(
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
        content: JSON.stringify({ success: false, error: 'Failed to add plant' })
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

export async function executeUpdatePlant(
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
        content: JSON.stringify({ success: false, error: 'Failed to update plant' })
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
