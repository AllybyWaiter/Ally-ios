import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook for auto-saving form data with debouncing
 * @param options - Configuration options
 * @returns Auto-save state and controls
 */
export const useAutoSave = <T,>({
  data,
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T>(data);
  const initialRenderRef = useRef(true);

  const saveNow = useCallback(async () => {
    if (!enabled) return;
    
    setIsSaving(true);
    setError(null);

    try {
      await onSave(dataRef.current);
      setLastSaved(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Auto-save failed');
      setError(error);
      toast.error('Auto-save failed', {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  }, [enabled, onSave]);

  useEffect(() => {
    // Skip auto-save on initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      dataRef.current = data;
      return;
    }

    if (!enabled) return;

    // Update data ref
    dataRef.current = data;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveNow]);

  // Cleanup on unmount - cancel any pending saves
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    saveNow,
    error,
  };
};
