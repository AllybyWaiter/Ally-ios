// Unit conversion utilities for aquarium measurements
import { formatDecimal } from './formatters';

export type UnitSystem = 'metric' | 'imperial';

// Temperature conversions
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5/9;
};

export const formatTemperature = (value: number | null | undefined, units: UnitSystem | null, storedUnit: 'C' | 'F' = 'F'): string => {
  if (value === null || value === undefined || isNaN(value)) return '';
  const unitSystem = units || 'imperial';
  
  // If stored in Celsius
  if (storedUnit === 'C') {
    if (unitSystem === 'metric') {
      return `${formatDecimal(value, 1)}°C`;
    } else {
      return `${formatDecimal(celsiusToFahrenheit(value), 1)}°F`;
    }
  }
  
  // If stored in Fahrenheit
  if (unitSystem === 'metric') {
    return `${formatDecimal(fahrenheitToCelsius(value), 1)}°C`;
  } else {
    return `${formatDecimal(value, 1)}°F`;
  }
};

// Volume conversions
export const gallonsToLiters = (gallons: number): number => {
  return gallons * 3.78541;
};

export const litersToGallons = (liters: number): number => {
  return liters / 3.78541;
};

export const formatVolume = (gallons: number | null | undefined, units: UnitSystem | null): string => {
  if (gallons === null || gallons === undefined || isNaN(gallons)) return '';
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'metric') {
    return `${formatDecimal(gallonsToLiters(gallons), 1)} L`;
  } else {
    return `${formatDecimal(gallons, 1)} gal`;
  }
};

// Length conversions
export const inchesToCentimeters = (inches: number): number => {
  return inches * 2.54;
};

export const centimetersToInches = (cm: number): number => {
  return cm / 2.54;
};

export const formatLength = (inches: number | null | undefined, units: UnitSystem | null): string => {
  if (inches === null || inches === undefined || isNaN(inches)) return '';
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'metric') {
    return `${formatDecimal(inchesToCentimeters(inches), 1)} cm`;
  } else {
    return `${formatDecimal(inches, 1)} in`;
  }
};

// Generic parameter formatting with units
export const formatParameter = (
  value: number | null | undefined, 
  unit: string, 
  unitSystem: UnitSystem | null
): string => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  // Temperature parameters
  if (unit === '°F' || unit === 'F') {
    return formatTemperature(value, unitSystem, 'F');
  }
  if (unit === '°C' || unit === 'C') {
    return formatTemperature(value, unitSystem, 'C');
  }
  
  // Volume parameters
  if (unit.toLowerCase().includes('gal')) {
    return formatVolume(value, unitSystem);
  }
  if (unit.toLowerCase() === 'l' || unit.toLowerCase() === 'liters') {
    const gallons = litersToGallons(value);
    return formatVolume(gallons, unitSystem);
  }
  
  // Length parameters
  if (unit === 'in' || unit.toLowerCase() === 'inches') {
    return formatLength(value, unitSystem);
  }
  if (unit === 'cm' || unit.toLowerCase() === 'centimeters') {
    const inches = centimetersToInches(value);
    return formatLength(inches, unitSystem);
  }
  
  // For parameters that don't need conversion (pH, ppm, etc.)
  return `${formatDecimal(value, 2)} ${unit}`;
};

// Get temperature unit label
export const getTemperatureUnit = (units: UnitSystem | null): string => {
  return units === 'metric' ? '°C' : '°F';
};

// Get volume unit label (consistent abbreviation)
export const getVolumeUnit = (units: UnitSystem | null): string => {
  return units === 'metric' ? 'L' : 'gal';
};

// Get volume unit full label for display
export const getVolumeUnitFull = (units: UnitSystem | null): string => {
  return units === 'metric' ? 'liters' : 'gallons';
};

// Get length unit label
export const getLengthUnit = (units: UnitSystem | null): string => {
  return units === 'metric' ? 'cm' : 'in';
};

// Wind speed conversions
export const kmhToMph = (kmh: number): number => {
  return kmh / 1.60934;
};

export const mphToKmh = (mph: number): number => {
  return mph * 1.60934;
};

export const formatWindSpeed = (kmh: number | null | undefined, units: UnitSystem | null): string => {
  if (kmh == null || isNaN(kmh)) return '';
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'metric') {
    return `${Math.round(kmh)} km/h`;
  }
  return `${Math.round(kmhToMph(kmh))} mph`;
};

// UV Index helpers
export interface UVLevel {
  label: string;
  colorClass: string;
}

