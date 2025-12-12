import { describe, it, expect } from 'vitest';
import { getParameterTemplates, validateParameter } from './waterTestUtils';

describe('getParameterTemplates', () => {
  describe('freshwater templates', () => {
    it('should return freshwater templates', () => {
      const templates = getParameterTemplates('freshwater');
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include basic parameters', () => {
      const templates = getParameterTemplates('freshwater');
      const templateNames = templates.map(t => t.name);
      expect(templateNames).toContain('Basic');
    });

    it('should have proper structure for each template', () => {
      const templates = getParameterTemplates('freshwater');
      templates.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('parameters');
        expect(Array.isArray(template.parameters)).toBe(true);
        template.parameters.forEach(param => {
          expect(param).toHaveProperty('name');
          expect(param).toHaveProperty('unit');
        });
      });
    });
  });

  describe('saltwater templates', () => {
    it('should return saltwater templates', () => {
      const templates = getParameterTemplates('saltwater');
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include salinity-related parameters', () => {
      const templates = getParameterTemplates('saltwater');
      const allParams = templates.flatMap(t => t.parameters.map(p => p.name));
      expect(allParams.some(name => name.toLowerCase().includes('salinity') || name.toLowerCase().includes('sg'))).toBe(true);
    });
  });

  describe('reef templates', () => {
    it('should return reef templates', () => {
      const templates = getParameterTemplates('reef');
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include reef-specific parameters', () => {
      const templates = getParameterTemplates('reef');
      const allParams = templates.flatMap(t => t.parameters.map(p => p.name));
      const hasReefParams = allParams.some(name => 
        name.toLowerCase().includes('calcium') || 
        name.toLowerCase().includes('alkalinity') ||
        name.toLowerCase().includes('magnesium')
      );
      expect(hasReefParams).toBe(true);
    });
  });

  describe('unknown aquarium type', () => {
    it('should return freshwater templates for unknown type', () => {
      const templates = getParameterTemplates('unknown-type');
      const freshwaterTemplates = getParameterTemplates('freshwater');
      expect(templates).toEqual(freshwaterTemplates);
    });
  });
});

describe('validateParameter', () => {
  describe('pH validation', () => {
    it('should validate pH in normal range as valid', () => {
      const result = validateParameter('pH', 7.0, 'freshwater');
      expect(result.isValid).toBe(true);
    });

    it('should validate extremely low pH as invalid', () => {
      const result = validateParameter('pH', 2.0, 'freshwater');
      expect(result.isValid).toBe(false);
      expect(result.hint).toBeDefined();
    });

    it('should validate extremely high pH as invalid', () => {
      const result = validateParameter('pH', 14.0, 'freshwater');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Ammonia validation', () => {
    it('should validate 0 ammonia as valid', () => {
      const result = validateParameter('Ammonia', 0, 'freshwater');
      expect(result.isValid).toBe(true);
    });

    it('should validate low ammonia as valid', () => {
      const result = validateParameter('Ammonia', 0.25, 'freshwater');
      expect(result.isValid).toBe(true);
    });

    it('should validate very high ammonia as invalid', () => {
      const result = validateParameter('Ammonia', 20, 'freshwater');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Nitrite validation', () => {
    it('should validate 0 nitrite as valid', () => {
      const result = validateParameter('Nitrite', 0, 'freshwater');
      expect(result.isValid).toBe(true);
    });

    it('should validate high nitrite as invalid', () => {
      const result = validateParameter('Nitrite', 15, 'freshwater');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Nitrate validation', () => {
    it('should validate low nitrate as valid', () => {
      const result = validateParameter('Nitrate', 10, 'freshwater');
      expect(result.isValid).toBe(true);
    });

    it('should validate moderate nitrate as valid', () => {
      const result = validateParameter('Nitrate', 40, 'freshwater');
      expect(result.isValid).toBe(true);
    });

    it('should validate extremely high nitrate as invalid', () => {
      const result = validateParameter('Nitrate', 500, 'freshwater');
      expect(result.isValid).toBe(false);
    });
  });

  describe('unknown parameter', () => {
    it('should return valid for unknown parameters', () => {
      const result = validateParameter('Unknown-Param', 100, 'freshwater');
      expect(result.isValid).toBe(true);
    });
  });

  describe('saltwater-specific validation', () => {
    it('should validate Salinity in normal range', () => {
      const result = validateParameter('Salinity', 35, 'saltwater');
      expect(result.isValid).toBe(true);
    });

    it('should validate extremely low salinity as invalid for saltwater', () => {
      const result = validateParameter('Salinity', 5, 'saltwater');
      expect(result.isValid).toBe(false);
    });
  });
});
