import type { SupabaseClient, ToolResult, Logger } from '../types.ts';

// Long-finned species keywords for fin nipper checks
const LONG_FINNED_KEYWORDS = ['betta', 'angelfish', 'guppy', 'gourami', 'goldfish', 'veiltail', 'butterfly'];

interface FishSpeciesRecord {
  id: string;
  common_name: string;
  scientific_name: string;
  temperament: 'peaceful' | 'semi-aggressive' | 'aggressive';
  adult_size_inches: number;
  min_tank_gallons: number;
  water_type: string;
  temp_min_f: number | null;
  temp_max_f: number | null;
  schooling: boolean;
  min_school_size: number;
  fin_nipper: boolean;
  predator: boolean;
  species_only_tank?: boolean;
}

export async function executeCheckFishCompatibility(
  supabase: SupabaseClient,
  args: {
    aquarium_id: string;
    species_name: string;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // 1. Fetch aquarium details
    const { data: aquarium, error: aquariumError } = await supabase
      .from('aquariums')
      .select('id, name, type, volume_gallons')
      .eq('id', args.aquarium_id)
      .single();

    if (aquariumError || !aquarium) {
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: 'Could not find the specified aquarium'
        })
      };
    }

    // 2. Fetch existing livestock
    const { data: existingLivestock, error: livestockError } = await supabase
      .from('livestock')
      .select('id, name, species, category, quantity, health_status')
      .eq('aquarium_id', args.aquarium_id);

    if (livestockError) {
      logger.error('Failed to fetch livestock', { error: livestockError.message });
    }

    const livestock = existingLivestock || [];

    // 3. Look up the species in our database
    // Sanitize species name for PostgREST filter safety
    const safeName = args.species_name.replace(/[.,()%_\\]/g, '');
    const { data: speciesData, error: speciesError } = await supabase
      .from('fish_species')
      .select('*')
      .or(`common_name.ilike.%${safeName}%,scientific_name.ilike.%${safeName}%`)
      .limit(1)
      .maybeSingle();

    if (speciesError) {
      logger.error('Failed to search fish species', { error: speciesError.message });
    }

    if (!speciesData) {
      // Species not in database - provide general guidance
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: true,
          found_in_database: false,
          species_name: args.species_name,
          aquarium_name: aquarium.name,
          existing_inhabitants: livestock.map(l => `${l.quantity}x ${l.name} (${l.species})`),
          message: `I don't have "${args.species_name}" in my fish database, so I can't provide automated compatibility checking. However, I can help you research this species. What would you like to know about compatibility, care requirements, or tank parameters?`
        })
      };
    }

    // 4. Get species data for existing livestock
    const existingSpeciesNames = livestock.map(l => l.species);

    let existingSpeciesData: FishSpeciesRecord[] = [];

    if (existingSpeciesNames.length > 0) {
      // Sanitize names for PostgREST filter safety
      const conditions = existingSpeciesNames.map(name => {
        const safe = name.replace(/[.,()%_\\]/g, '');
        return `common_name.ilike.${safe},scientific_name.ilike.${safe}`;
      }).join(',');

      const { data: speciesResults } = await supabase
        .from('fish_species')
        .select('*')
        .or(conditions);

      existingSpeciesData = (speciesResults || []) as FishSpeciesRecord[];
    }

    // 5. Run compatibility checks
    const warnings: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      type: string;
      title: string;
      message: string;
    }> = [];

    // Check water type compatibility
    const aquariumType = aquarium.type?.toLowerCase() || '';
    const isFreshwaterTank = ['freshwater', 'planted', 'coldwater'].some(t => aquariumType.includes(t));
    const isSaltwaterTank = ['saltwater', 'reef', 'marine'].some(t => aquariumType.includes(t));

    if (isFreshwaterTank && speciesData.water_type === 'saltwater') {
      warnings.push({
        severity: 'critical',
        type: 'water_type',
        title: 'Wrong Water Type',
        message: `${speciesData.common_name} is a saltwater species and cannot survive in your freshwater ${aquarium.name}.`
      });
    } else if (isSaltwaterTank && speciesData.water_type === 'freshwater') {
      warnings.push({
        severity: 'critical',
        type: 'water_type',
        title: 'Wrong Water Type',
        message: `${speciesData.common_name} is a freshwater species and cannot survive in your saltwater ${aquarium.name}.`
      });
    }

    // Check tank size
    if (aquarium.volume_gallons && speciesData.min_tank_gallons > aquarium.volume_gallons) {
      warnings.push({
        severity: 'high',
        type: 'tank_size',
        title: 'Tank Too Small',
        message: `${speciesData.common_name} requires at least ${speciesData.min_tank_gallons} gallons. Your ${aquarium.name} is ${aquarium.volume_gallons} gallons.`
      });
    }

    // Check species-only tank requirement
    if (speciesData.species_only_tank && livestock.length > 0) {
      const otherSpecies = livestock.filter(l =>
        l.species.toLowerCase() !== speciesData.common_name.toLowerCase() &&
        l.species.toLowerCase() !== speciesData.scientific_name.toLowerCase()
      );
      if (otherSpecies.length > 0) {
        warnings.push({
          severity: 'critical',
          type: 'species_only',
          title: 'Species Only Tank Required',
          message: `${speciesData.common_name} should be kept alone due to extreme aggression. Your tank has: ${otherSpecies.map(l => l.name).join(', ')}.`
        });
      }
    }

    // Check against each existing inhabitant
    for (const inhabitant of livestock) {
      const existingData = existingSpeciesData.find((s) =>
        s.common_name?.toLowerCase() === inhabitant.species.toLowerCase() ||
        s.scientific_name?.toLowerCase() === inhabitant.species.toLowerCase()
      );

      if (!existingData) continue;

      // Temperament check
      if (speciesData.temperament === 'aggressive' && existingData.temperament === 'peaceful') {
        warnings.push({
          severity: 'high',
          type: 'temperament',
          title: 'Aggression Risk',
          message: `${speciesData.common_name} is aggressive and may harm your peaceful ${inhabitant.name}.`
        });
      } else if (existingData.temperament === 'aggressive' && speciesData.temperament === 'peaceful') {
        warnings.push({
          severity: 'high',
          type: 'temperament',
          title: 'Aggression Risk',
          message: `Your aggressive ${inhabitant.name} may harm the peaceful ${speciesData.common_name}.`
        });
      }

      // Fin nipper check using shared keywords
      const existingHasLongFins = LONG_FINNED_KEYWORDS.some(k => inhabitant.species.toLowerCase().includes(k));
      const newHasLongFins = LONG_FINNED_KEYWORDS.some(k => speciesData.common_name.toLowerCase().includes(k));

      if (speciesData.fin_nipper && existingHasLongFins) {
        warnings.push({
          severity: 'high',
          type: 'fin_nipper',
          title: 'Fin Nipping Risk',
          message: `${speciesData.common_name} is known to nip fins and may harass your long-finned ${inhabitant.name}.`
        });
      } else if (existingData.fin_nipper && newHasLongFins) {
        warnings.push({
          severity: 'high',
          type: 'fin_nipper',
          title: 'Fin Nipping Risk',
          message: `Your ${inhabitant.name} may nip the fins of ${speciesData.common_name}.`
        });
      }

      // Size/Predation check
      if (speciesData.predator && existingData.adult_size_inches) {
        const sizeDiff = speciesData.adult_size_inches / existingData.adult_size_inches;
        if (sizeDiff >= 3) {
          warnings.push({
            severity: 'critical',
            type: 'predation',
            title: 'Predation Risk',
            message: `${speciesData.common_name} (${speciesData.adult_size_inches}") may eat your smaller ${inhabitant.name} (${existingData.adult_size_inches}").`
          });
        }
      }

      // Temperature compatibility
      if (speciesData.temp_min_f && speciesData.temp_max_f &&
          existingData.temp_min_f && existingData.temp_max_f) {
        const overlapMin = Math.max(speciesData.temp_min_f, existingData.temp_min_f);
        const overlapMax = Math.min(speciesData.temp_max_f, existingData.temp_max_f);
        if (overlapMin > overlapMax) {
          warnings.push({
            severity: 'critical',
            type: 'temperature',
            title: 'Temperature Incompatible',
            message: `${speciesData.common_name} (${speciesData.temp_min_f}-${speciesData.temp_max_f}°F) and ${inhabitant.name} (${existingData.temp_min_f}-${existingData.temp_max_f}°F) have no overlapping temperature range.`
          });
        }
      }
    }

    // Schooling requirement note
    if (speciesData.schooling && speciesData.min_school_size > 1) {
      warnings.push({
        severity: 'medium',
        type: 'schooling',
        title: 'Schooling Species',
        message: `${speciesData.common_name} is a schooling species and should be kept in groups of ${speciesData.min_school_size}+ for best health and reduced stress.`
      });
    }

    // Calculate compatibility score
    let score = 100;
    for (const warning of warnings) {
      switch (warning.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    }
    score = Math.max(0, score);

    const hasCritical = warnings.some(w => w.severity === 'critical');

    logger.info('Fish compatibility check completed', {
      species: speciesData.common_name,
      aquarium: aquarium.name,
      warningCount: warnings.length,
      score
    });

    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({
        success: true,
        found_in_database: true,
        species: {
          common_name: speciesData.common_name,
          scientific_name: speciesData.scientific_name,
          temperament: speciesData.temperament,
          adult_size_inches: speciesData.adult_size_inches,
          min_tank_gallons: speciesData.min_tank_gallons,
          water_type: speciesData.water_type,
          temp_range: speciesData.temp_min_f && speciesData.temp_max_f
            ? `${speciesData.temp_min_f}-${speciesData.temp_max_f}°F` : null,
          schooling: speciesData.schooling,
          min_school_size: speciesData.min_school_size
        },
        aquarium: {
          name: aquarium.name,
          type: aquarium.type,
          volume_gallons: aquarium.volume_gallons
        },
        existing_inhabitants: livestock.map(l => ({
          name: l.name,
          species: l.species,
          quantity: l.quantity
        })),
        compatibility: {
          score,
          compatible: warnings.length === 0,
          can_proceed: !hasCritical,
          warning_count: warnings.length,
          warnings
        }
      })
    };
  } catch (e) {
    logger.error('Error checking fish compatibility', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to check fish compatibility' })
    };
  }
}
