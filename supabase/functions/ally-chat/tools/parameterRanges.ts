/**
 * Parameter Ranges for Water Testing
 *
 * Defines acceptable ranges for different water types to calculate status.
 */

export const PARAMETER_RANGES: Record<string, Record<string, { good: [number, number]; warning: [number, number] }>> = {
  freshwater: {
    'pH': { good: [6.5, 7.5], warning: [6.0, 8.0] },
    'Ammonia': { good: [0, 0], warning: [0, 0.25] },
    'Nitrite': { good: [0, 0], warning: [0, 0.25] },
    'Nitrate': { good: [0, 20], warning: [0, 40] },
    'Temperature': { good: [75, 80], warning: [72, 82] },
    'GH': { good: [4, 12], warning: [3, 14] },
    'KH': { good: [3, 8], warning: [2, 10] },
  },
  saltwater: {
    'pH': { good: [8.1, 8.4], warning: [8.0, 8.5] },
    'Ammonia': { good: [0, 0], warning: [0, 0.1] },
    'Nitrite': { good: [0, 0], warning: [0, 0.1] },
    'Nitrate': { good: [0, 20], warning: [0, 40] },
    'Salinity': { good: [1.024, 1.026], warning: [1.020, 1.028] },
    'Temperature': { good: [75, 80], warning: [73, 82] },
  },
  reef: {
    'pH': { good: [8.1, 8.4], warning: [8.0, 8.5] },
    'Ammonia': { good: [0, 0], warning: [0, 0.05] },
    'Nitrite': { good: [0, 0], warning: [0, 0.05] },
    'Nitrate': { good: [0, 5], warning: [0, 10] },
    'Phosphate': { good: [0, 0.03], warning: [0, 0.1] },
    'Alkalinity': { good: [8, 12], warning: [7, 13] },
    'Calcium': { good: [400, 450], warning: [380, 480] },
    'Magnesium': { good: [1300, 1450], warning: [1250, 1500] },
    'Salinity': { good: [1.024, 1.026], warning: [1.023, 1.027] },
    'Temperature': { good: [76, 78], warning: [74, 80] },
  },
  pool: {
    'Free Chlorine': { good: [1, 3], warning: [0.5, 5] },
    'pH': { good: [7.2, 7.6], warning: [7.0, 7.8] },
    'Alkalinity': { good: [80, 120], warning: [60, 140] },
    'Calcium Hardness': { good: [200, 400], warning: [150, 500] },
    'Cyanuric Acid': { good: [30, 50], warning: [20, 70] },
    'Temperature': { good: [78, 84], warning: [70, 90] },
  },
  spa: {
    'Free Chlorine': { good: [3, 5], warning: [2, 7] },
    'Bromine': { good: [4, 6], warning: [3, 8] },
    'pH': { good: [7.2, 7.8], warning: [7.0, 8.0] },
    'Alkalinity': { good: [80, 120], warning: [60, 140] },
    'Calcium Hardness': { good: [150, 250], warning: [100, 300] },
    'Temperature': { good: [100, 104], warning: [95, 108] },
  }
};

export function getParameterStatus(
  paramName: string,
  value: number,
  waterType: string
): 'good' | 'warning' | 'critical' {
  const ranges = PARAMETER_RANGES[waterType] || PARAMETER_RANGES.freshwater;
  const paramRange = ranges[paramName];

  if (!paramRange) return 'good'; // Unknown parameter, assume OK

  const [goodMin, goodMax] = paramRange.good;
  const [warnMin, warnMax] = paramRange.warning;

  // Special case for ammonia/nitrite - any detection is bad
  if (['Ammonia', 'Nitrite'].includes(paramName)) {
    if (value === 0) return 'good';
    if (value <= warnMax) return 'warning';
    return 'critical';
  }

  if (value >= goodMin && value <= goodMax) return 'good';
  if (value >= warnMin && value <= warnMax) return 'warning';
  return 'critical';
}

export function calculateTrend(values: number[]): 'up' | 'down' | 'stable' | undefined {
  if (values.length < 2) return undefined;

  const recent = values.slice(-3);
  if (recent.length < 2) return undefined;

  const first = recent[0];
  const last = recent[recent.length - 1];
  const changePercent = ((last - first) / (first || 1)) * 100;

  if (Math.abs(changePercent) < 5) return 'stable';
  return changePercent > 0 ? 'up' : 'down';
}

export function mapAquariumTypeToWaterType(aquariumType: string): string {
  const type = aquariumType?.toLowerCase() || '';
  if (['reef'].includes(type)) return 'reef';
  if (['saltwater', 'marine', 'fowlr'].includes(type)) return 'saltwater';
  if (['pool', 'pool_chlorine', 'pool_saltwater'].includes(type)) return 'pool';
  if (['spa'].includes(type)) return 'spa';
  return 'freshwater';
}
