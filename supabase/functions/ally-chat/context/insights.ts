/**
 * Aquarium Insights Engine
 *
 * Pure computation module — no I/O. Takes fetched data and returns
 * structured insights for AI context: parameter trends, species-parameter
 * mismatches, maintenance statuses, stocking analysis, ammonia toxicity,
 * cycling detection, temperament conflicts, test staleness, optimal zones,
 * and water change estimates.
 */

import { PARAMETER_RANGES, getParameterStatus } from '../tools/parameterRanges.ts';

// ============= TYPES =============

interface TestParameter {
  parameter_name: string;
  value: number;
  unit?: string;
  status?: string;
}

interface WaterTest {
  test_date: string;
  test_parameters?: TestParameter[];
}

interface Livestock {
  name: string;
  species: string;
  quantity: number;
  category: string;
  health_status: string;
}

interface FishSpecies {
  common_name: string;
  scientific_name?: string;
  category?: string;              // 'fish', 'invertebrate', 'coral'
  water_type?: string;
  ph_min?: number;
  ph_max?: number;
  temp_min_f?: number;
  temp_max_f?: number;
  hardness_min_dgh?: number;
  hardness_max_dgh?: number;
  adult_size_inches?: number;
  min_tank_gallons?: number;
  min_school_size?: number;
  schooling?: boolean;
  temperament?: string;
  fin_nipper?: boolean;
  predator?: boolean;
  territorial?: boolean;
  bottom_dweller?: boolean;
  mid_dweller?: boolean;
  top_dweller?: boolean;
  incompatible_categories?: string[];
  species_only_tank?: boolean;
}

interface Equipment {
  id?: string;
  name: string;
  equipment_type: string;
  brand?: string;
  model?: string;
  maintenance_interval_days?: number;
  last_maintenance_date?: string;
  install_date?: string;
  notes?: string;
}

interface Plant {
  name: string;
  species: string;
  quantity: number;
  placement: string;       // foreground, midground, background, floating
  condition: string;        // thriving, growing, struggling
  notes?: string;
}

export interface PlantAnalysis {
  totalPlants: number;
  conditionSummary: { thriving: number; growing: number; struggling: number };
  warnings: string[];
  suggestions: string[];
}

export interface TankSizeWarning {
  species: string;
  minGallons: number;
  actualGallons: number;
  severity: 'warning' | 'critical';
}

export interface NicheConflict {
  zone: 'bottom' | 'mid' | 'top';
  species: string[];
  territorialSpecies: string[];
  severity: 'info' | 'caution' | 'concern';
}

export interface ParameterTrend {
  parameter: string;
  currentValue: number;
  currentStatus: 'good' | 'warning' | 'critical';
  direction: 'rising' | 'falling' | 'stable';
  ratePerWeek: number;
  daysUntilThreshold?: number;
  thresholdType?: 'warning' | 'critical';
  dataPoints: number;
}

export interface SpeciesMismatch {
  speciesName: string;
  parameter: string;
  currentValue: number;
  speciesMin: number;
  speciesMax: number;
  severity: 'caution' | 'concern' | 'critical';
}

export interface MaintenanceStatus {
  equipmentName: string;
  equipmentType: string;
  status: 'overdue' | 'due_soon' | 'on_track';
  daysSinceLastMaintenance: number | null;
  intervalDays: number;
  daysRemaining: number | null;
}

export interface StockingAnalysis {
  totalInches: number;
  capacityInches: number;
  percentStocked: number;
  status: 'understocked' | 'balanced' | 'heavy' | 'overstocked';
  schoolingWarnings: { species: string; current: number; minimum: number }[];
}

export interface OptimalZone {
  parameter: string;
  overlapMin: number;
  overlapMax: number;
  currentValue: number | null;
  speciesInZone: string[];
  speciesOutOfZone: string[];
  hasOverlap: boolean;
}

export interface AmmoniaToxicity {
  totalAmmonia: number;
  ph: number;
  temperatureF: number;
  percentNH3: number;
  toxicNH3ppm: number;
  severity: 'safe' | 'caution' | 'danger' | 'critical';
  message: string;
}

export interface CyclingPhase {
  phase: 'not_started' | 'phase1_ammonia' | 'phase2_nitrite' | 'phase3_completing' | 'cycled' | 'unknown';
  description: string;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
}

export interface TemperamentConflict {
  aggressor: string;
  aggressorTemperament: string;
  target: string;
  targetTemperament: string;
  severity: 'caution' | 'concern' | 'critical';
}

export interface TestStaleness {
  daysSinceLastTest: number;
  lastTestDate: string | null;
  severity: 'fresh' | 'aging' | 'stale' | 'very_stale';
  hasLivestock: boolean;
}

export interface WaterChangeEstimate {
  nitrateRatePerWeek: number;
  currentNitrate: number;
  targetNitrate: number;
  recommendedPercentage: number;
  recommendedFrequency: string;
  volumeGallons: number | null;
  changeGallons: number | null;
}

export interface ParameterInteraction {
  type: string;
  severity: 'info' | 'caution' | 'danger' | 'critical';
  parameters: string[];
  message: string;
}

export interface WhatIfScenario {
  action: string;
  effects: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface HealthScore {
  overall: number;             // 0-100
  label: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  breakdown: { category: string; score: number; maxScore: number; issues: string[] }[];
}

export interface ActionItem {
  priority: number;            // 1 = most urgent
  action: string;              // short imperative: "Do a 30% water change"
  reason: string;              // why: "Nitrate at 35 ppm and rising 5/week"
  impact: string;              // what happens: "Drops nitrate to ~25, reduces NH3"
  urgency: 'now' | 'today' | 'this_week' | 'soon';
}

export interface RecentTrajectory {
  parameter: string;
  values: { value: number; daysAgo: number }[];  // last 3-5 readings
  trajectory: 'improving' | 'worsening' | 'stable' | 'fluctuating';
  recentChange: number;       // change between last 2 readings
  narrative: string;           // "Nitrate: 20 → 25 → 32 (worsening)"
}

export interface DosingRecommendation {
  parameter: string;
  currentValue: number;
  targetValue: number;
  chemical: string;
  dose: string;
  instructions: string;
  caution?: string;
}

export interface SeasonalFactor {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  risks: string[];
  tips: string[];
  relevantToCurrentConditions: string[];
}

export interface DiseaseRisk {
  score: number;
  label: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  factors: { factor: string; weight: number; description: string }[];
  mitigations: string[];
}

export interface RecurringPattern {
  parameter: string;
  patternType: 'sawtooth' | 'cyclic_swing' | 'recurring_spike' | 'chronic_drift';
  description: string;
  estimatedCycleDays?: number;
  suggestedFix: string;
}

export interface CompatibilityReport {
  overallRating: 'excellent' | 'good' | 'mixed' | 'poor';
  pairs: { speciesA: string; speciesB: string; compatible: boolean; reason: string }[];
  summary: string;
}

export interface ParameterCorrelation {
  paramA: string;
  paramB: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  interpretation: string;
}

export interface DataGap {
  missing: string;                // what's missing: "water_tests", "volume", "livestock", etc.
  importance: 'critical' | 'high' | 'medium' | 'low';
  reason: string;                 // why it matters
  askPrompt: string;              // what to ask the user
}

export interface DataCompleteness {
  score: number;                  // 0-100 data completeness
  label: 'blind' | 'minimal' | 'partial' | 'good' | 'comprehensive';
  gaps: DataGap[];
  availableInsights: string[];    // what analyses ARE possible with current data
  blindSpots: string[];           // what we CAN'T assess
}

export interface CrisisProtocol {
  active: boolean;
  severity: 'emergency' | 'urgent' | 'elevated';
  triageSteps: {
    order: number;
    action: string;
    reason: string;
    timeframe: string;           // "right now", "within 1 hour", "today"
    whatHappensIfIgnored: string;
  }[];
  doNotDo: string[];             // common mistakes in crisis
  stabilizationTarget: string;   // "Once X, Y, Z are addressed, your tank is stabilized"
}

export interface InferredContext {
  inferences: {
    what: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    caveat?: string;
  }[];
  speciesIdealRanges: {          // ideal ranges for current livestock even without test data
    species: string;
    parameter: string;
    min: number;
    max: number;
  }[];
  setupChecklist: string[] | null;  // for brand-new/empty tanks
}

export interface AquariumInsights {
  healthScore: HealthScore;
  actionPlan: ActionItem[];
  recentTrajectories: RecentTrajectory[];
  trends: ParameterTrend[];
  speciesMismatches: SpeciesMismatch[];
  maintenanceStatuses: MaintenanceStatus[];
  stockingAnalysis: StockingAnalysis | null;
  optimalZones: OptimalZone[];
  ammoniaToxicity: AmmoniaToxicity | null;
  cyclingPhase: CyclingPhase | null;
  temperamentConflicts: TemperamentConflict[];
  testStaleness: TestStaleness | null;
  waterChangeEstimate: WaterChangeEstimate | null;
  parameterInteractions: ParameterInteraction[];
  whatIfScenarios: WhatIfScenario[];
  dosingRecommendations: DosingRecommendation[];
  seasonalFactors: SeasonalFactor | null;
  diseaseRisk: DiseaseRisk | null;
  recurringPatterns: RecurringPattern[];
  compatibilityReport: CompatibilityReport | null;
  parameterCorrelations: ParameterCorrelation[];
  dataCompleteness: DataCompleteness;
  crisisProtocol: CrisisProtocol | null;
  inferredContext: InferredContext;
  plantAnalysis: PlantAnalysis | null;
  tankSizeWarnings: TankSizeWarning[];
  nicheConflicts: NicheConflict[];
  proactiveSummary: string;
}

// ============= HELPERS =============

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function daysBetween(dateA: string | Date, dateB: string | Date): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return (b - a) / (1000 * 60 * 60 * 24);
}

function matchSpecies(livestockName: string, livestockSpecies: string, fishSpecies: FishSpecies): boolean {
  const names = [livestockName, livestockSpecies].map(s => s?.toLowerCase().trim()).filter(Boolean);
  const dbNames = [fishSpecies.common_name, fishSpecies.scientific_name].map(s => s?.toLowerCase().trim()).filter(Boolean);

  for (const name of names) {
    for (const dbName of dbNames) {
      if (name.includes(dbName) || dbName.includes(name)) return true;
    }
  }
  return false;
}

function isPoolSpa(waterType: string): boolean {
  return ['pool', 'pool_chlorine', 'pool_saltwater', 'spa'].includes(waterType);
}

function getRangeKey(waterType: string): string {
  if (waterType === 'reef') return 'reef';
  if (waterType === 'saltwater' || waterType === 'brackish') return 'saltwater';
  if (waterType === 'spa') return 'spa';
  if (['pool', 'pool_chlorine', 'pool_saltwater'].includes(waterType)) return 'pool';
  return 'freshwater';
}

// ============= COMPUTATION FUNCTIONS =============

export function computeParameterTrends(
  waterTests: WaterTest[],
  waterType: string
): ParameterTrend[] {
  if (!waterTests || waterTests.length === 0) return [];

  const paramData: Record<string, { date: string; value: number }[]> = {};

  for (const test of waterTests) {
    if (!test.test_parameters) continue;
    for (const param of test.test_parameters) {
      if (param.value == null) continue;
      if (!paramData[param.parameter_name]) paramData[param.parameter_name] = [];
      paramData[param.parameter_name].push({ date: test.test_date, value: param.value });
    }
  }

  const rangeKey = getRangeKey(waterType);
  const ranges = PARAMETER_RANGES[rangeKey] || PARAMETER_RANGES.freshwater;
  const trends: ParameterTrend[] = [];

  for (const [paramName, dataPoints] of Object.entries(paramData)) {
    dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const latestValue = dataPoints[dataPoints.length - 1].value;
    const currentStatus = getParameterStatus(paramName, latestValue, rangeKey);

    if (dataPoints.length < 3) {
      if (currentStatus !== 'good') {
        trends.push({
          parameter: paramName,
          currentValue: latestValue,
          currentStatus,
          direction: 'stable',
          ratePerWeek: 0,
          dataPoints: dataPoints.length,
        });
      }
      continue;
    }

    const firstDate = new Date(dataPoints[0].date).getTime();
    const points = dataPoints.map(d => ({
      x: (new Date(d.date).getTime() - firstDate) / (1000 * 60 * 60 * 24),
      y: d.value,
    }));

    const { slope } = linearRegression(points);
    const ratePerWeek = slope * 7;

    const paramRange = ranges[paramName];
    let direction: 'rising' | 'falling' | 'stable' = 'stable';

    if (paramRange) {
      const rangeSpan = paramRange.warning[1] - paramRange.warning[0];
      const threshold = rangeSpan * 0.05;
      if (Math.abs(ratePerWeek) > threshold) {
        direction = ratePerWeek > 0 ? 'rising' : 'falling';
      }
    } else {
      if (Math.abs(ratePerWeek) > 0.1) {
        direction = ratePerWeek > 0 ? 'rising' : 'falling';
      }
    }

    let daysUntilThreshold: number | undefined;
    let thresholdType: 'warning' | 'critical' | undefined;

    if (paramRange && direction !== 'stable' && slope !== 0) {
      const [warnMin, warnMax] = paramRange.warning;
      const [goodMin, goodMax] = paramRange.good;

      if (direction === 'rising') {
        if (latestValue < goodMax) {
          const days = (goodMax - latestValue) / slope;
          if (days > 0 && days < 365) { daysUntilThreshold = Math.round(days); thresholdType = 'warning'; }
        } else if (latestValue < warnMax) {
          const days = (warnMax - latestValue) / slope;
          if (days > 0 && days < 365) { daysUntilThreshold = Math.round(days); thresholdType = 'critical'; }
        }
      } else {
        if (latestValue > goodMin) {
          const days = (latestValue - goodMin) / Math.abs(slope);
          if (days > 0 && days < 365) { daysUntilThreshold = Math.round(days); thresholdType = 'warning'; }
        } else if (latestValue > warnMin) {
          const days = (latestValue - warnMin) / Math.abs(slope);
          if (days > 0 && days < 365) { daysUntilThreshold = Math.round(days); thresholdType = 'critical'; }
        }
      }
    }

    if (direction !== 'stable' || currentStatus !== 'good') {
      trends.push({
        parameter: paramName,
        currentValue: latestValue,
        currentStatus,
        direction,
        ratePerWeek: Math.round(ratePerWeek * 100) / 100,
        daysUntilThreshold,
        thresholdType,
        dataPoints: dataPoints.length,
      });
    }
  }

  return trends;
}

export function computeSpeciesMismatches(
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  latestParams: Record<string, number>
): SpeciesMismatch[] {
  if (!livestock?.length || !fishSpeciesData?.length) return [];

  const mismatches: SpeciesMismatch[] = [];

  const paramChecks: {
    paramKey: string;
    speciesMinKey: keyof FishSpecies;
    speciesMaxKey: keyof FishSpecies;
  }[] = [
    { paramKey: 'pH', speciesMinKey: 'ph_min', speciesMaxKey: 'ph_max' },
    { paramKey: 'Temperature', speciesMinKey: 'temp_min_f', speciesMaxKey: 'temp_max_f' },
    { paramKey: 'GH', speciesMinKey: 'hardness_min_dgh', speciesMaxKey: 'hardness_max_dgh' },
  ];

  for (const animal of livestock) {
    const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
    if (!matched) continue;

    for (const check of paramChecks) {
      const currentValue = latestParams[check.paramKey];
      if (currentValue == null) continue;

      const speciesMin = matched[check.speciesMinKey] as number | undefined;
      const speciesMax = matched[check.speciesMaxKey] as number | undefined;
      if (speciesMin == null || speciesMax == null) continue;

      const range = speciesMax - speciesMin;
      if (range <= 0) continue;

      let severity: 'caution' | 'concern' | 'critical' | null = null;

      if (currentValue < speciesMin) {
        const deviation = (speciesMin - currentValue) / range;
        if (deviation <= 0.1) severity = 'caution';
        else if (deviation <= 0.2) severity = 'concern';
        else severity = 'critical';
      } else if (currentValue > speciesMax) {
        const deviation = (currentValue - speciesMax) / range;
        if (deviation <= 0.1) severity = 'caution';
        else if (deviation <= 0.2) severity = 'concern';
        else severity = 'critical';
      } else {
        const lowerBuffer = range * 0.1;
        const upperBuffer = range * 0.1;
        if (currentValue < speciesMin + lowerBuffer || currentValue > speciesMax - upperBuffer) {
          severity = 'caution';
        }
      }

      if (severity) {
        mismatches.push({
          speciesName: animal.name || animal.species,
          parameter: check.paramKey,
          currentValue,
          speciesMin,
          speciesMax,
          severity,
        });
      }
    }
  }

  return mismatches;
}

export function computeMaintenanceStatuses(equipment: Equipment[]): MaintenanceStatus[] {
  if (!equipment?.length) return [];

  const statuses: MaintenanceStatus[] = [];
  const now = new Date();

  for (const item of equipment) {
    if (!item.maintenance_interval_days) continue;

    const intervalDays = item.maintenance_interval_days;

    if (!item.last_maintenance_date) {
      statuses.push({
        equipmentName: item.name,
        equipmentType: item.equipment_type,
        status: 'overdue',
        daysSinceLastMaintenance: null,
        intervalDays,
        daysRemaining: null,
      });
      continue;
    }

    const daysSince = Math.floor(daysBetween(item.last_maintenance_date, now.toISOString()));
    const daysRemaining = intervalDays - daysSince;

    let status: 'overdue' | 'due_soon' | 'on_track';
    if (daysRemaining < 0) {
      status = 'overdue';
    } else if (daysRemaining <= 7) {
      status = 'due_soon';
    } else {
      status = 'on_track';
    }

    statuses.push({
      equipmentName: item.name,
      equipmentType: item.equipment_type,
      status,
      daysSinceLastMaintenance: daysSince,
      intervalDays,
      daysRemaining,
    });
  }

  return statuses;
}

export function computeStockingAnalysis(
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  tankVolumeGallons: number | null | undefined,
  waterType: string
): StockingAnalysis | null {
  if (!tankVolumeGallons || !livestock?.length) return null;

  const isSaltwater = ['saltwater', 'brackish', 'reef'].includes(waterType);
  const capacityInches = tankVolumeGallons * (isSaltwater ? 0.5 : 1.0);

  let totalInches = 0;
  const schoolingWarnings: { species: string; current: number; minimum: number }[] = [];

  for (const animal of livestock) {
    if (animal.category !== 'fish') continue;

    const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
    const adultSize = matched?.adult_size_inches ?? 2;
    totalInches += adultSize * (animal.quantity || 1);

    if (matched?.min_school_size && animal.quantity < matched.min_school_size) {
      schoolingWarnings.push({
        species: animal.name || animal.species,
        current: animal.quantity,
        minimum: matched.min_school_size,
      });
    }
  }

  const percentStocked = (totalInches / capacityInches) * 100;

  let status: 'understocked' | 'balanced' | 'heavy' | 'overstocked';
  if (percentStocked < 50) status = 'understocked';
  else if (percentStocked <= 85) status = 'balanced';
  else if (percentStocked <= 100) status = 'heavy';
  else status = 'overstocked';

  return {
    totalInches: Math.round(totalInches * 10) / 10,
    capacityInches: Math.round(capacityInches * 10) / 10,
    percentStocked: Math.round(percentStocked),
    status,
    schoolingWarnings,
  };
}

