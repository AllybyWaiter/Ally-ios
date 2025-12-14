import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFeedback, fetchAllFeedback, fetchFeedbackByFeature, fetchUserFeedback } from './feedback';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('feedback DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFeedback', () => {
    it('should create feedback successfully', async () => {
      const mockFeedback = {
        id: 'feedback-1',
        user_id: 'user-1',
        feature: 'chat',
        rating: 'positive',
        created_at: new Date().toISOString(),
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockFeedback, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createFeedback({
        user_id: 'user-1',
        feature: 'chat',
        rating: 'positive',
      });

      expect(supabase.from).toHaveBeenCalledWith('ai_feedback');
      expect(result).toEqual(mockFeedback);
    });

    it('should throw error on failure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createFeedback({
        user_id: 'user-1',
        feature: 'chat',
        rating: 'positive',
      })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('fetchAllFeedback', () => {
    it('should fetch feedback with default limit', async () => {
      const mockData = [{ id: 'feedback-1' }, { id: 'feedback-2' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAllFeedback();

      expect(supabase.from).toHaveBeenCalledWith('ai_feedback');
      expect(mockChain.limit).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockData);
    });

    it('should fetch feedback with custom limit', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchAllFeedback(50);

      expect(mockChain.limit).toHaveBeenCalledWith(50);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchAllFeedback()).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchFeedbackByFeature', () => {
    it('should fetch feedback filtered by feature', async () => {
      const mockData = [{ id: 'feedback-1', feature: 'photo_analysis' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchFeedbackByFeature('photo_analysis');

      expect(mockChain.eq).toHaveBeenCalledWith('feature', 'photo_analysis');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchUserFeedback', () => {
    it('should fetch feedback for specific user', async () => {
      const mockData = [{ id: 'feedback-1', user_id: 'user-1' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUserFeedback('user-1');

      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockData);
    });
  });
});
