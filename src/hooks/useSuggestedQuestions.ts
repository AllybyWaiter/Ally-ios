import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { fetchActiveAlerts } from '@/infrastructure/queries/waterTestAlerts';
import { fetchUpcomingTasks } from '@/infrastructure/queries/maintenanceTasks';
import { Droplet, Fish, AlertTriangle, Wrench, Calendar, HelpCircle, Sparkles, Leaf, Waves } from 'lucide-react';

export interface SuggestedQuestion {
  text: string;
  category: 'maintenance' | 'health' | 'alert' | 'general' | 'getting-started' | 'water' | 'equipment';
  priority: number;
  icon: typeof Droplet;
}

interface UseSuggestedQuestionsParams {
  selectedAquariumId: string | null;
  aquariums: Array<{ id: string; name: string; type: string }>;
  hasMessages: boolean;
}

export function useSuggestedQuestions({ 
  selectedAquariumId, 
  aquariums, 
  hasMessages 
}: UseSuggestedQuestionsParams) {
  const { user } = useAuth();

  // Fetch active alerts for context
  const { data: alerts = [] } = useQuery({
    queryKey: queryKeys.waterTests.alerts(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchActiveAlerts(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch upcoming/overdue tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'upcoming', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchUpcomingTasks(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const selectedAquarium = useMemo(() => {
    return aquariums.find(a => a.id === selectedAquariumId);
  }, [aquariums, selectedAquariumId]);

  const suggestions = useMemo((): SuggestedQuestion[] => {
    const questions: SuggestedQuestion[] = [];

    // No aquariums - getting started
    if (aquariums.length === 0) {
      return [
        { text: "How do I set up my first aquarium?", category: 'getting-started', priority: 1, icon: HelpCircle },
        { text: "What equipment do I need for a freshwater tank?", category: 'equipment', priority: 2, icon: Wrench },
        { text: "Help me understand water chemistry basics", category: 'water', priority: 3, icon: Droplet },
        { text: "What are good beginner fish?", category: 'health', priority: 4, icon: Fish },
      ];
    }

    // Has active alerts - prioritize alert questions
    const selectedAlerts = alerts.filter(a => 
      !selectedAquariumId || a.aquarium_id === selectedAquariumId
    );
    
    if (selectedAlerts.length > 0) {
      const criticalAlert = selectedAlerts.find(a => a.severity === 'critical');
      const warningAlert = selectedAlerts.find(a => a.severity === 'warning');
      
      if (criticalAlert) {
        questions.push({
          text: `Why is my ${criticalAlert.parameter_name} ${criticalAlert.alert_type}?`,
          category: 'alert',
          priority: 0,
          icon: AlertTriangle,
        });
      }
      if (warningAlert && questions.length < 2) {
        questions.push({
          text: `Help with my ${warningAlert.parameter_name} levels`,
          category: 'alert',
          priority: 1,
          icon: AlertTriangle,
        });
      }
    }

    // Has overdue tasks
    const overdueTasks = tasks.filter(t => 
      new Date(t.due_date) < new Date() && t.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      questions.push({
        text: `What maintenance is overdue?`,
        category: 'maintenance',
        priority: 2,
        icon: Calendar,
      });
    }

    // Aquarium type-specific questions
    if (selectedAquarium) {
      const type = selectedAquarium.type;
      
      if (type === 'freshwater' || type === 'planted') {
        questions.push(
          { text: "What are ideal water parameters for my tank?", category: 'water', priority: 3, icon: Droplet },
          { text: "Any fish compatibility concerns?", category: 'health', priority: 4, icon: Fish },
        );
        if (type === 'planted') {
          questions.push(
            { text: "Tips for my planted tank?", category: 'health', priority: 5, icon: Leaf },
          );
        }
      } else if (type === 'saltwater' || type === 'reef') {
        questions.push(
          { text: "Check my reef parameters", category: 'water', priority: 3, icon: Droplet },
          { text: "Coral care recommendations", category: 'health', priority: 4, icon: Sparkles },
        );
      } else if (type === 'pool' || type === 'spa') {
        questions.push(
          { text: "How much chlorine should I add?", category: 'water', priority: 3, icon: Droplet },
          { text: "Is it time to shock my pool?", category: 'maintenance', priority: 4, icon: Waves },
        );
      }
    }

    // General fallback questions
    if (questions.length < 4) {
      const fallbacks: SuggestedQuestion[] = [
        { text: "How's my tank looking?", category: 'general', priority: 10, icon: Fish },
        { text: "When should I do a water change?", category: 'maintenance', priority: 11, icon: Droplet },
        { text: "Equipment maintenance tips", category: 'equipment', priority: 12, icon: Wrench },
      ];
      
      for (const fb of fallbacks) {
        if (questions.length < 4 && !questions.some(q => q.text === fb.text)) {
          questions.push(fb);
        }
      }
    }

    // Sort by priority and limit to 4
    return questions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [aquariums, selectedAquariumId, selectedAquarium, alerts, tasks]);

  return {
    suggestions,
    hasAlerts: alerts.length > 0,
    hasOverdueTasks: tasks.some(t => new Date(t.due_date) < new Date() && t.status !== 'completed'),
  };
}