// ============= NEW: OPTIMAL ZONE COMPUTATION =============

export function computeOptimalZones(
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  latestParams: Record<string, number>
): OptimalZone[] {
  if (!livestock?.length || !fishSpeciesData?.length) return [];

  const paramDefs: {
    paramKey: string;
    minKey: keyof FishSpecies;
    maxKey: keyof FishSpecies;
  }[] = [
    { paramKey: 'pH', minKey: 'ph_min', maxKey: 'ph_max' },
    { paramKey: 'Temperature', minKey: 'temp_min_f', maxKey: 'temp_max_f' },
    { paramKey: 'GH', minKey: 'hardness_min_dgh', maxKey: 'hardness_max_dgh' },
  ];

  const zones: OptimalZone[] = [];

  for (const paramDef of paramDefs) {
    // Collect ranges for all matched species
    const speciesRanges: { name: string; min: number; max: number }[] = [];

    for (const animal of livestock) {
      const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
      if (!matched) continue;

      const min = matched[paramDef.minKey] as number | undefined;
      const max = matched[paramDef.maxKey] as number | undefined;
      if (min == null || max == null) continue;

      // Avoid duplicates if same species appears multiple times
      const displayName = animal.name || animal.species;
      if (!speciesRanges.some(r => r.name === displayName)) {
        speciesRanges.push({ name: displayName, min, max });
      }
    }

    if (speciesRanges.length < 2) continue; // Need 2+ species for meaningful overlap

    // Compute overlap: the tightest shared range
    const overlapMin = Math.max(...speciesRanges.map(r => r.min));
    const overlapMax = Math.min(...speciesRanges.map(r => r.max));
    const hasOverlap = overlapMin < overlapMax;

    const currentValue = latestParams[paramDef.paramKey] ?? null;

    const speciesInZone: string[] = [];
    const speciesOutOfZone: string[] = [];

    if (hasOverlap && currentValue != null) {
      for (const sr of speciesRanges) {
        if (currentValue >= sr.min && currentValue <= sr.max) {
          speciesInZone.push(sr.name);
        } else {
          speciesOutOfZone.push(sr.name);
        }
      }
    }

    zones.push({
      parameter: paramDef.paramKey,
      overlapMin: Math.round(overlapMin * 10) / 10,
      overlapMax: Math.round(overlapMax * 10) / 10,
      currentValue,
      speciesInZone,
      speciesOutOfZone,
      hasOverlap,
    });
  }

  return zones;
}

// ============= NEW: AMMONIA TOXICITY AT PH =============

/**
 * Calculates % toxic NH3 from total ammonia based on pH and temperature.
 * Formula: % NH3 = 100 / (10^(pKa - pH) + 1)
 * pKa = 0.09018 + 2729.92 / (T_kelvin)
 */
export function computeAmmoniaToxicity(
  latestParams: Record<string, number>
): AmmoniaToxicity | null {
  const totalAmmonia = latestParams['Ammonia'];
  const ph = latestParams['pH'];
  if (totalAmmonia == null || ph == null || totalAmmonia === 0) return null;

  // Default to 77F if no temperature reading
  const temperatureF = latestParams['Temperature'] ?? 77;
  const temperatureC = (temperatureF - 32) * 5 / 9;
  const temperatureK = temperatureC + 273.15;

  const pKa = 0.09018 + 2729.92 / temperatureK;
  const percentNH3 = 100 / (Math.pow(10, pKa - ph) + 1);
  const toxicNH3ppm = totalAmmonia * (percentNH3 / 100);

  // Severity thresholds for toxic NH3 (free ammonia)
  // < 0.02 ppm = safe, 0.02-0.05 = caution, 0.05-0.2 = danger, > 0.2 = critical
  let severity: 'safe' | 'caution' | 'danger' | 'critical';
  let message: string;

  if (toxicNH3ppm < 0.02) {
    severity = 'safe';
    message = `Total ammonia ${totalAmmonia} ppm at pH ${ph} — toxic NH3 is ${toxicNH3ppm.toFixed(3)} ppm (safe). ${percentNH3.toFixed(1)}% of ammonia is in toxic form at this pH.`;
  } else if (toxicNH3ppm < 0.05) {
    severity = 'caution';
    message = `Total ammonia ${totalAmmonia} ppm at pH ${ph} — toxic NH3 is ${toxicNH3ppm.toFixed(3)} ppm (stressful). At this pH, ${percentNH3.toFixed(1)}% of ammonia is toxic. Lower pH makes ammonia less dangerous, but address the source.`;
  } else if (toxicNH3ppm < 0.2) {
    severity = 'danger';
    message = `Total ammonia ${totalAmmonia} ppm at pH ${ph} — toxic NH3 is ${toxicNH3ppm.toFixed(3)} ppm (DANGEROUS). ${percentNH3.toFixed(1)}% is toxic at this pH. Immediate water change needed. High pH greatly amplifies ammonia toxicity.`;
  } else {
    severity = 'critical';
    message = `Total ammonia ${totalAmmonia} ppm at pH ${ph} — toxic NH3 is ${toxicNH3ppm.toFixed(3)} ppm (LETHAL RISK). ${percentNH3.toFixed(1)}% is toxic at this pH/temperature. Emergency water change required immediately.`;
  }

  return {
    totalAmmonia,
    ph,
    temperatureF,
    percentNH3: Math.round(percentNH3 * 100) / 100,
    toxicNH3ppm: Math.round(toxicNH3ppm * 10000) / 10000,
    severity,
    message,
  };
}

// ============= NEW: CYCLING DETECTION =============

export function detectCyclingPhase(
  waterTests: WaterTest[]
): CyclingPhase | null {
  if (!waterTests?.length) return null;

  // Get latest values (tests are newest-first)
  const latestTest = waterTests[0];
  if (!latestTest?.test_parameters) return null;

  const params: Record<string, number> = {};
  for (const p of latestTest.test_parameters) {
    if (p.value != null) params[p.parameter_name] = p.value;
  }

  const ammonia = params['Ammonia'] ?? null;
  const nitrite = params['Nitrite'] ?? null;
  const nitrate = params['Nitrate'] ?? null;

  // Need at least ammonia and nitrite to assess cycling
  if (ammonia == null && nitrite == null) return null;

  // If all are 0 or very low, check history to distinguish "cycled" from "not started"
  if ((ammonia ?? 0) === 0 && (nitrite ?? 0) === 0 && (nitrate ?? 0) === 0) {
    // Check if there were ever any readings above 0 — if so, could be cycled with water change
    // With only current data showing all zeros and no nitrate, likely not started or very early
    const hasHistory = waterTests.length > 2;
    let everHadAmmonia = false;
    for (const test of waterTests) {
      for (const p of test.test_parameters || []) {
        if (p.parameter_name === 'Ammonia' && p.value > 0) everHadAmmonia = true;
      }
    }

    if (hasHistory && everHadAmmonia) {
      return {
        phase: 'cycled',
        description: 'Tank appears cycled — ammonia and nitrite at 0. Keep monitoring with regular water tests.',
        ammonia, nitrite, nitrate,
      };
    }

    return {
      phase: 'not_started',
      description: 'No ammonia, nitrite, or nitrate detected. Cycling may not have started yet, or this is a newly set up tank. Add an ammonia source to begin cycling.',
      ammonia, nitrite, nitrate,
    };
  }

  // Cycled: ammonia 0, nitrite 0, nitrate present
  if ((ammonia ?? 0) <= 0.1 && (nitrite ?? 0) <= 0.1 && (nitrate ?? 0) > 0) {
    return {
      phase: 'cycled',
      description: `Tank appears fully cycled — ammonia and nitrite near 0 with nitrate at ${nitrate} ppm. Safe for livestock.`,
      ammonia, nitrite, nitrate,
    };
  }

  // Phase 1: ammonia present, nitrite 0 or very low
  if ((ammonia ?? 0) > 0.25 && (nitrite ?? 0) <= 0.25) {
    return {
      phase: 'phase1_ammonia',
      description: `Cycling Phase 1 (ammonia spike) — ammonia at ${ammonia} ppm, nitrite at ${nitrite ?? 0} ppm. Beneficial bacteria are establishing. Nitrite-converting bacteria haven't colonized yet. Do NOT add fish. This phase typically lasts 1-2 weeks.`,
      ammonia, nitrite, nitrate,
    };
  }

  // Phase 2: both ammonia and nitrite present, or ammonia declining and nitrite rising
  if ((ammonia ?? 0) > 0 && (nitrite ?? 0) > 0.25) {
    return {
      phase: 'phase2_nitrite',
      description: `Cycling Phase 2 (nitrite spike) — ammonia at ${ammonia} ppm, nitrite at ${nitrite} ppm. Ammonia-converting bacteria are working. Nitrite-converting bacteria are still establishing. Most toxic phase — do NOT add fish. Typically lasts 1-3 weeks.`,
      ammonia, nitrite, nitrate,
    };
  }

  // Phase 3: ammonia near 0, nitrite declining, nitrate rising
  if ((ammonia ?? 0) <= 0.25 && (nitrite ?? 0) > 0 && (nitrate ?? 0) > 0) {
    return {
      phase: 'phase3_completing',
      description: `Cycling Phase 3 (nearly complete) — ammonia at ${ammonia ?? 0} ppm, nitrite at ${nitrite} ppm, nitrate at ${nitrate} ppm. Almost there! Nitrite should drop to 0 soon. Wait until both ammonia AND nitrite read 0 before adding fish.`,
      ammonia, nitrite, nitrate,
    };
  }

  return {
    phase: 'unknown',
    description: `Ammonia: ${ammonia ?? 'N/A'}, Nitrite: ${nitrite ?? 'N/A'}, Nitrate: ${nitrate ?? 'N/A'}. Pattern doesn't match a typical cycling phase — may need more test data.`,
    ammonia, nitrite, nitrate,
  };
}

// ============= NEW: TEMPERAMENT CONFLICT DETECTION =============

const TEMPERAMENT_RISK: Record<string, Record<string, 'caution' | 'concern' | 'critical'>> = {
  // aggressive + X
  'aggressive|peaceful': 'critical',
  'aggressive|community': 'concern',
  'aggressive|semi-aggressive': 'caution',
  // semi-aggressive + X
  'semi-aggressive|peaceful': 'concern',
  // predatory + X
  'predatory|peaceful': 'critical',
  'predatory|community': 'critical',
  'predatory|semi-aggressive': 'concern',
};

export function computeTemperamentConflicts(
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[]
): TemperamentConflict[] {
  if (!livestock?.length || !fishSpeciesData?.length) return [];

  // Match each livestock to its temperament
  const speciesTemperaments: { name: string; temperament: string }[] = [];

  for (const animal of livestock) {
    const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
    if (!matched?.temperament) continue;

    const displayName = animal.name || animal.species;
    const temp = matched.temperament.toLowerCase().trim();
    if (!speciesTemperaments.some(s => s.name === displayName)) {
      speciesTemperaments.push({ name: displayName, temperament: temp });
    }
  }

  if (speciesTemperaments.length < 2) return [];

  const conflicts: TemperamentConflict[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < speciesTemperaments.length; i++) {
    for (let j = i + 1; j < speciesTemperaments.length; j++) {
      const a = speciesTemperaments[i];
      const b = speciesTemperaments[j];

      if (a.temperament === b.temperament) continue;

      // Check both orderings in lookup table
      const key1 = `${a.temperament}|${b.temperament}`;
      const key2 = `${b.temperament}|${a.temperament}`;
      const severity = TEMPERAMENT_RISK[key1] || TEMPERAMENT_RISK[key2];

      if (!severity) continue;

      // Deduplicate
      const pairKey = [a.name, b.name].sort().join('|');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      // The "aggressor" is the one with the more aggressive temperament
      const aggressorIsA = TEMPERAMENT_RISK[key1] != null;
      conflicts.push({
        aggressor: aggressorIsA ? a.name : b.name,
        aggressorTemperament: aggressorIsA ? a.temperament : b.temperament,
        target: aggressorIsA ? b.name : a.name,
        targetTemperament: aggressorIsA ? b.temperament : a.temperament,
        severity,
      });
    }
  }

  return conflicts;
}

// ============= NEW: TEST STALENESS DETECTION =============

export function computeTestStaleness(
  waterTests: WaterTest[],
  hasLivestock: boolean
): TestStaleness | null {
  if (!waterTests?.length) {
    return {
      daysSinceLastTest: Infinity,
      lastTestDate: null,
      severity: 'very_stale',
      hasLivestock,
    };
  }

  // Tests come newest-first
  const latestDate = waterTests[0].test_date;
  const daysSince = Math.floor(daysBetween(latestDate, new Date().toISOString()));

  let severity: 'fresh' | 'aging' | 'stale' | 'very_stale';
  if (hasLivestock) {
    // Stricter thresholds when livestock are present
    if (daysSince <= 7) severity = 'fresh';
    else if (daysSince <= 14) severity = 'aging';
    else if (daysSince <= 30) severity = 'stale';
    else severity = 'very_stale';
  } else {
    // More relaxed for fishless tanks
    if (daysSince <= 14) severity = 'fresh';
    else if (daysSince <= 30) severity = 'aging';
    else if (daysSince <= 60) severity = 'stale';
    else severity = 'very_stale';
  }

  return {
    daysSinceLastTest: daysSince,
    lastTestDate: latestDate,
    severity,
    hasLivestock,
  };
}

// ============= NEW: WATER CHANGE ESTIMATION FROM NITRATE TREND =============

export function estimateWaterChangeNeeds(
  trends: ParameterTrend[],
  latestParams: Record<string, number>,
  volumeGallons: number | null | undefined,
  waterType: string
): WaterChangeEstimate | null {
  const nitrateTrend = trends.find(t => t.parameter === 'Nitrate' && t.direction === 'rising');
  const currentNitrate = latestParams['Nitrate'];

  if (!nitrateTrend || currentNitrate == null) return null;
  if (nitrateTrend.ratePerWeek <= 0) return null;

  const rangeKey = getRangeKey(waterType);
  const ranges = PARAMETER_RANGES[rangeKey] || PARAMETER_RANGES.freshwater;
  const nitrateRange = ranges['Nitrate'];
  const targetNitrate = nitrateRange ? nitrateRange.good[1] : 20;

  // To maintain nitrate at target, calculate water change needed per week:
  // After a water change of X%, new nitrate = old_nitrate * (1 - X/100)
  // We want: currentNitrate * (1 - X/100) + ratePerWeek <= targetNitrate
  // Solving: X = 100 * (1 - (targetNitrate - ratePerWeek) / currentNitrate)
  // Simplified: percentage to remove the weekly accumulation
  const weeklyRisePpm = nitrateTrend.ratePerWeek;

  // Approximate: to remove weeklyRise ppm from a tank at currentNitrate:
  // changePercent = (weeklyRise / currentNitrate) * 100
  // But cap and floor it reasonably
  let recommendedPercentage: number;

  if (currentNitrate > targetNitrate) {
    // Already above target — need a bigger change to bring it down
    recommendedPercentage = Math.min(50, Math.round(((currentNitrate - targetNitrate) / currentNitrate) * 100 + (weeklyRisePpm / currentNitrate) * 100));
  } else {
    // Below target — maintenance changes to keep it there
    recommendedPercentage = Math.max(10, Math.min(50, Math.round((weeklyRisePpm / Math.max(currentNitrate, 1)) * 100)));
  }

  // Frequency based on how fast nitrate is rising relative to headroom
  const headroom = targetNitrate - currentNitrate;
  let recommendedFrequency: string;

  if (headroom <= 0) {
    recommendedFrequency = 'immediately, then weekly';
  } else {
    const weeksUntilTarget = headroom / weeklyRisePpm;
    if (weeksUntilTarget <= 1) recommendedFrequency = 'weekly';
    else if (weeksUntilTarget <= 2) recommendedFrequency = 'every 1-2 weeks';
    else recommendedFrequency = 'every 2 weeks';
  }

  const changeGallons = volumeGallons ? Math.round(volumeGallons * recommendedPercentage / 100) : null;

  return {
    nitrateRatePerWeek: nitrateTrend.ratePerWeek,
    currentNitrate,
    targetNitrate,
    recommendedPercentage,
    recommendedFrequency,
    volumeGallons: volumeGallons ?? null,
    changeGallons,
  };
}

// ============= NEW: PARAMETER INTERACTIONS (COMPOUND RISKS) =============

/**
 * Computes toxic NH3 ppm for given total ammonia, pH, and temperature.
 * Reusable for what-if scenarios.
 */
function computeNH3ppm(totalAmmonia: number, ph: number, tempF: number): number {
  const tempC = (tempF - 32) * 5 / 9;
  const tempK = tempC + 273.15;
  const pKa = 0.09018 + 2729.92 / tempK;
  const percentNH3 = 100 / (Math.pow(10, pKa - ph) + 1);
  return totalAmmonia * (percentNH3 / 100);
}

