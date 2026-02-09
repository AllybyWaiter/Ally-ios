import type { SupabaseClient, ToolResult, Logger } from '../types.ts';

// Pool volume calculation constants
const CUBIC_FT_TO_GALLONS = 7.48052;

export async function executeCalculatePoolVolume(
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
      case 'round': {
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
      }

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
      confidence = 'low';
    } else if (reductions.length > 0) {
      confidence = 'medium';
    } else {
      confidence = 'high';
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
