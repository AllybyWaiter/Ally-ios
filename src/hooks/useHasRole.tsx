// Re-export role checking from the new context
import { usePermissionsContext } from '@/contexts';

export const useHasRole = (role: string): boolean => {
  const { hasRole } = usePermissionsContext();
  return hasRole(role);
};
