/**
 * Quick Add Task FAB
 * 
 * Floating action button for quick task creation.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAddTaskFABProps {
  onClick: () => void;
  isVisible?: boolean;
}

export function QuickAddTaskFAB({ onClick, isVisible = true }: QuickAddTaskFABProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  // Track scroll to adjust FAB visibility/position
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + N) - uses ref to avoid re-registering on every render
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onClickRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'fixed z-50 transition-all duration-300',
            'bottom-20 right-4 md:bottom-8 md:right-8',
            hasScrolled && 'bottom-24 md:bottom-12',
          )}
        >
          <Button
            size="lg"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'h-14 rounded-full shadow-lg hover:shadow-xl transition-all',
              'bg-primary hover:bg-primary/90',
              isHovered ? 'w-auto px-6' : 'w-14',
            )}
          >
            <motion.div
              animate={{ rotate: isHovered ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>

            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="ml-2 whitespace-nowrap overflow-hidden"
                >
                  Add Task
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          {/* Keyboard shortcut hint (desktop only) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="hidden md:block absolute -top-8 left-1/2 -translate-x-1/2"
          >
            <span className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border/50 whitespace-nowrap">
              ⌘N
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
