/**
 * Dosing Calculator Tool Handler
 *
 * Calculates product doses based on aquarium/pool volume.
 * Contains an inline product database for common aquatics products.
 */

import type { SupabaseClient, ToolResult, Logger } from '../types.ts';

// ============= PRODUCT DATABASE =============

interface DosingProduct {
  name: string;
  aliases: string[];
  category: 'dechlorinator' | 'fertilizer' | 'medication' | 'reef_supplement' | 'pool_chemical';
  dose_per_gallon: number; // mL per gallon (or oz per gallon for pool chemicals)
  unit: string;
  min_dose?: number; // minimum dose regardless of volume
  max_dose?: number; // maximum dose per application
  instructions: string;
  safety_warnings: string[];
  notes?: string;
}

const DOSING_DATABASE: DosingProduct[] = [
  // === DECHLORINATORS ===
  {
    name: 'Seachem Prime',
    aliases: ['prime', 'seachem prime'],
    category: 'dechlorinator',
    dose_per_gallon: 0.1, // 5mL per 50 gallons = 0.1mL/gal
    unit: 'mL',
    min_dose: 1,
    instructions: 'Add directly to tank or new water. 1 capful (5mL) treats 50 gallons. For emergency ammonia/nitrite detox, use up to 5x dose.',
    safety_warnings: [
      'May cause a sulfur smell at higher doses — this is normal',
      'Safe for all fish, plants, and invertebrates',
    ],
    notes: 'Can detoxify ammonia and nitrite for 24-48 hours at standard dose.',
  },
  {
    name: 'API Stress Coat+',
    aliases: ['stress coat', 'api stress coat', 'stress coat+'],
    category: 'dechlorinator',
    dose_per_gallon: 0.1, // 5mL per 50 gallons
    unit: 'mL',
    min_dose: 1,
    instructions: 'Add 5mL per 10 gallons for water changes. Double dose for fish with damaged fins or scales.',
    safety_warnings: [
      'Safe for all freshwater and saltwater fish',
    ],
  },

  // === FERTILIZERS ===
  {
    name: 'Seachem Flourish',
    aliases: ['flourish', 'seachem flourish'],
    category: 'fertilizer',
    dose_per_gallon: 0.1, // 5mL per 60 gallons ≈ 0.083, rounded up
    unit: 'mL',
    min_dose: 1,
    instructions: 'Dose 5mL per 60 gallons 1-2x per week. Best added after water changes.',
    safety_warnings: [
      'Overdosing can promote algae growth',
      'Safe for shrimp and invertebrates at recommended dose',
    ],
  },
  {
    name: 'Seachem Flourish Excel',
    aliases: ['flourish excel', 'excel', 'seachem excel'],
    category: 'fertilizer',
    dose_per_gallon: 0.1, // 5mL per 50 gallons
    unit: 'mL',
    min_dose: 1,
    instructions: 'Initial dose: 5mL per 50 gallons. Daily maintenance: 5mL per 200 gallons. Can spot-dose algae directly.',
    safety_warnings: [
      'Toxic to Vallisneria and some mosses at high doses',
      'Do not overdose — can harm sensitive plants and invertebrates',
      'Not a replacement for CO2 injection in high-tech tanks',
    ],
  },
  {
    name: 'API Leaf Zone',
    aliases: ['leaf zone', 'api leaf zone'],
    category: 'fertilizer',
    dose_per_gallon: 0.1, // 5mL per 10 gallons
    unit: 'mL',
    min_dose: 1,
    instructions: 'Add 5mL per 10 gallons weekly.',
    safety_warnings: [
      'Contains iron and potassium — monitor levels if also dosing individually',
    ],
  },

  // === MEDICATIONS ===
  {
    name: 'API Melafix',
    aliases: ['melafix', 'api melafix'],
    category: 'medication',
    dose_per_gallon: 0.1, // 5mL per 10 gallons
    unit: 'mL',
    min_dose: 1,
    instructions: 'Add 5mL per 10 gallons daily for 7 days. On day 7, do a 25% water change. Repeat if necessary.',
    safety_warnings: [
      'NOT safe for labyrinth fish (bettas, gouramis) — can damage labyrinth organ',
      'Remove activated carbon during treatment',
      'Increase aeration during treatment',
    ],
  },
  {
    name: 'Seachem ParaGuard',
    aliases: ['paraguard', 'seachem paraguard', 'para guard'],
    category: 'medication',
    dose_per_gallon: 0.1, // 5mL per 50 gallons
    unit: 'mL',
    min_dose: 1,
    instructions: 'Add 5mL per 50 gallons daily. Turn off UV sterilizers. Treatment for 2-3 weeks or until symptoms resolve.',
    safety_warnings: [
      'Use half dose for scaleless fish and invertebrates',
      'Remove activated carbon during treatment',
      'May reduce dissolved oxygen — increase aeration',
      'Not recommended for use with other medications simultaneously',
    ],
  },
  {
    name: 'Hikari Ich-X',
    aliases: ['ich-x', 'ich x', 'hikari ich-x', 'ichx'],
    category: 'medication',
    dose_per_gallon: 0.1, // 5mL per 10 gallons
    unit: 'mL',
    min_dose: 1,
    instructions: 'Add 5mL per 10 gallons. Do a 1/3 water change every 24 hours before re-dosing. Continue 3 days past last visible spot.',
    safety_warnings: [
      'Will stain silicone, decorations, and skin blue-green',
      'Remove activated carbon during treatment',
      'Safe for scaleless fish at full dose',
      'Safe for most plants',
    ],
  },

  // === REEF SUPPLEMENTS ===
  {
    name: 'Brightwell Calcion',
    aliases: ['calcion', 'brightwell calcion'],
    category: 'reef_supplement',
    dose_per_gallon: 0.1, // 5mL per 50 gallons
    unit: 'mL',
    min_dose: 1,
    instructions: 'Add 5mL per 50 gallons daily. Test calcium before and after dosing. Target: 400-450 ppm.',
    safety_warnings: [
      'Do not add near magnesium supplements — add at least 30 minutes apart',
      'Test calcium levels before dosing — overdosing can cause precipitation',
      'Monitor alkalinity as well — calcium and alkalinity are linked',
    ],
  },
  {
    name: 'Red Sea Reef Foundation A',
    aliases: ['reef foundation a', 'red sea foundation a', 'rfa', 'foundation a'],
    category: 'reef_supplement',
    dose_per_gallon: 0.02, // 1mL per 50 gallons raises Ca by ~2 ppm
    unit: 'mL',
    instructions: 'Dose to raise calcium 2 ppm per 1mL per 50 gallons. Test and adjust. Do not raise more than 20 ppm per day.',
    safety_warnings: [
      'Test before and after dosing',
      'Add to high-flow area of sump',
      'Space doses of A, B, and C at least 30 minutes apart',
    ],
    notes: 'Calcium supplement. Part of the A/B/C system.',
  },
  {
    name: 'Red Sea Reef Foundation B',
    aliases: ['reef foundation b', 'red sea foundation b', 'rfb', 'foundation b'],
    category: 'reef_supplement',
    dose_per_gallon: 0.02, // 1mL per 50 gallons raises Alk by ~0.36 dKH
    unit: 'mL',
    instructions: 'Dose to raise alkalinity. 1mL per 50 gallons raises Alk ~0.36 dKH. Do not raise more than 1.4 dKH per day.',
    safety_warnings: [
      'Test before and after dosing',
      'Rapid alkalinity swings can stress corals',
      'Space doses of A, B, and C at least 30 minutes apart',
    ],
    notes: 'Alkalinity (buffer) supplement. Part of the A/B/C system.',
  },
  {
    name: 'Red Sea Reef Foundation C',
    aliases: ['reef foundation c', 'red sea foundation c', 'rfc', 'foundation c'],
    category: 'reef_supplement',
    dose_per_gallon: 0.02, // 1mL per 50 gallons raises Mg by ~1 ppm
    unit: 'mL',
    instructions: 'Dose to raise magnesium. 1mL per 50 gallons raises Mg ~1 ppm. Target: 1300-1450 ppm.',
    safety_warnings: [
      'Test before and after dosing',
      'Space doses of A, B, and C at least 30 minutes apart',
    ],
    notes: 'Magnesium supplement. Part of the A/B/C system.',
  },

  // === POOL CHEMICALS ===
  {
    name: 'Liquid Chlorine',
    aliases: ['liquid chlorine', 'sodium hypochlorite', 'bleach', 'pool chlorine', 'liquid shock'],
    category: 'pool_chemical',
    dose_per_gallon: 0.00026, // ~10 fl oz per 10,000 gallons to raise FC by 1 ppm (12.5% concentration)
    unit: 'fl oz',
    instructions: 'At 12.5% concentration: ~10 fl oz per 10,000 gallons raises FC by ~1 ppm. Pour along pool edge with pump running. Allow 30 min circulation before testing.',
    safety_warnings: [
      'Never mix with acid or other pool chemicals',
      'Add to water, never water to chemical',
      'Do not swim until FC drops below 5 ppm',
      'Wear protective gloves and eye protection',
      'Store in cool, shaded area — degrades in heat and sunlight',
    ],
    notes: 'Calculation assumes 12.5% sodium hypochlorite concentration.',
  },
  {
    name: 'Muriatic Acid',
    aliases: ['muriatic acid', 'hydrochloric acid', 'pool acid', 'ph down pool', 'ph minus'],
    category: 'pool_chemical',
    dose_per_gallon: 0.000128, // ~16 fl oz per 10,000 gallons lowers pH by ~0.2
    unit: 'fl oz',
    instructions: 'At 31.45% concentration: ~16 fl oz (1 pint) per 10,000 gallons lowers pH by ~0.2. Pour slowly into deep end with pump running. Wait 4+ hours and retest before adding more.',
    safety_warnings: [
      'EXTREMELY CORROSIVE — wear acid-resistant gloves and eye protection',
      'Never mix with chlorine — produces toxic chlorine gas',
      'Always add acid to water, never water to acid',
      'Pour slowly into deep end away from equipment returns',
      'Do not swim for at least 4 hours after adding',
    ],
    notes: 'For lowering pH and alkalinity. Always adjust in small increments.',
  },
  {
    name: 'Baking Soda',
    aliases: ['baking soda', 'sodium bicarbonate', 'alkalinity up', 'alkalinity increaser'],
    category: 'pool_chemical',
    dose_per_gallon: 0.00017, // ~1.5 lbs per 10,000 gallons raises TA by 10 ppm
    unit: 'lbs',
    instructions: '1.5 lbs per 10,000 gallons raises total alkalinity by ~10 ppm. Pre-dissolve in bucket of pool water. Add to pool with pump running. Wait 6 hours and retest.',
    safety_warnings: [
      'Will also raise pH slightly',
      'Do not raise TA more than 10 ppm per application',
      'Pre-dissolve to avoid cloudy water',
    ],
    notes: 'For raising total alkalinity. Cheap and effective.',
  },
  {
    name: 'Cyanuric Acid',
    aliases: ['cyanuric acid', 'cya', 'stabilizer', 'pool stabilizer', 'conditioner'],
    category: 'pool_chemical',
    dose_per_gallon: 0.00013, // ~13 oz per 10,000 gallons raises CYA by 10 ppm
    unit: 'oz',
    instructions: '13 oz per 10,000 gallons raises CYA by ~10 ppm. Dissolve in warm water or add to skimmer basket (with pump running). Takes 3-7 days to fully dissolve and register on tests.',
    safety_warnings: [
      'CYA does NOT decrease naturally — the only way to lower it is dilution (partial drain and refill)',
      'Target 30-50 ppm for chlorine pools, 70-80 ppm for saltwater pools',
      'CYA above 100 ppm makes chlorine ineffective — may need partial drain',
      'Do not add through skimmer on systems with heaters in the line',
    ],
  },
];

