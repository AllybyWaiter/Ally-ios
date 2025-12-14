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
    it('should fetch a single equipment item', async () => {
      const mockEquipment = { id: 'eq-1', name: 'Filter', brand: 'Fluval', model: '407' };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEquipment, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchEquipmentItem('eq-1');

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'eq-1');
      expect(result).toEqual(mockEquipment);
    });

    it('should throw error when equipment not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchEquipmentItem('invalid-id')).rejects.toEqual({ code: 'PGRST116' });
    });
  });

  describe('createEquipment', () => {
    it('should create equipment with required fields', async () => {
      const mockEquipment = {
        id: 'eq-1',
        aquarium_id: 'aq-1',
        name: 'New Filter',
        equipment_type: 'filter',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockEquipment, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createEquipment({
        aquarium_id: 'aq-1',
        name: 'New Filter',
        equipment_type: 'filter',
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
        aquarium_id: 'aq-1',
        name: 'Fluval 407',
        equipment_type: 'filter',
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
        aquarium_id: 'aq-1',
        name: 'Filter',
        equipment_type: 'filter',
      })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment with partial data', async () => {
      const mockEquipment = { id: 'eq-1', name: 'Updated Filter', notes: 'New notes' };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockEquipment, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await updateEquipment('eq-1', { name: 'Updated Filter', notes: 'New notes' });

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Filter', notes: 'New notes' });
      expect(result).toEqual(mockEquipment);
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

      await expect(updateEquipment('eq-1', { notes: 'Test' })).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deleteEquipment('eq-1');

      expect(supabase.from).toHaveBeenCalledWith('equipment');
    });

    it('should throw error on failure', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(deleteEquipment('eq-1')).rejects.toEqual({ message: 'Delete failed' });
    });
  });
});
