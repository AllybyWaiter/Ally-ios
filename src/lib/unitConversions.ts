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

// Get volume unit label
export const getVolumeUnit = (units: UnitSystem | null): string => {
  return units === 'metric' ? 'L' : 'gal';
};

// Get length unit label
export const getLengthUnit = (units: UnitSystem | null): string => {
  return units === 'metric' ? 'cm' : 'in';
};
