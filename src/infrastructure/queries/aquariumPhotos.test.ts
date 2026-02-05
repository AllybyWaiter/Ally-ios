import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAquariumPhotos,
  fetchAllAquariumPhotos,
  uploadAquariumPhoto,
  updateAquariumPhoto,
  setAsPrimaryAquariumPhoto,
  deleteAquariumPhoto,
  getAquariumPhotoCount,
} from './aquariumPhotos';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('aquariumPhotos DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('fetchAquariumPhotos', () => {
    it('should fetch photos with pagination', async () => {
      const mockPhotos = [
        { id: 'photo-1', aquarium_id: 'aq-1', photo_url: 'https://example.com/photo1.jpg' },
        { id: 'photo-2', aquarium_id: 'aq-1', photo_url: 'https://example.com/photo2.jpg' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockPhotos, error: null, count: 2 }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAquariumPhotos('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('aquarium_photos');
      expect(mockChain.eq).toHaveBeenCalledWith('aquarium_id', 'aq-1');
      expect(result.data).toEqual(mockPhotos);
      expect(result.total).toBe(2);
    });

    it('should call ensureFreshSession before fetch', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchAquariumPhotos('aq-1');

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' }, count: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchAquariumPhotos('aq-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchAllAquariumPhotos', () => {
    it('should fetch all photos with max limit', async () => {
      const mockPhotos = [
        { id: 'photo-1', aquarium_id: 'aq-1', photo_url: 'https://example.com/photo1.jpg' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAllAquariumPhotos('aq-1');

      expect(result).toEqual(mockPhotos);
      expect(mockChain.limit).toHaveBeenCalledWith(500);
    });
  });

  describe('uploadAquariumPhoto', () => {
    it('should upload photo and create record', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockPhotoRecord = {
        id: 'photo-1',
        aquarium_id: 'aq-1',
        user_id: 'user-1',
        photo_url: 'https://storage.example.com/photo.jpg',
      };

      // Mock storage upload
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/photo.jpg' },
        }),
      } as any);

      // Mock database insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockPhotoRecord, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await uploadAquariumPhoto('aq-1', 'user-1', mockFile, 'Test caption');

      expect(supabase.storage.from).toHaveBeenCalledWith('aquarium-photos');
      expect(supabase.from).toHaveBeenCalledWith('aquarium_photos');
      expect(result).toEqual(mockPhotoRecord);
    });

    it('should throw error on upload failure', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
      } as any);

      await expect(uploadAquariumPhoto('aq-1', 'user-1', mockFile)).rejects.toEqual({
        message: 'Upload failed',
      });
    });
  });

  describe('updateAquariumPhoto', () => {
    it('should update photo with ownership verification', async () => {
      const mockPhoto = { id: 'photo-1', caption: 'Updated caption' };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockPhoto, error: null }),
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await updateAquariumPhoto('photo-1', 'user-1', { caption: 'Updated caption' });

      expect(supabase.from).toHaveBeenCalledWith('aquarium_photos');
      expect(result).toEqual(mockPhoto);
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

      await expect(updateAquariumPhoto('photo-1', 'user-1', { caption: 'Test' })).rejects.toThrow(
        'Photo not found'
      );
    });
  });

  describe('setAsPrimaryAquariumPhoto', () => {
    it('should clear existing primary and set new primary', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await setAsPrimaryAquariumPhoto('photo-1', 'aq-1', 'user-1', 'https://example.com/photo.jpg');

      // Should update aquarium_photos twice (clear + set) and aquariums once
      expect(supabase.from).toHaveBeenCalledWith('aquarium_photos');
      expect(supabase.from).toHaveBeenCalledWith('aquariums');
    });
  });

  describe('deleteAquariumPhoto', () => {
    it('should delete from storage and database', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deleteAquariumPhoto(
        'photo-1',
        'user-1',
        'https://storage.example.com/aquarium-photos/user-1/photo.jpg'
      );

      expect(supabase.storage.from).toHaveBeenCalledWith('aquarium-photos');
      expect(supabase.from).toHaveBeenCalledWith('aquarium_photos');
    });
  });

  describe('getAquariumPhotoCount', () => {
    it('should return photo count for aquarium', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getAquariumPhotoCount('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('aquarium_photos');
      expect(result).toBe(5);
    });

    it('should return 0 when count is null', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getAquariumPhotoCount('aq-1');

      expect(result).toBe(0);
    });
  });
});
