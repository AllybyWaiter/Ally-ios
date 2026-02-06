/**
 * Pool Volume Calculator
 * 
 * Client-side utilities for calculating pool/spa volume based on shape and dimensions.
 */

export type PoolShape = 'round' | 'oval' | 'rectangle' | 'kidney';
export type DepthType = 'flat' | 'sloped';

export interface PoolDimensions {
  shape: PoolShape;
  // For round pools
  diameter_ft?: number;
  // For rectangle/oval/kidney pools
  length_ft?: number;
  width_ft?: number;
  // Depth
  depth_type: DepthType;
  single_depth_ft?: number;
  shallow_depth_ft?: number;
  deep_depth_ft?: number;
}

export interface PoolAdjustments {
  water_inches_below_top?: number;
  has_steps?: boolean;
  has_bench?: boolean;
  has_sun_shelf?: boolean;
}

export interface VolumeCalculationResult {
  estimated_gallons: number;
  min_gallons: number;
  max_gallons: number;
  confidence_level: 'high' | 'medium' | 'low';
  explanation: string;
}

// Conversion: 1 cubic foot = 7.48052 gallons
const CUBIC_FT_TO_GALLONS = 7.48052;

/**
 * Calculate average depth based on depth type
 */
export function calculateAverageDepth(
  depthType: DepthType,
  singleDepth?: number,
  shallowDepth?: number,
  deepDepth?: number
): number {
  if (depthType === 'flat' && singleDepth) {
    return singleDepth;
  }
  if (depthType === 'sloped' && shallowDepth && deepDepth) {
    return (shallowDepth + deepDepth) / 2;
  }
  return singleDepth || shallowDepth || deepDepth || 4; // Default 4ft
}

/**
 * Calculate surface area based on pool shape
 */
export function calculateSurfaceArea(dimensions: PoolDimensions): number {
  switch (dimensions.shape) {
    case 'round':
      if (!dimensions.diameter_ft || dimensions.diameter_ft <= 0) return 0;
      const radius = dimensions.diameter_ft / 2;
      return Math.PI * radius * radius;

    case 'oval':
      if (!dimensions.length_ft || !dimensions.width_ft || 
          dimensions.length_ft <= 0 || dimensions.width_ft <= 0) return 0;
      const a = dimensions.length_ft / 2;
      const b = dimensions.width_ft / 2;
      return Math.PI * a * b;

    case 'rectangle':
      if (!dimensions.length_ft || !dimensions.width_ft ||
          dimensions.length_ft <= 0 || dimensions.width_ft <= 0) return 0;
      return dimensions.length_ft * dimensions.width_ft;

    case 'kidney':
      // Kidney/freeform pools: estimate as 80% of rectangle
      if (!dimensions.length_ft || !dimensions.width_ft ||
          dimensions.length_ft <= 0 || dimensions.width_ft <= 0) return 0;
      return dimensions.length_ft * dimensions.width_ft * 0.8;

    default:
      return 0;
  }
}

/**
 * Apply adjustments to volume (water level, steps, bench)
 */
export function applyAdjustments(
  baseGallons: number,
  adjustments?: PoolAdjustments
): { adjustedGallons: number; reductions: string[] } {
  let adjustedGallons = baseGallons;
  const reductions: string[] = [];

  if (!adjustments) {
    return { adjustedGallons, reductions };
  }

  // Water level adjustment (convert inches to feet)
  if (adjustments.water_inches_below_top && adjustments.water_inches_below_top > 0) {
    const depthReductionPercent = (adjustments.water_inches_below_top / 12) / 4 * 100; // Assuming 4ft avg depth
    const reduction = baseGallons * (depthReductionPercent / 100);
    adjustedGallons -= reduction;
    reductions.push(`Water level ${adjustments.water_inches_below_top}" below top: -${Math.round(reduction)} gallons`);
  }

  // Steps typically remove 200-500 gallons
  if (adjustments.has_steps) {
    const stepReduction = Math.min(350, baseGallons * 0.02); // 2% or 350 gallons max
    adjustedGallons -= stepReduction;
    reductions.push(`Steps: -${Math.round(stepReduction)} gallons`);
  }

  // Bench/ledge removes ~500-1000 gallons
  if (adjustments.has_bench) {
    const benchReduction = Math.min(750, baseGallons * 0.03); // 3% or 750 gallons max
    adjustedGallons -= benchReduction;
    reductions.push(`Built-in bench: -${Math.round(benchReduction)} gallons`);
  }

  // Sun shelf removes ~300-600 gallons
  if (adjustments.has_sun_shelf) {
    const shelfReduction = Math.min(500, baseGallons * 0.025); // 2.5% or 500 gallons max
    adjustedGallons -= shelfReduction;
    reductions.push(`Sun shelf: -${Math.round(shelfReduction)} gallons`);
  }

  return { adjustedGallons: Math.max(0, adjustedGallons), reductions };
}

/**
 * Determine confidence level based on input quality
 */
