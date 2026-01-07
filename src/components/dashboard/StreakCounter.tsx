import { Flame, Zap } from "lucide-react";
import { useProfileContext } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StreakCounterProps {
  className?: string;
  showLongest?: boolean;
}

export function StreakCounter({ className, showLongest = false }: StreakCounterProps) {
  const { currentStreak, longestStreak } = useProfileContext();
  
  const streak = currentStreak ?? 0;
  const longest = longestStreak ?? 0;
  
  // Determine streak tier for visual effects
  const getTier = (s: number) => {
    if (s >= 30) return "legendary";
    if (s >= 14) return "epic";
    if (s >= 7) return "great";
    if (s >= 3) return "good";
    return "starting";
  };
  
  const tier = getTier(streak);
  
  const tierColors = {
    starting: "text-muted-foreground",
    good: "text-orange-500",
    great: "text-orange-400",
    epic: "text-amber-500",
    legendary: "text-amber-400",
  };
  
  const tierBg = {
    starting: "bg-muted/50",
    good: "bg-orange-500/10",
    great: "bg-orange-400/15",
    epic: "bg-amber-500/20",
    legendary: "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
  };

  if (streak === 0 && !showLongest) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={streak}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            tierBg[tier]
          )}
        >
          <motion.div
            animate={streak >= 3 ? { 
              scale: [1, 1.2, 1],
              rotate: [0, -5, 5, 0]
            } : {}}
            transition={{ 
              duration: 0.5, 
              repeat: streak >= 7 ? 3 : 0, // Changed from Infinity to 3 for performance
              repeatDelay: streak >= 14 ? 5 : 3,
            }}
          >
            <Flame className={cn("w-4 h-4", tierColors[tier])} />
          </motion.div>
          <span className={cn("font-semibold text-sm", tierColors[tier])}>
            {streak} day{streak !== 1 ? 's' : ''}
          </span>
        </motion.div>
      </AnimatePresence>
      
      {showLongest && longest > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>Best: {longest}</span>
        </div>
      )}
    </div>
  );
}
