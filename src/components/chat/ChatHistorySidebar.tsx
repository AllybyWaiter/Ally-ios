import { useState, useMemo, memo, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Pin,
  Pencil,
  Check,
  X,
  Calendar,
  Filter,
  CheckSquare,
  MoreHorizontal,
  Download,
  Archive,
  ArchiveRestore,
  Copy
} from "lucide-react";
import { format, isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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
  onRenameConversation?: (id: string, newTitle: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onExportConversation?: (id: string) => Promise<string>;
  aquariums?: Aquarium[];
  isLoading?: boolean;
}

type DateGroup = "pinned" | "today" | "yesterday" | "week" | "older";
type FilterType = "all" | "pinned" | "week" | "with-aquarium";

const filterOptions: { id: FilterType; label: string; icon?: React.ReactNode }[] = [
  { id: "all", label: "All" },
  { id: "pinned", label: "Pinned", icon: <Star className="h-3 w-3" /> },
  { id: "week", label: "This Week", icon: <Calendar className="h-3 w-3" /> },
  { id: "with-aquarium", label: "With Tank", icon: <Fish className="h-3 w-3" /> },
];

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

// Inline edit component
const InlineEdit = memo(({ 
  value, 
  onSave, 
  onCancel 
}: { 
  value: string; 
  onSave: (newValue: string) => void; 
  onCancel: () => void;
}) => {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    if (editValue.trim()) {
      onSave(editValue.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="h-7 text-sm px-2 py-1"
        maxLength={50}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
        onClick={handleSave}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onCancel}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});

InlineEdit.displayName = "InlineEdit";

const ConversationCard = memo(({ 
  conversation, 
  isActive, 
  onLoad, 
  onRequestDelete,
  onPin,
  onRename,
  onExport,
  aquarium,
  isDeleting = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: { 
  conversation: Conversation; 
  isActive: boolean; 
  onLoad: () => void; 
  onRequestDelete: () => void;
  onPin?: () => void;
  onRename?: (newTitle: string) => void;
  onExport?: () => void;
  aquarium?: Aquarium | null;
  isDeleting?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const AquariumIcon = aquarium ? getAquariumIcon(aquarium.type) : null;
  const aquariumColorClass = aquarium ? getAquariumColor(aquarium.type) : '';
  
  const handleSaveRename = (newTitle: string) => {
    if (onRename && newTitle !== conversation.title) {
      onRename(newTitle);
    }
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (onRename && !isSelectionMode) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onLoad();
    }
  };
  
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
        isActive && !isSelectionMode && "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm shadow-primary/5",
        isSelected && "bg-primary/10 border border-primary/30",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div className="flex items-center justify-center shrink-0" onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.()}
            className="h-5 w-5"
          />
        </div>
      )}

      {/* Icon with gradient */}
      {!isSelectionMode && (
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 shrink-0",
          isActive 
            ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20" 
            : "bg-gradient-to-br from-muted to-muted/50 group-hover:from-accent group-hover:to-accent/50"
        )}>
          <MessageSquare className="h-4.5 w-4.5" />
        </div>
      )}
      
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title row with pin indicator */}
        <div className="flex items-start gap-2">
          {isEditing ? (
            <InlineEdit
              value={conversation.title}
              onSave={handleSaveRename}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <p 
                className={cn(
                  "text-sm font-medium truncate leading-tight flex-1",
                  isActive && "text-primary"
                )}
                onDoubleClick={handleDoubleClick}
                title="Double click to rename"
              >
                {conversation.title}
              </p>
              {conversation.is_pinned && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
              )}
            </>
          )}
        </div>
        
        {/* Message preview */}
        {!isEditing && conversation.last_message_preview && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {conversation.last_message_preview}
          </p>
        )}
        
        {/* Metadata row */}
        {!isEditing && (
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
        )}
      </div>
      
      {/* Action buttons on hover - hidden in selection mode */}
      {!isEditing && !isSelectionMode && (
        <div className={cn(
          "absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        )}>
          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onRename && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
              {onPin && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onPin();
                }}>
                  <Star className={cn("h-3.5 w-3.5 mr-2", conversation.is_pinned && "fill-current")} />
                  {conversation.is_pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
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
  onRenameConversation,
  onBulkDelete,
  onExportConversation,
  aquariums = [],
  isLoading = false,
}: ChatHistorySidebarProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Create aquarium lookup map
  const aquariumMap = useMemo(() => {
    const map = new Map<string, Aquarium>();
    aquariums.forEach(aq => map.set(aq.id, aq));
    return map;
  }, [aquariums]);

  // Filter counts for badges
  const filterCounts = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    
    return {
      all: conversations.length,
      pinned: conversations.filter(c => c.is_pinned).length,
      week: conversations.filter(c => {
        const date = new Date(c.updated_at);
        return isWithinInterval(date, { start: weekAgo, end: now });
      }).length,
      "with-aquarium": conversations.filter(c => c.aquarium_id).length,
    };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let result = conversations;
    
    // Apply filter
    if (activeFilter !== "all") {
      const now = new Date();
      const weekAgo = subDays(now, 7);
      
      switch (activeFilter) {
        case "pinned":
          result = result.filter(c => c.is_pinned);
          break;
        case "week":
          result = result.filter(c => {
            const date = new Date(c.updated_at);
            return isWithinInterval(date, { start: weekAgo, end: now });
          });
          break;
        case "with-aquarium":
          result = result.filter(c => c.aquarium_id);
          break;
      }
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.last_message_preview?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [conversations, searchQuery, activeFilter]);

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

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredConversations.map(c => c.id)));
  }, [filteredConversations]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !onBulkDelete) return;
    
    setIsBulkDeleting(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      toast({
        title: "Deleted",
        description: `${selectedIds.size} conversation${selectedIds.size > 1 ? 's' : ''} deleted`,
      });
      exitSelectionMode();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversations",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleExport = async (id: string) => {
    if (!onExportConversation) return;
    
    try {
      const content = await onExportConversation(id);
      
      // Create and download file
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const conv = conversations.find(c => c.id === id);
      a.href = url;
      a.download = `${conv?.title || 'conversation'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exported",
        description: "Conversation downloaded as Markdown",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export conversation",
        variant: "destructive",
      });
    }
  };

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
        
        {/* Selection mode header */}
        {isSelectionMode ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={exitSelectionMode}
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedIds.size === filteredConversations.length ? deselectAll : selectAll}
              >
                {selectedIds.size === filteredConversations.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedIds.size === 0}
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20">
                <MessagesSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg leading-tight">Chat History</h2>
                <p className="text-xs text-muted-foreground">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              {hasConversations && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setIsSelectionMode(true)}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Select multiple</TooltipContent>
                </Tooltip>
              )}
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
          </>
        )}

        {/* Search */}
        {hasConversations && !isSelectionMode && (
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

        {/* Quick Filters */}
        {hasConversations && !isSelectionMode && (
          <div className="flex gap-1.5 flex-wrap">
            {filterOptions.map((filter) => {
              const count = filterCounts[filter.id];
              const isActive = activeFilter === filter.id;
              
              // Hide filters with 0 results (except "all")
              if (filter.id !== "all" && count === 0) return null;
              
              return (
                <Button
                  key={filter.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs gap-1.5 rounded-full transition-all",
                    isActive 
                      ? "shadow-sm" 
                      : "bg-transparent hover:bg-accent border-muted-foreground/20"
                  )}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.icon}
                  {filter.label}
                  {filter.id !== "all" && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
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
              {activeFilter !== "all" ? (
                <Filter className="h-6 w-6 text-muted-foreground/50" />
              ) : (
                <Search className="h-6 w-6 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No results found
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {activeFilter !== "all" 
                ? "Try a different filter" 
                : "Try a different search term"
              }
            </p>
            {activeFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => setActiveFilter("all")}
              >
                Clear filter
              </Button>
            )}
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
                        onRename={onRenameConversation ? (newTitle) => onRenameConversation(conv.id, newTitle) : undefined}
                        onExport={onExportConversation ? () => handleExport(conv.id) : undefined}
                        aquarium={conv.aquarium_id ? aquariumMap.get(conv.aquarium_id) : null}
                        isDeleting={isDeleting && conversationToDelete === conv.id}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(conv.id)}
                        onToggleSelect={() => toggleSelection(conv.id)}
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

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} conversation{selectedIds.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected conversations and all their messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
