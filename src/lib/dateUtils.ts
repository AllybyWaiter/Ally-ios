/**
 * Date Utilities
 *
 * Standardized date handling utilities for consistent date formatting
 * and manipulation throughout the application.
 *
 * Re-exports date functions from formatters.ts and adds additional utilities.
 */

import {
  isValid,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addWeeks,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  isSameDay,
  isToday,
  isPast,
  isFuture,
} from 'date-fns';

// Re-export formatting functions from formatters.ts
export {
  formatDate,
  formatDateTime,
  formatDateShort,
  formatTime,
  formatRelativeTime,
  toDateString,
  toISOString,
  getTodayString,
  getFutureDateString,
} from './formatters';

// ==================== Date Parsing ====================

/**
 * Safely parse a date string to a Date object
 * Returns null for invalid dates instead of Invalid Date
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Parse a date or return current date if invalid
 */
export function parseDateOrNow(dateString: string | null | undefined): Date {
  return parseDate(dateString) ?? new Date();
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
  return parseDate(dateString) !== null;
}

// ==================== Date Ranges ====================

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get date range for common periods
 */
export function getDateRange(
  period: 'today' | 'week' | 'month' | '7d' | '30d' | '90d' | '1y'
): DateRange {
  const now = new Date();

  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case '7d':
      return { start: subDays(now, 7), end: now };
    case '30d':
      return { start: subDays(now, 30), end: now };
    case '90d':
      return { start: subDays(now, 90), end: now };
    case '1y':
      return { start: subDays(now, 365), end: now };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

/**
 * Get start of current month
 */
export function getStartOfMonth(): Date {
  return startOfMonth(new Date());
}

/**
 * Get ISO string for start of current month
 */
export function getStartOfMonthString(): string {
  return getStartOfMonth().toISOString();
}

// ==================== Date Comparisons ====================

/**
 * Check if a date is overdue (before today)
 */
export function isOverdue(date: Date | string | null | undefined): boolean {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) return false;
  return isPast(startOfDay(parsed)) && !isToday(parsed);
}

/**
 * Check if a date is due today
 */
export function isDueToday(date: Date | string | null | undefined): boolean {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) return false;
  return isToday(parsed);
}

/**
 * Check if a date is upcoming (within next N days)
 */
export function isUpcoming(date: Date | string | null | undefined, daysAhead: number = 7): boolean {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) return false;

  const futureDate = addDays(new Date(), daysAhead);
  return isFuture(parsed) && isBefore(parsed, futureDate);
}

/**
 * Get the number of days until a date
 * Returns negative for past dates
 */
export function getDaysUntil(date: Date | string | null | undefined): number | null {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) return null;

  return differenceInDays(parsed, new Date());
}

/**
 * Get a human-readable description of how far away a date is
 */
export function getDateProximity(
  date: Date | string | null | undefined
): 'overdue' | 'today' | 'tomorrow' | 'this-week' | 'later' | null {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) return null;

  if (isOverdue(parsed)) return 'overdue';
  if (isToday(parsed)) return 'today';

  const daysUntil = getDaysUntil(parsed);
  if (daysUntil === null) return null;

  if (daysUntil === 1) return 'tomorrow';
  if (daysUntil <= 7) return 'this-week';

  return 'later';
}

// ==================== Date Manipulation ====================

/**
 * Add days to a date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  return addDays(parsed ?? new Date(), days);
}

/**
 * Add weeks to a date
 */
export function addWeeksToDate(date: Date | string, weeks: number): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  return addWeeks(parsed ?? new Date(), weeks);
}

/**
 * Add months to a date
 */
export function addMonthsToDate(date: Date | string, months: number): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  return addMonths(parsed ?? new Date(), months);
}

// ==================== Re-exports from date-fns ====================

export {
  isValid,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addWeeks,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  isSameDay,
  isToday,
  isPast,
  isFuture,
};
