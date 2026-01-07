import { useRef, useEffect, memo, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Sparkles, 
  Copy, 
  Check,
  Edit2,
  X,
  RotateCw,
  Volume2,
  VolumeX,
  Loader2,
  Brain
} from "lucide-react";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { useTypewriterEffect } from "@/hooks/useTypewriterEffect";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { LazySyntaxHighlighter } from "./LazySyntaxHighlighter";
import { parseFollowUpSuggestions, FollowUpSuggestions, type FollowUpItem } from "./FollowUpSuggestions";
import { QuickActionChips, detectQuickActions, type QuickAction } from "./QuickActionChips";

// Typed props for markdown components
interface CodeProps {
  node?: unknown;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface AnchorProps {
  children?: React.ReactNode;
  href?: string;
}

// Memoized markdown components to prevent recreation on every render
const markdownComponents = {
  code({ inline, className, children, ...props }: CodeProps) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    
    // Use lazy syntax highlighter for code blocks
    return !inline && match ? (
      <LazySyntaxHighlighter language={match[1]}>
        {codeString}
      </LazySyntaxHighlighter>
    ) : (
      <code className={cn("bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>
        {children}
      </code>
    );
  },
  a: ({ children, href }: AnchorProps) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
      {children}
    </a>
  ),
};

// Memoized markdown renderer component - only re-renders when content changes
const MemoizedMarkdown = memo(({ content }: { content: string }) => {
  // Guard against empty content which may cause issues in some ReactMarkdown versions
  if (!content || content.trim() === '') {
    return null;
  }
  return (
    <ReactMarkdown components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id?: string;
  aquariumContext?: string | null;
  aquariumName?: string;
  imageUrl?: string;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  isThinking?: boolean;
  copiedIndex: number | null;
  editingIndex: number | null;
  editingContent: string;
  onCopy: (content: string, index: number) => void;
  onStartEdit: (index: number, content: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRegenerateResponse: (index: number) => void;
  onEditingContentChange: (content: string) => void;
  // TTS props
  onSpeak?: (content: string, messageId: string) => void;
  onStopSpeaking?: () => void;
  speakingMessageId?: string | null;
  isSpeaking?: boolean;
  isGeneratingTTS?: boolean;
  // Follow-up suggestions
  onSelectSuggestion?: (suggestion: string) => void;
  // Quick actions
  aquariumId?: string | null;
  onQuickAction?: (action: QuickAction) => void;
}

const MessageContent = memo(({ 
  message, 
  index,
  isStreaming,
  isLastMessage,
  copiedIndex,
  editingIndex,
  editingContent,
  onCopy,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerateResponse,
  onEditingContentChange,
  onSpeak,
  onStopSpeaking,
  speakingMessageId,
  isSpeaking,
  isGeneratingTTS,
  onSelectSuggestion,
  aquariumId,
  onQuickAction
}: {
  message: Message;
  index: number;
  isStreaming: boolean;
  isLastMessage: boolean;
  copiedIndex: number | null;
  editingIndex: number | null;
  editingContent: string;
  onCopy: (content: string, index: number) => void;
  onStartEdit: (index: number, content: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRegenerateResponse: (index: number) => void;
  onEditingContentChange: (content: string) => void;
  onSpeak?: (content: string, messageId: string) => void;
  onStopSpeaking?: () => void;
  speakingMessageId?: string | null;
  isSpeaking?: boolean;
  isGeneratingTTS?: boolean;
  onSelectSuggestion?: (suggestion: string) => void;
  aquariumId?: string | null;
  onQuickAction?: (action: QuickAction) => void;
}) => {
  const isEditing = editingIndex === index;
  const messageId = message.id || `msg-${index}`;
  const isThisMessageSpeaking = speakingMessageId === messageId;
  const isThisMessageGenerating = isGeneratingTTS && speakingMessageId === messageId;
  
  // Parse follow-up suggestions from assistant messages
  const { cleanContent, suggestions } = useMemo(() => {
    if (message.role !== 'assistant') {
      return { cleanContent: message.content, suggestions: [] };
    }
    return parseFollowUpSuggestions(message.content);
  }, [message.content, message.role]);

  // Detect quick actions from assistant messages
  const quickActions = useMemo(() => {
    if (message.role !== 'assistant' || isStreaming) {
      return [];
    }
    return detectQuickActions(cleanContent, aquariumId);
  }, [cleanContent, message.role, isStreaming, aquariumId]);
  
  // Smooth typewriter effect for streaming assistant messages
  const isTypewriterActive = isStreaming && isLastMessage && message.role === "assistant";
  const { displayedContent } = useTypewriterEffect(cleanContent, {
    isActive: isTypewriterActive,
    charsPerSecond: 60, // Natural reading pace
  });

  // Split content into stable and fading parts for smooth animation
  const fadeChars = 3;
  const stableContent = useMemo(() => {
    if (!isTypewriterActive || displayedContent.length <= fadeChars) return '';
    return displayedContent.slice(0, -fadeChars);
  }, [isTypewriterActive, displayedContent, fadeChars]);
  
  const fadingContent = useMemo(() => {
    if (!isTypewriterActive) return '';
    if (displayedContent.length <= fadeChars) return displayedContent;
    return displayedContent.slice(-fadeChars);
  }, [isTypewriterActive, displayedContent, fadeChars]);

  return (
    <div
      className={cn(
        "flex gap-4 group animate-fade-in relative py-2",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role === "assistant" && (
        <div className="h-6 w-6 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
      )}
      
      <div className={cn(
        "flex-1 space-y-1 min-w-0 overflow-hidden",
        message.role === "user" && "flex flex-col items-end"
      )}>
        <div className={cn(
          "relative group/message",
          message.role === "user" ? "text-right" : "text-left"
        )}>
          {message.role === "assistant" ? (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-2 prose-li:my-1 prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-muted prose-pre:border prose-pre:border-border">
              {isTypewriterActive ? (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {stableContent}
                  <span className="typewriter-fade">{fadingContent}</span>
                  <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                </p>
              ) : (
                <MemoizedMarkdown content={cleanContent} />
              )}
              {/* Follow-up suggestions for assistant messages */}
              {!isStreaming && suggestions.length > 0 && onSelectSuggestion && (
                <FollowUpSuggestions 
                  suggestions={suggestions} 
                  onSelectSuggestion={onSelectSuggestion} 
                />
              )}
              {/* Quick action buttons for assistant messages */}
              {!isStreaming && quickActions.length > 0 && (
                <QuickActionChips 
                  actions={quickActions} 
                  aquariumId={aquariumId}
                  onAction={onQuickAction}
                />
              )}
            </div>
          ) : (
            <>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingContent}
                    onChange={(e) => onEditingContentChange(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveEdit();
                      if (e.key === "Escape") onCancelEdit();
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={onSaveEdit}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={onCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2 max-w-[85%]">
                  {/* Image thumbnail if present */}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Attached photo"
                      className="max-h-48 max-w-full rounded-lg border border-border object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(message.imageUrl, '_blank')}
                    />
                  )}
                  {message.content && (
                    <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 break-words">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Message actions */}
        {message.role === "assistant" && message.content && !isStreaming && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* TTS Speaker Button */}
            {onSpeak && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 text-muted-foreground hover:text-foreground",
                      isThisMessageSpeaking && "text-primary"
                    )}
                    onClick={() => {
                      if (isThisMessageSpeaking && isSpeaking) {
                        onStopSpeaking?.();
                      } else {
                        onSpeak(message.content, messageId);
                      }
                    }}
                    disabled={isThisMessageGenerating}
                  >
                    {isThisMessageGenerating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isThisMessageSpeaking && isSpeaking ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isThisMessageSpeaking && isSpeaking ? "Stop speaking" : "Read aloud"}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onCopy(message.content, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Copy message</p></TooltipContent>
            </Tooltip>
            <FeedbackButtons 
              feature="chat" 
              messageId={message.id}
              context={{ messageContent: message.content.slice(0, 200) }}
            />
          </div>
        )}

        {message.role === "user" && !isEditing && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onStartEdit(index, message.content)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit message</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRegenerateResponse(index)}
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Regenerate response</p></TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
});

MessageContent.displayName = "MessageContent";

export const VirtualizedMessageList = memo(({
  messages,
  isLoading,
  isStreaming,
  isThinking = false,
  copiedIndex,
  editingIndex,
  editingContent,
  onCopy,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerateResponse,
  onEditingContentChange,
  onSpeak,
  onStopSpeaking,
  speakingMessageId,
  isSpeaking,
  isGeneratingTTS,
  onSelectSuggestion,
  aquariumId,
  onQuickAction
}: VirtualizedMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length + (isLoading && !isStreaming ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  // Smart auto-scroll: only scroll if user is near the bottom
  useEffect(() => {
    if (parentRef.current && messages.length > 0) {
      const container = parentRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      
      // Only auto-scroll if user is near the bottom (not scrolled up reading history)
      if (isNearBottom) {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' });
      }
    }
  }, [messages.length, virtualizer]);

  return (
    <div 
      ref={parentRef} 
      className="h-full overflow-auto px-4 lg:px-6"
      aria-live="polite"
      aria-atomic="false"
    >
      <div
        className="max-w-4xl mx-auto"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          // Loading indicator - use unique key based on message count to avoid reconciliation issues
          if (virtualItem.index === messages.length) {
            return (
              <div
                key={`loading-${messages.length}`}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="flex gap-4 py-2">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    isThinking ? "bg-amber-500/10" : "bg-primary/5"
                  )}>
                    {isThinking ? (
                      <Brain className="h-3 w-3 text-amber-500" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  {isThinking ? <ThinkingIndicator /> : <TypingIndicator />}
                </div>
              </div>
            );
          }

          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageContent
                message={message}
                index={virtualItem.index}
                isStreaming={isStreaming}
                isLastMessage={virtualItem.index === messages.length - 1}
                copiedIndex={copiedIndex}
                editingIndex={editingIndex}
                editingContent={editingContent}
                onCopy={onCopy}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onRegenerateResponse={onRegenerateResponse}
                onEditingContentChange={onEditingContentChange}
                onSpeak={onSpeak}
                onStopSpeaking={onStopSpeaking}
                speakingMessageId={speakingMessageId}
                isSpeaking={isSpeaking}
                isGeneratingTTS={isGeneratingTTS}
                onSelectSuggestion={onSelectSuggestion}
                aquariumId={aquariumId}
                onQuickAction={onQuickAction}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedMessageList.displayName = "VirtualizedMessageList";
