/**
 * Water Body Utilities
 * 
 * Helper functions for pool/spa vs aquarium type detection and labeling.
 */

export type WaterBodyCategory = 'aquarium' | 'pool' | 'spa';

/**
 * Format a water body type for display using i18n translations
 * Falls back to title case conversion if translation not found
 */
export function formatWaterBodyType(type: string, t: (key: string) => string): string {
  const translationKey = `aquarium.types.${type}`;
  const translated = t(translationKey);
  
  // If translation exists and isn't the key itself, use it
  if (translated && translated !== translationKey) {
    return translated;
  }
  
  // Fallback: Convert snake_case to Title Case
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if a water body type is a pool or spa
 */
export function isPoolType(type: string): boolean {
  const poolTypes = ['pool', 'spa', 'hot_tub'];
  return poolTypes.includes(type.toLowerCase());
}

/**
 * Get the category of a water body
 */
export function getWaterBodyCategory(type: string): WaterBodyCategory {
  const lowerType = type.toLowerCase();
  if (lowerType === 'spa' || lowerType === 'hot_tub') return 'spa';
  if (lowerType === 'pool') return 'pool';
  return 'aquarium';
}

/**
 * Get context-appropriate labels for a water body type
 */
export function getWaterBodyLabels(type: string) {
  const isPool = isPoolType(type);
  const category = getWaterBodyCategory(type);
  
  return {
    entityName: category === 'spa' ? 'Spa' : category === 'pool' ? 'Pool' : 'Aquarium',
    entityNamePlural: category === 'spa' ? 'Spas' : category === 'pool' ? 'Pools' : 'Aquariums',
    volumeLabel: isPool ? 'Capacity' : 'Volume',
    setupDateLabel: isPool ? 'Installation Date' : 'Setup Date',
    showLivestock: !isPool,
    showPlants: !isPool,
  };
}

/**
 * Get aquarium equipment types
 */
export const AQUARIUM_EQUIPMENT_TYPES = [
  "Filter",
  "Heater",
  "Light",
  "Pump",
  "Protein Skimmer",
  "UV Sterilizer",
  "CO2 System",
  "Dosing Pump",
  "Wave Maker",
  "Chiller",
  "Other",
];

/**
 * Get pool/spa equipment types
 */
export const POOL_EQUIPMENT_TYPES = [
  "Pool Pump",
  "Pool Filter",
  "Pool Heater",
  "Salt Chlorine Generator",
  "Chlorinator",
  "Pool Cleaner",
  "Skimmer",
  "Return Jets",
  "Pool Light",
  "Solar Cover",
  "Heat Pump",
  "Ozone Generator",
  "Chemical Feeder",
  "Automation System",
  "Variable Speed Pump",
  "Other",
];

/**
 * Get equipment types based on water body type
 */
export function getEquipmentTypes(aquariumType: string): string[] {
  return isPoolType(aquariumType) ? POOL_EQUIPMENT_TYPES : AQUARIUM_EQUIPMENT_TYPES;
}

/**
 * Aquarium task types
 */
export const AQUARIUM_TASK_TYPES = [
  { value: "water_change", label: "Water Change" },
  { value: "filter_cleaning", label: "Filter Cleaning" },
  { value: "equipment_maintenance", label: "Equipment Maintenance" },
  { value: "feeding", label: "Feeding" },
  { value: "dosing", label: "Dosing" },
  { value: "testing", label: "Testing" },
  { value: "other", label: "Other" },
];

/**
 * Pool/Spa task types
 */
export const POOL_TASK_TYPES = [
  { value: "shock_treatment", label: "Shock Treatment" },
  { value: "chemical_balancing", label: "Chemical Balancing" },
  { value: "filter_cleaning", label: "Filter Cleaning" },
  { value: "skimmer_basket", label: "Empty Skimmer Basket" },
  { value: "backwash", label: "Backwash Filter" },
  { value: "vacuuming", label: "Pool Vacuuming" },
  { value: "brush_walls", label: "Brush Pool Walls" },
  { value: "cover_cleaning", label: "Cover Cleaning" },
  { value: "salt_cell_cleaning", label: "Salt Cell Cleaning" },
  { value: "algae_treatment", label: "Algae Treatment" },
  { value: "drain_refresh", label: "Drain & Refresh Water" },
  { value: "testing", label: "Water Testing" },
  { value: "winterize", label: "Winterization" },
  { value: "opening", label: "Pool Opening" },
  { value: "equipment_maintenance", label: "Equipment Maintenance" },
  { value: "other", label: "Other" },
];

/**
 * Get task types based on water body type
 */
export function getTaskTypes(aquariumType: string) {
  return isPoolType(aquariumType) ? POOL_TASK_TYPES : AQUARIUM_TASK_TYPES;
}
