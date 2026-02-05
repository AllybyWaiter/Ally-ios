import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchPlants,
  fetchPlant,
  createPlant,
  updatePlant,
  deletePlant,
} from './plants';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('plants DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('fetchPlants', () => {
    it('should fetch plants for an aquarium', async () => {
      const mockData = [
        { id: 'pl-1', name: 'Java Fern', species: 'Microsorum pteropus' },
        { id: 'pl-2', name: 'Anubias', species: 'Anubias barteri' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchPlants('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('plants');
      expect(mockChain.eq).toHaveBeenCalledWith('aquarium_id', 'aq-1');
      expect(mockChain.order).toHaveBeenCalledWith('date_added', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no plants exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchPlants('aq-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchPlants('aq-1')).rejects.toEqual({ message: 'Fetch failed' });
    });

    it('should call ensureFreshSession before fetch', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchPlants('aq-1');

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('fetchPlant', () => {
    it('should fetch a single plant with ownership verification', async () => {
      const mockPlant = {
        id: 'pl-1',
        name: 'Java Fern',
        species: 'Microsorum pteropus',
        condition: 'healthy',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockPlant, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchPlant('pl-1', 'user-1');

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'pl-1');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockPlant);
    });

    it('should throw error when plant not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchPlant('invalid-id', 'user-1')).rejects.toThrow('Plant not found');
    });
  });

  describe('createPlant', () => {
    it('should create plant with required fields', async () => {
      const mockPlant = {
        id: 'pl-1',
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Java Fern',
        species: 'Microsorum pteropus',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPlant, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createPlant({
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Java Fern',
        species: 'Microsorum pteropus',
      });

      expect(supabase.from).toHaveBeenCalledWith('plants');
      expect(result).toEqual(mockPlant);
    });

    it('should create plant with optional fields', async () => {
      const mockPlant = {
        id: 'pl-1',
        name: 'Anubias',
        placement: 'foreground',
        quantity: 5,
        condition: 'excellent',
        notes: 'Attached to driftwood',
        date_added: '2025-01-01',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPlant, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createPlant({
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Anubias',
        species: 'Anubias barteri',
        placement: 'foreground',
        quantity: 5,
        condition: 'excellent',
        notes: 'Attached to driftwood',
        date_added: '2025-01-01',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        placement: 'foreground',
        quantity: 5,
        condition: 'excellent',
        notes: 'Attached to driftwood',
      }));
    });

    it('should throw error on failure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createPlant({
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        name: 'Plant',
        species: 'Species',
      })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('updatePlant', () => {
    it('should update plant with ownership verification', async () => {
      const mockPlant = { id: 'pl-1', name: 'Updated Name', condition: 'struggling' };

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPlant, error: null }),
        }),
      };
      const mockUpdate = vi.fn().mockReturnValue(mockChain);
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await updatePlant('pl-1', 'user-1', { name: 'Updated Name', condition: 'struggling' });

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Name', condition: 'struggling' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'pl-1');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockPlant);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
        }),
      };
      const mockUpdate = vi.fn().mockReturnValue(mockChain);
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await expect(updatePlant('pl-1', 'user-1', { notes: 'Test' })).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('deletePlant', () => {
    it('should delete plant successfully', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deletePlant('pl-1', 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('plants');
    });

    it('should throw error on failure', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(deletePlant('pl-1', 'user-123')).rejects.toEqual({ message: 'Delete failed' });
    });
  });
});
