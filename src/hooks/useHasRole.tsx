import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useHasRole = (role: string): boolean => {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user?.id) {
        setHasRole(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', role)
          .maybeSingle();

        if (error) throw error;
        setHasRole(!!data);
      } catch (error) {
        console.error('Error checking role:', error);
        setHasRole(false);
      }
    };

    checkRole();
  }, [user?.id, role]);

  return hasRole;
};
