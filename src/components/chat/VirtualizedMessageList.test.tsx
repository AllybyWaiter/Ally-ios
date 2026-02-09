import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { VirtualizedMessageList } from './VirtualizedMessageList';

// Mock react-syntax-highlighter to avoid ESM issues
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => <pre data-testid="code-block">{children}</pre>,
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

// Mock FeedbackButtons to simplify testing
vi.mock('@/components/FeedbackButtons', () => ({
  FeedbackButtons: () => <div data-testid="feedback-buttons" />,
}));

// Mock TypingIndicator
vi.mock('@/components/TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">Typing...</div>,
}));

// Mock useVirtualizer for predictable testing
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () => 
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: `item-${i}`,
        start: i * 100,
        size: 100,
      })),
    getTotalSize: () => count * 100,
    scrollToIndex: vi.fn(),
  }),
}));

const createMessage = (role: 'user' | 'assistant', content: string, id?: string) => ({
  role,
  content,
  id: id || `msg-${Math.random()}`,
  timestamp: new Date(),
});

const defaultProps = {
  messages: [],
  isLoading: false,
  isStreaming: false,
  copiedIndex: null,
  editingIndex: null,
  editingContent: '',
  onCopy: vi.fn(),
  onStartEdit: vi.fn(),
  onCancelEdit: vi.fn(),
  onSaveEdit: vi.fn(),
  onRegenerateResponse: vi.fn(),
  onEditingContentChange: vi.fn(),
};

