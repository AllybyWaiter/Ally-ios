import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingResponse } from './useStreamingResponse';
import { supabase } from '@/integrations/supabase/client';
import { mockToast } from '@/test/setup';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useStreamingResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with isStreaming as false', () => {
    const { result } = renderHook(() => useStreamingResponse());
    
    expect(result.current.isStreaming).toBe(false);
    expect(typeof result.current.streamResponse).toBe('function');
  });

  it('should redirect to auth when no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useStreamingResponse());
    
    const callbacks = {
      onStreamStart: vi.fn(),
      onToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onError: vi.fn(),
    };

    await expect(
      result.current.streamResponse(
        [{ role: 'user', content: 'Hello' }],
        null,
        callbacks
      )
    ).rejects.toThrow('Authentication required');

    expect(mockNavigate).toHaveBeenCalledWith('/auth');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Authentication required',
        variant: 'destructive',
      })
    );
  });

  it('should throw error when fetch fails', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'user-1', email: 'test@test.com' } as any,
        },
      },
      error: null,
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      body: null,
    });

    const { result } = renderHook(() => useStreamingResponse());
    
    const callbacks = {
      onStreamStart: vi.fn(),
      onToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onError: vi.fn(),
    };

    await expect(
      result.current.streamResponse(
        [{ role: 'user', content: 'Hello' }],
        null,
        callbacks
      )
    ).rejects.toThrow('Failed to get response');
  });

  it('should process SSE stream correctly', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'user-1', email: 'test@test.com' } as any,
        },
      },
      error: null,
    });

    // Mock ReadableStream
    const encoder = new TextEncoder();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    let chunkIndex = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (chunkIndex < chunks.length) {
          const chunk = chunks[chunkIndex];
          chunkIndex++;
          return { done: false, value: encoder.encode(chunk) };
        }
        return { done: true, value: undefined };
      }),
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    const { result } = renderHook(() => useStreamingResponse());
    
    const callbacks = {
      onStreamStart: vi.fn(),
      onToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onError: vi.fn(),
    };

    let streamResult: string;
    
    await act(async () => {
      streamResult = await result.current.streamResponse(
        [{ role: 'user', content: 'Hello' }],
        null,
        callbacks
      );
    });

    expect(callbacks.onStreamStart).toHaveBeenCalledTimes(1);
    expect(callbacks.onStreamEnd).toHaveBeenCalledWith('Hello World');
    expect(streamResult!).toBe('Hello World');
  });

  it('should include aquarium ID in request when provided', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'user-1', email: 'test@test.com' } as any,
        },
      },
      error: null,
    });

    const encoder = new TextEncoder();
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode('data: [DONE]\n\n') })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    const { result } = renderHook(() => useStreamingResponse());
    
    const callbacks = {
      onStreamStart: vi.fn(),
      onToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onError: vi.fn(),
    };

    await act(async () => {
      await result.current.streamResponse(
        [{ role: 'user', content: 'Hello' }],
        'aquarium-123',
        callbacks
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/ally-chat'),
      expect.objectContaining({
        body: expect.stringContaining('"aquariumId":"aquarium-123"'),
      })
    );
  });

  it('should handle malformed JSON gracefully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'user-1', email: 'test@test.com' } as any,
        },
      },
      error: null,
    });

    const encoder = new TextEncoder();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Valid"}}]}\n\n',
      'data: {malformed json}\n\n',
      'data: {"choices":[{"delta":{"content":" content"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    let chunkIndex = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (chunkIndex < chunks.length) {
          const chunk = chunks[chunkIndex];
          chunkIndex++;
          return { done: false, value: encoder.encode(chunk) };
        }
        return { done: true, value: undefined };
      }),
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    const { result } = renderHook(() => useStreamingResponse());
    
    const callbacks = {
      onStreamStart: vi.fn(),
      onToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onError: vi.fn(),
    };

    await act(async () => {
      await result.current.streamResponse(
        [{ role: 'user', content: 'Hello' }],
        null,
        callbacks
      );
    });

    // Should complete without throwing
    expect(callbacks.onStreamEnd).toHaveBeenCalled();
  });

  it('should ignore SSE comments and empty lines', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'user-1', email: 'test@test.com' } as any,
        },
      },
      error: null,
    });

    const encoder = new TextEncoder();
    const chunks = [
      ': keep-alive\n\n',
      '\n',
      'data: {"choices":[{"delta":{"content":"Test"}}]}\n\n',
      ': another comment\n',
      'data: [DONE]\n\n',
    ];

    let chunkIndex = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (chunkIndex < chunks.length) {
          const chunk = chunks[chunkIndex];
          chunkIndex++;
          return { done: false, value: encoder.encode(chunk) };
        }
        return { done: true, value: undefined };
      }),
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    const { result } = renderHook(() => useStreamingResponse());
    
    const callbacks = {
      onStreamStart: vi.fn(),
      onToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onError: vi.fn(),
    };

    await act(async () => {
      await result.current.streamResponse(
        [{ role: 'user', content: 'Hello' }],
        null,
        callbacks
      );
    });

    expect(callbacks.onStreamEnd).toHaveBeenCalledWith('Test');
  });
});
