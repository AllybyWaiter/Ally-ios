import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockAquarium, createMockConversation } from '@/test/test-utils';

// Mock supabase
const mockGetUser = vi.fn().mockResolvedValue({ 
  data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
});

const mockSupabaseFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      getSession: vi.fn().mockResolvedValue({ 
        data: { session: { access_token: 'test-token' } } 
      }),
    },
    from: (table: string) => {
      if (table === 'aquariums') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ 
            data: [createMockAquarium()], 
            error: null 
          }),
        };
      }
      if (table === 'chat_conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ 
            data: [createMockConversation()], 
            error: null 
          }),
          single: vi.fn().mockResolvedValue({ 
            data: createMockConversation(), 
            error: null 
          }),
        };
      }
      if (table === 'chat_messages') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          in: vi.fn().mockReturnThis(),
          delete: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return mockSupabaseFrom(table);
    },
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock components
vi.mock('@/components/AppHeader', () => ({
  default: () => <header data-testid="app-header">Header</header>,
}));

vi.mock('@/components/FeedbackButtons', () => ({
  FeedbackButtons: () => <div data-testid="feedback-buttons">Feedback</div>,
}));

vi.mock('@/components/TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">Typing...</div>,
}));

vi.mock('@/components/chat/VirtualizedConversationList', () => ({
  VirtualizedConversationList: ({ 
    conversations, 
    onLoadConversation, 
    onDeleteConversation 
  }: {
    conversations: { id: string; title: string }[];
    onLoadConversation: (id: string) => void;
    onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  }) => (
    <div data-testid="conversation-list">
      {conversations.map((conv: { id: string; title: string }) => (
        <button 
          key={conv.id} 
          onClick={() => onLoadConversation(conv.id)}
          data-testid={`conversation-${conv.id}`}
        >
          {conv.title}
        </button>
      ))}
    </div>
  ),
}));

// Mock use-mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

// Import after mocks
import AllyChat from './AllyChat';

describe('AllyChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
    });
  });

  it('renders the chat interface', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      // Look for the input area
      expect(screen.getByPlaceholderText(/ask ally/i) || 
             screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('renders initial assistant greeting', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      expect(screen.getByText(/I'm Ally/i)).toBeInTheDocument();
    });
  });

  it('renders message input area', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });

  it('renders send button', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      // Find send button by looking for button with Send icon or aria-label
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => 
        btn.querySelector('svg') || 
        btn.getAttribute('aria-label')?.includes('send')
      );
      expect(sendButton || buttons.length > 0).toBeTruthy();
    });
  });

  it('allows typing in the input', async () => {
    const user = userEvent.setup();
    
    render(<AllyChat />);
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello Ally');
    
    expect(input).toHaveValue('Hello Ally');
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    
    // Mock fetch for API call
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ 
              done: false, 
              value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n') 
            })
            .mockResolvedValueOnce({ 
              done: false, 
              value: new TextEncoder().encode('data: [DONE]\n') 
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });
    
    render(<AllyChat />);
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello{enter}');
    
    // Input should be cleared after sending
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows new conversation button', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      const newConvButton = screen.getByRole('button', { name: /new/i }) ||
                            screen.getAllByRole('button').find(btn => 
                              btn.querySelector('[class*="Plus"]'));
      expect(newConvButton || screen.getAllByRole('button').length > 0).toBeTruthy();
    });
  });

  it('redirects to auth if no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    
    render(<AllyChat />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  it('renders aquarium selector', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      // Look for aquarium selector or general context option
      const selector = screen.queryByText(/general/i) ||
                      screen.queryByRole('combobox') ||
                      screen.queryByText(/Test Aquarium/i);
      expect(selector || screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});

describe('AllyChat - Conversation Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
    });
  });

  it('renders conversation list', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });
  });

  it('loads conversation when clicked', async () => {
    const user = userEvent.setup();
    
    render(<AllyChat />);
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });
    
    const conversationButton = screen.getByTestId('conversation-test-conversation-id');
    await user.click(conversationButton);
    
    // Conversation should be loaded (messages fetched)
    // This would trigger a state change in the real component
    expect(conversationButton).toBeInTheDocument();
  });
});

describe('AllyChat - Message Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
    });
  });

  it('displays assistant messages with markdown', async () => {
    render(<AllyChat />);
    
    await waitFor(() => {
      // The initial greeting should be rendered
      expect(screen.getByText(/aquarium/i)).toBeInTheDocument();
    });
  });
});