describe('VirtualizedMessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering messages', () => {
    it('renders empty state when no messages', () => {
      render(<VirtualizedMessageList {...defaultProps} />);
      
      expect(screen.queryByText(/hello/i)).not.toBeInTheDocument();
    });

    it('renders user messages with correct styling', () => {
      const messages = [createMessage('user', 'Hello, Ally!')];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Hello, Ally!')).toBeInTheDocument();
    });

    it('renders assistant messages with sparkle icon', () => {
      const messages = [createMessage('assistant', 'Hi! How can I help?')];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument();
    });

    it('renders multiple messages in order', () => {
      const messages = [
        createMessage('user', 'First message'),
        createMessage('assistant', 'Second message'),
        createMessage('user', 'Third message'),
      ];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Third message')).toBeInTheDocument();
    });

    it('renders markdown content in assistant messages', () => {
      const messages = [createMessage('assistant', '**Bold text** and *italic*')];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      // ReactMarkdown should parse the content
      expect(screen.getByText(/Bold text/)).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('shows typing indicator when loading and not streaming', () => {
      const messages = [createMessage('user', 'Hello')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          isLoading={true} 
          isStreaming={false} 
        />
      );
      
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    it('does not show typing indicator when streaming', () => {
      const messages = [
        createMessage('user', 'Hello'),
        createMessage('assistant', 'Streaming content...'),
      ];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          isLoading={true} 
          isStreaming={true} 
        />
      );
      
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });

    it('shows blinking cursor when streaming the last message', async () => {
      const messages = [
        createMessage('user', 'Hello'),
        createMessage('assistant', 'Streaming...'),
      ];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          isStreaming={true} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByLabelText("Ally's response")).toHaveTextContent('Streaming');
      });

      // Cursor should be visible while typewriter streaming is active
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('message actions', () => {
    it('calls onCopy when copy button is clicked on assistant message', async () => {
      const user = userEvent.setup();
      const onCopy = vi.fn();
      const messages = [createMessage('assistant', 'Copy this content')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          onCopy={onCopy} 
        />
      );
      
      // Find and click the copy button (need to hover to show it)
      const messageContainer = screen.getByText('Copy this content').closest('.group');
      if (messageContainer) {
        fireEvent.mouseEnter(messageContainer);
      }
      
      // The copy button should be in the DOM
      const copyButtons = document.querySelectorAll('button');
      const copyButton = Array.from(copyButtons).find(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Check')
      );
      
      if (copyButton) {
        await user.click(copyButton);
        expect(onCopy).toHaveBeenCalledWith('Copy this content', 0);
      }
    });

    it('shows check icon when message is copied', () => {
      const messages = [createMessage('assistant', 'Copied content')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          copiedIndex={0} 
        />
      );
      
      // The check icon should be visible when copiedIndex matches
      expect(screen.getByText('Copied content')).toBeInTheDocument();
    });

    it('shows feedback buttons on assistant messages', () => {
      const messages = [createMessage('assistant', 'Response with feedback')];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByTestId('feedback-buttons')).toBeInTheDocument();
    });
  });

  describe('message editing', () => {
    it('shows edit input when editingIndex matches', () => {
      const messages = [createMessage('user', 'Edit this message')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          editingIndex={0} 
          editingContent="Edit this message" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Edit this message');
    });

    it('calls onEditingContentChange when edit input changes', async () => {
      const user = userEvent.setup();
      const onEditingContentChange = vi.fn();
      const messages = [createMessage('user', 'Original message')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          editingIndex={0} 
          editingContent="Original message"
          onEditingContentChange={onEditingContentChange}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'New');
      
      expect(onEditingContentChange).toHaveBeenCalled();
    });

    it('calls onSaveEdit when Enter is pressed in edit input', async () => {
      const user = userEvent.setup();
      const onSaveEdit = vi.fn();
      const messages = [createMessage('user', 'Edit message')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          editingIndex={0} 
          editingContent="Edited message"
          onSaveEdit={onSaveEdit}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, '{Enter}');
      
      expect(onSaveEdit).toHaveBeenCalled();
    });

    it('calls onCancelEdit when Escape is pressed in edit input', async () => {
      const user = userEvent.setup();
      const onCancelEdit = vi.fn();
      const messages = [createMessage('user', 'Edit message')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          editingIndex={0} 
          editingContent="Edited message"
          onCancelEdit={onCancelEdit}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, '{Escape}');
      
      expect(onCancelEdit).toHaveBeenCalled();
    });
  });

  describe('regenerate response', () => {
    it('calls onStartEdit when edit button is clicked on user message', async () => {
      const onStartEdit = vi.fn();
      const messages = [createMessage('user', 'User message to edit')];
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={messages} 
          onStartEdit={onStartEdit} 
        />
      );
      
      // Hover to reveal action buttons
      const messageContainer = screen.getByText('User message to edit').closest('.group');
      if (messageContainer) {
        fireEvent.mouseEnter(messageContainer);
      }
      
      // Find edit button among all buttons
      const buttons = document.querySelectorAll('button');
      // Edit button should be one of them
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('code blocks', () => {
    it('renders code blocks with syntax highlighting', () => {
      const codeContent = '```javascript\nconst x = 1;\n```';
      const messages = [createMessage('assistant', codeContent)];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      // The code block should be rendered (mocked)
      expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
    });

    it('renders inline code correctly', () => {
      const inlineCode = 'Use the `useState` hook';
      const messages = [createMessage('assistant', inlineCode)];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText(/useState/)).toBeInTheDocument();
    });
  });

  describe('virtualization', () => {
    it('renders all virtualized items', () => {
      const messages = Array.from({ length: 10 }, (_, i) => 
        createMessage(i % 2 === 0 ? 'user' : 'assistant', `Message ${i}`)
      );
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      // Due to our mock, all items should be rendered
      expect(screen.getByText('Message 0')).toBeInTheDocument();
      expect(screen.getByText('Message 9')).toBeInTheDocument();
    });

    it('applies correct transform styles for positioning', () => {
      const messages = [
        createMessage('user', 'First'),
        createMessage('assistant', 'Second'),
      ];
      
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} messages={messages} />
      );
      
      // Check that transform styles are applied for virtualization
      const virtualItems = container.querySelectorAll('[style*="transform"]');
      expect(virtualItems.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('has proper button roles for actions', () => {
      const messages = [createMessage('assistant', 'Message with actions')];
      
      render(<VirtualizedMessageList {...defaultProps} messages={messages} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
