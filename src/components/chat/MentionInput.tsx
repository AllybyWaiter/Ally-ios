import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Fish, Droplets, Waves, Search } from "lucide-react";

export interface MentionItem {
  id: string;
  name: string;
  type: "aquarium" | "equipment" | "livestock";
  subtitle?: string;
  icon?: "fish" | "water" | "waves";
}

export interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  mentionItems: MentionItem[];
  onMentionSelect?: (item: MentionItem) => void;
}

export interface MentionInputRef {
  focus: () => void;
  blur: () => void;
  resetHeight: () => void;
}

// Mention format: @[Tank Name](id:abc123)
const MENTION_REGEX = /@\[([^\]]+)\]\(id:([^)]+)\)/g;

/**
 * Parse mentions from text - extracts all @[Name](id:xxx) patterns
 */
export function parseMentions(text: string): Array<{ id: string; name: string }> {
  const mentions: Array<{ id: string; name: string }> = [];
  let match;
  // Reset regex state
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push({ name: match[1], id: match[2] });
  }
  return mentions;
}

/**
 * Convert storage format @[Name](id:xxx) to display format @Name
 */
export function mentionsToDisplay(text: string): string {
  return text.replace(/@\[([^\]]+)\]\(id:[^)]+\)/g, "@$1");
}

