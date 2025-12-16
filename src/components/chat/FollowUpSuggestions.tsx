import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

// Parse follow-up suggestions from AI response content
export function parseFollowUpSuggestions(content: string): {
  cleanContent: string;
  suggestions: string[];
} {
  const followUpRegex = /<!-- FOLLOW_UPS -->([\s\S]*?)<!-- \/FOLLOW_UPS -->/;
  const match = content.match(followUpRegex);

  if (!match) {
    return { cleanContent: content, suggestions: [] };
  }

  const suggestionsBlock = match[1];
  const cleanContent = content.replace(followUpRegex, '').trim();

  // Parse suggestions (bullet points or numbered list)
  const suggestions = suggestionsBlock
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line))
    .map(line => {
      // Remove bullet/number and quotes
      return line
        .replace(/^[-*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^["']|["']$/g, '')
        .trim();
    })
    .filter(s => s.length > 0)
    .slice(0, 3); // Max 3 suggestions

  return { cleanContent, suggestions };
}

export const FollowUpSuggestions = React.memo(function FollowUpSuggestions({
  suggestions,
  onSelectSuggestion,
}: FollowUpSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className={cn(
            "h-auto py-1.5 px-3 text-xs font-normal text-left",
            "bg-muted/50 hover:bg-muted border-border/50",
            "max-w-[250px] whitespace-normal"
          )}
          onClick={() => onSelectSuggestion(suggestion)}
        >
          <MessageCircle className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span className="line-clamp-2">{suggestion}</span>
        </Button>
      ))}
    </div>
  );
});