export function computeParameterInteractions(
  latestParams: Record<string, number>,
  stockingAnalysis: StockingAnalysis | null,
  trends: ParameterTrend[],
  waterType: string
): ParameterInteraction[] {
  const interactions: ParameterInteraction[] = [];

  const ph = latestParams['pH'];
  const ammonia = latestParams['Ammonia'];
  const nitrite = latestParams['Nitrite'];
  const nitrate = latestParams['Nitrate'];
  const tempF = latestParams['Temperature'];
  const kh = latestParams['KH'];
  const gh = latestParams['GH'];
  const phosphate = latestParams['Phosphate'];

  // --- 1. pH + KH: Buffering capacity / pH crash risk ---
  if (kh != null && kh < 3) {
    const khSeverity = kh < 1 ? 'critical' : kh < 2 ? 'danger' : 'caution';
    const crashRisk = kh < 1 ? 'imminent pH crash risk' : kh < 2 ? 'high pH crash risk' : 'pH may become unstable';
    interactions.push({
      type: 'kh_ph_stability',
      severity: khSeverity,
      parameters: ['KH', 'pH'],
      message: `KH at ${kh} dKH is very low — ${crashRisk}. KH buffers pH; without it, pH can plummet overnight (especially with CO2 or organic acids from waste). ${ph != null ? `Current pH ${ph} could drop rapidly.` : ''} Raise KH to 3-5 dKH with baking soda or a KH buffer.`,
    });
  }

  // --- 2. pH + Ammonia + Temperature: Triple threat ---
  if (ammonia != null && ammonia > 0 && ph != null && tempF != null) {
    const toxicNH3 = computeNH3ppm(ammonia, ph, tempF);

    // Flag compound danger when multiple factors amplify toxicity
    if (ph > 7.5 && tempF > 80 && ammonia > 0.25) {
      const severity = toxicNH3 > 0.1 ? 'critical' : toxicNH3 > 0.05 ? 'danger' : 'caution';
      interactions.push({
        type: 'ammonia_ph_temp_compound',
        severity,
        parameters: ['Ammonia', 'pH', 'Temperature'],
        message: `COMPOUND RISK: Ammonia (${ammonia} ppm) + high pH (${ph}) + warm temp (${tempF}°F) = ${(toxicNH3 * 100 / ammonia).toFixed(1)}% is toxic NH3 (${toxicNH3.toFixed(4)} ppm). Each factor amplifies the others — at pH 7.0 the same ammonia would be ${((computeNH3ppm(ammonia, 7.0, tempF) / ammonia) * 100).toFixed(1)}% toxic instead. Prioritize a water change, then address the root ammonia source.`,
      });
    }

    // High pH alone with any ammonia
    if (ph >= 8.0 && ammonia > 0 && !(ph > 7.5 && tempF > 80 && ammonia > 0.25)) {
      interactions.push({
        type: 'high_ph_ammonia',
        severity: toxicNH3 > 0.02 ? 'caution' : 'info',
        parameters: ['pH', 'Ammonia'],
        message: `At pH ${ph}, ${((toxicNH3 / ammonia) * 100).toFixed(1)}% of ammonia is toxic NH3. If pH were 7.0, only ${((computeNH3ppm(ammonia, 7.0, tempF ?? 77) / ammonia) * 100).toFixed(1)}% would be toxic. Don't lower pH as a fix — address the ammonia source — but be aware that high pH amplifies the danger.`,
      });
    }
  }

  // --- 3. Temperature + Dissolved Oxygen + Stocking ---
  if (tempF != null && tempF > 82) {
    const isHeavyStocked = stockingAnalysis && stockingAnalysis.percentStocked > 85;
    const severity = (tempF > 86 && isHeavyStocked) ? 'critical'
      : (tempF > 84 || isHeavyStocked) ? 'danger' : 'caution';

    let msg = `Water at ${tempF}°F holds significantly less dissolved oxygen than at 77°F.`;
    if (isHeavyStocked) {
      msg += ` Combined with ${stockingAnalysis!.percentStocked}% stocking, oxygen demand is high. Fish may gasp at the surface.`;
    }
    msg += ` Increase surface agitation, add an airstone, or lower temperature gradually (1-2°F per day).`;

    interactions.push({
      type: 'temp_oxygen_stocking',
      severity,
      parameters: ['Temperature', ...(isHeavyStocked ? ['Stocking'] : [])],
      message: msg,
    });
  }

  // --- 4. Nitrate + Phosphate: Algae bloom risk ---
  if (nitrate != null && phosphate != null && nitrate > 10 && phosphate > 0.05) {
    // High nutrient load = algae fuel
    const severity = (nitrate > 30 && phosphate > 0.1) ? 'danger'
      : (nitrate > 20 || phosphate > 0.1) ? 'caution' : 'info';
    interactions.push({
      type: 'nitrate_phosphate_algae',
      severity,
      parameters: ['Nitrate', 'Phosphate'],
      message: `Nitrate (${nitrate} ppm) + Phosphate (${phosphate} ppm) = elevated algae risk. Both are algae fuel. ${nitrate > 20 ? 'Water changes to reduce nitrate' : 'Control feeding'} and ${phosphate > 0.1 ? 'use a phosphate remover or GFO' : 'monitor phosphate'} to prevent blooms.`,
    });
  }

  // --- 5. Nitrite + Low Oxygen: Methemoglobin risk ---
  if (nitrite != null && nitrite > 0) {
    const highTemp = tempF != null && tempF > 82;
    const severity = nitrite > 1 ? 'danger' : nitrite > 0.5 ? 'caution' : 'info';
    if (severity !== 'info' || highTemp) {
      interactions.push({
        type: 'nitrite_oxygen',
        severity: highTemp && nitrite > 0.5 ? 'danger' : severity,
        parameters: ['Nitrite', ...(highTemp ? ['Temperature'] : [])],
        message: `Nitrite (${nitrite} ppm) blocks fish blood from carrying oxygen (methemoglobinemia). ${highTemp ? `High temperature (${tempF}°F) reduces available oxygen further, compounding the danger. ` : ''}Add salt (1 tsp/gallon aquarium salt) to block nitrite uptake, and do water changes to dilute.`,
      });
    }
  }

  // --- 6. pH trending + KH: crash prediction ---
  const phTrend = trends.find(t => t.parameter === 'pH');
  if (phTrend && phTrend.direction === 'falling' && kh != null && kh < 4) {
    interactions.push({
      type: 'ph_falling_low_kh',
      severity: kh < 2 ? 'danger' : 'caution',
      parameters: ['pH', 'KH'],
      message: `pH is trending down (${phTrend.ratePerWeek}/week) with low KH buffering (${kh} dKH). As KH depletes, pH drop accelerates — this can lead to a sudden crash. Raise KH before it's depleted.`,
    });
  }

  // --- 7. GH + KH imbalance ---
  if (gh != null && kh != null && gh > 0 && kh > 0) {
    if (gh > kh * 3 && kh < 3) {
      interactions.push({
        type: 'gh_kh_imbalance',
        severity: 'caution',
        parameters: ['GH', 'KH'],
        message: `GH (${gh}) is much higher than KH (${kh}). Plenty of minerals but low buffering capacity. pH may swing despite seemingly hard water. Consider adding a KH buffer specifically.`,
      });
    }
  }

  // --- 8. Pool-specific: Combined chlorine ---
  if (isPoolSpa(waterType)) {
    const freeChlorine = latestParams['Free Chlorine'];
    const totalChlorine = latestParams['Total Chlorine'];
    if (freeChlorine != null && totalChlorine != null) {
      const combinedChlorine = totalChlorine - freeChlorine;
      if (combinedChlorine > 0.5) {
        interactions.push({
          type: 'combined_chlorine',
          severity: combinedChlorine > 1 ? 'danger' : 'caution',
          parameters: ['Free Chlorine', 'Total Chlorine'],
          message: `Combined chlorine is ${combinedChlorine.toFixed(1)} ppm (total ${totalChlorine} - free ${freeChlorine}). Combined chlorine causes "chlorine smell" and eye/skin irritation. Shock to breakpoint: add enough chlorine to reach 10× combined chlorine (${(combinedChlorine * 10).toFixed(0)} ppm FC) to oxidize it.`,
        });
      }
    }
  }

  return interactions;
}

// ============= NEW: WHAT-IF SCENARIOS =============

export function computeWhatIfScenarios(
  latestParams: Record<string, number>,
  ammoniaToxicity: AmmoniaToxicity | null,
  waterChangeEstimate: WaterChangeEstimate | null,
  stockingAnalysis: StockingAnalysis | null,
  volumeGallons: number | null | undefined,
  waterType: string
): WhatIfScenario[] {
  const scenarios: WhatIfScenario[] = [];

  const ph = latestParams['pH'];
  const ammonia = latestParams['Ammonia'];
  const nitrate = latestParams['Nitrate'];
  const tempF = latestParams['Temperature'] ?? 77;
  const kh = latestParams['KH'];

  // --- Scenario 1: "What if you do a water change?" ---
  if (nitrate != null && nitrate > 10 && volumeGallons) {
    const changes = [25, 50];
    const effects: string[] = [];
    for (const pct of changes) {
      const newNitrate = Math.round(nitrate * (1 - pct / 100));
      effects.push(`${pct}% water change (~${Math.round(volumeGallons * pct / 100)} gal): nitrate ${nitrate} → ~${newNitrate} ppm`);
    }

    if (ammonia != null && ammonia > 0) {
      for (const pct of changes) {
        const newAmmonia = ammonia * (1 - pct / 100);
        if (ph != null) {
          const newNH3 = computeNH3ppm(newAmmonia, ph, tempF);
          effects.push(`${pct}% change also reduces toxic NH3 to ~${newNH3.toFixed(4)} ppm`);
        }
      }
    }

    scenarios.push({
      action: 'Water change',
      effects,
      priority: nitrate > 30 || (ammonia != null && ammonia > 0.5) ? 'high' : 'medium',
    });
  }

  // --- Scenario 2: "What if pH changes?" (ammonia toxicity shift) ---
  if (ammonia != null && ammonia > 0 && ph != null) {
    const currentNH3 = computeNH3ppm(ammonia, ph, tempF);
    const effects: string[] = [];

    // Show toxicity at lower pH values
    const targetPHs = ph > 7.5 ? [7.0, 7.5] : ph < 6.5 ? [7.0, 7.5] : [6.5, 8.0];
    for (const targetPH of targetPHs) {
      if (Math.abs(targetPH - ph) < 0.3) continue;
      const newNH3 = computeNH3ppm(ammonia, targetPH, tempF);
      const direction = targetPH > ph ? 'rises' : 'drops';
      const change = targetPH > ph ? 'MORE' : 'LESS';
      const ratio = currentNH3 > 0 ? (newNH3 / currentNH3) : 0;
      effects.push(`If pH ${direction} to ${targetPH}: toxic NH3 goes from ${currentNH3.toFixed(4)} to ${newNH3.toFixed(4)} ppm (${ratio > 1 ? ratio.toFixed(1) + '× ' + change : (1 / ratio).toFixed(1) + '× ' + change} dangerous)`);
    }

    if (effects.length > 0) {
      scenarios.push({
        action: 'pH shift effect on ammonia toxicity',
        effects,
        priority: ammoniaToxicity && ammoniaToxicity.severity !== 'safe' ? 'high' : 'medium',
      });
    }
  }

  // --- Scenario 3: "What if temperature changes?" ---
  if (ammonia != null && ammonia > 0 && ph != null && tempF != null) {
    const currentNH3 = computeNH3ppm(ammonia, ph, tempF);
    const effects: string[] = [];

    // Show effect at ±4°F
    for (const delta of [-4, 4]) {
      const newTemp = tempF + delta;
      const newNH3 = computeNH3ppm(ammonia, ph, newTemp);
      const direction = delta > 0 ? 'rises' : 'drops';
      effects.push(`If temp ${direction} to ${newTemp}°F: toxic NH3 shifts from ${currentNH3.toFixed(4)} to ${newNH3.toFixed(4)} ppm`);
    }

    // Also note O2 impact
    if (tempF > 78) {
      effects.push(`Every 2°F increase above 78°F reduces dissolved oxygen by ~3-5%. Current ${tempF}°F is ${tempF > 82 ? 'significantly reducing' : 'somewhat limiting'} available oxygen.`);
    }

    scenarios.push({
      action: 'Temperature change effects',
      effects,
      priority: tempF > 82 || (ammonia > 0.5) ? 'high' : 'low',
    });
  }

  // --- Scenario 4: "What if you raise KH?" ---
  if (kh != null && kh < 3 && ph != null) {
    const effects: string[] = [
      `Raising KH from ${kh} to 4-5 dKH stabilizes pH against sudden drops.`,
      `1 tsp baking soda per 5 gallons raises KH by ~1 dKH (also raises pH by ~0.1-0.2).`,
    ];
    if (ammonia != null && ammonia > 0) {
      const phBump = ph + 0.2;
      const newNH3 = computeNH3ppm(ammonia, phBump, tempF);
      const currentNH3 = computeNH3ppm(ammonia, ph, tempF);
      if (newNH3 > currentNH3 * 1.1) {
        effects.push(`Caution: raising pH from ${ph} to ~${phBump.toFixed(1)} increases toxic NH3 from ${currentNH3.toFixed(4)} to ${newNH3.toFixed(4)} ppm. Address ammonia first.`);
      }
    }

    scenarios.push({
      action: 'Raise KH (buffer)',
      effects,
      priority: kh < 2 ? 'high' : 'medium',
    });
  }

  return scenarios;
}

// ============= NEW: RECENT TRAJECTORY (LAST 3-5 READINGS) =============

