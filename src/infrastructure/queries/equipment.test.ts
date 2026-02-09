import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchEquipment,
  fetchEquipmentCount,
  fetchEquipmentItem,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from './equipment';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('equipment DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('fetchEquipment', () => {
    it('should fetch equipment for an aquarium', async () => {
      const mockData = [
        { id: 'eq-1', name: 'Filter', equipment_type: 'filter' },
        { id: 'eq-2', name: 'Heater', equipment_type: 'heater' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchEquipment('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('equipment');
      expect(mockChain.eq).toHaveBeenCalledWith('aquarium_id', 'aq-1');
      expect(mockChain.order).toHaveBeenCalledWith('install_date', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no equipment exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchEquipment('aq-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchEquipment('aq-1')).rejects.toEqual({ message: 'Fetch failed' });
    });

    it('should call ensureFreshSession before fetch', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchEquipment('aq-1');

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('fetchEquipmentCount', () => {
    it('should fetch equipment count', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchEquipmentCount('aq-1');

      expect(mockChain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toBe(5);
    });

    it('should return 0 when count is null', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchEquipmentCount('aq-1');

      expect(result).toBe(0);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Count failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchEquipmentCount('aq-1')).rejects.toEqual({ message: 'Count failed' });
    });
  });

  describe('fetchEquipmentItem', () => {
    it('should fetch a single equipment item with ownership verification', async () => {
      const mockEquipment = { id: 'eq-1', name: 'Filter', brand: 'Fluval', model: '407', aquariums: { user_id: 'user-1' } };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockEquipment, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchEquipmentItem('eq-1', 'user-1');

      expect(mockChain.select).toHaveBeenCalledWith('*, aquariums!inner(user_id)');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'eq-1');
      expect(mockChain.eq).toHaveBeenCalledWith('aquariums.user_id', 'user-1');
      expect(result).toEqual({ id: 'eq-1', name: 'Filter', brand: 'Fluval', model: '407' });
    });

    it('should throw error when equipment not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchEquipmentItem('invalid-id', 'user-1')).rejects.toThrow('Equipment not found');
    });
  });

  describe('createEquipment', () => {
    const testAquariumId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    it('should create equipment with required fields', async () => {
      const mockEquipment = {
        id: 'eq-1',
        aquarium_id: testAquariumId,
        name: 'New Filter',
        equipment_type: 'Filter',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockEquipment, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createEquipment({
        aquarium_id: testAquariumId,
        name: 'New Filter',
        equipment_type: 'Filter',
      });

      expect(supabase.from).toHaveBeenCalledWith('equipment');
      expect(result).toEqual(mockEquipment);
    });

    it('should create equipment with optional fields', async () => {
      const mockEquipment = {
        id: 'eq-1',
        name: 'Fluval 407',
        brand: 'Fluval',
        model: '407',
        install_date: '2025-01-01',
        maintenance_interval_days: 30,
        notes: 'Canister filter',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockEquipment, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createEquipment({
        aquarium_id: testAquariumId,
        name: 'Fluval 407',
        equipment_type: 'Filter',
        brand: 'Fluval',
        model: '407',
        install_date: '2025-01-01',
        maintenance_interval_days: 30,
        notes: 'Canister filter',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        brand: 'Fluval',
        model: '407',
        maintenance_interval_days: 30,
      }));
    });

    it('should throw error on failure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createEquipment({
        aquarium_id: testAquariumId,
        name: 'Filter',
        equipment_type: 'Filter',
      })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment with ownership verification', async () => {
      const mockEquipment = { id: 'eq-1', name: 'Updated Filter', notes: 'New notes' };

      // Mock for ownership verification
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'eq-1', aquariums: { user_id: 'user-1' } }, error: null }),
      };

      // Mock for update
      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockEquipment, error: null }),
          }),
        }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectChain as any;
        return { update: vi.fn().mockReturnValue(mockUpdateChain) } as any;
      });

      const result = await updateEquipment('eq-1', 'user-1', { name: 'Updated Filter', notes: 'New notes' });

      expect(result).toEqual(mockEquipment);
    });

    it('should throw error when equipment not found during ownership check', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(updateEquipment('eq-1', 'user-1', { notes: 'Test' })).rejects.toThrow('Equipment not found');
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment with ownership verification', async () => {
      // Mock for ownership verification
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'eq-1', aquariums: { user_id: 'user-1' } }, error: null }),
      };

      // Mock for delete
      const mockDeleteChain = {
        match: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectChain as any;
        return { delete: vi.fn().mockReturnValue(mockDeleteChain) } as any;
      });

      await deleteEquipment('eq-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('equipment');
    });

    it('should throw error when equipment not found during ownership check', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(deleteEquipment('eq-1', 'user-1')).rejects.toThrow('Equipment not found');
    });
  });
});
