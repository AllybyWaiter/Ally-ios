import { useRef, memo, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onRequestDelete,
  isDeleting = false
}: { 
  conversation: Conversation; 
  isActive: boolean; 
  onLoad: () => void; 
  onRequestDelete: () => void;
  isDeleting?: boolean;
}) => (
  <div
    role="button"
    tabIndex={0}
    aria-selected={isActive}
    aria-label={`Conversation: ${conversation.title}, last updated ${format(new Date(conversation.updated_at), "MMM d, h:mm a")}`}
    className={cn(
      "relative flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
      isActive && "bg-accent",
      isDeleting && "opacity-50 pointer-events-none"
    )}
    onClick={onLoad}
    onKeyDown={(e) => e.key === 'Enter' && onLoad()}
  >
    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
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
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          disabled={isDeleting}
          aria-label={`Delete conversation: ${conversation.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete();
          }}
        >
          {isDeleting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Deleting..." />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const handleLoad = useCallback((id: string) => () => {
    onLoadConversation(id);
  }, [onLoadConversation]);

  const handleRequestDelete = useCallback((id: string) => () => {
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async (e: React.MouseEvent) => {
    if (conversationToDelete) {
      setIsDeleting(true);
      try {
        await onDeleteConversation(conversationToDelete, e);
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
      }
    }
  }, [conversationToDelete, onDeleteConversation]);

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No conversations yet
      </p>
    );
  }

  return (
    <>
      <div 
        ref={parentRef} 
        className="h-full overflow-auto"
        role="listbox"
        aria-label="Conversation history"
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
                  onRequestDelete={handleRequestDelete(conv.id)}
                  isDeleting={isDeleting && conversationToDelete === conv.id}
                />
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

VirtualizedConversationList.displayName = "VirtualizedConversationList";
