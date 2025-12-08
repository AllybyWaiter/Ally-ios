import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface TaskSuggestion {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: string;
  recommendedDate?: string;
  reasoning?: string;
}

interface TaskSuggestionsProps {
  aquariumId: string;
}

const PRIORITY_COLORS = {
  low: "bg-blue-500/10 text-blue-600 border-blue-200",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  high: "bg-red-500/10 text-red-600 border-red-200",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  water_change: "Water Change",
  cleaning: "Cleaning",
  equipment_maintenance: "Equipment",
  testing: "Testing",
  feeding: "Feeding",
  other: "Other",
};

export function TaskSuggestions({ aquariumId }: TaskSuggestionsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingTaskId, setCreatingTaskId] = useState<number | null>(null);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-maintenance-tasks', {
        body: { aquariumId }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setSuggestions(data.suggestions || []);
      
      if (data.suggestions?.length > 0) {
        toast({
          title: "AI Suggestions Ready",
          description: `Found ${data.suggestions.length} recommended tasks`,
        });
      }
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (suggestion: TaskSuggestion, index: number) => {
    setCreatingTaskId(index);
    try {
      const dueDate = suggestion.recommendedDate 
        ? new Date(suggestion.recommendedDate).toISOString().split('T')[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default: 7 days from now

      const { error } = await supabase
        .from('maintenance_tasks')
        .insert({
          aquarium_id: aquariumId,
          task_name: suggestion.title,
          task_type: suggestion.category,
          due_date: dueDate,
          notes: suggestion.reasoning || suggestion.description,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Task Created",
        description: suggestion.title,
      });

      // Remove the suggestion from the list
      setSuggestions(prev => prev.filter((_, i) => i !== index));
      
      // Refresh tasks list
      queryClient.invalidateQueries({ queryKey: ["tasks", aquariumId] });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingTaskId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Task Suggestions</h3>
        </div>
        <Button
          onClick={handleGetSuggestions}
          disabled={isLoading || authLoading || !user}
          size="sm"
        >
          {isLoading || authLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {authLoading ? "Loading..." : "Analyzing..."}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get Suggestions
            </>
          )}
        </Button>
      </div>

      {suggestions.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Click "Get Suggestions" to let AI analyze your tank conditions and recommend maintenance tasks
          </p>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <Card key={index} className="p-4 border-l-4" style={{
            borderLeftColor: suggestion.priority === 'high' ? 'hsl(var(--destructive))' : 
                            suggestion.priority === 'medium' ? 'hsl(var(--warning))' : 
                            'hsl(var(--primary))'
          }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold">{suggestion.title}</h4>
                  <Badge variant="outline" className={PRIORITY_COLORS[suggestion.priority]}>
                    {suggestion.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_DISPLAY[suggestion.category] || suggestion.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>
                {suggestion.reasoning && (
                  <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{suggestion.reasoning}</span>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleCreateTask(suggestion, index)}
                disabled={creatingTaskId === index}
              >
                {creatingTaskId === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
