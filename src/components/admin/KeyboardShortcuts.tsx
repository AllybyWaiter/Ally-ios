import { useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


interface ShortcutGroup {
  name: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'U'], description: 'Go to Users' },
      { keys: ['G', 'T'], description: 'Go to Tickets' },
      { keys: ['G', 'B'], description: 'Go to Blog' },
      { keys: ['G', 'S'], description: 'Go to System Health' },
    ],
  },
  {
    name: 'Actions',
    shortcuts: [
      { keys: ['R'], description: 'Refresh current view' },
      { keys: ['E'], description: 'Export data' },
      { keys: ['N'], description: 'New item (context-aware)' },
      { keys: ['Esc'], description: 'Close dialog / Cancel' },
    ],
  },
  {
    name: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['⌘', '/'], description: 'Toggle sidebar' },
    ],
  },
];

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommandPaletteOpen: () => void;
  onSectionChange: (section: string) => void;
}

export function KeyboardShortcuts({
  open,
  onOpenChange,
  onCommandPaletteOpen,
  onSectionChange,
}: KeyboardShortcutsProps) {
  // Track timeouts for cleanup
  const gKeyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const secondKeyListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const isMeta = event.metaKey || event.ctrlKey;

    // Command palette: ⌘K
    if (isMeta && key === 'k') {
      event.preventDefault();
      onCommandPaletteOpen();
      return;
    }

    // Help: ?
    if (key === '?' && !isMeta) {
      event.preventDefault();
      onOpenChange(true);
      return;
    }

    // Navigation shortcuts (G + key)
    if (key === 'g' && !isMeta) {
      // Clear any existing listeners/timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (secondKeyListenerRef.current) {
        document.removeEventListener('keydown', secondKeyListenerRef.current);
      }

      const handleSecondKey = (e: KeyboardEvent) => {
        const secondKey = e.key.toLowerCase();
        const navigationMap: Record<string, string> = {
          d: 'overview',
          u: 'users',
          t: 'tickets',
          b: 'blog',
          s: 'system-health',
          r: 'roles',
          a: 'activity',
          c: 'contacts',
          w: 'waitlist',
          f: 'feature-flags',
        };

        if (navigationMap[secondKey]) {
          e.preventDefault();
          onSectionChange(navigationMap[secondKey]);
        }
        
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
        }
        document.removeEventListener('keydown', handleSecondKey);
        secondKeyListenerRef.current = null;
      };

      secondKeyListenerRef.current = handleSecondKey;

      // Listen for the second key
      gKeyTimeoutRef.current = setTimeout(() => {
        document.addEventListener('keydown', handleSecondKey, { once: true });
        // Remove listener after 1 second if no key pressed
        cleanupTimeoutRef.current = setTimeout(() => {
          document.removeEventListener('keydown', handleSecondKey);
          secondKeyListenerRef.current = null;
        }, 1000);
      }, 0);
    }

    // Escape to close dialogs
    if (key === 'escape') {
      onOpenChange(false);
    }
  }, [onCommandPaletteOpen, onOpenChange, onSectionChange]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (gKeyTimeoutRef.current) {
        clearTimeout(gKeyTimeoutRef.current);
      }
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (secondKeyListenerRef.current) {
        document.removeEventListener('keydown', secondKeyListenerRef.current);
      }
    };
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate quickly through the admin panel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.name}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                {group.name}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded border bg-muted font-mono text-xs"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="inline-flex items-center justify-center px-1 rounded border bg-muted font-mono text-xs">?</kbd> to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
