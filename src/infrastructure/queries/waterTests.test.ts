import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchWaterTests,
  fetchLatestWaterTest,
  fetchWaterTestsForChart,
  fetchWaterTest,
  createWaterTest,
  deleteWaterTest,
  fetchMonthlyTestCount,
  uploadWaterTestPhoto,
} from './waterTests';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('waterTests DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('fetchWaterTests', () => {
    it('should fetch water tests without limit', async () => {
      const mockData = [
        { id: 'wt-1', test_date: '2025-01-01', test_parameters: [] },
        { id: 'wt-2', test_date: '2025-01-02', test_parameters: [] },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        limit: vi.fn().mockReturnThis(),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchWaterTests('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('water_tests');
      expect(mockChain.eq).toHaveBeenCalledWith('aquarium_id', 'aq-1');
      expect(result).toEqual(mockData);
    });

    it('should fetch water tests with limit', async () => {
      const mockData = [{ id: 'wt-1', test_parameters: [] }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchWaterTests('aq-1', 5);

      expect(mockChain.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockData);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchWaterTests('aq-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchLatestWaterTest', () => {
    it('should fetch the latest water test', async () => {
      const mockTest = { id: 'wt-1', test_date: '2025-01-15', test_parameters: [] };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockTest, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchLatestWaterTest('aq-1');

      expect(mockChain.order).toHaveBeenCalledWith('test_date', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTest);
    });

    it('should return null when no tests exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchLatestWaterTest('aq-1');

      expect(result).toBeNull();
    });
  });

  describe('fetchWaterTestsForChart', () => {
    it('should fetch tests for 7 day range', async () => {
      const mockData = [{ id: 'wt-1', test_date: '2025-01-10', test_parameters: [] }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchWaterTestsForChart('aq-1', '7d');

      expect(mockChain.gte).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should fetch all tests when range is "all"', async () => {
      const mockData = [{ id: 'wt-1' }, { id: 'wt-2' }];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchWaterTestsForChart('aq-1', 'all');

      expect(result).toEqual(mockData);
    });

    it('should handle 30d, 90d, and 1y ranges', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchWaterTestsForChart('aq-1', '30d');
      await fetchWaterTestsForChart('aq-1', '90d');
      await fetchWaterTestsForChart('aq-1', '1y');

      expect(mockChain.gte).toHaveBeenCalledTimes(3);
    });
  });

  describe('fetchWaterTest', () => {
    it('should fetch a single water test', async () => {
      const mockTest = { id: 'wt-1', test_date: '2025-01-15', test_parameters: [] };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTest, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchWaterTest('wt-1');

      expect(supabase.from).toHaveBeenCalledWith('water_tests');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'wt-1');
      expect(result).toEqual(mockTest);
    });
  });

  describe('createWaterTest', () => {
    it('should create water test with parameters', async () => {
      const mockTest = { id: 'wt-1', aquarium_id: 'aq-1', user_id: 'user-1' };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTest, error: null }),
        }),
      });
      const mockParamInsert = vi.fn().mockResolvedValue({ error: null });
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'water_tests') {
          return { insert: mockInsert } as any;
        }
        return { insert: mockParamInsert } as any;
      });

      const result = await createWaterTest(
        { aquarium_id: 'aq-1', user_id: 'user-1' },
        [{ parameter_name: 'pH', value: 7.2, unit: 'pH' }]
      );

      expect(supabase.from).toHaveBeenCalledWith('water_tests');
      expect(supabase.from).toHaveBeenCalledWith('test_parameters');
      expect(result).toEqual(mockTest);
    });

    it('should create water test without parameters', async () => {
      const mockTest = { id: 'wt-1', aquarium_id: 'aq-1', user_id: 'user-1' };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTest, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createWaterTest(
        { aquarium_id: 'aq-1', user_id: 'user-1' },
        []
      );

      expect(result).toEqual(mockTest);
    });

    it('should throw error when test creation fails', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createWaterTest(
        { aquarium_id: 'aq-1', user_id: 'user-1' },
        []
      )).rejects.toEqual({ message: 'Insert failed' });
    });

    it('should throw error when parameter creation fails', async () => {
      const mockTest = { id: 'wt-1' };
      const mockTestInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTest, error: null }),
        }),
      });
      const mockParamInsert = vi.fn().mockResolvedValue({ error: { message: 'Param insert failed' } });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'water_tests') {
          return { insert: mockTestInsert } as any;
        }
        return { insert: mockParamInsert } as any;
      });

      await expect(createWaterTest(
        { aquarium_id: 'aq-1', user_id: 'user-1' },
        [{ parameter_name: 'pH', value: 7.2, unit: 'pH' }]
      )).rejects.toEqual({ message: 'Param insert failed' });
    });
  });

  describe('deleteWaterTest', () => {
    it('should delete water test successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await deleteWaterTest('wt-1');

      expect(supabase.from).toHaveBeenCalledWith('water_tests');
    });

    it('should throw error on failure', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(deleteWaterTest('wt-1')).rejects.toEqual({ message: 'Delete failed' });
    });
  });

  describe('fetchMonthlyTestCount', () => {
    it('should fetch monthly count', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 8, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchMonthlyTestCount('user-1');

      expect(supabase.from).toHaveBeenCalledWith('water_tests');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toBe(8);
    });

    it('should return 0 when count is null', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchMonthlyTestCount('user-1');

      expect(result).toBe(0);
    });
  });

  describe('uploadWaterTestPhoto', () => {
    it('should upload photo and return public URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockPublicUrl = 'https://storage.example.com/water-test-photos/user-1/12345.jpg';

      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as any);

      const result = await uploadWaterTestPhoto('user-1', mockFile);

      expect(supabase.storage.from).toHaveBeenCalledWith('water-test-photos');
      expect(result).toBe(mockPublicUrl);
    });

    it('should throw error on upload failure', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const mockUpload = vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } });
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as any);

      await expect(uploadWaterTestPhoto('user-1', mockFile)).rejects.toEqual({ message: 'Upload failed' });
    });
  });
});
