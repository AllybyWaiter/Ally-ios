/**
 * Fish Compatibility Checker
 * 
 * Checks compatibility between fish species based on temperament,
 * size, water parameters, and behavioral traits.
 */

export interface FishSpecies {
  id: string;
  common_name: string;
  scientific_name: string;
  category: string;
  water_type: string;
  temperament: 'peaceful' | 'semi-aggressive' | 'aggressive';
  schooling: boolean;
  min_school_size: number;
  adult_size_inches: number;
  min_tank_gallons: number;
  temp_min_f: number | null;
  temp_max_f: number | null;
  ph_min: number | null;
  ph_max: number | null;
  hardness_min_dgh: number | null;
  hardness_max_dgh: number | null;
  fin_nipper: boolean;
  predator: boolean;
  territorial: boolean;
  bottom_dweller: boolean;
  top_dweller: boolean;
  mid_dweller: boolean;
  species_only_tank: boolean;
  incompatible_categories: string[];
}

export interface ExistingLivestock {
  id: string;
  name: string;
  species: string;
  category: string;
  quantity: number;
  health_status: string;
}

export interface AquariumInfo {
  id: string;
  name: string;
  type: string;
  volume_gallons: number | null;
}

export type WarningSeverity = 'critical' | 'high' | 'medium' | 'low';
export type WarningType = 
  | 'temperament' 
  | 'size' 
  | 'water_type' 
  | 'parameters' 
  | 'space' 
  | 'schooling' 
  | 'fin_nipper' 
  | 'predator' 
  | 'territorial'
  | 'species_only';

export interface CompatibilityWarning {
  type: WarningType;
  severity: WarningSeverity;
  title: string;
  message: string;
  affectedSpecies?: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  score: number; // 0-100
  warnings: CompatibilityWarning[];
  canProceed: boolean; // false if critical issues exist
}

/**
 * Check if two temperature ranges overlap
 */
function hasTemperatureOverlap(
  species1: FishSpecies,
  species2: FishSpecies
): { overlaps: boolean; overlap?: [number, number] } {
  if (!species1.temp_min_f || !species1.temp_max_f || !species2.temp_min_f || !species2.temp_max_f) {
    return { overlaps: true }; // Assume compatible if data missing
  }
  
  const overlapMin = Math.max(species1.temp_min_f, species2.temp_min_f);
  const overlapMax = Math.min(species1.temp_max_f, species2.temp_max_f);
  
  if (overlapMin <= overlapMax) {
    return { overlaps: true, overlap: [overlapMin, overlapMax] };
  }
  return { overlaps: false };
}

/**
 * Check if two pH ranges overlap
 */
function hasPHOverlap(
  species1: FishSpecies,
  species2: FishSpecies
): { overlaps: boolean; overlap?: [number, number] } {
  if (!species1.ph_min || !species1.ph_max || !species2.ph_min || !species2.ph_max) {
    return { overlaps: true };
  }
  
  const overlapMin = Math.max(species1.ph_min, species2.ph_min);
  const overlapMax = Math.min(species1.ph_max, species2.ph_max);
  
  if (overlapMin <= overlapMax) {
    return { overlaps: true, overlap: [overlapMin, overlapMax] };
  }
  return { overlaps: false };
}

/**
 * Check if a larger fish might eat a smaller one
 */
function isPredationRisk(species1: FishSpecies, species2: FishSpecies): boolean {
  if (!species1.adult_size_inches || !species2.adult_size_inches) return false;
  // If size difference is 3x or more, there's predation risk
  const sizeDiff = species1.adult_size_inches / species2.adult_size_inches;
  if (sizeDiff >= 3 && species1.predator) return true;
  if (1 / sizeDiff >= 3 && species2.predator) return true;
  return false;
}

/**
 * Check if fish occupy the same water column level
 */
function shareWaterLevel(species1: FishSpecies, species2: FishSpecies): boolean {
  if (species1.bottom_dweller && species2.bottom_dweller) return true;
  if (species1.mid_dweller && species2.mid_dweller) return true;
  if (species1.top_dweller && species2.top_dweller) return true;
  return false;
}

/**
 * Long-finned species keywords - shared constant for consistency
 */
export const LONG_FINNED_KEYWORDS = [
  'betta', 'angelfish', 'guppy', 'fancy goldfish', 'gourami', 
  'veiltail', 'butterfly', 'long fin', 'longfin'
] as const;

