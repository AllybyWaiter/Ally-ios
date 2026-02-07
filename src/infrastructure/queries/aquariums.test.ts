import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAquariumsWithTaskCounts,
  fetchAquarium,
  fetchAquariumWithDetails,
  createAquarium,
  updateAquarium,
  deleteAquarium,
  fetchUpcomingTaskCount,
} from './aquariums';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('aquariums DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('fetchAquariumsWithTaskCounts', () => {
    it('should fetch aquariums with pending task counts', async () => {
      const mockAquariums = [
        { id: 'aq-1', name: 'Tank 1' },
        { id: 'aq-2', name: 'Tank 2' },
      ];
      const mockTaskCounts = [
        { aquarium_id: 'aq-1' },
        { aquarium_id: 'aq-1' },
        { aquarium_id: 'aq-1' },
      ];

      const aquariumChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockAquariums, error: null }),
      };
      const taskChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockTaskCounts, error: null }),
      };
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'maintenance_tasks') return taskChain as any;
        return aquariumChain as any;
      });

      const result = await fetchAquariumsWithTaskCounts('user-1');

      expect(supabase.from).toHaveBeenCalledWith('aquariums');
      expect(supabase.from).toHaveBeenCalledWith('maintenance_tasks');
      expect(result).toEqual([
        { id: 'aq-1', name: 'Tank 1', maintenance_tasks: [{ count: 3 }] },
        { id: 'aq-2', name: 'Tank 2', maintenance_tasks: [{ count: 0 }] },
      ]);
    });

    it('should return empty array when no aquariums exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAquariumsWithTaskCounts('user-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchAquariumsWithTaskCounts('user-1')).rejects.toEqual({ message: 'Fetch failed' });
    });

    it('should call ensureFreshSession before fetch', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchAquariumsWithTaskCounts('user-1');

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('fetchAquarium', () => {
    it('should fetch a single aquarium by ID', async () => {
      const mockAquarium = { id: 'aq-1', name: 'My Tank', type: 'freshwater' };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockAquarium, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAquarium('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('aquariums');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'aq-1');
      expect(result).toEqual(mockAquarium);
    });

    it('should throw error when aquarium not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchAquarium('invalid-id')).rejects.toThrow('Aquarium not found');
    });
  });

  describe('fetchAquariumWithDetails', () => {
    it('should fetch aquarium with related data', async () => {
      const mockData = {
        id: 'aq-1',
        name: 'Reef Tank',
        equipment: [{ id: 'eq-1', name: 'Filter' }],
        livestock: [{ id: 'ls-1', name: 'Clownfish' }],
        plants: [],
        water_tests: [{ id: 'wt-1', test_parameters: [] }],
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAquariumWithDetails('aq-1');

      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('equipment(*)'));
      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('livestock(*)'));
      expect(result).toEqual(mockData);
    });
  });

  describe('createAquarium', () => {
    const testUserId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

    it('should create aquarium with required fields', async () => {
      const mockAquarium = {
        id: 'aq-1',
        name: 'New Tank',
        type: 'freshwater',
        user_id: testUserId,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAquarium, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createAquarium({
        name: 'New Tank',
        type: 'freshwater',
        user_id: testUserId,
      });

      expect(supabase.from).toHaveBeenCalledWith('aquariums');
      expect(result).toEqual(mockAquarium);
    });

    it('should create aquarium with optional fields', async () => {
      const mockAquarium = {
        id: 'aq-1',
        name: 'Big Tank',
        type: 'saltwater',
        volume_gallons: 100,
        status: 'cycling',
        notes: 'New setup',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAquarium, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createAquarium({
        name: 'Big Tank',
        type: 'saltwater',
        user_id: testUserId,
        volume_gallons: 100,
        status: 'cycling',
        notes: 'New setup',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        volume_gallons: 100,
        status: 'cycling',
        notes: 'New setup',
      }));
    });

    it('should throw error on failure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createAquarium({
        name: 'Tank',
        type: 'freshwater',
        user_id: testUserId,
      })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('updateAquarium', () => {
    it('should update aquarium with partial data', async () => {
      const mockAquarium = { id: 'aq-1', name: 'Updated Tank', type: 'freshwater' };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockAquarium, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await updateAquarium('aq-1', { name: 'Updated Tank' });

      expect(supabase.from).toHaveBeenCalledWith('aquariums');
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Tank' });
      expect(result).toEqual(mockAquarium);
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

      await expect(updateAquarium('aq-1', { name: 'Test' })).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('deleteAquarium', () => {
    it('should delete aquarium successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deleteAquarium('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('aquariums');
      expect(mockDelete().eq).toHaveBeenCalledWith('id', 'aq-1');
    });

    it('should throw error on failure', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(deleteAquarium('aq-1')).rejects.toEqual({ message: 'Delete failed' });
    });
  });

  describe('fetchUpcomingTaskCount', () => {
    it('should fetch count with default days ahead', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUpcomingTaskCount(['aq-1', 'aq-2']);

      expect(supabase.from).toHaveBeenCalledWith('maintenance_tasks');
      expect(mockChain.in).toHaveBeenCalledWith('aquarium_id', ['aq-1', 'aq-2']);
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
      expect(result).toBe(5);
    });

    it('should fetch count with custom days ahead', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUpcomingTaskCount(['aq-1'], 14);

      expect(result).toBe(10);
    });

    it('should return 0 when count is null', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUpcomingTaskCount(['aq-1']);

      expect(result).toBe(0);
    });
  });
});