export const getUVLevel = (uvIndex: number | null | undefined): UVLevel => {
  if (uvIndex == null || isNaN(uvIndex)) return { label: 'Unknown', colorClass: 'text-muted-foreground' };
  if (uvIndex <= 2) return { label: 'Low', colorClass: 'text-green-600 dark:text-green-400' };
  if (uvIndex <= 5) return { label: 'Moderate', colorClass: 'text-yellow-600 dark:text-yellow-400' };
  if (uvIndex <= 7) return { label: 'High', colorClass: 'text-orange-600 dark:text-orange-400' };
  if (uvIndex <= 10) return { label: 'Very High', colorClass: 'text-red-600 dark:text-red-400' };
  return { label: 'Extreme', colorClass: 'text-purple-600 dark:text-purple-400' };
};

// Pressure conversions (hPa to inHg)
export const hPaToInHg = (hPa: number): number => {
  return hPa * 0.02953;
};

export const formatPressure = (hPa: number | null | undefined, units: UnitSystem | null): string => {
  if (hPa == null || isNaN(hPa)) return '';
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'imperial') {
    return `${hPaToInHg(hPa).toFixed(2)} inHg`;
  }
  return `${Math.round(hPa)} hPa`;
};

// Visibility conversions (km to miles)
export const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

export const formatVisibility = (km: number | null | undefined, units: UnitSystem | null): string => {
  if (km == null || isNaN(km)) return '';
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'imperial') {
    return `${kmToMiles(km).toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
};

// Precipitation formatting (mm to inches)
export const mmToInches = (mm: number): number => {
  return mm * 0.0393701;
};

export const formatPrecipitation = (mm: number | null | undefined, units: UnitSystem | null): string => {
  if (mm == null || isNaN(mm)) return '';
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'imperial') {
    return `${mmToInches(mm).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
};

// Air Quality Index helpers
export interface AQILevel {
  label: string;
  colorClass: string;
  bgClass: string;
  advice: string;
}

export const getAQILevel = (aqi: number | null | undefined): AQILevel => {
  if (aqi == null || isNaN(aqi)) {
    return { label: 'Unknown', colorClass: 'text-muted-foreground', bgClass: 'bg-muted', advice: 'Air quality data unavailable' };
  }
  if (aqi <= 50) {
    return { label: 'Good', colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-500', advice: 'Air quality is satisfactory' };
  }
  if (aqi <= 100) {
    return { label: 'Moderate', colorClass: 'text-yellow-600 dark:text-yellow-400', bgClass: 'bg-yellow-500', advice: 'Acceptable for most people' };
  }
  if (aqi <= 150) {
    return { label: 'Unhealthy for Sensitive', colorClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-500', advice: 'Sensitive groups should limit outdoor activity' };
  }
  if (aqi <= 200) {
    return { label: 'Unhealthy', colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-500', advice: 'Everyone should reduce outdoor activity' };
  }
  if (aqi <= 300) {
    return { label: 'Very Unhealthy', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-500', advice: 'Avoid outdoor activity' };
  }
  return { label: 'Hazardous', colorClass: 'text-rose-800 dark:text-rose-300', bgClass: 'bg-rose-800', advice: 'Stay indoors' };
};

// Comfort level based on dew point (in Celsius)
export interface ComfortLevel {
  label: string;
  colorClass: string;
}

export const getComfortLevel = (dewPointC: number | null | undefined): ComfortLevel => {
  if (dewPointC == null || isNaN(dewPointC)) {
    return { label: 'Unknown', colorClass: 'text-muted-foreground' };
  }
  if (dewPointC < 10) return { label: 'Dry', colorClass: 'text-blue-600 dark:text-blue-400' };
  if (dewPointC < 16) return { label: 'Comfortable', colorClass: 'text-green-600 dark:text-green-400' };
  if (dewPointC < 18) return { label: 'Slightly Humid', colorClass: 'text-yellow-600 dark:text-yellow-400' };
  if (dewPointC < 21) return { label: 'Humid', colorClass: 'text-orange-600 dark:text-orange-400' };
  return { label: 'Oppressive', colorClass: 'text-red-600 dark:text-red-400' };
};

// Pressure trend icon helper
export const getPressureTrendIcon = (trend: 'rising' | 'falling' | 'steady'): { icon: string; label: string } => {
  switch (trend) {
    case 'rising': return { icon: '↑', label: 'Rising' };
    case 'falling': return { icon: '↓', label: 'Falling' };
    default: return { icon: '→', label: 'Steady' };
  }
};
