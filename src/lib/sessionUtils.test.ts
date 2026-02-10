import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ensureFreshSession, isIOSPWA, getSession, getCurrentUser } from './sessionUtils';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Derived mock return types to avoid `as any` casts
type AuthSessionReturn = Awaited<ReturnType<typeof supabase.auth.getSession>>;
type AuthRefreshReturn = Awaited<ReturnType<typeof supabase.auth.refreshSession>>;

describe('sessionUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureFreshSession', () => {
    it('should not refresh when session exists and is valid', async () => {
      const mockSession = {
        user: { id: 'user-1' },
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as unknown as AuthSessionReturn);

      await ensureFreshSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
    });

    it('should refresh when no session exists (iOS PWA case)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as unknown as AuthSessionReturn);

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      } as unknown as AuthRefreshReturn);

      await ensureFreshSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });

    it('should refresh when session is about to expire (within 60 seconds)', async () => {
      const mockSession = {
        user: { id: 'user-1' },
        expires_at: Math.floor(Date.now() / 1000) + 30, // 30 seconds from now
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as unknown as AuthSessionReturn);

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as unknown as AuthRefreshReturn);

      await ensureFreshSession();

      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });

    it('should not refresh when session has more than 60 seconds remaining', async () => {
      const mockSession = {
        user: { id: 'user-1' },
        expires_at: Math.floor(Date.now() / 1000) + 120, // 2 minutes from now
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as unknown as AuthSessionReturn);

      await ensureFreshSession();

      expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
    });

    it('should attempt refresh when getSession returns error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      } as unknown as AuthSessionReturn);

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as unknown as AuthRefreshReturn);

      await ensureFreshSession();

      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });

    it('should not throw when refresh fails', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as unknown as AuthSessionReturn);

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' },
      } as unknown as AuthRefreshReturn);

      // Should not throw
      await expect(ensureFreshSession()).resolves.toBeUndefined();
    });

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(ensureFreshSession()).resolves.toBeUndefined();
    });

    it('should handle session without expires_at', async () => {
      const mockSession = {
        user: { id: 'user-1' },
        // No expires_at
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as unknown as AuthSessionReturn);

      // Should complete without error
      await expect(ensureFreshSession()).resolves.toBeUndefined();
      expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
    });
  });

  describe('isIOSPWA', () => {
    const originalWindow = global.window;

    afterEach(() => {
      // Restore original window
      global.window = originalWindow;
    });

    it('should return false when window is undefined (SSR)', () => {
      // @ts-expect-error - partial window mock for test
      global.window = undefined;

      expect(isIOSPWA()).toBe(false);
    });

    it('should return true when navigator.standalone is true (iOS Safari PWA)', () => {
      // @ts-expect-error - partial window mock for test
      global.window = {
        navigator: { standalone: true },
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      };

      expect(isIOSPWA()).toBe(true);
    });

    it('should return true when display-mode is standalone', () => {
      // @ts-expect-error - partial window mock for test
      global.window = {
        navigator: { standalone: false },
        matchMedia: vi.fn().mockReturnValue({ matches: true }),
      };

      expect(isIOSPWA()).toBe(true);
    });

    it('should return false when not in PWA mode', () => {
      // @ts-expect-error - partial window mock for test
      global.window = {
        navigator: { standalone: false },
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      };

      expect(isIOSPWA()).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should return session data without refreshing', async () => {
      const mockSession = { user: { id: 'user-1' } };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as unknown as AuthSessionReturn);

      const result = await getSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result.data.session).toEqual(mockSession);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when session exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      } as unknown as AuthSessionReturn);

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as unknown as AuthSessionReturn);

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
