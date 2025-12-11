// Re-export permissions from the new context
import { usePermissionsContext } from '@/contexts';

export const usePermissions = () => {
  const { permissions, permissionsLoading } = usePermissionsContext();
  return { permissions, loading: permissionsLoading };
};
