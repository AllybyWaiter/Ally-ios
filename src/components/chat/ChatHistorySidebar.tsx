import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { 
  MessageSquare, 
  Trash2, 
  Plus, 
  Search, 
  Sparkles, 
  MessagesSquare,
  Fish,
  Waves,
  Droplets,
  Star,
  Pin
} from "lucide-react";
import { format, isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Aquarium {
  id: string;
  name: string;
  type: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  aquarium_id: string | null;
  is_pinned?: boolean;
  last_message_preview?: string | null;
  message_count?: number;
}

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
  onPinConversation?: (id: string) => void;
  aquariums?: Aquarium[];
  isLoading?: boolean;
}

type DateGroup = "pinned" | "today" | "yesterday" | "week" | "older";

function getDateGroup(conv: Conversation): DateGroup {
  if (conv.is_pinned) return "pinned";
  const date = new Date(conv.updated_at);
  const now = new Date();
  
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (isWithinInterval(date, { start: subDays(now, 7), end: now })) return "week";
  return "older";
}

const groupLabels: Record<DateGroup, string> = {
  pinned: "Pinned",
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 Days",
  older: "Older",
};

const groupIcons: Record<DateGroup, React.ReactNode> = {
  pinned: <Pin className="h-3 w-3" />,
  today: null,
  yesterday: null,
  week: null,
  older: null,
};

function getAquariumIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'freshwater':
      return Fish;
    case 'saltwater':
    case 'reef':
      return Waves;
    case 'pool':
    case 'spa':
    case 'hot_tub':
      return Droplets;
    default:
      return Fish;
  }
}

function getAquariumColor(type: string) {
  switch (type?.toLowerCase()) {
    case 'freshwater':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'saltwater':
    case 'reef':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    case 'pool':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'spa':
    case 'hot_tub':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

const ConversationSkeleton = () => (
  <div className="space-y-3 px-1">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ConversationCard = memo(({ 
  conversation, 
  isActive, 
  onLoad, 
  onRequestDelete,
  onPin,
  aquarium,
  isDeleting = false
}: { 
  conversation: Conversation; 
  isActive: boolean; 
  onLoad: () => void; 
  onRequestDelete: () => void;
  onPin?: () => void;
  aquarium?: Aquarium | null;
  isDeleting?: boolean;
}) => {
  const AquariumIcon = aquarium ? getAquariumIcon(aquarium.type) : null;
  const aquariumColorClass = aquarium ? getAquariumColor(aquarium.type) : '';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
        "hover:bg-accent/80",
        isActive && "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm shadow-primary/5",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      onClick={onLoad}
    >
      {/* Icon with gradient */}
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 shrink-0",
        isActive 
          ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20" 
          : "bg-gradient-to-br from-muted to-muted/50 group-hover:from-accent group-hover:to-accent/50"
      )}>
        <MessageSquare className="h-4.5 w-4.5" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title row with pin indicator */}
        <div className="flex items-start gap-2">
          <p className={cn(
            "text-sm font-medium truncate leading-tight flex-1",
            isActive && "text-primary"
          )}>
            {conversation.title}
          </p>
          {conversation.is_pinned && (
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
          )}
        </div>
        
        {/* Message preview */}
        {conversation.last_message_preview && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {conversation.last_message_preview}
          </p>
        )}
        
        {/* Metadata row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aquarium badge */}
          {aquarium ? (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-1.5 py-0 h-5 gap-1 font-medium border",
                aquariumColorClass
              )}
            >
              {AquariumIcon && <AquariumIcon className="h-2.5 w-2.5" />}
              <span className="truncate max-w-[80px]">{aquarium.name}</span>
            </Badge>
          ) : (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0 h-5 gap-1 font-medium bg-muted/50"
            >
              <Sparkles className="h-2.5 w-2.5" />
              General
            </Badge>
          )}
          
          {/* Message count */}
          {typeof conversation.message_count === 'number' && conversation.message_count > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {conversation.message_count} msg{conversation.message_count !== 1 ? 's' : ''}
            </span>
          )}
          
          {/* Time */}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {format(new Date(conversation.updated_at), isToday(new Date(conversation.updated_at)) ? "h:mm a" : "MMM d")}
          </span>
        </div>
      </div>
      
      {/* Action buttons on hover */}
      <div className={cn(
        "absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
      )}>
        {onPin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10",
                  conversation.is_pinned && "text-amber-500"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onPin();
                }}
              >
                <Star className={cn("h-3.5 w-3.5", conversation.is_pinned && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{conversation.is_pinned ? 'Unpin' : 'Pin'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
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
          <TooltipContent side="top">
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
});

ConversationCard.displayName = "ConversationCard";

export function ChatHistorySidebar({
  conversations,
  currentConversationId,
  onLoadConversation,
  onDeleteConversation,
  onNewChat,
  onPinConversation,
  aquariums = [],
  isLoading = false,
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create aquarium lookup map
  const aquariumMap = useMemo(() => {
    const map = new Map<string, Aquarium>();
    aquariums.forEach(aq => map.set(aq.id, aq));
    return map;
  }, [aquariums]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.last_message_preview?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const groups: Record<DateGroup, Conversation[]> = {
      pinned: [],
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    filteredConversations.forEach(conv => {
      const group = getDateGroup(conv);
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
    <div className="flex flex-col h-full bg-background">
      {/* Header with gradient accent */}
      <div className="relative px-4 pt-4 pb-3 space-y-4">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20">
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
          className="relative w-full gap-2 rounded-xl shadow-md shadow-primary/10 overflow-hidden group"
          size="lg"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="h-4 w-4 relative z-10" />
          <span className="relative z-10">New Chat</span>
        </Button>

        {/* Search */}
        {hasConversations && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>
        )}
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-3">
        {isLoading ? (
          <ConversationSkeleton />
        ) : !hasConversations ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md">
                <Plus className="h-3 w-3 text-white" />
              </div>
            </div>
            <h3 className="font-semibold text-base mb-1.5">Start a Conversation</h3>
            <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">
              Ask Ally anything about your aquarium, pool, or spa care
            </p>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 mb-4">
              <Search className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No results found
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            <AnimatePresence mode="popLayout">
              {(["pinned", "today", "yesterday", "week", "older"] as DateGroup[]).map(group => {
                const items = groupedConversations[group];
                if (items.length === 0) return null;

                return (
                  <motion.div 
                    key={group}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2 px-1 py-2">
                      {groupIcons[group]}
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {groupLabels[group]}
                      </p>
                      <span className="text-xs text-muted-foreground/60">
                        ({items.length})
                      </span>
                    </div>
                    {items.map(conv => (
                      <ConversationCard
                        key={conv.id}
                        conversation={conv}
                        isActive={currentConversationId === conv.id}
                        onLoad={() => onLoadConversation(conv.id)}
                        onRequestDelete={() => handleRequestDelete(conv.id)}
                        onPin={onPinConversation ? () => onPinConversation(conv.id) : undefined}
                        aquarium={conv.aquarium_id ? aquariumMap.get(conv.aquarium_id) : null}
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
