import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLivestockPhotos,
  uploadLivestockPhoto,
  updateLivestockPhoto,
  setAsPrimaryPhoto,
  deleteLivestockPhoto,
  getLivestockPhotoCount,
} from './livestockPhotos';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('livestockPhotos DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('fetchLivestockPhotos', () => {
    it('should fetch photos for a livestock item', async () => {
      const mockPhotos = [
        { id: 'photo-1', livestock_id: 'ls-1', photo_url: 'https://example.com/photo1.jpg' },
        { id: 'photo-2', livestock_id: 'ls-1', photo_url: 'https://example.com/photo2.jpg' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchLivestockPhotos('ls-1');

      expect(supabase.from).toHaveBeenCalledWith('livestock_photos');
      expect(mockChain.eq).toHaveBeenCalledWith('livestock_id', 'ls-1');
      expect(result).toEqual(mockPhotos);
    });

    it('should call ensureFreshSession before fetch', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchLivestockPhotos('ls-1');

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchLivestockPhotos('ls-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('uploadLivestockPhoto', () => {
    it('should upload photo and create record', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockPhotoRecord = {
        id: 'photo-1',
        livestock_id: 'ls-1',
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

      const result = await uploadLivestockPhoto('ls-1', 'user-1', mockFile, 'Test caption');

      expect(supabase.storage.from).toHaveBeenCalledWith('livestock-photos');
      expect(supabase.from).toHaveBeenCalledWith('livestock_photos');
      expect(result).toEqual(mockPhotoRecord);
    });

    it('should throw error on upload failure', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
      } as any);

      await expect(uploadLivestockPhoto('ls-1', 'user-1', mockFile)).rejects.toEqual({
        message: 'Upload failed',
      });
    });
  });

  describe('updateLivestockPhoto', () => {
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

      const result = await updateLivestockPhoto('photo-1', 'user-1', { caption: 'Updated caption' });

      expect(supabase.from).toHaveBeenCalledWith('livestock_photos');
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

      await expect(updateLivestockPhoto('photo-1', 'user-1', { caption: 'Test' })).rejects.toThrow(
        'Photo not found'
      );
    });
  });

  describe('setAsPrimaryPhoto', () => {
    it('should clear existing primary and set new primary', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await setAsPrimaryPhoto('photo-1', 'ls-1', 'user-1', 'https://example.com/photo.jpg');

      expect(supabase.from).toHaveBeenCalledWith('livestock_photos');
      expect(supabase.from).toHaveBeenCalledWith('livestock');
    });
  });

  describe('deleteLivestockPhoto', () => {
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

      await deleteLivestockPhoto(
        'photo-1',
        'user-1',
        'https://storage.example.com/livestock-photos/user-1/photo.jpg'
      );

      expect(supabase.storage.from).toHaveBeenCalledWith('livestock-photos');
      expect(supabase.from).toHaveBeenCalledWith('livestock_photos');
    });
  });

  describe('getLivestockPhotoCount', () => {
    it('should return photo count for livestock', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getLivestockPhotoCount('ls-1');

      expect(supabase.from).toHaveBeenCalledWith('livestock_photos');
      expect(result).toBe(3);
    });

    it('should return 0 when count is null', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getLivestockPhotoCount('ls-1');

      expect(result).toBe(0);
    });
  });
});
