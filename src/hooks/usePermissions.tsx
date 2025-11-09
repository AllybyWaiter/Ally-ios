import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any).rpc('get_user_permissions', {
          _user_id: user.id
        });

        if (error) throw error;
        setPermissions(data || []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id]);

  return { permissions, loading };
};
