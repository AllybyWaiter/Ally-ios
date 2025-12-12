import { useRef, memo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  aquarium_id: string | null;
}

interface VirtualizedConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
}

const ConversationItem = memo(({ 
  conversation, 
  isActive, 
  onLoad, 
  onDelete 
}: { 
  conversation: Conversation; 
  isActive: boolean; 
  onLoad: () => void; 
  onDelete: (e: React.MouseEvent) => void;
}) => (
  <div
    className={cn(
      "group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
      isActive && "bg-accent"
    )}
    onClick={onLoad}
  >
    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{conversation.title}</p>
      <p className="text-xs text-muted-foreground">
        {format(new Date(conversation.updated_at), "MMM d, h:mm a")}
      </p>
    </div>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 h-8 w-8"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Delete conversation</p>
      </TooltipContent>
    </Tooltip>
  </div>
));

ConversationItem.displayName = "ConversationItem";

export const VirtualizedConversationList = memo(({ 
  conversations, 
  currentConversationId, 
  onLoadConversation, 
  onDeleteConversation 
}: VirtualizedConversationListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Each conversation item is ~64px
    overscan: 5,
  });

  const handleLoad = useCallback((id: string) => () => {
    onLoadConversation(id);
  }, [onLoadConversation]);

  const handleDelete = useCallback((id: string) => (e: React.MouseEvent) => {
    onDeleteConversation(id, e);
  }, [onDeleteConversation]);

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No conversations yet
      </p>
    );
  }

  return (
    <div 
      ref={parentRef} 
      className="h-full overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const conv = conversations[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ConversationItem
                conversation={conv}
                isActive={currentConversationId === conv.id}
                onLoad={handleLoad(conv.id)}
                onDelete={handleDelete(conv.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedConversationList.displayName = "VirtualizedConversationList";
