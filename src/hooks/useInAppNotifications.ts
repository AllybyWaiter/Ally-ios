import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InAppNotification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  sent_at: string;
  isLocal: true;
}

/**
 * Generates client-side in-app notifications based on current aquarium state.
 * These appear in the Activity tab of NotificationBell as a stopgap until
 * push notifications are fully configured.
 *
 * Checks for:
 * - Overdue maintenance tasks
 * - Tasks due today or tomorrow
 * - Water tests older than 7 days
 * - Aquariums with no water tests at all
 */
export function useInAppNotifications(userId: string | undefined) {
  const { data: rawNotifications = [] } = useQuery<InAppNotification[]>({
    queryKey: ['inAppNotifications', userId],
    queryFn: async (): Promise<InAppNotification[]> => {
      if (!userId) return [];

      const notifications: InAppNotification[] = [];
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

      // Fetch user's active aquariums
      const { data: aquariums, error: aqError } = await supabase
        .from('aquariums')
        .select('id, name')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (aqError || !aquariums || aquariums.length === 0) return [];

      const aquariumIds = aquariums.map((a) => a.id);
      const aquariumMap = new Map(aquariums.map((a) => [a.id, a.name]));

      // Fetch overdue + upcoming tasks (due up to tomorrow)
      const { data: tasks } = await supabase
        .from('maintenance_tasks')
        .select('id, task_name, due_date, aquarium_id')
        .in('aquarium_id', aquariumIds)
        .eq('status', 'pending')
        .lte('due_date', tomorrow)
        .order('due_date', { ascending: true })
        .limit(20);

      for (const task of tasks || []) {
        const aquariumName =
          aquariumMap.get(task.aquarium_id) || 'your aquatic space';
        const isOverdue = task.due_date < today;
        const isToday = task.due_date === today;

        if (isOverdue) {
          const daysOverdue = Math.max(1, Math.floor(
            (now.getTime() - new Date(task.due_date).getTime()) /
              (1000 * 60 * 60 * 24)
          ));
          notifications.push({
            id: `inapp-overdue-${task.id}`,
            notification_type: 'task_reminder',
            title: `Overdue: ${task.task_name}`,
            body: `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue for ${aquariumName}`,
            sent_at: task.due_date,
            isLocal: true,
          });
        } else if (isToday) {
          notifications.push({
            id: `inapp-today-${task.id}`,
            notification_type: 'task_reminder',
            title: `Due Today: ${task.task_name}`,
            body: `Task due today for ${aquariumName}`,
            sent_at: now.toISOString(),
            isLocal: true,
          });
        } else {
          notifications.push({
            id: `inapp-upcoming-${task.id}`,
            notification_type: 'task_reminder',
            title: `Upcoming: ${task.task_name}`,
            body: `Due tomorrow for ${aquariumName}`,
            sent_at: now.toISOString(),
            isLocal: true,
          });
        }
      }

      // Fetch latest water test per aquarium (single query, group client-side)
      const { data: allTests } = await supabase
        .from('water_tests')
        .select('aquarium_id, test_date')
        .in('aquarium_id', aquariumIds)
        .order('test_date', { ascending: false })
        .limit(aquariumIds.length * 2);

      const latestTestByAquarium = new Map<string, string>();
      for (const test of allTests || []) {
        if (!latestTestByAquarium.has(test.aquarium_id)) {
          latestTestByAquarium.set(test.aquarium_id, test.test_date);
        }
      }

      for (const aquarium of aquariums) {
        const lastTestDate = latestTestByAquarium.get(aquarium.id);
        if (!lastTestDate) {
          notifications.push({
            id: `inapp-no-test-${aquarium.id}`,
            notification_type: 'water_alert',
            title: `Test Your Water: ${aquarium.name}`,
            body: 'No water tests recorded yet. Test your water to start tracking.',
            sent_at: now.toISOString(),
            isLocal: true,
          });
        } else {
          const daysSince = Math.floor(
            (now.getTime() - new Date(lastTestDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (daysSince >= 7) {
            notifications.push({
              id: `inapp-stale-test-${aquarium.id}`,
              notification_type: 'water_alert',
              title: `Water Test Reminder: ${aquarium.name}`,
              body: `It's been ${daysSince} days since your last water test.`,
              sent_at: lastTestDate,
              isLocal: true,
            });
          }
        }
      }

      return notifications;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const count = useMemo(() => rawNotifications.length, [rawNotifications]);

  return { notifications: rawNotifications, count };
}
