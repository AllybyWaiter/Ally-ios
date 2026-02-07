import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchActiveAlerts,
  fetchAquariumAlerts,
  dismissAlert,
  dismissAquariumAlerts,
  triggerTrendAnalysis,
  getAlertCountsBySeverity,
} from './waterTestAlerts';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

describe('waterTestAlerts DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchActiveAlerts', () => {
    it('should fetch active alerts for a user', async () => {
      const mockData = [
        { id: 'alert-1', parameter_name: 'pH', severity: 'warning', is_dismissed: false },
        { id: 'alert-2', parameter_name: 'Ammonia', severity: 'critical', is_dismissed: false },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchActiveAlerts('user-1');

      expect(supabase.from).toHaveBeenCalledWith('water_test_alerts');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockChain.eq).toHaveBeenCalledWith('is_dismissed', false);
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no alerts exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchActiveAlerts('user-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchActiveAlerts('user-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchAquariumAlerts', () => {
    it('should fetch alerts for an aquarium', async () => {
      const mockData = [
        { id: 'alert-1', aquarium_id: 'aq-1', parameter_name: 'Nitrate', severity: 'warning' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAquariumAlerts('aq-1');

      expect(mockChain.eq).toHaveBeenCalledWith('aquarium_id', 'aq-1');
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no alerts exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchAquariumAlerts('aq-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchAquariumAlerts('aq-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss an alert', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await dismissAlert('alert-1');

      expect(supabase.from).toHaveBeenCalledWith('water_test_alerts');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        is_dismissed: true,
        dismissed_at: expect.any(String),
      }));
    });

    it('should throw error on failure', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await expect(dismissAlert('alert-1')).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('dismissAquariumAlerts', () => {
    it('should dismiss all alerts for an aquarium', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await dismissAquariumAlerts('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('water_test_alerts');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        is_dismissed: true,
        dismissed_at: expect.any(String),
      }));
    });

    it('should throw error on failure', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      await expect(dismissAquariumAlerts('aq-1')).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('triggerTrendAnalysis', () => {
    it('should invoke the analyze-water-trends function', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

      await triggerTrendAnalysis('aq-1', 'user-1');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-water-trends', {
        body: { aquariumId: 'aq-1', userId: 'user-1' },
      });
    });

    it('should not throw on error (non-critical operation)', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ error: { message: 'Function failed' } });
      vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

      // Should not throw
      await expect(triggerTrendAnalysis('aq-1', 'user-1')).resolves.toBeUndefined();
    });
  });

  describe('getAlertCountsBySeverity', () => {
    it('should return counts by severity', async () => {
      const mockData = [
        { severity: 'critical' },
        { severity: 'critical' },
        { severity: 'warning' },
        { severity: 'info' },
        { severity: 'info' },
        { severity: 'info' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Second eq call resolves the chain
      let eqCallCount = 0;
      mockChain.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount % 2 === 0) {
          return Promise.resolve({ data: mockData, error: null });
        }
        return mockChain;
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getAlertCountsBySeverity('user-1');

      expect(result).toEqual({ critical: 2, warning: 1, info: 3 });
    });

    it('should return zero counts on error', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      let eqCallCount = 0;
      mockChain.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount % 2 === 0) {
          return Promise.resolve({ data: null, error: { message: 'Fetch failed' } });
        }
        return mockChain;
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getAlertCountsBySeverity('user-1');

      expect(result).toEqual({ critical: 0, warning: 0, info: 0 });
    });

    it('should return zero counts when no alerts exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      let eqCallCount = 0;
      mockChain.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount % 2 === 0) {
          return Promise.resolve({ data: [], error: null });
        }
        return mockChain;
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getAlertCountsBySeverity('user-1');

      expect(result).toEqual({ critical: 0, warning: 0, info: 0 });
    });

    it('should ignore unknown severity values', async () => {
      const mockData = [
        { severity: 'critical' },
        { severity: 'unknown' },
        { severity: 'warning' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      let eqCallCount = 0;
      mockChain.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount % 2 === 0) {
          return Promise.resolve({ data: mockData, error: null });
        }
        return mockChain;
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getAlertCountsBySeverity('user-1');

      expect(result).toEqual({ critical: 1, warning: 1, info: 0 });
    });
  });
});
