import React from 'react';
import { Button } from '@/components/ui/button';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FollowUpItem {
  label: string;    // Short text shown on button
  template: string; // Answer template filled in input
}

interface FollowUpSuggestionsProps {
  suggestions: FollowUpItem[];
  onSelectSuggestion: (template: string) => void;
}

// Parse follow-up suggestions from AI response content
export function parseFollowUpSuggestions(content: string): {
  cleanContent: string;
  suggestions: FollowUpItem[];
} {
  const followUpRegex = /<!-- FOLLOW_UPS -->([\s\S]*?)<!-- \/FOLLOW_UPS -->/;
  const match = content.match(followUpRegex);

  if (!match) {
    return { cleanContent: content, suggestions: [] };
  }

  const suggestionsBlock = match[1];
  const cleanContent = content.replace(followUpRegex, '').trim();

  // Parse suggestions - new format: "Label" | "Template" or old format: "Question"
  const suggestions = suggestionsBlock
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line))
    .map(line => {
      // Remove bullet/number
      const cleaned = line
        .replace(/^[-*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim();
      
      // Check for new format: "Label" | "Template"
      const pipeMatch = cleaned.match(/^["']?([^"'|]+)["']?\s*\|\s*["']?([^"']+)["']?$/);
      
      if (pipeMatch) {
        return {
          label: pipeMatch[1].trim(),
          template: pipeMatch[2].trim()
        };
      }
      
      // Fallback for old format: just a question - use as both label and template
      const text = cleaned.replace(/^["']|["']$/g, '').trim();
      return {
        label: text,
        template: text
      };
    })
    .filter(s => s.label.length > 0)
    .slice(0, 3); // Max 3 suggestions

  return { cleanContent, suggestions };
}

export const FollowUpSuggestions = React.memo(function FollowUpSuggestions({
  suggestions,
  onSelectSuggestion,
}: FollowUpSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((item, index) => (
        <Button
          key={`${item.label}-${item.template}-${index}`}
          variant="outline"
          size="sm"
          className={cn(
            "h-auto py-1.5 px-3 text-xs font-normal text-left",
            "bg-muted/50 hover:bg-muted border-border/50",
            "max-w-[200px] whitespace-normal"
          )}
          onClick={() => onSelectSuggestion(item.template)}
        >
          <PenLine className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span className="line-clamp-2">{item.label}</span>
        </Button>
      ))}
    </div>
  );
});
