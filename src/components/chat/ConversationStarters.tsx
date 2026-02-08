import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Fish, Droplet, Wrench, HelpCircle, AlertTriangle, Sparkles, MessageCircle } from 'lucide-react';
import { SuggestedQuestion } from '@/hooks/useSuggestedQuestions';
import { cn } from '@/lib/utils';

interface ConversationStartersProps {
  suggestions: SuggestedQuestion[];
  hasAquariums: boolean;
  hasAlerts: boolean;
  onSelectQuestion: (question: string) => void;
}

const categoryIcons = {
  maintenance: Wrench,
  health: Fish,
  alert: AlertTriangle,
  general: MessageCircle,
  'getting-started': HelpCircle,
  water: Droplet,
  equipment: Wrench,
};

const categoryColors = {
  maintenance: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  health: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  alert: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  general: 'bg-primary/10 text-primary border-primary/20',
  'getting-started': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  water: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  equipment: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export const ConversationStarters = React.memo(function ConversationStarters({
  suggestions,
  hasAquariums,
  hasAlerts,
  onSelectQuestion,
}: ConversationStartersProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 pb-4 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {!hasAquariums 
            ? "Let's get started" 
            : hasAlerts 
              ? "I noticed some concerns" 
              : "Quick questions"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon || categoryIcons[suggestion.category];
          const colorClass = categoryColors[suggestion.category];
          
          return (
            <Card
              key={suggestion.text}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md border",
                colorClass
              )}
              onClick={() => onSelectQuestion(suggestion.text)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", colorClass.split(' ')[0])}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground line-clamp-2">
                  {suggestion.text}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});
