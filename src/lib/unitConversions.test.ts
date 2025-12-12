import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature,
  gallonsToLiters,
  litersToGallons,
  formatVolume,
  inchesToCentimeters,
  centimetersToInches,
  formatLength,
  formatParameter,
  getTemperatureUnit,
  getVolumeUnit,
  getLengthUnit,
} from './unitConversions';

describe('Temperature Conversions', () => {
  describe('celsiusToFahrenheit', () => {
    it('should convert 0°C to 32°F', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
    });

    it('should convert 100°C to 212°F', () => {
      expect(celsiusToFahrenheit(100)).toBe(212);
    });

    it('should convert 25°C to 77°F', () => {
      expect(celsiusToFahrenheit(25)).toBe(77);
    });

    it('should handle negative temperatures', () => {
      expect(celsiusToFahrenheit(-40)).toBe(-40);
    });
  });

  describe('fahrenheitToCelsius', () => {
    it('should convert 32°F to 0°C', () => {
      expect(fahrenheitToCelsius(32)).toBe(0);
    });

    it('should convert 212°F to 100°C', () => {
      expect(fahrenheitToCelsius(212)).toBe(100);
    });

    it('should convert 77°F to 25°C', () => {
      expect(fahrenheitToCelsius(77)).toBe(25);
    });

    it('should handle -40 (same in both scales)', () => {
      expect(fahrenheitToCelsius(-40)).toBe(-40);
    });
  });

  describe('formatTemperature', () => {
    it('should return empty string for null', () => {
      expect(formatTemperature(null, 'metric')).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatTemperature(undefined, 'imperial')).toBe('');
    });

    it('should format Fahrenheit stored value to Celsius in metric', () => {
      const result = formatTemperature(77, 'metric', 'F');
      expect(result).toBe('25.0°C');
    });

    it('should format Fahrenheit stored value to Fahrenheit in imperial', () => {
      const result = formatTemperature(77, 'imperial', 'F');
      expect(result).toBe('77.0°F');
    });

    it('should format Celsius stored value to Fahrenheit in imperial', () => {
      const result = formatTemperature(25, 'imperial', 'C');
      expect(result).toBe('77.0°F');
    });

    it('should format Celsius stored value to Celsius in metric', () => {
      const result = formatTemperature(25, 'metric', 'C');
      expect(result).toBe('25.0°C');
    });

    it('should default to imperial when units is null', () => {
      const result = formatTemperature(77, null, 'F');
      expect(result).toBe('77.0°F');
    });
  });
});

describe('Volume Conversions', () => {
  describe('gallonsToLiters', () => {
    it('should convert 1 gallon to 3.78541 liters', () => {
      expect(gallonsToLiters(1)).toBeCloseTo(3.78541, 4);
    });

    it('should convert 10 gallons to 37.8541 liters', () => {
      expect(gallonsToLiters(10)).toBeCloseTo(37.8541, 3);
    });

    it('should handle 0', () => {
      expect(gallonsToLiters(0)).toBe(0);
    });
  });

  describe('litersToGallons', () => {
    it('should convert 3.78541 liters to 1 gallon', () => {
      expect(litersToGallons(3.78541)).toBeCloseTo(1, 4);
    });

    it('should convert 100 liters to ~26.42 gallons', () => {
      expect(litersToGallons(100)).toBeCloseTo(26.417, 2);
    });
  });

  describe('formatVolume', () => {
    it('should return empty string for null', () => {
      expect(formatVolume(null, 'metric')).toBe('');
    });

    it('should format gallons to liters in metric', () => {
      const result = formatVolume(10, 'metric');
      expect(result).toBe('37.9 L');
    });

    it('should format gallons to gallons in imperial', () => {
      const result = formatVolume(10, 'imperial');
      expect(result).toBe('10.0 gal');
    });

    it('should default to imperial when units is null', () => {
      const result = formatVolume(10, null);
      expect(result).toBe('10.0 gal');
    });
  });
});

describe('Length Conversions', () => {
  describe('inchesToCentimeters', () => {
    it('should convert 1 inch to 2.54 cm', () => {
      expect(inchesToCentimeters(1)).toBe(2.54);
    });

    it('should convert 12 inches to 30.48 cm', () => {
      expect(inchesToCentimeters(12)).toBeCloseTo(30.48, 2);
    });
  });

  describe('centimetersToInches', () => {
    it('should convert 2.54 cm to 1 inch', () => {
      expect(centimetersToInches(2.54)).toBe(1);
    });

    it('should convert 100 cm to ~39.37 inches', () => {
      expect(centimetersToInches(100)).toBeCloseTo(39.37, 1);
    });
  });

  describe('formatLength', () => {
    it('should return empty string for null', () => {
      expect(formatLength(null, 'metric')).toBe('');
    });

    it('should format inches to centimeters in metric', () => {
      const result = formatLength(10, 'metric');
      expect(result).toBe('25.4 cm');
    });

    it('should format inches to inches in imperial', () => {
      const result = formatLength(10, 'imperial');
      expect(result).toBe('10.0 in');
    });
  });
});

describe('formatParameter', () => {
  it('should return dash for null value', () => {
    expect(formatParameter(null, 'ppm', 'metric')).toBe('-');
  });

  it('should return dash for undefined value', () => {
    expect(formatParameter(undefined, 'ppm', 'metric')).toBe('-');
  });

  it('should return dash for NaN value', () => {
    expect(formatParameter(NaN, 'ppm', 'metric')).toBe('-');
  });

  it('should format temperature with °F unit', () => {
    const result = formatParameter(77, '°F', 'metric');
    expect(result).toBe('25.0°C');
  });

  it('should format temperature with F unit', () => {
    const result = formatParameter(77, 'F', 'metric');
    expect(result).toBe('25.0°C');
  });

  it('should format volume with gal unit', () => {
    const result = formatParameter(10, 'gal', 'metric');
    expect(result).toBe('37.9 L');
  });

  it('should format length with in unit', () => {
    const result = formatParameter(10, 'in', 'metric');
    expect(result).toBe('25.4 cm');
  });

  it('should format non-convertible units with value and unit', () => {
    const result = formatParameter(7.5, 'pH', 'metric');
    expect(result).toBe('7.50 pH');
  });

  it('should format ppm values', () => {
    const result = formatParameter(0.25, 'ppm', 'imperial');
    expect(result).toBe('0.25 ppm');
  });
});

describe('Unit Label Helpers', () => {
  describe('getTemperatureUnit', () => {
    it('should return °C for metric', () => {
      expect(getTemperatureUnit('metric')).toBe('°C');
    });

    it('should return °F for imperial', () => {
      expect(getTemperatureUnit('imperial')).toBe('°F');
    });

    it('should return °F for null', () => {
      expect(getTemperatureUnit(null)).toBe('°F');
    });
  });

  describe('getVolumeUnit', () => {
    it('should return L for metric', () => {
      expect(getVolumeUnit('metric')).toBe('L');
    });

    it('should return gal for imperial', () => {
      expect(getVolumeUnit('imperial')).toBe('gal');
    });

    it('should return gal for null', () => {
      expect(getVolumeUnit(null)).toBe('gal');
    });
  });

  describe('getLengthUnit', () => {
    it('should return cm for metric', () => {
      expect(getLengthUnit('metric')).toBe('cm');
    });

    it('should return in for imperial', () => {
      expect(getLengthUnit('imperial')).toBe('in');
    });

    it('should return in for null', () => {
      expect(getLengthUnit(null)).toBe('in');
    });
  });
});
