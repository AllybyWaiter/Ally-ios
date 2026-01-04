/**
 * Safe Storage Utilities
 * 
 * Provides safe localStorage access with JSON parsing and validation.
 */

/**
 * Safely get and parse JSON from localStorage
 * Returns the parsed value or defaultValue if parsing fails or key doesn't exist
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch {
    // Invalid JSON or storage error, return default
    return defaultValue;
  }
}

/**
 * Safely set JSON in localStorage
 * Returns true if successful, false if storage fails
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Storage quota exceeded or other error
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 */
export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
