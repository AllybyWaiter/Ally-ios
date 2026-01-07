import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { MessageSquare, Trash2, Plus, Search, Sparkles, MessagesSquare } from "lucide-react";
import { format, isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  aquarium_id: string | null;
}

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
}

type DateGroup = "today" | "yesterday" | "week" | "older";

function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr);
  const now = new Date();
  
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (isWithinInterval(date, { start: subDays(now, 7), end: now })) return "week";
  return "older";
}

const groupLabels: Record<DateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 Days",
  older: "Older",
};

const ConversationCard = memo(({ 
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
  <motion.div
    layout
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    className={cn(
      "group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
      "hover:bg-accent/80 hover:shadow-sm",
      isActive && "bg-primary/10 border border-primary/20 shadow-sm",
      isDeleting && "opacity-50 pointer-events-none"
    )}
    onClick={onLoad}
  >
    <div className={cn(
      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "bg-muted"
    )}>
      <MessageSquare className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0 pt-0.5">
      <p className={cn(
        "text-sm font-medium truncate leading-tight",
        isActive && "text-primary"
      )}>
        {conversation.title}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {format(new Date(conversation.updated_at), "h:mm a")}
      </p>
    </div>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          )}
          disabled={isDeleting}
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete();
          }}
        >
          {isDeleting ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Delete</p>
      </TooltipContent>
    </Tooltip>
  </motion.div>
));

ConversationCard.displayName = "ConversationCard";

export function ChatHistorySidebar({
  conversations,
  currentConversationId,
  onLoadConversation,
  onDeleteConversation,
  onNewChat,
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.title.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const groups: Record<DateGroup, Conversation[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    filteredConversations.forEach(conv => {
      const group = getDateGroup(conv.updated_at);
      groups[group].push(conv);
    });

    return groups;
  }, [filteredConversations]);

  const handleRequestDelete = (id: string) => {
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
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
  };

  const hasConversations = conversations.length > 0;
  const hasResults = filteredConversations.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-md">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">Chat History</h2>
            <p className="text-xs text-muted-foreground">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
          className="w-full gap-2 rounded-xl shadow-sm"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        {/* Search */}
        {hasConversations && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        )}
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-3">
        {!hasConversations ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium text-base mb-1">Start a Conversation</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Ask Ally anything about your aquarium, pool, or spa care
            </p>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No conversations match "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            <AnimatePresence mode="popLayout">
              {(["today", "yesterday", "week", "older"] as DateGroup[]).map(group => {
                const items = groupedConversations[group];
                if (items.length === 0) return null;

                return (
                  <motion.div 
                    key={group}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-1"
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 py-2">
                      {groupLabels[group]}
                    </p>
                    {items.map(conv => (
                      <ConversationCard
                        key={conv.id}
                        conversation={conv}
                        isActive={currentConversationId === conv.id}
                        onLoad={() => onLoadConversation(conv.id)}
                        onRequestDelete={() => handleRequestDelete(conv.id)}
                        isDeleting={isDeleting && conversationToDelete === conv.id}
                      />
                    ))}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Delete Dialog */}
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
    </div>
  );
}
