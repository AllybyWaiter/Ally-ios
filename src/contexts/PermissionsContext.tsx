import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './AuthContext';

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
    console.log('🔵 Permissions: Fetching for:', userId);
    try {
      const [rolesResult, permsResult] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        (supabase as any).rpc('get_user_permissions', { _user_id: userId })
      ]);

      const userRoles = rolesResult?.data?.map((r: any) => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin') || userRoles.includes('super_admin'));

      const permissionNames = permsResult?.data?.map((p: any) => p.permission_name || p) || [];
      setPermissions(permissionNames);

      console.log('🟢 Permissions: Loaded - roles:', userRoles.length);
    } catch (error: any) {
      console.error('🔴 Permissions: Fetch error:', error.message);
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
