import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchPlantPhotos,
  uploadPlantPhoto,
  setAsPrimaryPlantPhoto,
  deletePlantPhoto,
} from './plantPhotos';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('plantPhotos DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1' },
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    } as any);
  });

  describe('fetchPlantPhotos', () => {
    it('should fetch photos for a plant', async () => {
      const mockPhotos = [
        { id: 'photo-1', plant_id: 'plant-1', photo_url: 'https://example.com/photo1.jpg' },
        { id: 'photo-2', plant_id: 'plant-1', photo_url: 'https://example.com/photo2.jpg' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchPlantPhotos('plant-1');

      expect(supabase.from).toHaveBeenCalledWith('plant_photos');
      expect(mockChain.eq).toHaveBeenCalledWith('plant_id', 'plant-1');
      expect(result).toEqual(mockPhotos);
    });

    it('should call ensureFreshSession before fetch', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchPlantPhotos('plant-1');

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should return empty array when no photos exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchPlantPhotos('plant-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchPlantPhotos('plant-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('uploadPlantPhoto', () => {
    it('should upload photo and create record', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockPhotoRecord = {
        id: 'photo-1',
        plant_id: 'plant-1',
        user_id: 'user-1',
        photo_url: 'https://storage.example.com/photo.jpg',
      };

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/photo.jpg' },
        }),
      } as any);

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockPhotoRecord, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await uploadPlantPhoto('plant-1', 'user-1', mockFile, 'Test caption');

      expect(supabase.storage.from).toHaveBeenCalledWith('plant-photos');
      expect(supabase.from).toHaveBeenCalledWith('plant_photos');
      expect(result).toEqual(mockPhotoRecord);
    });

    it('should throw error on upload failure', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
      } as any);

      await expect(uploadPlantPhoto('plant-1', 'user-1', mockFile)).rejects.toEqual({
        message: 'Upload failed',
      });
    });

    it('should throw error when record creation fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/photo.jpg' },
        }),
      } as any);

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(uploadPlantPhoto('plant-1', 'user-1', mockFile)).rejects.toThrow(
        'Failed to create photo record'
      );
    });
  });

  describe('setAsPrimaryPlantPhoto', () => {
    it('should clear existing primary and set new primary', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { photo_url: 'https://example.com/photo.jpg' },
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await setAsPrimaryPlantPhoto('photo-1', 'plant-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('plant_photos');
      expect(supabase.from).toHaveBeenCalledWith('plants');
    });

    it('should throw error when photo not found', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await expect(setAsPrimaryPlantPhoto('photo-1', 'plant-1', 'user-1')).rejects.toThrow(
        'Photo not found'
      );
    });
  });

  describe('deletePlantPhoto', () => {
    it('should delete from storage and database', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { photo_url: 'https://storage.example.com/plant-photos/user-1/photo.jpg', is_primary: false },
              error: null,
            }),
          }),
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'plant_photos') {
          return { select: mockSelect, delete: mockDelete } as any;
        }
        return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }) } as any;
      });

      await deletePlantPhoto('photo-1', 'plant-1', 'user-1');

      expect(supabase.storage.from).toHaveBeenCalledWith('plant-photos');
    });

    it('should clear primary_photo_url when deleting primary photo', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const mockSelectResult = {
        data: { photo_url: 'https://storage.example.com/plant-photos/user-1/photo.jpg', is_primary: true },
        error: null,
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue(mockSelectResult),
          }),
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockPlantUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'plant_photos') {
          return { select: mockSelect, delete: mockDelete } as any;
        }
        if (table === 'plants') {
          return { update: mockPlantUpdate } as any;
        }
        return {} as any;
      });

      await deletePlantPhoto('photo-1', 'plant-1', 'user-1');

      // Verify plants update was called to clear primary_photo_url
      expect(supabase.from).toHaveBeenCalledWith('plants');
    });

    it('should throw error when photo not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await expect(deletePlantPhoto('photo-1', 'plant-1', 'user-1')).rejects.toThrow(
        'Photo not found'
      );
    });
  });
});
