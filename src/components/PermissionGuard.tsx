import { ReactNode } from 'react';
import { useHasPermission } from '@/hooks/useHasPermission';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard = ({ permission, children, fallback = null }: PermissionGuardProps) => {
  const hasPermission = useHasPermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
