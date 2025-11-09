import { format, formatDistanceToNow, isValid } from 'date-fns';
import { enUS, es, fr } from 'date-fns/locale';

// Map language codes to date-fns locales
const localeMap = {
  en: enUS,
  es: es,
  fr: fr,
};

/**
 * Get the current language from i18n
 */
const getCurrentLanguage = (): 'en' | 'es' | 'fr' => {
  // Access i18n language from localStorage or default to 'en'
  const storedLang = localStorage.getItem('i18nextLng');
  if (storedLang && ['en', 'es', 'fr'].includes(storedLang)) {
    return storedLang as 'en' | 'es' | 'fr';
  }
  return 'en';
};

/**
 * Format a date according to the user's locale
 */
export const formatDate = (date: Date | string | number, formatStr: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (!isValid(dateObj)) {
    return 'Invalid date';
  }

  const lang = getCurrentLanguage();
  return format(dateObj, formatStr, { locale: localeMap[lang] });
};

/**
 * Format a date and time according to the user's locale
 */
export const formatDateTime = (date: Date | string | number): string => {
  return formatDate(date, 'PPp');
};

/**
 * Format a date in short format (e.g., "12/31/2024", "31/12/2024")
 */
export const formatDateShort = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (!isValid(dateObj)) {
    return 'Invalid date';
  }

  const lang = getCurrentLanguage();
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
};

/**
 * Format time according to the user's locale
 */
export const formatTime = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (!isValid(dateObj)) {
    return 'Invalid time';
  }

  const lang = getCurrentLanguage();
  return new Intl.DateTimeFormat(lang, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: lang === 'en', // Use 12-hour format for English, 24-hour for others
  }).format(dateObj);
};

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (!isValid(dateObj)) {
    return 'Invalid date';
  }

  const lang = getCurrentLanguage();
  return formatDistanceToNow(dateObj, { 
    addSuffix: true,
    locale: localeMap[lang],
  });
};

/**
 * Format a number with locale-specific thousand separators and decimal points
 */
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  const lang = getCurrentLanguage();
  return new Intl.NumberFormat(lang, options).format(value);
};

/**
 * Format a decimal number with a specific number of decimal places
 */
export const formatDecimal = (value: number, decimals: number = 2): string => {
  const lang = getCurrentLanguage();
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a currency value
 */
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  const lang = getCurrentLanguage();
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

/**
 * Format a percentage value
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  const lang = getCurrentLanguage();
  return new Intl.NumberFormat(lang, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Format a unit value (e.g., "5 gallons", "10 liters")
 */
export const formatUnit = (value: number, unit: string): string => {
  const lang = getCurrentLanguage();
  const formattedNumber = formatNumber(value);
  
  // For now, just append the unit
  // In the future, this could use Intl.NumberFormat with unit style when more widely supported
  return `${formattedNumber} ${unit}`;
};
