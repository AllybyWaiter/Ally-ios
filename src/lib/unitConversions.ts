// Unit conversion utilities

export type UnitSystem = 'metric' | 'imperial';

// Temperature conversions
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5/9;
};

export const formatTemperature = (value: number, units: UnitSystem | null, storedUnit: 'C' | 'F' = 'F'): string => {
  const unitSystem = units || 'imperial';
  
  // If stored in Celsius
  if (storedUnit === 'C') {
    if (unitSystem === 'metric') {
      return `${value.toFixed(1)}°C`;
    } else {
      return `${celsiusToFahrenheit(value).toFixed(1)}°F`;
    }
  }
  
  // If stored in Fahrenheit
  if (unitSystem === 'metric') {
    return `${fahrenheitToCelsius(value).toFixed(1)}°C`;
  } else {
    return `${value.toFixed(1)}°F`;
  }
};

// Volume conversions
export const gallonsToLiters = (gallons: number): number => {
  return gallons * 3.78541;
};

export const litersToGallons = (liters: number): number => {
  return liters / 3.78541;
};

export const formatVolume = (gallons: number, units: UnitSystem | null): string => {
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'metric') {
    return `${gallonsToLiters(gallons).toFixed(1)} L`;
  } else {
    return `${gallons.toFixed(1)} gal`;
  }
};

// Length conversions
export const inchesToCentimeters = (inches: number): number => {
  return inches * 2.54;
};

export const centimetersToInches = (cm: number): number => {
  return cm / 2.54;
};

export const formatLength = (inches: number, units: UnitSystem | null): string => {
  const unitSystem = units || 'imperial';
  
  if (unitSystem === 'metric') {
    return `${inchesToCentimeters(inches).toFixed(1)} cm`;
  } else {
    return `${inches.toFixed(1)} in`;
  }
};

// Generic parameter formatting with units
export const formatParameter = (
  value: number, 
  unit: string, 
  unitSystem: UnitSystem | null
): string => {
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
  return `${value.toFixed(2)} ${unit}`;
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