export function determineConfidence(
  shape: PoolShape,
  hasExactMeasurements: boolean,
  adjustments?: PoolAdjustments
): 'high' | 'medium' | 'low' {
  // Kidney/freeform shapes inherently have lower confidence
  if (shape === 'kidney') {
    return hasExactMeasurements ? 'medium' : 'low';
  }

  // If user provided adjustments, slightly higher confidence
  const hasAdjustments = adjustments && (
    adjustments.has_steps || 
    adjustments.has_bench || 
    adjustments.water_inches_below_top
  );

  if (hasExactMeasurements && hasAdjustments) {
    return 'high';
  }

  if (hasExactMeasurements) {
    return 'medium';
  }

  return 'low';
}

/**
 * Calculate confidence range (±X%)
 */
export function calculateConfidenceRange(
  gallons: number,
  confidence: 'high' | 'medium' | 'low'
): { min: number; max: number } {
  const rangePercent = {
    high: 5,
    medium: 10,
    low: 20
  }[confidence];

  const variation = gallons * (rangePercent / 100);
  return {
    min: Math.round(gallons - variation),
    max: Math.round(gallons + variation)
  };
}

/**
 * Main calculation function
 */
export function calculatePoolVolume(
  dimensions: PoolDimensions,
  adjustments?: PoolAdjustments,
  hasExactMeasurements = true
): VolumeCalculationResult {
  // Calculate average depth
  const avgDepth = calculateAverageDepth(
    dimensions.depth_type,
    dimensions.single_depth_ft,
    dimensions.shallow_depth_ft,
    dimensions.deep_depth_ft
  );

  // Calculate surface area
  const surfaceArea = calculateSurfaceArea(dimensions);

  // Calculate volume in cubic feet, then convert to gallons
  const cubicFeet = surfaceArea * avgDepth;
  const baseGallons = cubicFeet * CUBIC_FT_TO_GALLONS;

  // Apply adjustments
  const { adjustedGallons, reductions } = applyAdjustments(baseGallons, adjustments);

  // Determine confidence
  const confidence = determineConfidence(dimensions.shape, hasExactMeasurements, adjustments);

  // Calculate range
  const range = calculateConfidenceRange(adjustedGallons, confidence);

  // Build explanation
  const shapeLabel = dimensions.shape.charAt(0).toUpperCase() + dimensions.shape.slice(1);
  let explanation = `Based on ${shapeLabel} shape`;
  
  if (dimensions.shape === 'round') {
    explanation += ` (${dimensions.diameter_ft ?? 0}' diameter)`;
  } else {
    explanation += ` (${dimensions.length_ft ?? 0}' × ${dimensions.width_ft ?? 0}')`;
  }

  if (dimensions.depth_type === 'sloped') {
    explanation += ` with ${dimensions.shallow_depth_ft ?? 0}'-${dimensions.deep_depth_ft ?? 0}' sloped depth`;
  } else {
    explanation += ` with ${dimensions.single_depth_ft ?? 0}' depth`;
  }

  if (reductions.length > 0) {
    explanation += `. Adjustments: ${reductions.join('; ')}`;
  }

  return {
    estimated_gallons: Math.round(adjustedGallons),
    min_gallons: range.min,
    max_gallons: range.max,
    confidence_level: confidence,
    explanation
  };
}

/**
 * Common pool sizes for quick selection
 */
export const COMMON_POOL_SIZES = {
  round: [
    { diameter: 12, label: '12\' Round (Above Ground)' },
    { diameter: 15, label: '15\' Round (Above Ground)' },
    { diameter: 18, label: '18\' Round (Above Ground)' },
    { diameter: 21, label: '21\' Round (Above Ground)' },
    { diameter: 24, label: '24\' Round (Above Ground)' },
    { diameter: 27, label: '27\' Round (Above Ground)' },
    { diameter: 30, label: '30\' Round (Above Ground)' },
  ],
  rectangle: [
    { length: 14, width: 28, label: '14\' × 28\' (Small Inground)' },
    { length: 16, width: 32, label: '16\' × 32\' (Medium Inground)' },
    { length: 18, width: 36, label: '18\' × 36\' (Large Inground)' },
    { length: 20, width: 40, label: '20\' × 40\' (Lap Pool)' },
  ],
  oval: [
    { length: 12, width: 24, label: '12\' × 24\' Oval (Above Ground)' },
    { length: 15, width: 30, label: '15\' × 30\' Oval (Above Ground)' },
    { length: 18, width: 33, label: '18\' × 33\' Oval (Above Ground)' },
  ]
};

/**
 * Measurement tips for users
 */
export const MEASUREMENT_TIPS = {
  diameter: 'Measure across the widest point of the pool, going through the center.',
  length: 'Measure the longest dimension of your pool.',
  width: 'Measure the shorter dimension, perpendicular to the length.',
  depth_single: 'If your pool has a flat bottom, measure from the water line to the bottom.',
  depth_sloped: 'For sloped pools, measure the shallowest point (usually near steps) and the deepest point.',
  pacing: 'No tape measure? One adult step ≈ 2.5 feet. Count your paces and multiply by 2.5.'
};