export function computeRecentTrajectories(
  waterTests: WaterTest[],
  waterType: string
): RecentTrajectory[] {
  if (!waterTests?.length) return [];

  const rangeKey = getRangeKey(waterType);

  // Group params across tests (tests are newest-first)
  const paramReadings: Record<string, { value: number; date: string }[]> = {};

  for (const test of waterTests.slice(0, 5)) {
    if (!test.test_parameters) continue;
    for (const p of test.test_parameters) {
      if (p.value == null) continue;
      if (!paramReadings[p.parameter_name]) paramReadings[p.parameter_name] = [];
      paramReadings[p.parameter_name].push({ value: p.value, date: test.test_date });
    }
  }

  const trajectories: RecentTrajectory[] = [];
  const now = Date.now();

  for (const [param, readings] of Object.entries(paramReadings)) {
    if (readings.length < 2) continue;

    // Readings are newest-first, reverse for chronological display
    const chronological = [...readings].reverse();
    const values = chronological.map(r => ({
      value: r.value,
      daysAgo: Math.round((now - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    const recentChange = values[values.length - 1].value - values[values.length - 2].value;

    // Determine trajectory — is this parameter getting better or worse?
    const paramRange = (PARAMETER_RANGES[rangeKey] || PARAMETER_RANGES.freshwater)[param];
    let trajectory: 'improving' | 'worsening' | 'stable' | 'fluctuating';

    if (values.length >= 3) {
      // Check for fluctuation: alternating up/down
      const deltas = [];
      for (let i = 1; i < values.length; i++) {
        deltas.push(values[i].value - values[i - 1].value);
      }
      const signs = deltas.map(d => Math.sign(d));
      const isFluctuating = signs.length >= 2 && signs.some((s, i) => i > 0 && s !== 0 && signs[i - 1] !== 0 && s !== signs[i - 1]);

      if (isFluctuating && Math.max(...values.map(v => v.value)) - Math.min(...values.map(v => v.value)) > 0.5) {
        trajectory = 'fluctuating';
      } else {
        // Monotonic or mostly monotonic — is the direction good or bad?
        const overallDelta = values[values.length - 1].value - values[0].value;
        const isStable = paramRange
          ? Math.abs(overallDelta) < (paramRange.warning[1] - paramRange.warning[0]) * 0.05
          : Math.abs(overallDelta) < 0.1;

        if (isStable) {
          trajectory = 'stable';
        } else if (paramRange) {
          // "Improving" means moving toward the good range midpoint
          const goodMid = (paramRange.good[0] + paramRange.good[1]) / 2;
          const latestVal = values[values.length - 1].value;
          const prevVal = values[0].value;
          const nowDistance = Math.abs(latestVal - goodMid);
          const prevDistance = Math.abs(prevVal - goodMid);
          trajectory = nowDistance < prevDistance ? 'improving' : 'worsening';
        } else {
          trajectory = overallDelta > 0 ? 'worsening' : 'improving';
        }
      }
    } else {
      // Only 2 points
      if (paramRange) {
        const goodMid = (paramRange.good[0] + paramRange.good[1]) / 2;
        const nowDist = Math.abs(values[1].value - goodMid);
        const prevDist = Math.abs(values[0].value - goodMid);
        trajectory = Math.abs(nowDist - prevDist) < 0.1 ? 'stable' : nowDist < prevDist ? 'improving' : 'worsening';
      } else {
        trajectory = 'stable';
      }
    }

    // Build narrative: "pH: 7.2 → 7.5 → 7.8 (worsening)"
    const valueStr = values.map(v => v.value).join(' → ');
    const label = trajectory === 'stable' ? 'stable' : trajectory;
    const narrative = `${param}: ${valueStr} (${label})`;

    // Only include non-stable trajectories, or if currently warning/critical
    const latestStatus = getParameterStatus(param, values[values.length - 1].value, rangeKey);
    if (trajectory !== 'stable' || latestStatus !== 'good') {
      trajectories.push({ parameter: param, values, trajectory, recentChange, narrative });
    }
  }

  return trajectories;
}

// ============= NEW: HEALTH SCORE =============

export function computeHealthScore(
  insights: {
    trends: ParameterTrend[];
    speciesMismatches: SpeciesMismatch[];
    maintenanceStatuses: MaintenanceStatus[];
    stockingAnalysis: StockingAnalysis | null;
    ammoniaToxicity: AmmoniaToxicity | null;
    cyclingPhase: CyclingPhase | null;
    temperamentConflicts: TemperamentConflict[];
    testStaleness: TestStaleness | null;
    parameterInteractions: ParameterInteraction[];
    recentTrajectories: RecentTrajectory[];
  },
  hasLivestock: boolean
): HealthScore {
  const breakdown: HealthScore['breakdown'] = [];

  // --- Water Chemistry (40 points max) ---
  let waterScore = 40;
  const waterIssues: string[] = [];

  for (const t of insights.trends) {
    if (t.currentStatus === 'critical') { waterScore -= 12; waterIssues.push(`${t.parameter} critical (${t.currentValue})`); }
    else if (t.currentStatus === 'warning') { waterScore -= 6; waterIssues.push(`${t.parameter} warning (${t.currentValue})`); }
    if (t.direction === 'rising' || t.direction === 'falling') {
      waterScore -= 2;
      if (t.thresholdType === 'critical' && t.daysUntilThreshold != null && t.daysUntilThreshold <= 14) {
        waterScore -= 5;
        waterIssues.push(`${t.parameter} trending to critical in ${t.daysUntilThreshold}d`);
      }
    }
  }

  if (insights.ammoniaToxicity) {
    if (insights.ammoniaToxicity.severity === 'critical') { waterScore -= 15; waterIssues.push('Lethal NH3 levels'); }
    else if (insights.ammoniaToxicity.severity === 'danger') { waterScore -= 10; waterIssues.push('Dangerous NH3 levels'); }
    else if (insights.ammoniaToxicity.severity === 'caution') { waterScore -= 4; waterIssues.push('Elevated NH3'); }
  }

  for (const interaction of insights.parameterInteractions) {
    if (interaction.severity === 'critical') { waterScore -= 8; }
    else if (interaction.severity === 'danger') { waterScore -= 4; }
    else if (interaction.severity === 'caution') { waterScore -= 2; }
  }

  if (insights.cyclingPhase && insights.cyclingPhase.phase !== 'cycled' && insights.cyclingPhase.phase !== 'unknown') {
    waterScore -= 5;
    waterIssues.push(`Tank cycling (${insights.cyclingPhase.phase.replace('_', ' ')})`);
  }

  breakdown.push({ category: 'Water Chemistry', score: Math.max(0, waterScore), maxScore: 40, issues: waterIssues });

  // --- Livestock Welfare (25 points max, 0 if no livestock) ---
  if (hasLivestock) {
    let livestockScore = 25;
    const livestockIssues: string[] = [];

    for (const m of insights.speciesMismatches) {
      if (m.severity === 'critical') { livestockScore -= 6; livestockIssues.push(`${m.speciesName}: ${m.parameter} critical mismatch`); }
      else if (m.severity === 'concern') { livestockScore -= 3; }
      else if (m.severity === 'caution') { livestockScore -= 1; }
    }

    for (const c of insights.temperamentConflicts) {
      if (c.severity === 'critical') { livestockScore -= 6; livestockIssues.push(`${c.aggressor} may harm ${c.target}`); }
      else if (c.severity === 'concern') { livestockScore -= 3; }
      else if (c.severity === 'caution') { livestockScore -= 1; }
    }

    if (insights.stockingAnalysis) {
      if (insights.stockingAnalysis.status === 'overstocked') { livestockScore -= 6; livestockIssues.push('Overstocked'); }
      else if (insights.stockingAnalysis.status === 'heavy') { livestockScore -= 2; }
      for (const sw of insights.stockingAnalysis.schoolingWarnings) {
        livestockScore -= 2;
        livestockIssues.push(`${sw.species}: ${sw.current}/${sw.minimum} school size`);
      }
    }

    breakdown.push({ category: 'Livestock Welfare', score: Math.max(0, livestockScore), maxScore: 25, issues: livestockIssues });
  }

  // --- Equipment & Maintenance (20 points max) ---
  let equipScore = 20;
  const equipIssues: string[] = [];

  for (const m of insights.maintenanceStatuses) {
    if (m.status === 'overdue') {
      const penalty = m.daysSinceLastMaintenance === null ? 8 : Math.min(8, Math.ceil(Math.abs(m.daysRemaining ?? 0) / 7) * 2);
      equipScore -= penalty;
      equipIssues.push(`${m.equipmentName} overdue${m.daysRemaining != null ? ` by ${Math.abs(m.daysRemaining)}d` : ''}`);
    } else if (m.status === 'due_soon') {
      equipScore -= 1;
    }
  }

  breakdown.push({ category: 'Equipment', score: Math.max(0, equipScore), maxScore: 20, issues: equipIssues });

  // --- Monitoring & Data (15 points max) ---
  let dataScore = 15;
  const dataIssues: string[] = [];

  if (insights.testStaleness) {
    if (insights.testStaleness.severity === 'very_stale') { dataScore -= 10; dataIssues.push(`No test in ${insights.testStaleness.daysSinceLastTest === Infinity ? 'ever' : insights.testStaleness.daysSinceLastTest + 'd'}`); }
    else if (insights.testStaleness.severity === 'stale') { dataScore -= 5; dataIssues.push(`Last test ${insights.testStaleness.daysSinceLastTest}d ago`); }
    else if (insights.testStaleness.severity === 'aging') { dataScore -= 2; }
  }

  // Bonus for improving trajectories, penalty for worsening
  const worseningCount = insights.recentTrajectories.filter(t => t.trajectory === 'worsening').length;
  const improvingCount = insights.recentTrajectories.filter(t => t.trajectory === 'improving').length;
  if (worseningCount > improvingCount) {
    dataScore -= Math.min(5, (worseningCount - improvingCount) * 2);
    dataIssues.push(`${worseningCount} params worsening`);
  }

  breakdown.push({ category: 'Monitoring', score: Math.max(0, dataScore), maxScore: 15, issues: dataIssues });

  // --- Compute overall ---
  const totalMax = breakdown.reduce((s, b) => s + b.maxScore, 0);
  const totalScore = breakdown.reduce((s, b) => s + b.score, 0);
  const overall = Math.round((totalScore / totalMax) * 100);

  let label: HealthScore['label'];
  if (overall >= 90) label = 'excellent';
  else if (overall >= 75) label = 'good';
  else if (overall >= 55) label = 'fair';
  else if (overall >= 30) label = 'poor';
  else label = 'critical';

  return { overall, label, breakdown };
}

// ============= NEW: PRIORITIZED ACTION PLAN =============

export function buildActionPlan(
  insights: Omit<AquariumInsights, 'proactiveSummary' | 'healthScore' | 'actionPlan' | 'recentTrajectories'> & {
    recentTrajectories: RecentTrajectory[];
  },
  latestParams: Record<string, number>,
  volumeGallons: number | null | undefined
): ActionItem[] {
  const actions: ActionItem[] = [];
  let pri = 0;

  const nh3 = insights.ammoniaToxicity;
  const tempF = latestParams['Temperature'] ?? 77;

  // 1. Emergency NH3
  if (nh3 && (nh3.severity === 'critical' || nh3.severity === 'danger')) {
    const wcPct = nh3.severity === 'critical' ? 50 : 30;
    const wcGal = volumeGallons ? ` (~${Math.round(volumeGallons * wcPct / 100)} gal)` : '';
    const newNH3 = computeNH3ppm(nh3.totalAmmonia * (1 - wcPct / 100), nh3.ph, tempF);
    actions.push({
      priority: ++pri,
      action: `Emergency ${wcPct}% water change${wcGal}`,
      reason: `Toxic NH3 at ${nh3.toxicNH3ppm.toFixed(3)} ppm (${nh3.severity}) — ammonia ${nh3.totalAmmonia} at pH ${nh3.ph}`,
      impact: `Reduces toxic NH3 to ~${newNH3.toFixed(4)} ppm`,
      urgency: 'now',
    });
  }

  // 2. Critical params
  for (const t of insights.trends.filter(t => t.currentStatus === 'critical')) {
    if (t.parameter === 'Ammonia' && nh3 && nh3.severity !== 'safe') continue; // handled above
    actions.push({
      priority: ++pri,
      action: `Address ${t.parameter} at ${t.currentValue} (critical)`,
      reason: `${t.parameter} is outside safe range${t.direction !== 'stable' ? `, trending ${t.direction}` : ''}`,
      impact: 'Prevent livestock stress or death',
      urgency: 'now',
    });
  }

  // 3. Critical interactions
  for (const interaction of insights.parameterInteractions.filter(i => i.severity === 'critical')) {
    actions.push({
      priority: ++pri,
      action: `Address ${interaction.parameters.join(' + ')} compound risk`,
      reason: interaction.message.slice(0, 120),
      impact: 'Multiple parameters amplifying each other',
      urgency: 'now',
    });
  }

  // 4. Overdue maintenance
  for (const m of insights.maintenanceStatuses.filter(m => m.status === 'overdue')) {
    const overdueStr = m.daysRemaining != null ? `${Math.abs(m.daysRemaining)} days overdue` : 'never maintained';
    actions.push({
      priority: ++pri,
      action: `Service ${m.equipmentName} (${m.equipmentType})`,
      reason: overdueStr,
      impact: `Restore ${m.equipmentType.toLowerCase()} performance — affects water quality`,
      urgency: 'today',
    });
  }

  // 5. Critical temperament conflicts
  for (const c of insights.temperamentConflicts.filter(c => c.severity === 'critical')) {
    actions.push({
      priority: ++pri,
      action: `Separate ${c.aggressor} from ${c.target}`,
      reason: `${c.aggressorTemperament} vs ${c.targetTemperament} — high harm risk`,
      impact: 'Prevent injury/death to peaceful species',
      urgency: 'today',
    });
  }

  // 6. Water change for nitrate
  if (insights.waterChangeEstimate && !actions.some(a => a.action.includes('water change'))) {
    const wc = insights.waterChangeEstimate;
    const wcGal = wc.changeGallons ? ` (~${wc.changeGallons} gal)` : '';
    actions.push({
      priority: ++pri,
      action: `${wc.recommendedPercentage}% water change${wcGal} ${wc.recommendedFrequency}`,
      reason: `Nitrate at ${wc.currentNitrate} ppm, rising ${wc.nitrateRatePerWeek}/week`,
      impact: `Keep nitrate under ${wc.targetNitrate} ppm`,
      urgency: wc.currentNitrate > wc.targetNitrate ? 'today' : 'this_week',
    });
  }

  // 7. Test water (if stale)
  if (insights.testStaleness && (insights.testStaleness.severity === 'stale' || insights.testStaleness.severity === 'very_stale')) {
    actions.push({
      priority: ++pri,
      action: 'Test water parameters',
      reason: `Last test was ${insights.testStaleness.daysSinceLastTest === Infinity ? 'never' : insights.testStaleness.daysSinceLastTest + ' days ago'}`,
      impact: 'All insights are based on stale data — current conditions unknown',
      urgency: insights.testStaleness.severity === 'very_stale' ? 'today' : 'this_week',
    });
  }

  // 8. Due-soon maintenance
  for (const m of insights.maintenanceStatuses.filter(m => m.status === 'due_soon')) {
    actions.push({
      priority: ++pri,
      action: `Schedule ${m.equipmentName} maintenance`,
      reason: `Due in ${m.daysRemaining} days`,
      impact: 'Preventive care — avoid equipment failure',
      urgency: 'this_week',
    });
  }

  // 9. Schooling warnings
  if (insights.stockingAnalysis) {
    for (const sw of insights.stockingAnalysis.schoolingWarnings) {
      actions.push({
        priority: ++pri,
        action: `Add ${sw.minimum - sw.current} more ${sw.species}`,
        reason: `Only ${sw.current} of ${sw.minimum} minimum for schooling — causes stress`,
        impact: 'Reduces stress, brings out natural behavior',
        urgency: 'soon',
      });
    }
  }

  return actions;
}

// ============= DOSING CALCULATOR =============

export function computeDosingRecommendations(
  latestParams: Record<string, number>,
  volumeGallons: number | null | undefined,
  waterType: string
): DosingRecommendation[] {
  if (!volumeGallons) return [];

  const recs: DosingRecommendation[] = [];
  const rangeKey = getRangeKey(waterType);
  const ranges = PARAMETER_RANGES[rangeKey] || PARAMETER_RANGES.freshwater;
  const isPool = isPoolSpa(waterType);

  if (isPool) {
    // --- Pool/Spa dosing ---
    const fc = latestParams['Free Chlorine'];
    const ph = latestParams['pH'];
    const alk = latestParams['Alkalinity'];
    const ch = latestParams['Calcium Hardness'];
    const cya = latestParams['Cyanuric Acid'];

    // Low chlorine: liquid chlorine (12.5% sodium hypochlorite) ~2 fl oz per 1000 gal = +1 ppm
    if (fc != null && fc < (ranges['Free Chlorine']?.good[0] ?? 1)) {
      const target = ranges['Free Chlorine']?.good[0] ?? 1;
      const ppmNeeded = target - fc;
      const ozNeeded = Math.round(ppmNeeded * (volumeGallons / 1000) * 2 * 10) / 10;
      recs.push({
        parameter: 'Free Chlorine',
        currentValue: fc,
        targetValue: target,
        chemical: 'Liquid chlorine (12.5% sodium hypochlorite)',
        dose: `${ozNeeded} fl oz`,
        instructions: `Add to pool with pump running. Wait 30 min before retesting. Don't swim until FC < 5 ppm.`,
      });
    }

    // pH low: soda ash — ~6 oz per 10,000 gal = +0.2 pH
    if (ph != null && ph < (ranges['pH']?.good[0] ?? 7.2)) {
      const target = ranges['pH']?.good[0] ?? 7.2;
      const phNeeded = target - ph;
      const steps = phNeeded / 0.2;
      const ozNeeded = Math.round(steps * 6 * (volumeGallons / 10000) * 10) / 10;
      recs.push({
        parameter: 'pH',
        currentValue: ph,
        targetValue: target,
        chemical: 'Soda ash (sodium carbonate)',
        dose: `${ozNeeded} oz`,
        instructions: `Pre-dissolve in bucket, pour around edges with pump running. Retest after 4 hours. Adjust in increments of 0.2.`,
      });
    }

    // pH high: muriatic acid (31.45%) — ~1 cup per 10,000 gal = -0.2 pH
    if (ph != null && ph > (ranges['pH']?.good[1] ?? 7.6)) {
      const target = ranges['pH']?.good[1] ?? 7.6;
      const phDrop = ph - target;
      const steps = phDrop / 0.2;
      const cupsNeeded = Math.round(steps * (volumeGallons / 10000) * 100) / 100;
      recs.push({
        parameter: 'pH',
        currentValue: ph,
        targetValue: target,
        chemical: 'Muriatic acid (31.45%)',
        dose: `${cupsNeeded} cup${cupsNeeded !== 1 ? 's' : ''}`,
        instructions: `Add slowly to deep end with pump running. Wear gloves and eye protection. Retest after 4 hours.`,
        caution: 'Never add more than 1 cup per 10,000 gal at a time. Wait and retest.',
      });
    }

    // Low alkalinity: baking soda — 1.5 lbs per 10,000 gal = +10 ppm
    if (alk != null && alk < (ranges['Alkalinity']?.good[0] ?? 80)) {
      const target = ranges['Alkalinity']?.good[0] ?? 80;
      const ppmNeeded = target - alk;
      const lbsNeeded = Math.round((ppmNeeded / 10) * 1.5 * (volumeGallons / 10000) * 100) / 100;
      recs.push({
        parameter: 'Alkalinity',
        currentValue: alk,
        targetValue: target,
        chemical: 'Baking soda (sodium bicarbonate)',
        dose: `${lbsNeeded} lbs`,
        instructions: `Broadcast over surface with pump running. Max 2 lbs per 10,000 gal at a time. Retest after 6 hours.`,
      });
    }

    // Low calcium: calcium chloride — 1 lb per 10,000 gal = +10 ppm
    if (ch != null && ch < (ranges['Calcium Hardness']?.good[0] ?? 200)) {
      const target = ranges['Calcium Hardness']?.good[0] ?? 200;
      const ppmNeeded = target - ch;
      const lbsNeeded = Math.round((ppmNeeded / 10) * 1 * (volumeGallons / 10000) * 100) / 100;
      recs.push({
        parameter: 'Calcium Hardness',
        currentValue: ch,
        targetValue: target,
        chemical: 'Calcium chloride',
        dose: `${lbsNeeded} lbs`,
        instructions: `Pre-dissolve in bucket of warm water, pour around edges. Add no more than 1 lb per 10,000 gal at a time. Retest after 24 hours.`,
        caution: 'Generates heat when dissolving. Use plastic bucket, add slowly to water.',
      });
    }

    // Low CYA: stabilizer — 13 oz per 10,000 gal = +10 ppm
    if (cya != null && cya < (ranges['Cyanuric Acid']?.good[0] ?? 30)) {
      const target = ranges['Cyanuric Acid']?.good[0] ?? 30;
      const ppmNeeded = target - cya;
      const ozNeeded = Math.round((ppmNeeded / 10) * 13 * (volumeGallons / 10000) * 10) / 10;
      recs.push({
        parameter: 'Cyanuric Acid',
        currentValue: cya,
        targetValue: target,
        chemical: 'Cyanuric acid (stabilizer)',
        dose: `${ozNeeded} oz`,
        instructions: `Place in skimmer basket or sock in front of return jet. Dissolves slowly (3-7 days). Don't backwash for a week. Retest after 7 days.`,
        caution: 'CYA cannot be lowered except by draining. Only add what you need.',
      });
    }
  } else {
    // --- Aquarium dosing ---
    const kh = latestParams['KH'];
    const ph = latestParams['pH'];
    const nitrite = latestParams['Nitrite'];
    const ammonia = latestParams['Ammonia'];

    // Low KH: baking soda — 1 tsp per 5 gal = +1 dKH
    if (kh != null && kh < (ranges['KH']?.good[0] ?? 3)) {
      const target = ranges['KH']?.good[0] ?? 3;
      const dkhNeeded = target - kh;
      const tspNeeded = Math.round(dkhNeeded * (volumeGallons / 5) * 10) / 10;
      const caution = ammonia != null && ammonia > 0
        ? `Caution: raising KH will also raise pH by ~${(dkhNeeded * 0.15).toFixed(1)}, which increases toxic NH3. Address ammonia first.`
        : undefined;
      recs.push({
        parameter: 'KH',
        currentValue: kh,
        targetValue: target,
        chemical: 'Baking soda (sodium bicarbonate)',
        dose: `${tspNeeded} tsp`,
        instructions: `Dissolve in tank water first. Add 1/3 of dose, wait 1 hour, retest. Repeat until target KH reached. Max +2 dKH per day.`,
        caution,
      });
    }

    // Nitrite present: aquarium salt — 1 tsp per gallon
    if (nitrite != null && nitrite > 0.25) {
      const tspNeeded = Math.round(volumeGallons);
      recs.push({
        parameter: 'Nitrite',
        currentValue: nitrite,
        targetValue: 0,
        chemical: 'Aquarium salt (NaCl, non-iodized)',
        dose: `${tspNeeded} tsp (1 per gallon)`,
        instructions: `Dissolve in a cup of tank water, add slowly. Salt blocks nitrite uptake through fish gills. Do NOT use table salt (iodized). Remove via water changes once nitrite reads 0.`,
        caution: 'Not suitable for scaleless fish (corydoras, loaches, plecos) or most plants. Use half dose for these species.',
      });
    }

    // Ammonia present: primary recommendation is water change (handled by action plan)
    // But if ammonia is present and tank is cycling, recommend Seachem Prime
    if (ammonia != null && ammonia > 0.25) {
      const mlNeeded = Math.round(volumeGallons * 0.2); // 1 mL per 5 gal = 0.2 per gal, standard dose
      recs.push({
        parameter: 'Ammonia',
        currentValue: ammonia,
        targetValue: 0,
        chemical: 'Seachem Prime (or similar ammonia detoxifier)',
        dose: `${mlNeeded} mL (standard dose for ${volumeGallons} gal)`,
        instructions: `Dose directly to tank. Detoxifies ammonia for 24-48 hours but doesn't remove it — you still need water changes and biological filtration. Can dose up to 5× in emergencies.`,
        caution: 'Detoxifiers are a temporary measure. Address root cause: overfeeding, dead fish, uncycled filter, or overstocking.',
      });
    }

    // Low GH (freshwater): remineralizer
    const gh = latestParams['GH'];
    if (gh != null && gh < (ranges['GH']?.good[0] ?? 4)) {
      recs.push({
        parameter: 'GH',
        currentValue: gh,
        targetValue: ranges['GH']?.good[0] ?? 4,
        chemical: 'GH booster (e.g., Seachem Equilibrium)',
        dose: `Follow product label for ${volumeGallons} gallons`,
        instructions: `Dissolve in water change water before adding to tank. Adjust by 1-2 dGH per water change to avoid shocking livestock.`,
      });
    }
  }

  return recs;
}

// ============= SEASONAL AWARENESS =============

export function computeSeasonalFactors(
  waterType: string,
  latestParams: Record<string, number>,
  stockingAnalysis: StockingAnalysis | null,
  maintenanceStatuses: MaintenanceStatus[]
): SeasonalFactor {
  const month = new Date().getMonth() + 1; // 1-12
  let season: SeasonalFactor['season'];
  if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else if (month >= 9 && month <= 11) season = 'fall';
  else season = 'winter';

  const isPool = isPoolSpa(waterType);
  const risks: string[] = [];
  const tips: string[] = [];
  const relevant: string[] = [];

  const tempF = latestParams['Temperature'];

  if (isPool) {
    switch (season) {
      case 'summer':
        risks.push('Higher chlorine demand from UV and bather load');
        risks.push('Algae growth accelerates in warm water + sunlight');
        tips.push('Test chlorine 2-3× per week in summer');
        tips.push('Run pump 10-12 hours daily minimum');
        if (tempF != null && tempF > 85) relevant.push(`Pool temp ${tempF}°F is high — chlorine degrades faster above 85°F`);
        break;
      case 'fall':
        risks.push('Falling leaves add phosphates and organic load');
        tips.push('Use a leaf net or cover when not in use');
        tips.push('Begin winterization planning if in a cold climate');
        break;
      case 'winter':
        risks.push('Freeze damage to pumps, pipes, and equipment');
        tips.push('Maintain antifreeze protection for exposed plumbing');
        tips.push('If closed: check cover and water level monthly');
        break;
      case 'spring':
        risks.push('Opening after winter — expect cloudy water and depleted sanitizer');
        tips.push('Shock heavily on first opening, clean filter thoroughly');
        tips.push('Test and balance all parameters before first swim');
        break;
    }
  } else {
    switch (season) {
      case 'summer':
        risks.push('Room temperature rises can push tank temp dangerously high');
        risks.push('Warmer water holds less dissolved oxygen');
        risks.push('Algae growth accelerates with longer daylight');
        tips.push('Consider a clip-on fan across the water surface for evaporative cooling');
        tips.push('Reduce light period to 6-8 hours if algae is a problem');
        if (tempF != null && tempF > 82) {
          relevant.push(`Tank temp ${tempF}°F is elevated — typical for summer. O2 is reduced.`);
          if (stockingAnalysis && stockingAnalysis.percentStocked > 70) {
            relevant.push(`Combined with ${stockingAnalysis.percentStocked}% stocking, O2 demand is high. Add an airstone.`);
          }
        }
        break;
      case 'winter':
        risks.push('Heater failure is more dangerous when room temp is low');
        risks.push('Drafts near windows can cause localized cold spots');
        tips.push('Check heater function weekly — have a backup for critical tanks');
        tips.push('Reduce feeding slightly — metabolism slows in cooler rooms');
        if (tempF != null && tempF < 74) {
          relevant.push(`Tank temp ${tempF}°F is low — check heater is working properly`);
        }
        const hasHeater = maintenanceStatuses.some(m => m.equipmentType.toLowerCase().includes('heater'));
        if (hasHeater) {
          const heaterStatus = maintenanceStatuses.find(m => m.equipmentType.toLowerCase().includes('heater'));
          if (heaterStatus?.status === 'overdue') {
            relevant.push(`Your ${heaterStatus.equipmentName} is overdue for maintenance — critical in winter`);
          }
        }
        break;
      case 'spring':
        risks.push('Parasite activity increases as temperatures warm up');
        risks.push('Algae blooms are common with increasing daylight');
        tips.push('Watch for ich and other parasites — quarantine new additions');
        tips.push('Good time for a deep clean and filter maintenance');
        tips.push('Many species enter spawning behavior — watch for aggression changes');
        break;
      case 'fall':
        risks.push('Room temp drops can cause gradual tank cooling');
        risks.push('Reduced natural daylight can affect plant growth');
        tips.push('Verify heater thermostat accuracy before winter');
        tips.push('Good time to stock up on supplies before winter');
        break;
    }
  }

  return { season, risks, tips, relevantToCurrentConditions: relevant };
}

// ============= DISEASE RISK SCORING =============

export function computeDiseaseRisk(
  insights: {
    trends: ParameterTrend[];
    speciesMismatches: SpeciesMismatch[];
    stockingAnalysis: StockingAnalysis | null;
    ammoniaToxicity: AmmoniaToxicity | null;
    temperamentConflicts: TemperamentConflict[];
    testStaleness: TestStaleness | null;
    recentTrajectories: RecentTrajectory[];
    cyclingPhase: CyclingPhase | null;
  },
  latestParams: Record<string, number>,
  hasLivestock: boolean
): DiseaseRisk | null {
  if (!hasLivestock) return null;

  const factors: DiseaseRisk['factors'] = [];
  let totalWeight = 0;

  const ammonia = latestParams['Ammonia'];
  const nitrite = latestParams['Nitrite'];

  // Ammonia stress
  if (ammonia != null && ammonia > 0) {
    const w = ammonia > 1 ? 20 : ammonia > 0.5 ? 15 : 10;
    factors.push({ factor: 'Ammonia present', weight: w, description: `Ammonia at ${ammonia} ppm causes gill damage and immune suppression` });
    totalWeight += w;
  }

  // Nitrite stress
  if (nitrite != null && nitrite > 0) {
    const w = nitrite > 1 ? 15 : nitrite > 0.5 ? 10 : 5;
    factors.push({ factor: 'Nitrite present', weight: w, description: `Nitrite at ${nitrite} ppm reduces blood oxygen capacity` });
    totalWeight += w;
  }

  // NH3 toxicity compounding
  if (insights.ammoniaToxicity && insights.ammoniaToxicity.severity !== 'safe') {
    const w = insights.ammoniaToxicity.severity === 'critical' ? 15 : insights.ammoniaToxicity.severity === 'danger' ? 10 : 5;
    factors.push({ factor: 'Toxic NH3 elevated', weight: w, description: `Free ammonia at ${insights.ammoniaToxicity.toxicNH3ppm.toFixed(3)} ppm — immunosuppressive` });
    totalWeight += w;
  }

  // pH instability
  const phTrajectory = insights.recentTrajectories.find(t => t.parameter === 'pH');
  if (phTrajectory && phTrajectory.trajectory === 'fluctuating') {
    factors.push({ factor: 'pH fluctuating', weight: 10, description: `pH is swinging: ${phTrajectory.narrative} — causes chronic stress` });
    totalWeight += 10;
  }

  // Temperature outside range or fluctuating
  const tempTrajectory = insights.recentTrajectories.find(t => t.parameter === 'Temperature');
  if (tempTrajectory && tempTrajectory.trajectory === 'fluctuating') {
    factors.push({ factor: 'Temperature unstable', weight: 8, description: `Temp swings stress immune systems — ich often follows temp drops` });
    totalWeight += 8;
  }
  const tempTrend = insights.trends.find(t => t.parameter === 'Temperature');
  if (tempTrend && tempTrend.currentStatus !== 'good') {
    factors.push({ factor: 'Temperature out of range', weight: 8, description: `Temperature at ${tempTrend.currentValue}°F — outside ideal range` });
    totalWeight += 8;
  }

  // Overstocking stress
  if (insights.stockingAnalysis) {
    if (insights.stockingAnalysis.status === 'overstocked') {
      factors.push({ factor: 'Overstocked', weight: 12, description: `${insights.stockingAnalysis.percentStocked}% stocked — crowding increases disease transmission` });
      totalWeight += 12;
    } else if (insights.stockingAnalysis.status === 'heavy') {
      factors.push({ factor: 'Heavy stocking', weight: 5, description: `${insights.stockingAnalysis.percentStocked}% stocked — moderate crowding stress` });
      totalWeight += 5;
    }
  }

  // Species parameter mismatches (chronic stress)
  const criticalMismatches = insights.speciesMismatches.filter(m => m.severity === 'critical').length;
  const concernMismatches = insights.speciesMismatches.filter(m => m.severity === 'concern').length;
  if (criticalMismatches > 0) {
    factors.push({ factor: 'Critical species mismatches', weight: Math.min(15, criticalMismatches * 5), description: `${criticalMismatches} species in critically wrong parameters — chronic stress weakens immunity` });
    totalWeight += Math.min(15, criticalMismatches * 5);
  }
  if (concernMismatches > 0) {
    factors.push({ factor: 'Species parameter concerns', weight: Math.min(8, concernMismatches * 3), description: `${concernMismatches} species outside preferred ranges` });
    totalWeight += Math.min(8, concernMismatches * 3);
  }

  // Temperament conflicts (stress from aggression)
  const criticalConflicts = insights.temperamentConflicts.filter(c => c.severity === 'critical').length;
  if (criticalConflicts > 0) {
    factors.push({ factor: 'Aggression stress', weight: Math.min(10, criticalConflicts * 5), description: `${criticalConflicts} critical temperament conflict(s) — bullied fish are immunocompromised` });
    totalWeight += Math.min(10, criticalConflicts * 5);
  }

  // Worsening trajectories
  const worseningCount = insights.recentTrajectories.filter(t => t.trajectory === 'worsening').length;
  if (worseningCount > 0) {
    const w = Math.min(12, worseningCount * 4);
    factors.push({ factor: 'Parameters worsening', weight: w, description: `${worseningCount} parameter(s) trending in wrong direction — environment deteriorating` });
    totalWeight += w;
  }

  // Cycling phase (not cycled = immature biofilter)
  if (insights.cyclingPhase && !['cycled', 'unknown'].includes(insights.cyclingPhase.phase)) {
    factors.push({ factor: 'Tank not cycled', weight: 10, description: `Tank in ${insights.cyclingPhase.phase.replace(/_/g, ' ')} — immature biofilter can't handle waste spikes` });
    totalWeight += 10;
  }

  // Stale data (uncertainty)
  if (insights.testStaleness && (insights.testStaleness.severity === 'stale' || insights.testStaleness.severity === 'very_stale')) {
    factors.push({ factor: 'Stale test data', weight: 5, description: `Last test ${insights.testStaleness.daysSinceLastTest === Infinity ? 'never' : insights.testStaleness.daysSinceLastTest + 'd ago'} — actual conditions unknown` });
    totalWeight += 5;
  }

  const score = Math.min(100, totalWeight);

  let label: DiseaseRisk['label'];
  if (score >= 60) label = 'critical';
  else if (score >= 40) label = 'high';
  else if (score >= 25) label = 'elevated';
  else if (score >= 10) label = 'moderate';
  else label = 'low';

  // Generate mitigations
  const mitigations: string[] = [];
  if (ammonia != null && ammonia > 0) mitigations.push('Water change to reduce ammonia');
  if (nitrite != null && nitrite > 0) mitigations.push('Water change + aquarium salt to block nitrite uptake');
  if (phTrajectory?.trajectory === 'fluctuating') mitigations.push('Stabilize pH — check KH buffer');
  if (tempTrajectory?.trajectory === 'fluctuating') mitigations.push('Stabilize temperature — check heater thermostat');
  if (insights.stockingAnalysis?.status === 'overstocked') mitigations.push('Rehome some fish to reduce bioload');
  if (criticalConflicts > 0) mitigations.push('Separate aggressive and peaceful species');
  if (score < 15) mitigations.push('Conditions are good — maintain regular water changes and testing');

  return { score, label, factors, mitigations };
}

// ============= RECURRING PATTERN DETECTION =============

export function detectRecurringPatterns(
  waterTests: WaterTest[]
): RecurringPattern[] {
  if (!waterTests || waterTests.length < 4) return [];

  const patterns: RecurringPattern[] = [];

  // Group params chronologically (waterTests come newest-first)
  const paramHistory: Record<string, { value: number; daysAgo: number }[]> = {};
  const now = Date.now();

  for (const test of waterTests) {
    if (!test.test_parameters) continue;
    const daysAgo = Math.round((now - new Date(test.test_date).getTime()) / (1000 * 60 * 60 * 24));
    for (const p of test.test_parameters) {
      if (p.value == null) continue;
      if (!paramHistory[p.parameter_name]) paramHistory[p.parameter_name] = [];
      paramHistory[p.parameter_name].push({ value: p.value, daysAgo });
    }
  }

  for (const [param, readings] of Object.entries(paramHistory)) {
    if (readings.length < 4) continue;

    // Reverse to chronological order
    const chrono = [...readings].reverse();
    const values = chrono.map(r => r.value);
    const days = chrono.map(r => r.daysAgo);

    // Compute deltas
    const deltas: number[] = [];
    for (let i = 1; i < values.length; i++) {
      deltas.push(values[i] - values[i - 1]);
    }

    const signs = deltas.map(d => d > 0.05 ? 1 : d < -0.05 ? -1 : 0);

    // --- Sawtooth: alternating rises then a sharp drop (water change pattern) ---
    // Look for sequences of positive deltas followed by a negative delta
    if (param === 'Nitrate' || param === 'Phosphate') {
      let sawtoothCount = 0;
      let riseLength = 0;
      for (const sign of signs) {
        if (sign >= 0) {
          riseLength++;
        } else {
          if (riseLength >= 2) sawtoothCount++;
          riseLength = 0;
        }
      }
      if (sawtoothCount >= 2) {
        // Estimate cycle length from drop-to-drop intervals
        const dropIndices = signs.map((s, i) => s < 0 ? i : -1).filter(i => i >= 0);
        let avgCycle: number | undefined;
        if (dropIndices.length >= 2) {
          const gaps = [];
          for (let i = 1; i < dropIndices.length; i++) {
            const dayGap = Math.abs(days[dropIndices[i]] - days[dropIndices[i - 1]]);
            if (dayGap > 0) gaps.push(dayGap);
          }
          if (gaps.length > 0) avgCycle = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        }

        patterns.push({
          parameter: param,
          patternType: 'sawtooth',
          description: `${param} repeatedly rises then drops sharply — consistent with water change cycle. Rises between changes suggest buildup is faster than removal.`,
          estimatedCycleDays: avgCycle,
          suggestedFix: avgCycle && avgCycle > 10
            ? `Your water changes (~every ${avgCycle} days) may not be frequent enough. Try every ${Math.max(5, Math.round(avgCycle * 0.7))} days or increase volume.`
            : 'Increase water change volume or frequency to prevent peak buildup.',
        });
      }
    }

    // --- Cyclic swing: parameter oscillates up and down repeatedly ---
    if (signs.length >= 4) {
      let reversals = 0;
      for (let i = 1; i < signs.length; i++) {
        if (signs[i] !== 0 && signs[i - 1] !== 0 && signs[i] !== signs[i - 1]) {
          reversals++;
        }
      }

      // If more than 60% of transitions are reversals, it's oscillating
      const nonZeroSigns = signs.filter(s => s !== 0);
      if (reversals >= 3 && nonZeroSigns.length >= 4 && reversals / (nonZeroSigns.length - 1) > 0.6) {
        const range = Math.max(...values) - Math.min(...values);
        if (range > 0.3) { // Meaningful swing
          let fix = '';
          if (param === 'pH') fix = 'Check KH buffering capacity. Low KH allows pH to swing. Maintain KH 3-5 dKH for stability.';
          else if (param === 'Temperature') fix = 'Check heater thermostat accuracy. Consider a heater controller. Avoid placement near windows/vents.';
          else fix = `Investigate what causes ${param} to swing — inconsistent dosing, feeding, or water changes can cause oscillation.`;

          patterns.push({
            parameter: param,
            patternType: 'cyclic_swing',
            description: `${param} oscillates between ${Math.min(...values).toFixed(1)} and ${Math.max(...values).toFixed(1)} — swinging up and down rather than stabilizing.`,
            suggestedFix: fix,
          });
        }
      }
    }

    // --- Chronic drift: steady one-direction movement across all/most readings ---
    if (values.length >= 5) {
      const positiveDeltas = signs.filter(s => s > 0).length;
      const negativeDeltas = signs.filter(s => s < 0).length;
      const totalNonZero = positiveDeltas + negativeDeltas;

      if (totalNonZero >= 4 && (positiveDeltas / totalNonZero > 0.8 || negativeDeltas / totalNonZero > 0.8)) {
        const direction = positiveDeltas > negativeDeltas ? 'rising' : 'falling';
        const totalChange = values[values.length - 1] - values[0];
        const totalDays = Math.abs(days[days.length - 1] - days[0]);

        let fix = '';
        if (param === 'Nitrate' && direction === 'rising') fix = 'Nitrate is accumulating despite water changes — increase frequency/volume, reduce feeding, or add fast-growing plants.';
        else if (param === 'pH' && direction === 'falling') fix = 'Steady pH decline suggests KH is being consumed. Add KH buffer regularly. Check for excess CO2 or organic acid sources.';
        else if (param === 'pH' && direction === 'rising') fix = 'Steady pH rise can be caused by substrate (crushed coral, limestone), evaporation top-offs, or high KH. Identify and address the source.';
        else fix = `${param} has been steadily ${direction} — identify the root cause rather than just correcting the value each time.`;

        patterns.push({
          parameter: param,
          patternType: 'chronic_drift',
          description: `${param} has been steadily ${direction} over ${totalDays} days: ${values[0].toFixed(1)} → ${values[values.length - 1].toFixed(1)} (${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}).`,
          estimatedCycleDays: totalDays,
          suggestedFix: fix,
        });
      }
    }

    // --- Recurring spike: same parameter spikes then returns to baseline 2+ times ---
    if (param === 'Ammonia' || param === 'Nitrite') {
      let spikeCount = 0;
      let inSpike = false;
      for (const v of values) {
        if (v > 0.25 && !inSpike) { spikeCount++; inSpike = true; }
        else if (v <= 0.1) { inSpike = false; }
      }

      if (spikeCount >= 2) {
        patterns.push({
          parameter: param,
          patternType: 'recurring_spike',
          description: `${param} has spiked ${spikeCount} times then returned to baseline — something repeatedly introduces ${param.toLowerCase()}.`,
          suggestedFix: param === 'Ammonia'
            ? 'Look for a recurring cause: overfeeding, dying plant matter, dead fish, filter cleaning (avoid rinsing in tap water), or irregular water changes.'
            : 'Recurring nitrite spikes suggest unstable biological filtration. Avoid over-cleaning filter media. Consider adding more bio-media.',
        });
      }
    }
  }

  return patterns;
}

// ============= COMPATIBILITY REPORT =============

export function computeCompatibilityReport(
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  temperamentConflicts: TemperamentConflict[],
  optimalZones: OptimalZone[]
): CompatibilityReport | null {
  if (!livestock?.length || livestock.length < 2) return null;

  const pairs: CompatibilityReport['pairs'] = [];
  const matchedSpecies: { name: string; species: FishSpecies }[] = [];

  for (const animal of livestock) {
    const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
    if (matched) {
      const displayName = animal.name || animal.species;
      if (!matchedSpecies.some(s => s.name === displayName)) {
        matchedSpecies.push({ name: displayName, species: matched });
      }
    }
  }

  if (matchedSpecies.length < 2) return null;

  let compatibleCount = 0;
  let incompatibleCount = 0;

  for (let i = 0; i < matchedSpecies.length; i++) {
    for (let j = i + 1; j < matchedSpecies.length; j++) {
      const a = matchedSpecies[i];
      const b = matchedSpecies[j];
      const reasons: string[] = [];
      let compatible = true;

      // Check temperament conflict
      const conflict = temperamentConflicts.find(c =>
        (c.aggressor === a.name && c.target === b.name) ||
        (c.aggressor === b.name && c.target === a.name)
      );
      if (conflict) {
        if (conflict.severity === 'critical') {
          compatible = false;
          reasons.push(`${conflict.aggressor} (${conflict.aggressorTemperament}) will likely harm ${conflict.target} (${conflict.targetTemperament})`);
        } else if (conflict.severity === 'concern') {
          reasons.push(`Temperament mismatch: ${conflict.aggressorTemperament} vs ${conflict.targetTemperament}`);
        }
      }

      // Check parameter overlap
      const paramChecks = [
        { key: 'pH', minA: a.species.ph_min, maxA: a.species.ph_max, minB: b.species.ph_min, maxB: b.species.ph_max },
        { key: 'Temp', minA: a.species.temp_min_f, maxA: a.species.temp_max_f, minB: b.species.temp_min_f, maxB: b.species.temp_max_f },
      ];

      for (const check of paramChecks) {
        if (check.minA == null || check.maxA == null || check.minB == null || check.maxB == null) continue;
        const overlapMin = Math.max(check.minA, check.minB);
        const overlapMax = Math.min(check.maxA, check.maxB);
        if (overlapMin >= overlapMax) {
          compatible = false;
          reasons.push(`No ${check.key} overlap: ${a.name} needs ${check.minA}-${check.maxA}, ${b.name} needs ${check.minB}-${check.maxB}`);
        }
      }

      // Size predation risk
      const sizeA = a.species.adult_size_inches ?? 2;
      const sizeB = b.species.adult_size_inches ?? 2;
      if (sizeA > 0 && sizeB > 0) {
        const ratio = Math.max(sizeA, sizeB) / Math.min(sizeA, sizeB);
        if (ratio >= 4) {
          const bigger = sizeA > sizeB ? a.name : b.name;
          const smaller = sizeA > sizeB ? b.name : a.name;
          const biggerSpecies = sizeA > sizeB ? a.species : b.species;
          if (biggerSpecies.predator) {
            compatible = false;
            reasons.push(`PREDATION RISK: ${bigger} is a predator (${Math.max(sizeA, sizeB)}") and ${smaller} (${Math.min(sizeA, sizeB)}") is small enough to eat`);
          } else {
            compatible = false;
            reasons.push(`Size mismatch (${ratio.toFixed(1)}×): ${bigger} may eat ${smaller}`);
          }
        } else if (ratio >= 3) {
          reasons.push(`Size difference (${ratio.toFixed(1)}×): monitor for bullying`);
        }
      }

      // Fin nipper + long-finned species
      if (a.species.fin_nipper && b.species.temperament === 'peaceful') {
        reasons.push(`${a.name} is a fin nipper — may damage ${b.name}'s fins`);
      }
      if (b.species.fin_nipper && a.species.temperament === 'peaceful') {
        reasons.push(`${b.name} is a fin nipper — may damage ${a.name}'s fins`);
      }

      // Species-only tank
      if (a.species.species_only_tank) {
        compatible = false;
        reasons.push(`${a.name} requires a species-only tank — should not be kept with other species`);
      }
      if (b.species.species_only_tank) {
        compatible = false;
        reasons.push(`${b.name} requires a species-only tank — should not be kept with other species`);
      }

      // Incompatible categories
      const catA = a.species.category || 'fish';
      const catB = b.species.category || 'fish';
      if (a.species.incompatible_categories?.includes(catB)) {
        compatible = false;
        reasons.push(`${a.name} is incompatible with ${catB}s (like ${b.name})`);
      }
      if (b.species.incompatible_categories?.includes(catA)) {
        compatible = false;
        reasons.push(`${b.name} is incompatible with ${catA}s (like ${a.name})`);
      }

      if (reasons.length === 0) {
        reasons.push('Compatible — overlapping parameter preferences and temperament');
      }

      if (compatible) compatibleCount++;
      else incompatibleCount++;

      pairs.push({
        speciesA: a.name,
        speciesB: b.name,
        compatible,
        reason: reasons.join('. '),
      });
    }
  }

  const total = compatibleCount + incompatibleCount;
  let overallRating: CompatibilityReport['overallRating'];
  const compatiblePct = total > 0 ? compatibleCount / total : 1;
  if (incompatibleCount === 0) overallRating = 'excellent';
  else if (compatiblePct >= 0.75) overallRating = 'good';
  else if (compatiblePct >= 0.5) overallRating = 'mixed';
  else overallRating = 'poor';

  const zoneIssues = optimalZones.filter(z => !z.hasOverlap);
  let summary = `${matchedSpecies.length} species analyzed: ${compatibleCount}/${total} pairs compatible (${overallRating}).`;
  if (zoneIssues.length > 0) {
    summary += ` No shared ${zoneIssues.map(z => z.parameter).join('/')} range for all species.`;
  }
  if (incompatibleCount > 0) {
    const worstPairs = pairs.filter(p => !p.compatible).map(p => `${p.speciesA}+${p.speciesB}`);
    summary += ` Problem pairs: ${worstPairs.join(', ')}.`;
  }

  return { overallRating, pairs, summary };
}

// ============= PARAMETER CORRELATION DETECTION =============

export function computeParameterCorrelations(
  waterTests: WaterTest[]
): ParameterCorrelation[] {
  if (!waterTests || waterTests.length < 4) return [];

  // Build per-test parameter snapshots (matched by test_date)
  const testSnapshots: Record<string, number>[] = [];

  for (const test of waterTests) {
    if (!test.test_parameters?.length) continue;
    const snapshot: Record<string, number> = {};
    for (const p of test.test_parameters) {
      if (p.value != null) snapshot[p.parameter_name] = p.value;
    }
    if (Object.keys(snapshot).length >= 2) {
      testSnapshots.push(snapshot);
    }
  }

  if (testSnapshots.length < 4) return [];

  // Get all parameter names that appear in 4+ tests
  const paramCounts: Record<string, number> = {};
  for (const snap of testSnapshots) {
    for (const key of Object.keys(snap)) {
      paramCounts[key] = (paramCounts[key] || 0) + 1;
    }
  }
  const eligibleParams = Object.keys(paramCounts).filter(p => paramCounts[p] >= 4);

  if (eligibleParams.length < 2) return [];

  const correlations: ParameterCorrelation[] = [];

  // Compute Pearson correlation for each pair
  for (let i = 0; i < eligibleParams.length; i++) {
    for (let j = i + 1; j < eligibleParams.length; j++) {
      const paramA = eligibleParams[i];
      const paramB = eligibleParams[j];

      // Get paired values (both must be present in same test)
      const pairedA: number[] = [];
      const pairedB: number[] = [];
      for (const snap of testSnapshots) {
        if (snap[paramA] != null && snap[paramB] != null) {
          pairedA.push(snap[paramA]);
          pairedB.push(snap[paramB]);
        }
      }

      if (pairedA.length < 4) continue;

      const n = pairedA.length;
      let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
      for (let k = 0; k < n; k++) {
        sumA += pairedA[k];
        sumB += pairedB[k];
        sumAB += pairedA[k] * pairedB[k];
        sumA2 += pairedA[k] * pairedA[k];
        sumB2 += pairedB[k] * pairedB[k];
      }

      const numerator = n * sumAB - sumA * sumB;
      const denomA = n * sumA2 - sumA * sumA;
      const denomB = n * sumB2 - sumB * sumB;
      const denom = Math.sqrt(denomA * denomB);

      if (denom === 0) continue;

      const r = numerator / denom;
      const absR = Math.abs(r);

      // Only report moderate+ correlations
      if (absR < 0.5) continue;

      const strength: ParameterCorrelation['strength'] = absR >= 0.8 ? 'strong' : absR >= 0.5 ? 'moderate' : 'weak';
      const direction: ParameterCorrelation['direction'] = r > 0 ? 'positive' : 'negative';

      // Generate interpretation
      let interpretation: string;
      const verb = r > 0 ? 'rise together' : (r > 0 ? 'rise together' : 'move inversely');

      if (paramA === 'KH' && paramB === 'pH') {
        interpretation = r > 0
          ? `KH and pH ${verb} (r=${r.toFixed(2)}) — expected, KH buffers pH. When KH drops, pH follows.`
          : `KH and pH move inversely (r=${r.toFixed(2)}) — unusual. Check if CO2 or acids are involved.`;
      } else if ((paramA === 'Nitrate' || paramB === 'Nitrate') && (paramA === 'Phosphate' || paramB === 'Phosphate')) {
        interpretation = r > 0
          ? `Nitrate and Phosphate rise together (r=${r.toFixed(2)}) — both accumulate from feeding/waste. Water changes lower both.`
          : `Nitrate and Phosphate move inversely (r=${r.toFixed(2)}) — one may be consumed by algae when the other is high.`;
      } else if ((paramA === 'Ammonia' || paramB === 'Ammonia') && (paramA === 'Nitrite' || paramB === 'Nitrite')) {
        interpretation = r > 0
          ? `Ammonia and Nitrite correlate (r=${r.toFixed(2)}) — both elevated suggests biofilter under stress.`
          : `Ammonia falls as Nitrite rises (r=${r.toFixed(2)}) — consistent with cycling progression.`;
      } else {
        const movementDesc = r > 0
          ? `When ${paramA} goes up, ${paramB} goes up too`
          : `When ${paramA} goes up, ${paramB} goes down`;
        interpretation = `${movementDesc} (r=${r.toFixed(2)}, ${strength}). In your tank, these parameters are linked.`;
      }

      correlations.push({
        paramA,
        paramB,
        correlation: Math.round(r * 100) / 100,
        strength,
        direction,
        interpretation,
      });
    }
  }

  // Sort by absolute correlation strength (strongest first)
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // Limit to top 5 most interesting correlations
  return correlations.slice(0, 5);
}

// ============= PLANT ANALYSIS =============

export function computePlantAnalysis(
  plants: Plant[],
  latestParams: Record<string, number>,
  equipment: Equipment[]
): PlantAnalysis | null {
  if (!plants?.length) return null;

  const totalPlants = plants.reduce((sum, p) => sum + (p.quantity || 1), 0);
  const conditionSummary = { thriving: 0, growing: 0, struggling: 0 };
  const warnings: string[] = [];
  const suggestions: string[] = [];

  for (const plant of plants) {
    const condition = (plant.condition || 'growing').toLowerCase();
    if (condition === 'thriving') conditionSummary.thriving += plant.quantity || 1;
    else if (condition === 'struggling') conditionSummary.struggling += plant.quantity || 1;
    else conditionSummary.growing += plant.quantity || 1;
  }

  // Check for struggling plants
  if (conditionSummary.struggling > 0) {
    const strugglingSpecies = plants.filter(p => (p.condition || '').toLowerCase() === 'struggling').map(p => p.name || p.species);
    warnings.push(`${conditionSummary.struggling} plant(s) struggling: ${strugglingSpecies.join(', ')}`);

    // Correlate with possible causes
    const nitrate = latestParams['Nitrate'];
    if (nitrate != null && nitrate < 5) {
      suggestions.push('Low nitrate (<5 ppm) may mean plants lack nitrogen — consider root tabs or liquid fertilizer');
    }

    const ph = latestParams['pH'];
    if (ph != null && ph > 7.5) {
      suggestions.push('High pH (>7.5) can limit CO2 availability for plants — consider CO2 injection or lowering pH');
    }
  }

  // Check if CO2 equipment exists
  const hasCO2 = equipment.some(e =>
    (e.equipment_type || '').toLowerCase().includes('co2') ||
    (e.name || '').toLowerCase().includes('co2')
  );

  // Check lighting
  const hasLight = equipment.some(e =>
    (e.equipment_type || '').toLowerCase().includes('light') ||
    (e.name || '').toLowerCase().includes('light')
  );

  if (!hasLight && totalPlants > 0) {
    warnings.push('No lighting equipment recorded — plants need 6-10 hours of light daily');
  }

  // Floating plants blocking light
  const floatingPlants = plants.filter(p => (p.placement || '').toLowerCase() === 'floating');
  const backgroundPlants = plants.filter(p => (p.placement || '').toLowerCase() === 'background');
  if (floatingPlants.length > 0 && backgroundPlants.length > 0) {
    suggestions.push('Floating plants may block light from reaching background plants — thin out if background plants struggle');
  }

  // Plants as nitrate absorbers
  const nitrate = latestParams['Nitrate'];
  if (nitrate != null && nitrate > 30 && totalPlants < 5) {
    suggestions.push('Fast-growing stem plants (hornwort, water wisteria, water sprite) can help absorb excess nitrate');
  }

  // CO2 suggestion for struggling plants
  if (conditionSummary.struggling > 0 && !hasCO2) {
    suggestions.push('CO2 injection can dramatically improve plant growth — even liquid CO2 (Excel/Easy Carbo) helps');
  }

  // Positive feedback
  if (conditionSummary.thriving > conditionSummary.struggling && conditionSummary.struggling === 0) {
    suggestions.push('All plants healthy — maintain current light and nutrient regimen');
  }

  return { totalPlants, conditionSummary, warnings, suggestions };
}

// ============= TANK SIZE WARNINGS =============

export function computeTankSizeWarnings(
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  volumeGallons: number | null | undefined
): TankSizeWarning[] {
  if (!volumeGallons || !livestock?.length) return [];

  const warnings: TankSizeWarning[] = [];
  const seen = new Set<string>();

  for (const animal of livestock) {
    const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
    if (!matched?.min_tank_gallons) continue;

    const displayName = animal.name || animal.species;
    if (seen.has(displayName)) continue;
    seen.add(displayName);

    if (volumeGallons < matched.min_tank_gallons) {
      const deficit = matched.min_tank_gallons - volumeGallons;
      warnings.push({
        species: displayName,
        minGallons: matched.min_tank_gallons,
        actualGallons: volumeGallons,
        severity: deficit > matched.min_tank_gallons * 0.3 ? 'critical' : 'warning',
      });
    }
  }

  return warnings;
}

// ============= NICHE / DWELLING LAYER CONFLICTS =============

export function computeNicheConflicts(
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[]
): NicheConflict[] {
  if (!livestock?.length) return [];

  const zones: Record<string, { name: string; territorial: boolean }[]> = {
    bottom: [],
    mid: [],
    top: [],
  };

  for (const animal of livestock) {
    const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
    if (!matched) continue;

    const displayName = animal.name || animal.species;
    const isTerritorial = matched.territorial || false;

    if (matched.bottom_dweller) zones.bottom.push({ name: displayName, territorial: isTerritorial });
    if (matched.mid_dweller) zones.mid.push({ name: displayName, territorial: isTerritorial });
    if (matched.top_dweller) zones.top.push({ name: displayName, territorial: isTerritorial });
  }

  const conflicts: NicheConflict[] = [];

  for (const [zone, inhabitants] of Object.entries(zones)) {
    // Deduplicate
    const unique = inhabitants.filter((v, i, a) => a.findIndex(u => u.name === v.name) === i);
    if (unique.length < 2) continue;

    const territorialOnes = unique.filter(s => s.territorial);
    if (territorialOnes.length === 0 && unique.length <= 3) continue; // Peaceful crowding is fine in small numbers

    let severity: NicheConflict['severity'] = 'info';
    if (territorialOnes.length >= 2) severity = 'concern';
    else if (territorialOnes.length === 1 && unique.length >= 3) severity = 'caution';
    else if (unique.length >= 4) severity = 'caution';

    if (severity !== 'info' || territorialOnes.length > 0) {
      conflicts.push({
        zone: zone as 'bottom' | 'mid' | 'top',
        species: unique.map(s => s.name),
        territorialSpecies: territorialOnes.map(s => s.name),
        severity,
      });
    }
  }

  return conflicts;
}

// ============= DATA COMPLETENESS ASSESSMENT =============

export function computeDataCompleteness(
  waterTests: WaterTest[],
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  equipment: Equipment[],
  volumeGallons: number | null | undefined,
  waterType: string,
  latestParams: Record<string, number>
): DataCompleteness {
  const gaps: DataGap[] = [];
  const availableInsights: string[] = [];
  const blindSpots: string[] = [];
  const isPool = isPoolSpa(waterType);

  let score = 0;
  const maxScore = isPool ? 70 : 100; // pools don't need livestock/species

  // --- Water tests (most important) ---
  if (!waterTests?.length) {
    gaps.push({
      missing: 'water_tests',
      importance: 'critical',
      reason: 'Without water test data, we cannot assess water quality, detect trends, predict problems, or give safe dosing advice. We are essentially blind.',
      askPrompt: 'When was the last time you tested your water? If you have a test kit, a quick test would let me give you much better advice.',
    });
    blindSpots.push('water quality', 'parameter trends', 'ammonia toxicity', 'cycling status', 'dosing calculations', 'what-if projections');
  } else {
    score += 25;
    availableInsights.push('current parameter status');

    if (waterTests.length === 1) {
      gaps.push({
        missing: 'test_history',
        importance: 'high',
        reason: 'With only 1 water test, we can see current values but cannot detect trends, recurring patterns, or correlations. One snapshot is not a trend.',
        askPrompt: 'Do you have results from any previous tests? Even one more data point helps us spot trends.',
      });
      blindSpots.push('parameter trends', 'recurring patterns', 'parameter correlations');
    } else if (waterTests.length === 2) {
      score += 5;
      availableInsights.push('basic change detection');
      blindSpots.push('trend confidence (need 3+ tests)', 'recurring patterns', 'parameter correlations');
    } else {
      score += 15;
      availableInsights.push('trend analysis', 'recurring pattern detection', 'parameter correlations');
    }

    // Check which critical parameters are measured
    const criticalParams = isPool
      ? ['Free Chlorine', 'pH', 'Alkalinity']
      : ['Ammonia', 'Nitrite', 'Nitrate', 'pH', 'Temperature'];
    const measured = criticalParams.filter(p => latestParams[p] != null);
    const unmeasured = criticalParams.filter(p => latestParams[p] == null);

    if (unmeasured.length > 0) {
      const paramReasons: Record<string, string> = {
        'Ammonia': 'Ammonia is the #1 fish killer — even 0.25 ppm is harmful, and toxicity depends on pH',
        'Nitrite': 'Nitrite blocks oxygen in fish blood — any reading above 0 is dangerous',
        'Nitrate': 'Nitrate shows waste accumulation — drives water change scheduling',
        'pH': 'pH determines ammonia toxicity AND affects every chemical process in the tank',
        'Temperature': 'Temperature affects metabolism, oxygen levels, and ammonia toxicity',
        'Free Chlorine': 'Chlorine is your primary sanitizer — without it, bacteria and algae take over',
        'Alkalinity': 'Alkalinity buffers pH — without it, pH can crash suddenly',
      };

      for (const param of unmeasured) {
        gaps.push({
          missing: `parameter_${param}`,
          importance: ['Ammonia', 'pH', 'Free Chlorine'].includes(param) ? 'critical' : 'high',
          reason: paramReasons[param] || `${param} is a core parameter for ${isPool ? 'pool' : 'aquarium'} health`,
          askPrompt: `Do you have a ${param} reading? It's one of the most important parameters to track.`,
        });
      }

      if (unmeasured.length > 0) {
        blindSpots.push(`${unmeasured.join(', ')} status unknown`);
      }
    }

    if (measured.length === criticalParams.length) {
      score += 10;
      availableInsights.push('complete critical parameter coverage');
    }
  }

  // --- Volume ---
  if (!volumeGallons) {
    gaps.push({
      missing: 'volume',
      importance: 'high',
      reason: 'Without volume, we cannot calculate dosing amounts, stocking capacity, or water change volumes. All chemical recommendations would be guesses.',
      askPrompt: 'How many gallons is your tank/pool? Even an estimate helps us calculate doses and stocking.',
    });
    blindSpots.push('dosing calculations', 'stocking analysis', 'water change volume');
  } else {
    score += 15;
    availableInsights.push('dosing calculations', 'stocking capacity');
  }

  // --- Livestock (aquariums only) ---
  if (!isPool) {
    if (!livestock?.length) {
      gaps.push({
        missing: 'livestock',
        importance: 'medium',
        reason: 'Without knowing your fish/invertebrates, we cannot check species compatibility, parameter preferences, stocking levels, or temperament conflicts.',
        askPrompt: 'What fish or other animals do you have in your tank? Species and quantities help us give species-specific advice.',
      });
      blindSpots.push('species compatibility', 'species-parameter matching', 'stocking analysis', 'temperament conflicts');
    } else {
      score += 15;
      availableInsights.push('species analysis');

      // Check if species match the DB
      const matchCount = livestock.filter(l =>
        fishSpeciesData.some(fs => matchSpecies(l.name, l.species, fs))
      ).length;

      if (matchCount === 0 && fishSpeciesData.length > 0) {
        gaps.push({
          missing: 'species_match',
          importance: 'low',
          reason: 'None of your livestock matched our species database — we cannot check their specific parameter preferences. Using general ranges instead.',
          askPrompt: 'Can you double-check the species names? Common names like "Neon Tetra" or "Clownfish" help us match to our database.',
        });
      } else if (matchCount > 0) {
        score += 5;
        availableInsights.push('species-parameter matching', 'compatibility report', 'optimal zones');
      }
    }
  }

  // --- Equipment ---
  if (!equipment?.length) {
    gaps.push({
      missing: 'equipment',
      importance: 'medium',
      reason: 'Without equipment data, we cannot track maintenance schedules or factor equipment health into assessments.',
      askPrompt: 'What equipment do you use (filter, heater, lights, etc.)? We can track maintenance schedules for you.',
    });
    blindSpots.push('maintenance tracking');
  } else {
    score += 10;
    availableInsights.push('maintenance tracking');

    const withMaintenance = equipment.filter(e => e.maintenance_interval_days);
    if (withMaintenance.length === 0 && equipment.length > 0) {
      gaps.push({
        missing: 'maintenance_intervals',
        importance: 'low',
        reason: 'Your equipment is listed but has no maintenance intervals set — we cannot track when maintenance is due.',
        askPrompt: 'Would you like to set up maintenance reminders for your equipment?',
      });
    }
  }

  // Normalize score
  const normalized = Math.round((score / maxScore) * 100);

  let label: DataCompleteness['label'];
  if (normalized >= 85) label = 'comprehensive';
  else if (normalized >= 65) label = 'good';
  else if (normalized >= 40) label = 'partial';
  else if (normalized >= 15) label = 'minimal';
  else label = 'blind';

  // Sort gaps by importance
  const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  return {
    score: normalized,
    label,
    gaps,
    availableInsights,
    blindSpots,
  };
}

// ============= CRISIS TRIAGE PROTOCOL =============

export function computeCrisisProtocol(
  insights: {
    trends: ParameterTrend[];
    ammoniaToxicity: AmmoniaToxicity | null;
    maintenanceStatuses: MaintenanceStatus[];
    parameterInteractions: ParameterInteraction[];
    cyclingPhase: CyclingPhase | null;
    healthScore: HealthScore;
  },
  latestParams: Record<string, number>,
  volumeGallons: number | null | undefined,
  waterType: string
): CrisisProtocol | null {
  if (isPoolSpa(waterType)) {
    // Pool crisis: extremely low chlorine + high pH, or very high chlorine
    const fc = latestParams['Free Chlorine'];
    const ph = latestParams['pH'];

    if (fc != null && fc === 0 && ph != null) {
      return {
        active: true,
        severity: 'urgent',
        triageSteps: [
          {
            order: 1,
            action: 'Shock the pool immediately',
            reason: 'Zero free chlorine means no sanitization — bacteria and algae are growing unchecked',
            timeframe: 'right now',
            whatHappensIfIgnored: 'Algae bloom within 24-48 hours, bacterial contamination makes pool unsafe to swim',
          },
          {
            order: 2,
            action: 'Test and adjust pH to 7.2-7.6',
            reason: 'Chlorine is 50% less effective at pH 8.0 vs 7.2 — fixing pH first maximizes your shock',
            timeframe: 'before shocking if pH is above 7.8',
            whatHappensIfIgnored: 'Shock treatment will be partially wasted at high pH',
          },
          {
            order: 3,
            action: 'Run pump continuously for 24 hours',
            reason: 'Circulation distributes chemicals and prevents dead spots where algae starts',
            timeframe: 'start now, run for 24 hours',
            whatHappensIfIgnored: 'Chemicals settle unevenly, some areas remain unsanitized',
          },
        ],
        doNotDo: [
          'Do NOT swim until free chlorine drops below 5 ppm',
          'Do NOT add multiple chemicals at once — wait 30 min between additions',
        ],
        stabilizationTarget: 'Once FC reads 1-3 ppm and pH is 7.2-7.6, the pool is safe. Retest daily for a week.',
      };
    }

    return null; // No pool crisis detected
  }

  // --- Aquarium crisis detection ---
  const criticalParams = insights.trends.filter(t => t.currentStatus === 'critical');
  const criticalInteractions = insights.parameterInteractions.filter(i => i.severity === 'critical');
  const nh3 = insights.ammoniaToxicity;
  const nh3Critical = nh3 && (nh3.severity === 'critical' || nh3.severity === 'danger');

  const ammonia = latestParams['Ammonia'] ?? 0;
  const nitrite = latestParams['Nitrite'] ?? 0;
  const ph = latestParams['pH'];
  const tempF = latestParams['Temperature'];

  // Count crisis signals
  const crisisSignals =
    (nh3Critical ? 2 : 0) +
    criticalParams.length +
    criticalInteractions.length +
    (insights.healthScore.overall < 30 ? 1 : 0);

  if (crisisSignals === 0) return null;

  let severity: CrisisProtocol['severity'];
  if (crisisSignals >= 4 || (nh3 && nh3.severity === 'critical')) severity = 'emergency';
  else if (crisisSignals >= 2 || nh3Critical) severity = 'urgent';
  else severity = 'elevated';

  const triageSteps: CrisisProtocol['triageSteps'] = [];
  let order = 0;

  // TRIAGE ORDER: What kills fish fastest?
  // 1. Toxic NH3 (kills in hours at high levels)
  // 2. Extreme temperature (kills in hours)
  // 3. Nitrite (kills in hours-days)
  // 4. pH crash/spike (kills in hours if extreme)
  // 5. Everything else (days-weeks)

  // Step 1: Emergency water change for NH3
  if (ammonia > 0 && (nh3Critical || ammonia > 0.5)) {
    const wcPct = nh3 && nh3.severity === 'critical' ? 50 : 30;
    const wcGal = volumeGallons ? ` (~${Math.round(volumeGallons * wcPct / 100)} gallons)` : '';
    triageSteps.push({
      order: ++order,
      action: `Immediate ${wcPct}% water change${wcGal} — use temperature-matched, dechlorinated water`,
      reason: `Ammonia at ${ammonia} ppm${nh3 ? ` with ${nh3.toxicNH3ppm.toFixed(3)} ppm toxic NH3 at pH ${nh3.ph}` : ''} — this is ${nh3?.severity === 'critical' ? 'LETHAL' : 'causing acute gill damage'}. Water change is the single fastest way to reduce toxicity.`,
      timeframe: 'right now',
      whatHappensIfIgnored: 'Gill tissue destruction, internal organ damage. Fish can die within hours at these levels.',
    });
  }

  // Step 2: Temperature emergency
  if (tempF != null && (tempF > 88 || tempF < 65)) {
    const isTooHot = tempF > 88;
    triageSteps.push({
      order: ++order,
      action: isTooHot
        ? `Cool tank gradually — float ice bags (sealed) or aim a fan across surface. Target: drop 2°F per hour max.`
        : `Check heater immediately — ${tempF}°F is dangerously cold. If heater failed, use a backup or slowly add warmer water.`,
      reason: isTooHot
        ? `${tempF}°F causes severe oxygen depletion and heat stress. Fish metabolism spikes but O2 drops.`
        : `${tempF}°F causes immune shutdown and can trigger ich or other diseases within days.`,
      timeframe: 'right now',
      whatHappensIfIgnored: isTooHot
        ? 'Oxygen crashes, fish suffocate. Can kill within hours in a heavily stocked tank.'
        : 'Cold shock, immune collapse, disease outbreak within 1-3 days.',
    });
  }

  // Step 3: Nitrite emergency
  if (nitrite > 0.5) {
    const saltDose = volumeGallons ? ` (${Math.round(volumeGallons)} tsp total for ${volumeGallons} gallons)` : '';
    triageSteps.push({
      order: ++order,
      action: `Add aquarium salt at 1 tsp per gallon${saltDose} to block nitrite uptake`,
      reason: `Nitrite at ${nitrite} ppm enters fish blood and prevents oxygen transport (methemoglobinemia — "brown blood disease"). Salt (chloride ions) competitively blocks nitrite from entering the gills.`,
      timeframe: 'within 1 hour',
      whatHappensIfIgnored: 'Fish gasp at surface, gills turn brown, lethargy progresses to death over 12-48 hours.',
    });
  }

  // Step 4: pH crash/extreme
  if (ph != null && (ph < 5.5 || ph > 9.0)) {
    triageSteps.push({
      order: ++order,
      action: ph < 5.5
        ? `Raise pH slowly — add baking soda (1/4 tsp per 5 gallons, wait 15 min, repeat). Do NOT raise more than 0.2 pH per hour.`
        : `Lower pH — a large water change with lower-pH source water is safest. Chemical pH adjusters can overshoot.`,
      reason: ph < 5.5
        ? `pH ${ph} causes acid burns on gills and skin. Below 6.0, the nitrogen cycle bacteria also start dying.`
        : `pH ${ph} is alkaline enough to cause chemical burns. At this pH, even trace ammonia becomes extremely toxic NH3.`,
      timeframe: 'within 1 hour',
      whatHappensIfIgnored: ph < 5.5
        ? 'Biofilter crash (beneficial bacteria die below pH 6), creating ammonia spike on top of acid damage.'
        : 'Severe gill damage from alkalinity + massively amplified ammonia toxicity.',
    });
  }

  // Step 5: Dose Prime/detoxifier
  if ((ammonia > 0.25 || nitrite > 0.25) && triageSteps.length > 0) {
    const primeDose = volumeGallons ? `${Math.round(volumeGallons * 0.2)} mL` : 'standard dose';
    triageSteps.push({
      order: ++order,
      action: `Dose Seachem Prime or equivalent ammonia/nitrite detoxifier (${primeDose})`,
      reason: 'Detoxifiers convert ammonia and nitrite to less harmful forms for 24-48 hours, buying time for the biofilter to catch up. This is a bridge, not a fix.',
      timeframe: 'after water change',
      whatHappensIfIgnored: 'Toxins return to harmful forms within hours if water changes alone aren\'t enough.',
    });
  }

  // Step 6: Add aeration
  if (triageSteps.length >= 2) {
    triageSteps.push({
      order: ++order,
      action: 'Maximize oxygen — add an airstone, lower water level to increase splash, point filter outflow at surface',
      reason: 'Stressed fish consume more oxygen. Ammonia, nitrite, and heat all reduce oxygen availability or uptake. Extra aeration is cheap insurance.',
      timeframe: 'right now (takes 30 seconds)',
      whatHappensIfIgnored: 'Oxygen becomes the limiting factor — fish that survive the toxins may still suffocate.',
    });
  }

  // Step 7: Stop feeding
  if ((ammonia > 0 || nitrite > 0) && triageSteps.length > 0) {
    triageSteps.push({
      order: ++order,
      action: 'Stop feeding for 24-48 hours',
      reason: 'Food = ammonia. Every feeding adds to the toxin load. Healthy fish can safely go 3-5 days without food.',
      timeframe: 'starting now',
      whatHappensIfIgnored: 'Each feeding adds ammonia, undoing your water change work.',
    });
  }

  const doNotDo: string[] = [];
  doNotDo.push('Do NOT clean the filter right now — you need every last bacterium working');
  doNotDo.push('Do NOT add new fish until ALL parameters read safe for 1+ week');
  if (ammonia > 0 && ph != null && ph > 7.5) {
    doNotDo.push('Do NOT raise pH — at your current ammonia level, higher pH makes it MORE toxic');
  }
  if (ph != null && (ph < 6.0 || ph > 8.5)) {
    doNotDo.push('Do NOT adjust pH more than 0.2 units per hour — rapid pH swings are themselves lethal');
  }
  doNotDo.push('Do NOT add multiple medications simultaneously — interactions can be fatal');

  // Stabilization target
  const targets: string[] = [];
  if (ammonia > 0) targets.push('ammonia at 0 ppm');
  if (nitrite > 0) targets.push('nitrite at 0 ppm');
  if (ph != null && (ph < 6.0 || ph > 8.5)) targets.push('pH between 6.5-7.5');
  if (tempF != null && (tempF > 86 || tempF < 70)) targets.push(`temperature 75-80°F`);
  const stabilizationTarget = targets.length > 0
    ? `Tank is stabilized once ${targets.join(', ')}. Then maintain with daily testing and water changes for 1 week.`
    : 'Monitor closely with daily testing for the next week.';

  return {
    active: true,
    severity,
    triageSteps,
    doNotDo,
    stabilizationTarget,
  };
}

// ============= ZERO-DATA INFERENCE =============

export function computeInferredContext(
  waterTests: WaterTest[],
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  equipment: Equipment[],
  volumeGallons: number | null | undefined,
  waterType: string,
  latestParams: Record<string, number>
): InferredContext {
  const inferences: InferredContext['inferences'] = [];
  const speciesIdealRanges: InferredContext['speciesIdealRanges'] = [];
  let setupChecklist: string[] | null = null;
  const isPool = isPoolSpa(waterType);

  // --- Infer tank maturity from data availability ---
  if (!waterTests?.length && !livestock?.length && equipment.length === 0) {
    inferences.push({
      what: 'Brand new or not-yet-set-up tank',
      confidence: 'medium',
      reasoning: 'No water tests, no livestock, no equipment recorded — this appears to be a new setup.',
      caveat: 'If this tank has been running and you just haven\'t logged data yet, let me know and I can adjust.',
    });

    // Generate setup checklist
    if (!isPool) {
      setupChecklist = [
        'Set up and run filter, heater, and lights for 24 hours before adding anything',
        'Add dechlorinator to treat tap water',
        'Begin fishless cycling: add ammonia source (fish food or pure ammonia)',
        'Test ammonia, nitrite, nitrate every 2-3 days during cycling',
        'Cycling typically takes 4-6 weeks — ammonia and nitrite must both read 0',
        'Once cycled: add fish slowly (2-3 at a time, wait 2 weeks between additions)',
        'Set up a regular testing schedule (weekly once stocked)',
      ];
    } else {
      setupChecklist = [
        'Fill and run the pump/filter system for 24 hours',
        'Test and balance pH (7.2-7.6) and alkalinity (80-120 ppm) first',
        'Add sanitizer (chlorine or bromine) — test after 30 minutes',
        'For salt pools: add salt to manufacturer specification, allow 24 hours to dissolve',
        'Verify calcium hardness (200-400 ppm) to prevent surface damage',
        'Brush walls and vacuum before first use',
        'Set up a testing schedule (2-3× per week in summer, weekly in winter)',
      ];
    }
  } else if (!waterTests?.length && (livestock?.length || 0) > 0) {
    inferences.push({
      what: 'Livestock present but no water test data — blind spot',
      confidence: 'high',
      reasoning: `You have ${livestock.length} livestock entries but no recorded water tests. This is the most dangerous data gap — fish could be in distress without visible symptoms.`,
    });
    inferences.push({
      what: 'Testing is the single most impactful action right now',
      confidence: 'high',
      reasoning: 'With fish present, water quality is the #1 health factor. Even a single test gives us actionable data. Without it, we cannot assess safety.',
    });
  }

  // --- Infer from equipment alone ---
  if (equipment.length > 0 && !volumeGallons) {
    // Try to infer tank size from filter model
    const filterNames = equipment
      .filter(e => e.equipment_type?.toLowerCase().includes('filter'))
      .map(e => `${e.brand || ''} ${e.model || ''} ${e.name || ''}`.trim());

    if (filterNames.length > 0) {
      inferences.push({
        what: 'Tank volume may be estimable from filter model',
        confidence: 'low',
        reasoning: `You have a filter (${filterNames[0]}) but no tank volume logged. Filter manufacturers rate their filters for specific tank sizes — knowing your volume helps us calculate doses and stocking.`,
        caveat: 'We need you to confirm the volume — we can\'t reliably guess from filter model alone.',
      });
    }
  }

  // --- Provide species ideal ranges (useful even without test data) ---
  if (!isPool && livestock?.length && fishSpeciesData?.length) {
    const seenSpecies = new Set<string>();
    for (const animal of livestock) {
      const matched = fishSpeciesData.find(fs => matchSpecies(animal.name, animal.species, fs));
      if (!matched) continue;

      const displayName = animal.name || animal.species;
      if (seenSpecies.has(displayName)) continue;
      seenSpecies.add(displayName);

      if (matched.ph_min != null && matched.ph_max != null) {
        speciesIdealRanges.push({ species: displayName, parameter: 'pH', min: matched.ph_min, max: matched.ph_max });
      }
      if (matched.temp_min_f != null && matched.temp_max_f != null) {
        speciesIdealRanges.push({ species: displayName, parameter: 'Temperature', min: matched.temp_min_f, max: matched.temp_max_f });
      }
      if (matched.hardness_min_dgh != null && matched.hardness_max_dgh != null) {
        speciesIdealRanges.push({ species: displayName, parameter: 'GH', min: matched.hardness_min_dgh, max: matched.hardness_max_dgh });
      }
    }

    if (speciesIdealRanges.length > 0 && !waterTests?.length) {
      inferences.push({
        what: `Target ranges based on your ${seenSpecies.size} species`,
        confidence: 'high',
        reasoning: `Even without test data, we know your species' ideal parameters. ${Array.from(seenSpecies).join(', ')} — aim for the overlap zone when you do test.`,
      });
    }
  }

  // --- Infer from single test with missing params ---
  if (waterTests?.length === 1 && Object.keys(latestParams).length > 0) {
    const hasAmmonia = latestParams['Ammonia'] != null;
    const hasNitrite = latestParams['Nitrite'] != null;
    const hasNitrate = latestParams['Nitrate'] != null;
    const hasPH = latestParams['pH'] != null;

    if (hasAmmonia && hasNitrite && hasNitrate) {
      // Can infer cycling status even from one test
      inferences.push({
        what: 'Nitrogen cycle snapshot available',
        confidence: 'medium',
        reasoning: 'We have a single reading for ammonia, nitrite, and nitrate — enough to estimate cycling phase, but trends require more tests.',
        caveat: 'One snapshot can\'t distinguish between "cycled" and "between ammonia spikes." Test again in 3-4 days.',
      });
    }

    if (hasPH && hasAmmonia && latestParams['Ammonia'] > 0) {
      inferences.push({
        what: 'Ammonia toxicity assessment possible',
        confidence: 'high',
        reasoning: `pH ${latestParams['pH']} + ammonia ${latestParams['Ammonia']} ppm — we can calculate toxic NH3 even from one test. This is critical safety information.`,
      });
    }
  }

  // --- Infer from livestock health status ---
  if (livestock?.length) {
    const sickFish = livestock.filter(l =>
      l.health_status && ['sick', 'stressed', 'critical', 'quarantined'].includes(l.health_status.toLowerCase())
    );
    if (sickFish.length > 0 && !waterTests?.length) {
      inferences.push({
        what: 'Sick fish without water data — testing is urgent',
        confidence: 'high',
        reasoning: `${sickFish.map(f => f.name || f.species).join(', ')} ${sickFish.length === 1 ? 'is' : 'are'} marked as ${sickFish.map(f => f.health_status).join('/')}. Water quality is the #1 cause of fish illness — test immediately to rule it out before treating for disease.`,
      });
    }
  }

  // --- Infer from only having tests but no livestock or equipment ---
  if (waterTests?.length && !livestock?.length && equipment.length === 0 && !isPool) {
    inferences.push({
      what: 'Possibly fishless cycling or planning phase',
      confidence: 'medium',
      reasoning: 'Water tests logged but no livestock or equipment — you may be cycling a new tank or researching before stocking.',
      caveat: 'If you have fish but haven\'t logged them yet, adding them will unlock species-specific advice.',
    });
  }

  return { inferences, speciesIdealRanges, setupChecklist };
}

// ============= PROACTIVE SUMMARY BUILDER =============

export function buildProactiveSummary(insights: Omit<AquariumInsights, 'proactiveSummary'>): string {
  const sections: string[] = [];

  // === 0A. CRISIS PROTOCOL (highest priority — before everything) ===
  if (insights.crisisProtocol?.active) {
    const cp = insights.crisisProtocol;
    const triageLines = cp.triageSteps.map(s =>
      `${s.order}. [${s.timeframe.toUpperCase()}] ${s.action} — ${s.reason} (If ignored: ${s.whatHappensIfIgnored})`
    );
    const doNotLines = cp.doNotDo.map(d => `- ${d}`);
    sections.push(
      `🚨 ${cp.severity.toUpperCase()} CRISIS PROTOCOL:\n` +
      `TRIAGE (in this order):\n${triageLines.join('\n')}\n\n` +
      `DO NOT:\n${doNotLines.join('\n')}\n\n` +
      `STABILIZATION TARGET: ${cp.stabilizationTarget}`
    );
  }

  // === 0B. DATA COMPLETENESS (if sparse data, tell AI what's missing) ===
  const dc = insights.dataCompleteness;
  if (dc.label === 'blind' || dc.label === 'minimal') {
    const topGaps = dc.gaps.filter(g => g.importance === 'critical' || g.importance === 'high').slice(0, 3);
    const gapLines = topGaps.map(g => `- [${g.importance.toUpperCase()}] ${g.missing}: ${g.reason}`);
    const blindStr = dc.blindSpots.length > 0 ? `\nBlind spots: ${dc.blindSpots.join(', ')}` : '';
    sections.push(
      `DATA COMPLETENESS: ${dc.score}/100 (${dc.label.toUpperCase()}) — insights are limited\n` +
      `Missing data:\n${gapLines.join('\n')}${blindStr}`
    );
  }

  // === 0C. INFERRED CONTEXT (when data is sparse, show what we CAN infer) ===
  const ic = insights.inferredContext;
  if (ic.inferences.length > 0 && (dc.label === 'blind' || dc.label === 'minimal' || dc.label === 'partial')) {
    const inferLines = ic.inferences.slice(0, 3).map(i =>
      `- [${i.confidence}] ${i.what}: ${i.reasoning}${i.caveat ? ` (Caveat: ${i.caveat})` : ''}`
    );
    sections.push(`INFERRED CONTEXT:\n${inferLines.join('\n')}`);
  }

  // === 0D. SETUP CHECKLIST (brand-new tanks) ===
  if (ic.setupChecklist) {
    sections.push(`SETUP CHECKLIST:\n${ic.setupChecklist.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  }

  // === 0E. SPECIES TARGET RANGES (when we have species but no test data) ===
  if (ic.speciesIdealRanges.length > 0 && (dc.label === 'blind' || dc.label === 'minimal')) {
    // Group by species
    const bySpecies: Record<string, string[]> = {};
    for (const r of ic.speciesIdealRanges) {
      if (!bySpecies[r.species]) bySpecies[r.species] = [];
      bySpecies[r.species].push(`${r.parameter}: ${r.min}–${r.max}`);
    }
    const speciesLines = Object.entries(bySpecies).map(([species, ranges]) =>
      `- ${species}: ${ranges.join(', ')}`
    );
    sections.push(`TARGET RANGES FOR YOUR SPECIES:\n${speciesLines.join('\n')}`);
  }

  // === 1. HEALTH SCORE HEADLINE ===
  const hs = insights.healthScore;
  const issueCategories = hs.breakdown.filter(b => b.issues.length > 0);
  const issueStr = issueCategories.length > 0
    ? ` Dragged down by: ${issueCategories.map(b => `${b.category} (${b.issues.slice(0, 2).join(', ')})`).join('; ')}.`
    : '';
  sections.push(`TANK HEALTH: ${hs.overall}/100 (${hs.label.toUpperCase()})${issueStr}`);

  // === 2. ACTION PLAN (top 5) ===
  if (insights.actionPlan.length > 0) {
    const topActions = insights.actionPlan.slice(0, 5);
    const actionLines = topActions.map(a =>
      `${a.priority}. [${a.urgency.toUpperCase()}] ${a.action} — ${a.reason}. Impact: ${a.impact}`
    );
    sections.push(`ACTION PLAN:\n${actionLines.join('\n')}`);
  }

  // === 3. RECENT TRAJECTORIES (non-stable only) ===
  const noteworthy = insights.recentTrajectories.filter(t => t.trajectory !== 'stable');
  if (noteworthy.length > 0) {
    sections.push(`RECENT READINGS:\n${noteworthy.map(t => `- ${t.narrative}`).join('\n')}`);
  }

  // === 4. KEY CONTEXT (cycling, stocking, optimal zones — one line each, only if noteworthy) ===
  const context: string[] = [];

  if (insights.cyclingPhase && insights.cyclingPhase.phase !== 'cycled' && insights.cyclingPhase.phase !== 'unknown') {
    context.push(`Cycling: ${insights.cyclingPhase.description}`);
  }

  if (insights.stockingAnalysis) {
    const sa = insights.stockingAnalysis;
    context.push(`Stocking: ${sa.percentStocked}% (${sa.status})${sa.schoolingWarnings.length > 0 ? ` — ${sa.schoolingWarnings.map(s => `${s.species} needs ${s.minimum - s.current} more`).join(', ')}` : ''}`);
  }

  const zoneIssues = insights.optimalZones.filter(z =>
    !z.hasOverlap || (z.currentValue != null && (z.currentValue < z.overlapMin || z.currentValue > z.overlapMax))
  );
  const goodZones = insights.optimalZones.filter(z =>
    z.hasOverlap && z.currentValue != null && z.currentValue >= z.overlapMin && z.currentValue <= z.overlapMax
  );
  if (zoneIssues.length > 0) {
    for (const z of zoneIssues) {
      if (!z.hasOverlap) {
        context.push(`${z.parameter}: no overlap zone for all species — incompatible preferences`);
      } else {
        context.push(`${z.parameter}: ${z.currentValue} is outside sweet spot ${z.overlapMin}–${z.overlapMax} for all species`);
      }
    }
  } else if (goodZones.length > 0) {
    context.push(`Sweet spot: ${goodZones.map(z => `${z.parameter} ${z.overlapMin}–${z.overlapMax}`).join(', ')} — all species happy`);
  }

  // Good news
  const stableGood = insights.trends.filter(t => t.currentStatus === 'good' && t.direction === 'stable');
  if (stableGood.length > 0) {
    context.push(`Stable & healthy: ${stableGood.map(t => t.parameter).join(', ')}`);
  }

  if (context.length > 0) {
    sections.push(`CONTEXT:\n${context.map(s => `- ${s}`).join('\n')}`);
  }

  // === 5. WHAT-IF PROJECTIONS (high priority only, max 2) ===
  const highScenarios = insights.whatIfScenarios.filter(s => s.priority === 'high').slice(0, 2);
  if (highScenarios.length > 0) {
    const lines = highScenarios.map(s =>
      `${s.action}: ${s.effects.slice(0, 2).join('; ')}`
    );
    sections.push(`WHAT-IF:\n${lines.map(l => `- ${l}`).join('\n')}`);
  }

  // === 6. KEY INTERACTIONS (danger+ only, max 2) ===
  const dangerInteractions = insights.parameterInteractions
    .filter(i => i.severity === 'critical' || i.severity === 'danger')
    .slice(0, 2);
  if (dangerInteractions.length > 0) {
    sections.push(`PARAMETER INTERACTIONS:\n${dangerInteractions.map(i => `- [${i.parameters.join('+')}] ${i.message}`).join('\n')}`);
  }

  // === 7. DISEASE RISK (if elevated+) ===
  if (insights.diseaseRisk && insights.diseaseRisk.score >= 25) {
    const dr = insights.diseaseRisk;
    const topFactors = dr.factors.slice(0, 3).map(f => f.factor).join(', ');
    const mitigation = dr.mitigations.slice(0, 2).join('; ');
    sections.push(`DISEASE RISK: ${dr.score}/100 (${dr.label.toUpperCase()}) — Top factors: ${topFactors}. Priority: ${mitigation}`);
  }

  // === 8. RECURRING PATTERNS (max 2) ===
  if (insights.recurringPatterns.length > 0) {
    const topPatterns = insights.recurringPatterns.slice(0, 2);
    sections.push(`RECURRING PATTERNS:\n${topPatterns.map(p => `- ${p.description} Fix: ${p.suggestedFix}`).join('\n')}`);
  }

  // === 9. DOSING RECOMMENDATIONS (max 3) ===
  if (insights.dosingRecommendations.length > 0) {
    const topDoses = insights.dosingRecommendations.slice(0, 3);
    const doseLines = topDoses.map(d =>
      `- ${d.parameter}: ${d.dose} of ${d.chemical} (${d.currentValue} → ${d.targetValue})${d.caution ? ` ⚠ ${d.caution}` : ''}`
    );
    sections.push(`DOSING RECOMMENDATIONS:\n${doseLines.join('\n')}`);
  }

  // === 10. SEASONAL AWARENESS (if has relevant conditions) ===
  if (insights.seasonalFactors) {
    const sf = insights.seasonalFactors;
    const items = [
      ...sf.relevantToCurrentConditions,
      ...(sf.relevantToCurrentConditions.length === 0 ? sf.risks.slice(0, 1) : []),
    ].slice(0, 2);
    if (items.length > 0) {
      sections.push(`SEASONAL (${sf.season.toUpperCase()}):\n${items.map(i => `- ${i}`).join('\n')}`);
    }
  }

  // === 11. COMPATIBILITY (if mixed/poor) ===
  if (insights.compatibilityReport && (insights.compatibilityReport.overallRating === 'poor' || insights.compatibilityReport.overallRating === 'mixed')) {
    sections.push(`COMPATIBILITY: ${insights.compatibilityReport.summary}`);
  }

  // === 12. TANK SIZE WARNINGS (species in undersized tanks) ===
  if (insights.tankSizeWarnings.length > 0) {
    const sizeLines = insights.tankSizeWarnings.map(w =>
      `- [${w.severity.toUpperCase()}] ${w.species} needs ${w.minGallons} gal minimum (tank is ${w.actualGallons} gal)`
    );
    sections.push(`TANK SIZE WARNINGS:\n${sizeLines.join('\n')}`);
  }

  // === 13. NICHE / DWELLING CONFLICTS (territorial overlap) ===
  const noteableNiche = insights.nicheConflicts.filter(c => c.severity !== 'info');
  if (noteableNiche.length > 0) {
    const nicheLines = noteableNiche.map(c =>
      `- [${c.severity.toUpperCase()}] ${c.zone} zone: ${c.species.join(', ')}${c.territorialSpecies.length > 0 ? ` (territorial: ${c.territorialSpecies.join(', ')})` : ''}`
    );
    sections.push(`DWELLING LAYER CONFLICTS:\n${nicheLines.join('\n')}`);
  }

  // === 14. PLANT ANALYSIS ===
  if (insights.plantAnalysis) {
    const pa = insights.plantAnalysis;
    const plantLines: string[] = [];
    plantLines.push(`${pa.totalPlants} plants: ${pa.conditionSummary.thriving} thriving, ${pa.conditionSummary.growing} growing, ${pa.conditionSummary.struggling} struggling`);
    for (const w of pa.warnings) plantLines.push(`⚠ ${w}`);
    for (const s of pa.suggestions.slice(0, 2)) plantLines.push(`→ ${s}`);
    sections.push(`PLANT HEALTH:\n${plantLines.map(l => `- ${l}`).join('\n')}`);
  }

  // === 15. PARAMETER CORRELATIONS (top 2 strong only) ===
  const strongCorrelations = insights.parameterCorrelations.filter(c => c.strength === 'strong').slice(0, 2);
  if (strongCorrelations.length > 0) {
    sections.push(`LINKED PARAMETERS:\n${strongCorrelations.map(c => `- ${c.interpretation}`).join('\n')}`);
  }

  if (sections.length === 0) return '';

  return `\nDATA-DRIVEN INSIGHTS:\n${sections.join('\n\n')}`;
}

// ============= ORCHESTRATOR =============

export function computeAquariumInsights(
  waterTests: WaterTest[],
  livestock: Livestock[],
  fishSpeciesData: FishSpecies[],
  equipment: Equipment[],
  volumeGallons: number | null | undefined,
  waterType: string,
  plants?: Plant[]
): AquariumInsights {
  const trends = computeParameterTrends(waterTests, waterType);

  // Extract latest parameter values
  const latestParams: Record<string, number> = {};
  if (waterTests?.length) {
    const latestTest = waterTests[0];
    if (latestTest?.test_parameters) {
      for (const p of latestTest.test_parameters) {
        if (p.value != null) latestParams[p.parameter_name] = p.value;
      }
    }
  }

  const isPool = isPoolSpa(waterType);

  // Species-dependent analyses (skip for pool/spa)
  const speciesMismatches = isPool
    ? []
    : computeSpeciesMismatches(livestock, fishSpeciesData, latestParams);

  const stockingAnalysis = isPool
    ? null
    : computeStockingAnalysis(livestock, fishSpeciesData, volumeGallons, waterType);

  const optimalZones = isPool
    ? []
    : computeOptimalZones(livestock, fishSpeciesData, latestParams);

  const temperamentConflicts = isPool
    ? []
    : computeTemperamentConflicts(livestock, fishSpeciesData);

  // Ammonia toxicity (aquariums only — pool chloramine is different chemistry)
  const ammoniaToxicity = isPool
    ? null
    : computeAmmoniaToxicity(latestParams);

  // Cycling detection (aquariums only)
  const cyclingPhase = isPool
    ? null
    : detectCyclingPhase(waterTests);

  const maintenanceStatuses = computeMaintenanceStatuses(equipment);

  const testStaleness = computeTestStaleness(waterTests, (livestock?.length ?? 0) > 0);

  const waterChangeEstimate = isPool
    ? null
    : estimateWaterChangeNeeds(trends, latestParams, volumeGallons, waterType);

  // Cross-parameter intelligence
  const parameterInteractions = computeParameterInteractions(
    latestParams, stockingAnalysis, trends, waterType
  );

  const whatIfScenarios = computeWhatIfScenarios(
    latestParams, ammoniaToxicity, waterChangeEstimate,
    stockingAnalysis, volumeGallons, waterType
  );

  // Recent trajectories (needed by healthScore and actionPlan)
  const recentTrajectories = computeRecentTrajectories(waterTests, waterType);

  const coreInsights = {
    trends,
    speciesMismatches,
    maintenanceStatuses,
    stockingAnalysis,
    optimalZones,
    ammoniaToxicity,
    cyclingPhase,
    temperamentConflicts,
    testStaleness,
    waterChangeEstimate,
    parameterInteractions,
    whatIfScenarios,
    recentTrajectories,
  };

  // Health score (depends on recentTrajectories)
  const healthScore = computeHealthScore(coreInsights, (livestock?.length ?? 0) > 0);

  // Action plan (depends on recentTrajectories)
  const actionPlan = buildActionPlan(coreInsights, latestParams, volumeGallons);

  // --- New features ---

  // Dosing recommendations
  const dosingRecommendations = computeDosingRecommendations(latestParams, volumeGallons, waterType);

  // Seasonal awareness
  const seasonalFactors = computeSeasonalFactors(waterType, latestParams, stockingAnalysis, maintenanceStatuses);

  // Disease risk (aquariums with livestock only)
  const hasLivestock = (livestock?.length ?? 0) > 0;
  const diseaseRisk = isPool
    ? null
    : computeDiseaseRisk(coreInsights, latestParams, hasLivestock);

  // Recurring patterns
  const recurringPatterns = detectRecurringPatterns(waterTests);

  // Compatibility report (aquariums with 2+ livestock only)
  const compatibilityReport = isPool
    ? null
    : computeCompatibilityReport(livestock, fishSpeciesData, temperamentConflicts, optimalZones);

  // Parameter correlations
  const parameterCorrelations = computeParameterCorrelations(waterTests);

  // --- Worst-conditions intelligence ---

  // Data completeness: what do we know, what's missing, what to ask
  const dataCompleteness = computeDataCompleteness(
    waterTests, livestock, fishSpeciesData, equipment,
    volumeGallons, waterType, latestParams
  );

  // Crisis protocol: when everything is wrong, triage by lethality
  const crisisProtocol = computeCrisisProtocol(
    { trends, ammoniaToxicity, maintenanceStatuses, parameterInteractions, cyclingPhase, healthScore },
    latestParams, volumeGallons, waterType
  );

  // Inferred context: smart guesses when data is sparse
  const inferredContext = computeInferredContext(
    waterTests, livestock, fishSpeciesData, equipment,
    volumeGallons, waterType, latestParams
  );

  // --- Plant & habitat intelligence ---

  // Plant health analysis (aquariums only)
  const plantAnalysis = isPool
    ? null
    : computePlantAnalysis(plants || [], latestParams, equipment);

  // Tank size warnings — flag species in undersized tanks
  const tankSizeWarnings = isPool
    ? []
    : computeTankSizeWarnings(livestock, fishSpeciesData, volumeGallons);

  // Niche / dwelling layer conflicts
  const nicheConflicts = isPool
    ? []
    : computeNicheConflicts(livestock, fishSpeciesData);

  const fullInsights = {
    ...coreInsights,
    healthScore,
    actionPlan,
    dosingRecommendations,
    seasonalFactors,
    diseaseRisk,
    recurringPatterns,
    compatibilityReport,
    parameterCorrelations,
    dataCompleteness,
    crisisProtocol,
    inferredContext,
    plantAnalysis,
    tankSizeWarnings,
    nicheConflicts,
  };

  const proactiveSummary = buildProactiveSummary(fullInsights);

  return { ...fullInsights, proactiveSummary };
}
