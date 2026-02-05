import { toast } from 'sonner';

/**
 * Show an error toast with consistent styling
 */
export function showErrorToast(title: string, description?: string) {
  toast.error(title, {
    description,
  });
}

/**
 * Show a success toast with consistent styling
 */
export function showSuccessToast(title: string, description?: string) {
  toast.success(title, {
    description,
  });
}

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
  return 'An unexpected error occurred';
}

/**
 * Show error toast from an unknown error
 */
export function showErrorFromUnknown(title: string, error: unknown) {
  showErrorToast(title, getErrorMessage(error));
}
