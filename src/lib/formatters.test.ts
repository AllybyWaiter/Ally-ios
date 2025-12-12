import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDateShort,
  formatTime,
  formatRelativeTime,
  formatNumber,
  formatDecimal,
  formatCurrency,
  formatPercent,
  formatUnit,
} from './formatters';

describe('formatters', () => {
  beforeEach(() => {
    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue('en');
  });

  describe('formatDate', () => {
    it('should format a Date object', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/June 15/);
    });

    it('should format a date string', () => {
      const result = formatDate('2025-06-15');
      expect(result).toMatch(/June 15/);
    });

    it('should format a timestamp number', () => {
      const timestamp = new Date('2025-06-15T12:00:00Z').getTime();
      const result = formatDate(timestamp);
      expect(result).toMatch(/June 15/);
    });

    it('should accept custom format string', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      const result = formatDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2025-06-15');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2025-06-15T14:30:00Z');
      const result = formatDateTime(date);
      expect(result).toMatch(/June 15/);
      // Time portion varies by timezone
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('formatDateShort', () => {
    it('should format date in short format', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      const result = formatDateShort(date);
      // Short format varies by locale
      expect(result).toMatch(/\d+/);
    });
  });

  describe('formatTime', () => {
    it('should format time portion of date', () => {
      const date = new Date('2025-06-15T14:30:00Z');
      const result = formatTime(date);
      // Time varies by timezone but should contain digits and possibly AM/PM
      expect(result).toMatch(/\d/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should return empty string for null', () => {
      expect(formatRelativeTime(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatRelativeTime(undefined)).toBe('');
    });

    it('should format recent date as relative', () => {
      const recentDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago
      const result = formatRelativeTime(recentDate);
      expect(result).toMatch(/5 minutes ago|less than/);
    });

    it('should format old date as relative', () => {
      const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // 7 days ago
      const result = formatRelativeTime(oldDate);
      expect(result).toMatch(/7 days ago|about/);
    });
  });

  describe('formatNumber', () => {
    it('should format integer', () => {
      const result = formatNumber(1234);
      expect(result).toBe('1,234');
    });

    it('should format decimal number', () => {
      const result = formatNumber(1234.56);
      expect(result).toBe('1,234.56');
    });

    it('should accept options', () => {
      const result = formatNumber(1234.5678, { maximumFractionDigits: 2 });
      expect(result).toBe('1,234.57');
    });
  });

  describe('formatDecimal', () => {
    it('should return empty string for null', () => {
      expect(formatDecimal(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDecimal(undefined)).toBe('');
    });

    it('should format with default 2 decimals', () => {
      expect(formatDecimal(3.14159)).toBe('3.14');
    });

    it('should format with custom decimal places', () => {
      expect(formatDecimal(3.14159, 4)).toBe('3.1416');
    });

    it('should handle 0', () => {
      expect(formatDecimal(0, 2)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatDecimal(-3.14159, 2)).toBe('-3.14');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      const result = formatCurrency(99.99);
      expect(result).toMatch(/\$99\.99/);
    });

    it('should format with different currency', () => {
      const result = formatCurrency(99.99, 'EUR');
      expect(result).toMatch(/€|EUR/);
    });
  });

  describe('formatPercent', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercent(0.75)).toBe('75%');
    });

    it('should format with decimals', () => {
      expect(formatPercent(0.7567, 2)).toBe('75.67%');
    });

    it('should handle 0', () => {
      expect(formatPercent(0)).toBe('0%');
    });

    it('should handle 1', () => {
      expect(formatPercent(1)).toBe('100%');
    });
  });

  describe('formatUnit', () => {
    it('should format value with unit', () => {
      expect(formatUnit(42, 'kg')).toBe('42 kg');
    });

    it('should format decimal value with unit', () => {
      expect(formatUnit(7.5, 'pH')).toBe('7.5 pH');
    });
  });
});
