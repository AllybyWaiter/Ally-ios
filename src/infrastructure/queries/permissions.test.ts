import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchUserRoles, 
  fetchUserPermissions, 
  fetchRolesAndPermissions, 
  hasRole, 
  isSuperAdmin 
} from './permissions';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('permissions DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUserRoles', () => {
    it('should fetch user roles successfully', async () => {
      const mockRoles = [{ role: 'admin' }, { role: 'user' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockRoles, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUserRoles('user-1');

      expect(supabase.from).toHaveBeenCalledWith('user_roles');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(['admin', 'user']);
    });

    it('should return empty array when no roles', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUserRoles('user-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchUserRoles('user-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchUserPermissions', () => {
    it('should fetch permissions via RPC', async () => {
      const mockPermissions = [
        { permission_name: 'read:users' },
        { permission_name: 'write:users' },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockPermissions, error: null } as any);

      const result = await fetchUserPermissions('user-1');

      expect(supabase.rpc).toHaveBeenCalledWith('get_user_permissions', { _user_id: 'user-1' });
      expect(result).toEqual(['read:users', 'write:users']);
    });

    it('should return empty array when no permissions', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

      const result = await fetchUserPermissions('user-1');

      expect(result).toEqual([]);
    });

    it('should throw error on RPC failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'RPC failed' } } as any);

      await expect(fetchUserPermissions('user-1')).rejects.toEqual({ message: 'RPC failed' });
    });
  });

  describe('fetchRolesAndPermissions', () => {
    it('should fetch both roles and permissions in parallel', async () => {
      const mockRoles = [{ role: 'admin' }];
      const mockPermissions = [{ permission_name: 'manage:all' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockRoles, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockPermissions, error: null } as any);

      const result = await fetchRolesAndPermissions('user-1');

      expect(result).toEqual({
        roles: ['admin'],
        permissions: ['manage:all'],
        isAdmin: true,
      });
    });

    it('should set isAdmin true for super_admin role', async () => {
      const mockRoles = [{ role: 'super_admin' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockRoles, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as any);

      const result = await fetchRolesAndPermissions('user-1');

      expect(result.isAdmin).toBe(true);
    });

    it('should set isAdmin false for regular user', async () => {
      const mockRoles = [{ role: 'user' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockRoles, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as any);

      const result = await fetchRolesAndPermissions('user-1');

      expect(result.isAdmin).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const result = await hasRole('user-1', 'admin');

      expect(supabase.rpc).toHaveBeenCalledWith('has_role', { _user_id: 'user-1', _role: 'admin' });
      expect(result).toBe(true);
    });

    it('should return false when user lacks role', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as any);

      const result = await hasRole('user-1', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for super admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const result = await isSuperAdmin('user-1');

      expect(supabase.rpc).toHaveBeenCalledWith('is_super_admin', { _user_id: 'user-1' });
      expect(result).toBe(true);
    });

    it('should return false for non-super admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as any);

      const result = await isSuperAdmin('user-1');

      expect(result).toBe(false);
    });
  });
});
