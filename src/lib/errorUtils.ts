/**
 * Error Utilities
 * 
 * Type-safe error handling utilities.
 */

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

/**
 * Check if error is an AbortError (from AbortController)
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes('network') || 
         error.message.includes('fetch') ||
         error.message.includes('CORS');
}