/**
 * Check if a species has long fins (simplified check)
 */
export function hasLongFins(speciesName: string): boolean {
  const lowerName = speciesName.toLowerCase();
  return LONG_FINNED_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

/**
 * Main compatibility checking function
 */
export function checkCompatibility(
  newSpecies: FishSpecies,
  existingLivestock: ExistingLivestock[],
  aquarium: AquariumInfo,
  existingSpeciesData: FishSpecies[]
): CompatibilityResult {
  const warnings: CompatibilityWarning[] = [];
  let score = 100;

  // Map existing livestock to their species data
  const existingSpeciesMap = new Map<string, FishSpecies>();
  existingSpeciesData.forEach(sp => {
    existingSpeciesMap.set(sp.common_name.toLowerCase(), sp);
    existingSpeciesMap.set(sp.scientific_name.toLowerCase(), sp);
  });

  // 1. Check water type compatibility
  const aquariumWaterType = aquarium.type.toLowerCase();
  const isFreshwater = ['freshwater', 'planted', 'coldwater'].some(t => aquariumWaterType.includes(t));
  const isSaltwater = ['saltwater', 'reef', 'marine'].some(t => aquariumWaterType.includes(t));
  
  if (isFreshwater && newSpecies.water_type === 'saltwater') {
    warnings.push({
      type: 'water_type',
      severity: 'critical',
      title: 'Wrong Water Type',
      message: `${newSpecies.common_name} is a saltwater species and cannot survive in a freshwater tank.`
    });
    score -= 50;
  } else if (isSaltwater && newSpecies.water_type === 'freshwater') {
    warnings.push({
      type: 'water_type',
      severity: 'critical',
      title: 'Wrong Water Type',
      message: `${newSpecies.common_name} is a freshwater species and cannot survive in a saltwater tank.`
    });
    score -= 50;
  }

  // 2. Check tank size
  if (aquarium.volume_gallons && aquarium.volume_gallons < newSpecies.min_tank_gallons) {
    warnings.push({
      type: 'space',
      severity: 'high',
      title: 'Tank Too Small',
      message: `${newSpecies.common_name} requires at least ${newSpecies.min_tank_gallons} gallons. Your tank is ${aquarium.volume_gallons} gallons.`
    });
    score -= 20;
  }

  // 3. Check species-only tank requirement
  if (newSpecies.species_only_tank && existingLivestock.length > 0) {
    const otherSpecies = existingLivestock.filter(l => 
      l.species.toLowerCase() !== newSpecies.common_name.toLowerCase() &&
      l.species.toLowerCase() !== newSpecies.scientific_name.toLowerCase()
    );
    if (otherSpecies.length > 0) {
      warnings.push({
        type: 'species_only',
        severity: 'critical',
        title: 'Species Only Tank Required',
        message: `${newSpecies.common_name} should be kept alone without other fish species due to extreme aggression.`
      });
      score -= 40;
    }
  }

  // 4. Check against each existing livestock
  for (const livestock of existingLivestock) {
    const existingData = existingSpeciesMap.get(livestock.species.toLowerCase());
    if (!existingData) continue;

    // Temperament check
    if (newSpecies.temperament === 'aggressive' && existingData.temperament === 'peaceful') {
      warnings.push({
        type: 'temperament',
        severity: 'high',
        title: 'Aggression Risk',
        message: `${newSpecies.common_name} is aggressive and may harm your peaceful ${livestock.species}.`,
        affectedSpecies: livestock.species
      });
      score -= 15;
    } else if (existingData.temperament === 'aggressive' && newSpecies.temperament === 'peaceful') {
      warnings.push({
        type: 'temperament',
        severity: 'high',
        title: 'Aggression Risk',
        message: `Your aggressive ${livestock.species} may harm the peaceful ${newSpecies.common_name}.`,
        affectedSpecies: livestock.species
      });
      score -= 15;
    }

    // Fin nipper check
    if (newSpecies.fin_nipper && hasLongFins(livestock.species)) {
      warnings.push({
        type: 'fin_nipper',
        severity: 'high',
        title: 'Fin Nipping Risk',
        message: `${newSpecies.common_name} is known to nip fins and may harass your long-finned ${livestock.species}.`,
        affectedSpecies: livestock.species
      });
      score -= 15;
    } else if (existingData.fin_nipper && hasLongFins(newSpecies.common_name)) {
      warnings.push({
        type: 'fin_nipper',
        severity: 'high',
        title: 'Fin Nipping Risk',
        message: `Your ${livestock.species} may nip the fins of ${newSpecies.common_name}.`,
        affectedSpecies: livestock.species
      });
      score -= 15;
    }

    // Predation risk
    if (isPredationRisk(newSpecies, existingData)) {
      const larger = newSpecies.adult_size_inches > existingData.adult_size_inches 
        ? newSpecies.common_name 
        : livestock.species;
      const smaller = newSpecies.adult_size_inches > existingData.adult_size_inches 
        ? livestock.species 
        : newSpecies.common_name;
      warnings.push({
        type: 'predator',
        severity: 'critical',
        title: 'Predation Risk',
        message: `${larger} may eat ${smaller} due to significant size difference.`,
        affectedSpecies: livestock.species
      });
      score -= 30;
    }

    // Size difference warning (even without predation)
    const sizeDiff = existingData.adult_size_inches > 0
      ? newSpecies.adult_size_inches / existingData.adult_size_inches
      : 0;
    const inverseSizeDiff = newSpecies.adult_size_inches > 0
      ? existingData.adult_size_inches / newSpecies.adult_size_inches
      : 0;
    if ((sizeDiff >= 2 || inverseSizeDiff >= 2) && !isPredationRisk(newSpecies, existingData)) {
      warnings.push({
        type: 'size',
        severity: 'low',
        title: 'Size Mismatch',
        message: `${newSpecies.common_name} (${newSpecies.adult_size_inches}") and ${livestock.species} (${existingData.adult_size_inches}") have different adult sizes. Monitor for bullying.`,
        affectedSpecies: livestock.species
      });
      score -= 5;
    }

    // Temperature compatibility
    const tempOverlap = hasTemperatureOverlap(newSpecies, existingData);
    if (!tempOverlap.overlaps) {
      warnings.push({
        type: 'parameters',
        severity: 'critical',
        title: 'Temperature Incompatible',
        message: `${newSpecies.common_name} (${newSpecies.temp_min_f}-${newSpecies.temp_max_f}°F) and ${livestock.species} (${existingData.temp_min_f}-${existingData.temp_max_f}°F) have no overlapping temperature range.`,
        affectedSpecies: livestock.species
      });
      score -= 25;
    }

    // pH compatibility
    const phOverlap = hasPHOverlap(newSpecies, existingData);
    if (!phOverlap.overlaps) {
      warnings.push({
        type: 'parameters',
        severity: 'high',
        title: 'pH Incompatible',
        message: `${newSpecies.common_name} (pH ${newSpecies.ph_min}-${newSpecies.ph_max}) and ${livestock.species} (pH ${existingData.ph_min}-${existingData.ph_max}) prefer different pH ranges.`,
        affectedSpecies: livestock.species
      });
      score -= 15;
    }

    // Territorial conflicts in same water level
    if (newSpecies.territorial && existingData.territorial && shareWaterLevel(newSpecies, existingData)) {
      warnings.push({
        type: 'territorial',
        severity: 'medium',
        title: 'Territorial Conflict',
        message: `Both ${newSpecies.common_name} and ${livestock.species} are territorial and occupy the same water level. Provide plenty of hiding spots.`,
        affectedSpecies: livestock.species
      });
      score -= 10;
    }
  }

  // 5. Check schooling requirements
  if (newSpecies.schooling && newSpecies.min_school_size > 1) {
    warnings.push({
      type: 'schooling',
      severity: 'medium',
      title: 'Schooling Fish',
      message: `${newSpecies.common_name} is a schooling species and should be kept in groups of ${newSpecies.min_school_size}+ for best health and behavior.`
    });
    // Don't reduce score, just informational
  }

  // Ensure score doesn't go below 0 or result in NaN (division by zero protection)
  score = Math.max(0, Number.isFinite(score) ? score : 0);

  // Determine if user can proceed
  const hasCritical = warnings.some(w => w.severity === 'critical');
  
  return {
    compatible: warnings.length === 0,
    score,
    warnings,
    canProceed: !hasCritical
  };
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: WarningSeverity): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: WarningSeverity): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
  }
}
