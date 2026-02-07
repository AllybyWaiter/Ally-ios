import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchFeatureFlags,
  fetchFeatureFlagByKey,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  fetchFlagOverrides,
  fetchUserOverrides,
  upsertFlagOverride,
  deleteFlagOverride,
} from './featureFlags';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('featureFlags DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchFeatureFlags', () => {
    it('should fetch all feature flags', async () => {
      const mockData = [
        { id: 'ff-1', key: 'feature_a', name: 'Feature A', enabled: true },
        { id: 'ff-2', key: 'feature_b', name: 'Feature B', enabled: false },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchFeatureFlags();

      expect(supabase.from).toHaveBeenCalledWith('feature_flags');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no flags exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchFeatureFlags();

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchFeatureFlags()).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchFeatureFlagByKey', () => {
    it('should fetch a feature flag by key', async () => {
      const mockFlag = { id: 'ff-1', key: 'feature_a', name: 'Feature A', enabled: true };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFlag, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchFeatureFlagByKey('feature_a');

      expect(mockChain.eq).toHaveBeenCalledWith('key', 'feature_a');
      expect(result).toEqual(mockFlag);
    });

    it('should return null when flag not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchFeatureFlagByKey('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on other failures', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'Error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchFeatureFlagByKey('feature_a')).rejects.toEqual({ code: 'OTHER', message: 'Error' });
    });
  });

  describe('createFeatureFlag', () => {
    it('should create feature flag with required fields', async () => {
      const mockFlag = {
        id: 'ff-1',
        key: 'new_feature',
        name: 'New Feature',
        enabled: false,
        rollout_percentage: 0,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockFlag, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createFeatureFlag({
        key: 'new_feature',
        name: 'New Feature',
      });

      expect(supabase.from).toHaveBeenCalledWith('feature_flags');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        key: 'new_feature',
        name: 'New Feature',
        enabled: false,
        rollout_percentage: 0,
      }));
      expect(result).toEqual(mockFlag);
    });

    it('should create feature flag with optional fields', async () => {
      const mockFlag = {
        id: 'ff-1',
        key: 'premium_feature',
        name: 'Premium Feature',
        enabled: true,
        rollout_percentage: 50,
        target_tiers: ['gold', 'enterprise'],
        target_roles: ['admin'],
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockFlag, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createFeatureFlag({
        key: 'premium_feature',
        name: 'Premium Feature',
        description: 'A premium feature',
        enabled: true,
        rollout_percentage: 50,
        target_tiers: ['gold', 'enterprise'],
        target_roles: ['admin'],
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        enabled: true,
        rollout_percentage: 50,
        target_tiers: ['gold', 'enterprise'],
        target_roles: ['admin'],
      }));
    });

    it('should throw error on failure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createFeatureFlag({
        key: 'feature',
        name: 'Feature',
      })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('updateFeatureFlag', () => {
    it('should update feature flag with partial data', async () => {
      const mockFlag = { id: 'ff-1', name: 'Updated Name', enabled: true };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockFlag, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await updateFeatureFlag('ff-1', { name: 'Updated Name', enabled: true });

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Name', enabled: true });
      expect(result).toEqual(mockFlag);
    });

    it('should throw error on failure', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await expect(updateFeatureFlag('ff-1', { enabled: false })).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('deleteFeatureFlag', () => {
    it('should delete feature flag successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deleteFeatureFlag('ff-1');

      expect(supabase.from).toHaveBeenCalledWith('feature_flags');
    });

    it('should throw error on failure', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(deleteFeatureFlag('ff-1')).rejects.toEqual({ message: 'Delete failed' });
    });
  });

  describe('fetchFlagOverrides', () => {
    it('should fetch overrides for a flag', async () => {
      const mockData = [
        { id: 'fo-1', flag_id: 'ff-1', user_id: 'user-1', enabled: true },
        { id: 'fo-2', flag_id: 'ff-1', user_id: 'user-2', enabled: false },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchFlagOverrides('ff-1');

      expect(supabase.from).toHaveBeenCalledWith('feature_flag_overrides');
      expect(mockChain.eq).toHaveBeenCalledWith('flag_id', 'ff-1');
      expect(result).toEqual(mockData);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchFlagOverrides('ff-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchUserOverrides', () => {
    it('should fetch overrides for a user', async () => {
      const mockData = [
        { id: 'fo-1', flag_id: 'ff-1', user_id: 'user-1', enabled: true },
        { id: 'fo-2', flag_id: 'ff-2', user_id: 'user-1', enabled: false },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUserOverrides('user-1');

      expect(supabase.from).toHaveBeenCalledWith('feature_flag_overrides');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockData);
    });
  });

  describe('upsertFlagOverride', () => {
    it('should create or update a flag override', async () => {
      const mockOverride = { id: 'fo-1', flag_id: 'ff-1', user_id: 'user-1', enabled: true };

      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockOverride, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any);

      const result = await upsertFlagOverride('ff-1', 'user-1', true);

      expect(mockUpsert).toHaveBeenCalledWith(
        { flag_id: 'ff-1', user_id: 'user-1', enabled: true },
        { onConflict: 'flag_id,user_id' }
      );
      expect(result).toEqual(mockOverride);
    });

    it('should throw error on failure', async () => {
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Upsert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any);

      await expect(upsertFlagOverride('ff-1', 'user-1', true)).rejects.toEqual({ message: 'Upsert failed' });
    });
  });

  describe('deleteFlagOverride', () => {
    it('should delete a flag override', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deleteFlagOverride('ff-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('feature_flag_overrides');
    });

    it('should throw error on failure', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(deleteFlagOverride('ff-1', 'user-1')).rejects.toEqual({ message: 'Delete failed' });
    });
  });
});
