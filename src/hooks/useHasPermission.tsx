import { usePermissions } from './usePermissions';

export const useHasPermission = (permission: string): boolean => {
  const { permissions } = usePermissions();
  return permissions.includes(permission);
};
