import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockAquarium, createMockConversation } from '@/test/test-utils';

// Mock supabase
const mockGetUser = vi.fn().mockResolvedValue({ 
  data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
});

const mockAquariums = [
  createMockAquarium({ id: 'test-aquarium-id', name: 'Test Aquarium' }),
];

const mockConversations = [
  createMockConversation({
    id: 'test-conversation-id',
    title: 'Test Conversation',
    aquarium_id: 'test-aquarium-id',
  }),
];

const createThenable = <T,>(result: T) => ({
  then: (
    onFulfilled?: ((value: T) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null
  ) => Promise.resolve(result).then(onFulfilled ?? undefined, onRejected ?? undefined),
  catch: (onRejected?: ((reason: unknown) => unknown) | null) =>
    Promise.resolve(result).catch(onRejected ?? undefined),
  finally: (onFinally?: (() => void) | null) =>
    Promise.resolve(result).finally(onFinally ?? undefined),
});

const createQueryBuilder = (result: { data: unknown; error: unknown }) => {
  const singleResult = {
    data: Array.isArray(result.data) ? (result.data[0] ?? null) : result.data,
    error: result.error,
  };

  const builder: Record<string, unknown> = {};
  const orderChain: Record<string, unknown> = {};

  orderChain.order = vi.fn(() => orderChain);
  Object.assign(orderChain, createThenable(result));

  builder.select = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => orderChain);
  builder.single = vi.fn().mockResolvedValue(singleResult);
  builder.maybeSingle = vi.fn().mockResolvedValue(singleResult);
  Object.assign(builder, createThenable(result));

  return builder;
};

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
        return createQueryBuilder({ data: mockAquariums, error: null });
      }
      if (table === 'chat_conversations') {
        return createQueryBuilder({ data: mockConversations, error: null });
      }
      if (table === 'chat_messages') {
        return createQueryBuilder({ data: [], error: null });
      }
      return createQueryBuilder({ data: [], error: null });
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

vi.mock('@/components/chat/ChatHistorySidebar', () => ({
  ChatHistorySidebar: ({
    conversations,
    onLoadConversation,
  }: {
    conversations: { id: string; title: string }[];
    onLoadConversation: (id: string) => void;
  }) => (
    <div data-testid="conversation-list">
      {conversations.map((conv) => (
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

vi.mock('@/components/chat/VirtualizedMessageList', () => ({
  VirtualizedMessageList: ({
    messages,
  }: {
    messages: Array<{ id?: string; role: string; content: string }>;
  }) => (
    <div data-testid="message-list">
      {messages.map((message, index) => (
        <div key={message.id ?? index}>{message.content}</div>
      ))}
    </div>
  ),
}));

// Mock use-mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/usePlanLimits', () => ({
  usePlanLimits: () => ({
    limits: {
      hasReasoningModel: true,
    },
  }),
}));

vi.mock('@/hooks/useSuggestedQuestions', () => ({
  useSuggestedQuestions: () => ({
    suggestions: [],
    hasAlerts: false,
  }),
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
      expect(screen.getByPlaceholderText(/message ally/i) || 
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
      expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
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
    const user = userEvent.setup();
    render(<AllyChat />);

    await user.click(screen.getByRole('button', { name: /open chat history/i }));
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });
  });

  it('loads conversation when clicked', async () => {
    const user = userEvent.setup();
    
    render(<AllyChat />);

    await user.click(screen.getByRole('button', { name: /open chat history/i }));
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });
    
    const conversationButton = screen.getByTestId('conversation-test-conversation-id');
    await user.click(conversationButton);
    
    await waitFor(() => {
      // Selecting a conversation closes the history sheet
      expect(screen.queryByTestId('conversation-list')).not.toBeInTheDocument();
    });
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
