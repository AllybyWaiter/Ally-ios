import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLivestock,
  fetchLivestockItem,
  createLivestock,
  updateLivestock,
  deleteLivestock,
} from './livestock';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('livestock DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('fetchLivestock', () => {
    it('should fetch livestock for an aquarium', async () => {
      const mockData = [
        { id: 'ls-1', name: 'Nemo', species: 'Clownfish', quantity: 2 },
        { id: 'ls-2', name: 'Dory', species: 'Blue Tang', quantity: 1 },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchLivestock('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('livestock');
      expect(mockChain.eq).toHaveBeenCalledWith('aquarium_id', 'aq-1');
      expect(mockChain.order).toHaveBeenCalledWith('date_added', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no livestock exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchLivestock('aq-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchLivestock('aq-1')).rejects.toEqual({ message: 'Fetch failed' });
    });

    it('should call ensureFreshSession before fetch', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchLivestock('aq-1');

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('fetchLivestockItem', () => {
    it('should fetch a single livestock item', async () => {
      const mockLivestock = {
        id: 'ls-1',
        name: 'Nemo',
        species: 'Clownfish',
        health_status: 'healthy',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLivestock, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchLivestockItem('ls-1');

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'ls-1');
      expect(result).toEqual(mockLivestock);
    });

    it('should throw error when livestock not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchLivestockItem('invalid-id')).rejects.toEqual({ code: 'PGRST116' });
    });
  });

  describe('createLivestock', () => {
    it('should create livestock with required fields', async () => {
      const mockLivestock = {
        id: 'ls-1',
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Nemo',
        species: 'Clownfish',
        category: 'fish',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLivestock, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createLivestock({
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Nemo',
        species: 'Clownfish',
        category: 'fish',
      });

      expect(supabase.from).toHaveBeenCalledWith('livestock');
      expect(result).toEqual(mockLivestock);
    });

    it('should create livestock with optional fields', async () => {
      const mockLivestock = {
        id: 'ls-1',
        name: 'Cleaner Shrimp',
        quantity: 3,
        health_status: 'healthy',
        notes: 'Active cleaners',
        date_added: '2025-01-01',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLivestock, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createLivestock({
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Cleaner Shrimp',
        species: 'Lysmata amboinensis',
        category: 'invertebrate',
        quantity: 3,
        health_status: 'healthy',
        notes: 'Active cleaners',
        date_added: '2025-01-01',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        quantity: 3,
        health_status: 'healthy',
        notes: 'Active cleaners',
      }));
    });

    it('should throw error on failure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createLivestock({
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Fish',
        species: 'Species',
        category: 'fish',
      })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('updateLivestock', () => {
    it('should update livestock with partial data', async () => {
      const mockLivestock = { id: 'ls-1', name: 'Updated Name', health_status: 'stressed' };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockLivestock, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await updateLivestock('ls-1', { name: 'Updated Name', health_status: 'stressed' });

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Name', health_status: 'stressed' });
      expect(result).toEqual(mockLivestock);
    });

    it('should throw error on failure', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await expect(updateLivestock('ls-1', { notes: 'Test' })).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('deleteLivestock', () => {
    it('should delete livestock successfully', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deleteLivestock('ls-1', 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('livestock');
    });

    it('should throw error on failure', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(deleteLivestock('ls-1', 'user-123')).rejects.toEqual({ message: 'Delete failed' });
    });
  });
});