const iconMap = {
  fish: Fish,
  water: Droplets,
  waves: Waves,
};

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  className,
  mentionItems,
  onMentionSelect,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [atPosition, setAtPosition] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    blur: () => textareaRef.current?.blur(),
    resetHeight: () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
  }));

  // Display value (without ID parts)
  const displayValue = useMemo(() => mentionsToDisplay(value), [value]);

  // Filter mention items based on search
  const filteredItems = useMemo(() => {
    if (!mentionSearch) return mentionItems;
    const search = mentionSearch.toLowerCase();
    return mentionItems.filter(item =>
      item.name.toLowerCase().includes(search)
    );
  }, [mentionItems, mentionSearch]);

  // Reset index when filtered items change
  useEffect(() => {
    setMentionIndex(0);
  }, [filteredItems.length]);

  // Calculate dropdown position when showing
  const updateDropdownPosition = useCallback(() => {
    if (!textareaRef.current) return;

    const rect = textareaRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(filteredItems.length * 52 + 48, 240);

    // Position above the input
    setDropdownPosition({
      top: rect.top - dropdownHeight - 8,
      left: rect.left,
      width: rect.width,
    });
  }, [filteredItems.length]);

  // Update position when dropdown is shown or items change
  useEffect(() => {
    if (showMentions) {
      updateDropdownPosition();
      // Also update on scroll/resize
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [showMentions, updateDropdownPosition]);

  // Detect @ symbol and show mentions
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayValue = e.target.value;
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = newDisplayValue.slice(0, cursor);

    // Find the last @ that could be starting a new mention
    let lastAtIndex = -1;
    for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
      if (textBeforeCursor[i] === '@') {
        const afterAt = textBeforeCursor.slice(i + 1);
        // If there's no ] after the @, it's a new mention being typed
        if (!afterAt.includes(']')) {
          lastAtIndex = i;
          break;
        }
      }
    }

    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);
      // Show dropdown if search doesn't contain newlines and is reasonable length
      if (!searchText.includes('\n') && searchText.length < 50) {
        setShowMentions(true);
        setMentionSearch(searchText);
        setAtPosition(lastAtIndex);
      } else {
        setShowMentions(false);
        setAtPosition(null);
      }
    } else {
      setShowMentions(false);
      setAtPosition(null);
    }

    // Convert display value back to storage format
    const newStorageValue = convertDisplayToStorage(newDisplayValue, value, mentionItems);
    onChange(newStorageValue);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions) {
      if (filteredItems.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setMentionIndex(prev => (prev + 1) % filteredItems.length);
            return;
          case "ArrowUp":
            e.preventDefault();
            setMentionIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
            return;
          case "Enter":
            if (!e.shiftKey) {
              e.preventDefault();
              selectMention(filteredItems[mentionIndex]);
              return;
            }
            break;
          case "Tab":
            e.preventDefault();
            selectMention(filteredItems[mentionIndex]);
            return;
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        setAtPosition(null);
        return;
      }
    }

    onKeyDown?.(e);
  };

  // Insert selected mention
  const selectMention = useCallback((item: MentionItem) => {
    if (!textareaRef.current || atPosition === null) return;

    const textarea = textareaRef.current;
    const currentDisplay = displayValue;

    // Build the mention string
    const mentionDisplay = `@${item.name}`;
    const mentionStorage = `@[${item.name}](id:${item.id})`;

    // Replace @search with the mention in display value
    const beforeAt = currentDisplay.slice(0, atPosition);
    const cursor = textarea.selectionStart || 0;
    const afterCursor = currentDisplay.slice(cursor);

    const newDisplayValue = beforeAt + mentionDisplay + ' ' + afterCursor;

    // Convert to storage format
    const newStorageValue = convertDisplayToStorage(newDisplayValue, value, mentionItems, {
      displayMention: mentionDisplay,
      storageMention: mentionStorage,
      position: atPosition
    });

    onChange(newStorageValue);
    setShowMentions(false);
    setAtPosition(null);
    onMentionSelect?.(item);

    // Set cursor position after mention
    requestAnimationFrame(() => {
      const newCursor = atPosition + mentionDisplay.length + 1;
      textarea.setSelectionRange(newCursor, newCursor);
      textarea.focus();
    });
  }, [atPosition, displayValue, value, mentionItems, onChange, onMentionSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
        setAtPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (showMentions && dropdownRef.current) {
      const selectedEl = dropdownRef.current.querySelector(`[data-index="${mentionIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [mentionIndex, showMentions]);

  // Render dropdown via portal to escape overflow:hidden containers
  const dropdown = showMentions && dropdownPosition && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] max-h-[240px] overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      <div className="p-1">
        {filteredItems.length > 0 ? (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3 w-3" />
              {mentionSearch ? `Matching "${mentionSearch}"` : 'Your Aquatic Spaces'}
            </div>
            {filteredItems.map((item, index) => {
              const Icon = iconMap[item.icon || "fish"];
              return (
                <button
                  key={item.id}
                  type="button"
                  data-index={index}
                  className={cn(
                    "flex items-center gap-3 w-full px-2 py-2.5 rounded-md text-sm transition-colors touch-manipulation",
                    index === mentionIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted active:bg-muted"
                  )}
                  onClick={() => selectMention(item)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    selectMention(item);
                  }}
                  onMouseEnter={() => setMentionIndex(index)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    {item.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </>
        ) : (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            {mentionItems.length === 0 ? (
              <>No aquatic spaces yet. Create one to use @mentions.</>
            ) : (
              <>No matches for "{mentionSearch}"</>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex-1 min-h-[24px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base overflow-y-auto w-full",
          className
        )}
        rows={1}
      />
      {dropdown}
    </div>
  );
});

MentionInput.displayName = "MentionInput";

/**
 * Convert display format back to storage format
 */
function convertDisplayToStorage(
  newDisplay: string,
  oldStorage: string,
  items: MentionItem[],
  newMention?: { displayMention: string; storageMention: string; position: number }
): string {
  if (newMention) {
    let result = newDisplay;
    const beforeMention = result.slice(0, newMention.position);
    const afterMention = result.slice(newMention.position + newMention.displayMention.length);
    result = beforeMention + newMention.storageMention + afterMention;

    for (const item of items) {
      const displayPattern = new RegExp(`@${escapeRegex(item.name)}(?![\\]\\(])`, 'g');
      const storageFormat = `@[${item.name}](id:${item.id})`;
      result = result.replace(displayPattern, storageFormat);
    }

    return result;
  }

  let result = newDisplay;

  for (const item of items) {
    const displayPattern = new RegExp(`@${escapeRegex(item.name)}(?![\\]\\(])`, 'g');
    const storageFormat = `@[${item.name}](id:${item.id})`;
    result = result.replace(displayPattern, storageFormat);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
