import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import { fetchRolesAndPermissions as fetchRolesAndPermissionsFromDAL } from '@/infrastructure/queries/permissions';
import { logger } from '@/lib/logger';

interface PermissionsContextType {
  isAdmin: boolean;
  roles: string[];
  permissions: string[];
  permissionsLoading: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user, isInitialAuthComplete } = useAuthContext();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const fetchRolesAndPermissions = useCallback(async (userId: string) => {
    try {
      const { roles: userRoles, permissions: userPermissions, isAdmin: userIsAdmin } = 
        await fetchRolesAndPermissionsFromDAL(userId);

      setRoles(userRoles);
      setPermissions(userPermissions);
      setIsAdmin(userIsAdmin);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Permissions: Fetch error:', message);
      setRoles([]);
      setPermissions([]);
      setIsAdmin(false);
    }
  }, []);

  const clearPermissions = useCallback(() => {
    setIsAdmin(false);
    setRoles([]);
    setPermissions([]);
  }, []);

  useEffect(() => {
    if (!isInitialAuthComplete) return;

    if (!user) {
      clearPermissions();
      setPermissionsLoading(false);
      return;
    }

    setPermissionsLoading(true);
    fetchRolesAndPermissions(user.id).finally(() => {
      setPermissionsLoading(false);
    });
  }, [user?.id, isInitialAuthComplete, fetchRolesAndPermissions, clearPermissions]);

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);
  const hasPermission = useCallback((permission: string) => permissions.includes(permission), [permissions]);
  const hasAnyRole = useCallback((checkRoles: string[]) => checkRoles.some(role => roles.includes(role)), [roles]);

  return (
    <PermissionsContext.Provider value={{
      isAdmin,
      roles,
      permissions,
      permissionsLoading,
      hasRole,
      hasPermission,
      hasAnyRole
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    return {
      isAdmin: false,
      roles: [] as string[],
      permissions: [] as string[],
      permissionsLoading: true,
      hasRole: () => false,
      hasPermission: () => false,
      hasAnyRole: () => false,
    };
  }
  return context;
};
