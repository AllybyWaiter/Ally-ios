import { useRef, useEffect, memo, useCallback } from "react";
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
  RotateCw
} from "lucide-react";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { TypingIndicator } from "@/components/TypingIndicator";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id?: string;
  aquariumContext?: string | null;
  aquariumName?: string;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  copiedIndex: number | null;
  editingIndex: number | null;
  editingContent: string;
  onCopy: (content: string, index: number) => void;
  onStartEdit: (index: number, content: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRegenerateResponse: (index: number) => void;
  onEditingContentChange: (content: string) => void;
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
  onEditingContentChange
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
}) => {
  const isEditing = editingIndex === index;

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
              {isStreaming && isLastMessage ? (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                  <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                </p>
              ) : (
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md my-2 text-sm"
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={cn("bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>
                          {children}
                        </code>
                      );
                    },
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
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
                <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[85%] break-words">
                  <p className="text-sm leading-relaxed text-right">{message.content}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message actions */}
        {message.role === "assistant" && message.content && !isStreaming && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              messageId={message.id || `msg-${index}`}
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
  copiedIndex,
  editingIndex,
  editingContent,
  onCopy,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerateResponse,
  onEditingContentChange
}: VirtualizedMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length + (isLoading && !isStreaming ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (parentRef.current) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' });
    }
  }, [messages.length, virtualizer]);

  return (
    <div 
      ref={parentRef} 
      className="h-full overflow-auto px-4 lg:px-6"
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
          // Loading indicator
          if (virtualItem.index === messages.length) {
            return (
              <div
                key="loading"
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
                  <div className="h-6 w-6 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <TypingIndicator />
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
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedMessageList.displayName = "VirtualizedMessageList";
