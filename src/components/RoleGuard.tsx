import { ReactNode } from 'react';
import { useHasRole } from '@/hooks/useHasRole';

interface RoleGuardProps {
  role: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGuard = ({ role, children, fallback = null }: RoleGuardProps) => {
  const hasRole = useHasRole(role);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
