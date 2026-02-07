import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversationManager } from './useConversationManager';
import { supabase } from '@/integrations/supabase/client';
import { mockToast } from '@/test/setup';

describe('useConversationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useConversationManager('user-123'));
      
      expect(result.current.conversations).toEqual([]);
      expect(result.current.currentConversationId).toBeNull();
      expect(result.current.aquariums).toEqual([]);
      expect(result.current.selectedAquarium).toBe('general');
    });

    it('should work with null userId', () => {
      const { result } = renderHook(() => useConversationManager(null));
      
      expect(result.current.conversations).toEqual([]);
    });
  });

  describe('fetchAquariums', () => {
    it('should fetch and set aquariums', async () => {
      const mockAquariums = [
        { id: 'aq-1', name: 'Reef Tank', type: 'saltwater' },
        { id: 'aq-2', name: 'Planted Tank', type: 'freshwater' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAquariums, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      await act(async () => {
        await result.current.fetchAquariums();
      });

      expect(result.current.aquariums).toEqual(mockAquariums);
    });

    it('should handle empty aquariums', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      await act(async () => {
        await result.current.fetchAquariums();
      });

      expect(result.current.aquariums).toEqual([]);
    });
  });

  describe('fetchConversations', () => {
    it('should fetch and set conversations', async () => {
      const mockConversations = [
        { id: 'conv-1', title: 'First Chat', updated_at: '2024-01-15', aquarium_id: null },
        { id: 'conv-2', title: 'Second Chat', updated_at: '2024-01-16', aquarium_id: 'aq-1' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockConversations, error: null }),
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations).toEqual(mockConversations);
    });
  });

  describe('startNewConversation', () => {
    it('should return initial message and reset conversation ID', () => {
      const { result } = renderHook(() => useConversationManager('user-123'));
      
      let messages: any[];
      act(() => {
        messages = result.current.startNewConversation();
      });

      expect(messages!).toHaveLength(1);
      expect(messages![0].role).toBe('assistant');
      expect(messages![0].content).toContain("Hi! I'm Ally");
      expect(result.current.currentConversationId).toBeNull();
    });
  });

  describe('loadConversation', () => {
    it('should load messages and set current conversation', async () => {
      const mockMessages = [
        { role: 'user', content: 'Hello', created_at: '2024-01-15T10:00:00Z' },
        { role: 'assistant', content: 'Hi there!', created_at: '2024-01-15T10:01:00Z' },
      ];

      const mockConversations = [
        { id: 'conv-1', title: 'Test', updated_at: '2024-01-15', aquarium_id: 'aq-1' },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'chat_conversations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockConversations, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      // First fetch conversations to have them available
      await act(async () => {
        await result.current.fetchConversations();
      });

      let messages: any[];
      await act(async () => {
        messages = await result.current.loadConversation('conv-1');
      });

      expect(messages!).toHaveLength(2);
      expect(messages![0].role).toBe('user');
      expect(messages![0].content).toBe('Hello');
      expect(result.current.currentConversationId).toBe('conv-1');
      expect(result.current.selectedAquarium).toBe('aq-1');
    });

    it('should return initial message when no messages found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      let messages: any[];
      await act(async () => {
        messages = await result.current.loadConversation('conv-1');
      });

      expect(messages![0].content).toContain("Hi! I'm Ally");
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation and show success toast', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chat_conversations') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      await act(async () => {
        await result.current.deleteConversation('conv-1');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Conversation deleted',
      });
    });

    it('should return true when deleting current conversation', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ role: 'user', content: 'Hello', created_at: '2024-01-15T10:00:00Z' }],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'chat_conversations') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      // Load a conversation first
      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      let shouldReset: boolean;
      await act(async () => {
        shouldReset = await result.current.deleteConversation('conv-1');
      });

      expect(shouldReset!).toBe(true);
    });
  });

  describe('saveConversation', () => {
    it('should create new conversation when none exists', async () => {
      const mockInsertConv = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-conv-id' },
            error: null,
          }),
        }),
      });

      const mockInsertMsg = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chat_conversations') {
          return {
            insert: mockInsertConv,
            update: mockUpdate,
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === 'chat_messages') {
          return {
            insert: mockInsertMsg,
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      const userMsg = { role: 'user' as const, content: 'Hello', timestamp: new Date() };
      const assistantMsg = { role: 'assistant' as const, content: 'Hi!', timestamp: new Date() };
      
      let conversationId: string | null;
      await act(async () => {
        conversationId = await result.current.saveConversation(userMsg, assistantMsg);
      });

      expect(conversationId!).toBe('new-conv-id');
      expect(result.current.currentConversationId).toBe('new-conv-id');
    });

    it('should return null when no userId', async () => {
      const { result } = renderHook(() => useConversationManager(null));
      
      const userMsg = { role: 'user' as const, content: 'Hello', timestamp: new Date() };
      const assistantMsg = { role: 'assistant' as const, content: 'Hi!', timestamp: new Date() };
      
      let conversationId: string | null;
      await act(async () => {
        conversationId = await result.current.saveConversation(userMsg, assistantMsg);
      });

      expect(conversationId!).toBeNull();
    });
  });

  describe('getSelectedAquariumName', () => {
    it('should return "Aquatics Advice" for general selection', () => {
      const { result } = renderHook(() => useConversationManager('user-123'));
      
      expect(result.current.getSelectedAquariumName()).toBe('Aquatics Advice');
    });

    it('should return aquarium name when selected', async () => {
      const mockAquariums = [
        { id: 'aq-1', name: 'Reef Tank', type: 'saltwater' },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'aquariums') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockAquariums, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'chat_conversations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      await act(async () => {
        await result.current.fetchAquariums();
        result.current.setSelectedAquarium('aq-1');
      });

      expect(result.current.getSelectedAquariumName()).toBe('Reef Tank');
    });
  });

  describe('getAquariumIdForApi', () => {
    it('should return null for general selection', () => {
      const { result } = renderHook(() => useConversationManager('user-123'));
      
      expect(result.current.getAquariumIdForApi()).toBeNull();
    });

    it('should return aquarium ID when selected', () => {
      const { result } = renderHook(() => useConversationManager('user-123'));
      
      act(() => {
        result.current.setSelectedAquarium('aq-123');
      });

      expect(result.current.getAquariumIdForApi()).toBe('aq-123');
    });
  });

  describe('setSelectedAquarium', () => {
    it('should update selected aquarium', () => {
      const { result } = renderHook(() => useConversationManager('user-123'));
      
      expect(result.current.selectedAquarium).toBe('general');
      
      act(() => {
        result.current.setSelectedAquarium('aq-123');
      });

      expect(result.current.selectedAquarium).toBe('aq-123');
    });
  });

  describe('updateMessageInDb', () => {
    it('should update message and delete subsequent messages', async () => {
      const mockMessages = [
        { id: 'msg-1', created_at: '2024-01-15T10:00:00Z' },
        { id: 'msg-2', created_at: '2024-01-15T10:01:00Z' },
        { id: 'msg-3', created_at: '2024-01-15T10:02:00Z' },
      ];

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockDelete = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
              }),
            }),
            update: mockUpdate,
            delete: mockDelete,
          } as any;
        }
        if (table === 'chat_conversations') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: 'conv-1', title: 'Test', updated_at: '2024-01-15', aquarium_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      // Set current conversation
      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      await act(async () => {
        await result.current.updateMessageInDb(0, 'Updated content');
      });

      // Verify update was called
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should do nothing without current conversation', async () => {
      const mockUpdate = vi.fn();
      
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      await act(async () => {
        await result.current.updateMessageInDb(0, 'Updated content');
      });

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('saveAssistantMessage', () => {
    it('should save message when conversation exists', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chat_messages') {
          return {
            insert: mockInsert,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ role: 'user', content: 'Hi', created_at: '2024-01-15T10:00:00Z' }],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'chat_conversations') {
          return {
            update: mockUpdate,
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: 'conv-1', title: 'Test', updated_at: '2024-01-15', aquarium_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      // Load a conversation first
      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      await act(async () => {
        await result.current.saveAssistantMessage('Test response');
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Test response',
        })
      );
    });

    it('should do nothing without current conversation', async () => {
      const mockInsert = vi.fn();
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useConversationManager('user-123'));
      
      await act(async () => {
        await result.current.saveAssistantMessage('Test response');
      });

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
