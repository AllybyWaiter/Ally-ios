/**
 * Calendar Keyboard Navigation Hook
 * 
 * Provides keyboard shortcuts for calendar navigation and task management.
 */

import { useEffect, useCallback } from 'react';
import { addDays, subDays, addWeeks, subWeeks } from 'date-fns';

interface UseCalendarKeyboardOptions {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  onOpenDay?: () => void;
  onAddTask?: () => void;
  onGoToToday?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

export function useCalendarKeyboard({
  selectedDate,
  onDateChange,
  onOpenDay,
  onAddTask,
  onGoToToday,
  onClose,
  enabled = true,
}: UseCalendarKeyboardOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't capture if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Cmd/Ctrl + Shift + N: Add new task (changed from Cmd+N to avoid browser conflict)
    if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      onAddTask?.();
      return;
    }

    // Cmd/Ctrl + Shift + T: Go to today (changed from Cmd+T to avoid browser new tab conflict)
    if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      onGoToToday?.();
      return;
    }

    // Escape: Close detail panel
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
      return;
    }

    // Arrow key navigation (only if we have a selected date)
    if (!selectedDate) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onDateChange(subDays(selectedDate, 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onDateChange(addDays(selectedDate, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        onDateChange(subWeeks(selectedDate, 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        onDateChange(addWeeks(selectedDate, 1));
        break;
      case 'Enter':
        e.preventDefault();
        onOpenDay?.();
        break;
    }
  }, [enabled, selectedDate, onDateChange, onOpenDay, onAddTask, onGoToToday, onClose]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  // Return shortcut descriptions for UI display
  return {
    shortcuts: [
      { key: '←→↑↓', description: 'Navigate days' },
      { key: 'Enter', description: 'Open day details' },
      { key: '⌘⇧N', description: 'New task' },
      { key: '⌘⇧T', description: 'Go to today' },
      { key: 'Esc', description: 'Close panel' },
    ],
  };
}