// ============= FUZZY MATCH =============

function fuzzyMatchProduct(query: string): DosingProduct | null {
  const normalizedQuery = query.toLowerCase().trim();

  // Exact name match
  const exactMatch = DOSING_DATABASE.find(
    p => p.name.toLowerCase() === normalizedQuery
  );
  if (exactMatch) return exactMatch;

  // Alias match
  const aliasMatch = DOSING_DATABASE.find(
    p => p.aliases.some(a => a === normalizedQuery)
  );
  if (aliasMatch) return aliasMatch;

  // Substring match on name
  const substringMatch = DOSING_DATABASE.find(
    p => p.name.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(p.name.toLowerCase())
  );
  if (substringMatch) return substringMatch;

  // Substring match on aliases
  const aliasSubstringMatch = DOSING_DATABASE.find(
    p => p.aliases.some(a => a.includes(normalizedQuery) || normalizedQuery.includes(a))
  );
  if (aliasSubstringMatch) return aliasSubstringMatch;

  return null;
}

// ============= HANDLER =============

export async function executeCalculateDose(
  supabase: SupabaseClient,
  args: {
    aquarium_id: string;
    product_name: string;
    current_level?: number;
    target_level?: number;
  },
  toolCallId: string,
  logger: Logger
): Promise<ToolResult> {
  try {
    // 1. Look up aquarium volume
    const { data: aquarium, error: aquariumError } = await supabase
      .from('aquariums')
      .select('name, volume_gallons, type')
      .eq('id', args.aquarium_id)
      .single();

    if (aquariumError || !aquarium) {
      logger.error('Failed to fetch aquarium for dosing', { error: aquariumError?.message });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: 'Could not find the aquarium. Please make sure an aquarium is selected.',
        }),
      };
    }

    const volume = aquarium.volume_gallons;
    if (!volume || volume <= 0) {
      logger.info('Aquarium has no volume set', { aquariumId: args.aquarium_id });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: `"${aquarium.name}" doesn't have a volume set. Please ask the user to set the volume in their aquarium settings (or use the pool volume calculator) before calculating doses.`,
        }),
      };
    }

    // 2. Fuzzy-match product
    const product = fuzzyMatchProduct(args.product_name);

    if (!product) {
      logger.info('Product not found in database', { query: args.product_name });
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        content: JSON.stringify({
          success: true,
          found: false,
          aquarium_name: aquarium.name,
          volume_gallons: volume,
          product_query: args.product_name,
          message: `"${args.product_name}" is not in the built-in product database. If the user can provide the dosing rate (e.g., "5mL per 10 gallons"), you can calculate the amount for their ${volume}-gallon ${aquarium.name}. Otherwise, use your general knowledge to provide approximate guidance with appropriate safety caveats.`,
          suggestion: 'Ask the user for the product label dosing instructions, then calculate based on their volume.',
        }),
      };
    }

    // 3. Calculate dose
    let calculatedDose = volume * product.dose_per_gallon;

    // Apply min/max bounds
    if (product.min_dose && calculatedDose < product.min_dose) {
      calculatedDose = product.min_dose;
    }
    if (product.max_dose && calculatedDose > product.max_dose) {
      calculatedDose = product.max_dose;
    }

    // Round to reasonable precision
    const displayDose = product.unit === 'lbs'
      ? Math.round(calculatedDose * 100) / 100 // 2 decimal places for lbs
      : Math.round(calculatedDose * 10) / 10;  // 1 decimal place for mL/oz

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      found: true,
      product_name: product.name,
      category: product.category,
      aquarium_name: aquarium.name,
      volume_gallons: volume,
      calculated_dose: displayDose,
      unit: product.unit,
      instructions: product.instructions,
      safety_warnings: product.safety_warnings,
      message: `For ${aquarium.name} (${volume} gallons): dose ${displayDose} ${product.unit} of ${product.name}. ${product.instructions}`,
      reminder: 'Test water parameters before and after dosing.',
    };

    if (product.notes) {
      response.notes = product.notes;
    }

    // For pool chemicals with current/target levels, provide adjusted calculation info
    if (args.current_level !== undefined && args.target_level !== undefined) {
      response.current_level = args.current_level;
      response.target_level = args.target_level;
      response.adjustment_note = `To adjust from ${args.current_level} to ${args.target_level}: dose in small increments, test after each addition, and allow circulation time between doses.`;
    }

    logger.info('Dosing calculated', {
      product: product.name,
      aquariumId: args.aquarium_id,
      volume,
      dose: displayDose,
      unit: product.unit,
    });

    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify(response),
    };
  } catch (e) {
    logger.error('Error calculating dose', { error: String(e) });
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      content: JSON.stringify({ success: false, error: 'Failed to calculate dose' }),
    };
  }
}
