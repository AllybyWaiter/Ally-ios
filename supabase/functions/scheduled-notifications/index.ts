import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders, securityHeaders } from '../_shared/cors.ts';
import { timingSafeEqual } from '../_shared/validation.ts';

// Row types for health score calculations (mirrors Supabase schema)
interface WaterTestRow {
  id: string;
  test_date: string;
}

interface LivestockRow {
  id: string;
  quantity: number | null;
  health_status: string | null;
}

interface MaintenanceTaskRow {
  id: string;
  due_date: string;
  status: string;
  completed_date: string | null;
}

// Joined aquarium fields from !inner selects
interface JoinedAquarium {
  user_id: string;
  name: string;
}

interface NWSAlert {
  id: string;
  properties: {
    severity: string;
    certainty: string;
    urgency: string;
    event: string;
    headline: string;
    description: string;
    instruction: string;
    expires: string;
    areaDesc: string;
  };
}

async function fetchNWSAlerts(latitude: number, longitude: number): Promise<NWSAlert[]> {
  try {
    const response = await fetch(
      `https://api.weather.gov/alerts/active?point=${latitude},${longitude}&status=actual`,
      {
        headers: {
          'User-Agent': 'Ally by WA.I.TER (info@allybywaiter.com)',
          'Accept': 'application/geo+json',
        },
      }
    );
    
    if (!response.ok) {
      console.log(`NWS API returned ${response.status} for ${latitude},${longitude}`);
      return [];
    }
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Failed to fetch NWS alerts:', error);
    return [];
  }
}

// Health score calculation functions (mirrors client-side logic)
function calculateWaterTestScore(tests: WaterTestRow[]): number {
  if (!tests || tests.length === 0) return 30; // Match client: no tests = low score

  const now = new Date();
  const latestTest = tests[0];
  const testDate = new Date(latestTest.test_date);
  const daysSinceTest = Math.floor((now.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));

  // Freshness penalty (aligned with client-side values)
  let freshnessScore = 100;
  if (daysSinceTest > 14) freshnessScore = 50;
  else if (daysSinceTest > 7) freshnessScore = 75;
  else if (daysSinceTest > 3) freshnessScore = 90;

  return freshnessScore;
}

function calculateLivestockScore(livestock: LivestockRow[]): number {
  if (!livestock || livestock.length === 0) return 100; // Match client: no livestock = perfect

  let totalScore = 0;
  let totalQuantity = 0;

  for (const animal of livestock) {
    const quantity = animal.quantity || 1;
    let healthValue = 100;

    // Aligned with client-side healthScores in useAquariumHealthScore.ts
    switch (animal.health_status) {
      case 'healthy': healthValue = 100; break;
      case 'quarantine': healthValue = 70; break;
      case 'stressed': healthValue = 50; break;
      case 'sick': healthValue = 25; break;
      case 'deceased': healthValue = 0; break;
      default: healthValue = 70;
    }

    totalScore += healthValue * quantity;
    totalQuantity += quantity;
  }

  return totalQuantity > 0 ? Math.round(totalScore / totalQuantity) : 100;
}

function calculateMaintenanceScore(tasks: MaintenanceTaskRow[]): number {
  if (!tasks || tasks.length === 0) return 80; // Neutral if no tasks
  
  const now = new Date();
  let overdueCount = 0;
  let pendingCount = 0;
  let completedCount = 0;
  
  for (const task of tasks) {
    if (task.status === 'completed') {
      completedCount++;
    } else if (task.status === 'pending') {
      const dueDate = new Date(task.due_date);
      if (dueDate < now) {
        overdueCount++;
      } else {
        pendingCount++;
      }
    }
  }
  
  const totalTasks = overdueCount + pendingCount + completedCount;
  if (totalTasks === 0) return 80;
  
  // Penalty for overdue tasks (aligned with client: 15 per task, max 60)
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 80;
  const overduePenalty = Math.min(overdueCount * 15, 60);

  return Math.round(Math.max(0, Math.min(100, completionRate - overduePenalty)));
}

function calculateConsistencyScore(tests: WaterTestRow[], tasks: MaintenanceTaskRow[]): number {
  // Check testing regularity over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTests = (tests || []).filter(t => new Date(t.test_date) >= thirtyDaysAgo);
  const recentCompletedTasks = (tasks || []).filter(t => 
    t.status === 'completed' && 
    t.completed_date && 
    new Date(t.completed_date) >= thirtyDaysAgo
  );
  
  // Ideal: at least 1 test per week (4 tests in 30 days)
  const testingScore = Math.min(100, (recentTests.length / 4) * 100);
  
  // Task completion rate
  const taskScore = recentCompletedTasks.length > 0 ? 100 : 50;
  
  return Math.round((testingScore + taskScore) / 2);
}

function calculateHealthScore(tests: WaterTestRow[], livestock: LivestockRow[], tasks: MaintenanceTaskRow[]): number {
  const waterScore = calculateWaterTestScore(tests);
  const livestockScore = calculateLivestockScore(livestock);
  const maintenanceScore = calculateMaintenanceScore(tasks);
  const consistencyScore = calculateConsistencyScore(tests, tasks);
  
  // Weighted average matching client-side logic
  return Math.round(
    waterScore * 0.40 +
    livestockScore * 0.25 +
    maintenanceScore * 0.20 +
    consistencyScore * 0.15
  );
}

function getHealthLabel(score: number): { label: string; severity: 'critical' | 'warning' } {
  if (score < 25) return { label: 'Critical', severity: 'critical' };
  return { label: 'Needs Attention', severity: 'warning' };
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(JSON.stringify({ requestId, message: 'scheduled-notifications started', time: new Date().toISOString() }));

  try {
    // ========== SERVICE-ROLE AUTH ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(JSON.stringify({ requestId, error: 'Missing authorization header' }));
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...getCorsHeaders(req), ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseServiceKey || !timingSafeEqual(token, supabaseServiceKey)) {
      console.error(JSON.stringify({ requestId, error: 'Invalid service role key' }));
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...getCorsHeaders(req), ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    let taskNotificationsSent = 0;
    let alertNotificationsSent = 0;
    let weatherNotificationsSent = 0;
    let healthNotificationsSent = 0;

    // Get all users with push enabled and task reminders enabled
    const { data: enabledUsers, error: usersError } = await supabase
      .from('notification_preferences')
      .select('user_id, reminder_hours_before')
      .eq('push_enabled', true)
      .eq('task_reminders_enabled', true)
      .limit(5000);

    if (usersError) {
      console.error(JSON.stringify({ requestId, error: 'Failed to fetch users', message: usersError.message }));
      throw usersError;
    }

    console.log(JSON.stringify({ requestId, message: `Found ${enabledUsers?.length || 0} users with push enabled` }));

    // Process task reminders for each user
    for (const userPref of enabledUsers || []) {
      const reminderWindowHours = userPref.reminder_hours_before || 24;
      const reminderWindowMs = reminderWindowHours * 60 * 60 * 1000;
      
      // Find tasks due within the reminder window that haven't been notified
      const windowStart = now;
      const windowEnd = new Date(now.getTime() + reminderWindowMs);

      const { data: tasks, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select(`
          id,
          task_name,
          due_date,
          aquarium_id,
          aquariums!inner(user_id, name)
        `)
        .eq('aquariums.user_id', userPref.user_id)
        .eq('status', 'pending')
        .gte('due_date', windowStart.toISOString().split('T')[0])
        .lte('due_date', windowEnd.toISOString().split('T')[0]);

      if (tasksError) {
        console.error(JSON.stringify({ requestId, error: 'Failed to fetch tasks', userId: userPref.user_id }));
        continue;
      }

      for (const task of tasks || []) {
        // Check if already notified
        const { data: existingLog } = await supabase
          .from('notification_log')
          .select('id')
          .eq('user_id', userPref.user_id)
          .eq('notification_type', 'task_reminder')
          .eq('reference_id', task.id)
          .maybeSingle();

        if (existingLog) continue;

        // Send notification
        const aquariumName = (task.aquariums as unknown as JoinedAquarium | null)?.name || 'your aquatic space';
        const dueDate = new Date(task.due_date);
        const isToday = dueDate.toDateString() === now.toDateString();
        const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

        let timeText = 'soon';
        if (isToday) timeText = 'today';
        else if (isTomorrow) timeText = 'tomorrow';

        try {
          const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: userPref.user_id,
              title: `Task Reminder: ${task.task_name}`,
              body: `Due ${timeText} for ${aquariumName}`,
              tag: `task-${task.id}`,
              url: `/aquarium/${task.aquarium_id}`,
              notificationType: 'task_reminder',
              referenceId: task.id,
            },
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
          });

          if (sendError) {
            console.error(JSON.stringify({ requestId, error: 'Task push invoke failed', message: sendError.message, taskId: task.id }));
          } else {
            taskNotificationsSent++;
            console.log(JSON.stringify({ requestId, message: 'Task notification sent', taskId: task.id }));
          }
        } catch (error) {
          console.error(JSON.stringify({ requestId, error: 'Failed to send task notification', taskId: task.id, message: String(error) }));
        }
      }
    }

    // Process water test alerts
    const { data: alertUsers, error: alertUsersError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('push_enabled', true)
      .eq('water_alerts_enabled', true)
      .limit(5000);

    if (!alertUsersError && alertUsers) {
      // Find recent alerts (last 15 minutes) that haven't been notified
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      for (const userPref of alertUsers) {
        const { data: alerts, error: alertsError } = await supabase
          .from('water_test_alerts')
          .select(`
            id,
            parameter_name,
            alert_type,
            severity,
            message,
            aquarium_id,
            aquariums!inner(user_id, name)
          `)
          .eq('aquariums.user_id', userPref.user_id)
          .eq('is_dismissed', false)
          .gte('created_at', fifteenMinutesAgo.toISOString());

        if (alertsError) {
          console.error(JSON.stringify({ requestId, error: 'Failed to fetch alerts', userId: userPref.user_id }));
          continue;
        }

        for (const alert of alerts || []) {
          // Check if already notified
          const { data: existingLog } = await supabase
            .from('notification_log')
            .select('id')
            .eq('user_id', userPref.user_id)
            .eq('notification_type', 'water_alert')
            .eq('reference_id', alert.id)
            .maybeSingle();

          if (existingLog) continue;

          const aquariumName = (alert.aquariums as unknown as JoinedAquarium | null)?.name || 'your aquatic space';
          const severityEmoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';

          try {
            const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: userPref.user_id,
                title: `${severityEmoji} Water Alert: ${alert.parameter_name}`,
                body: `${alert.message} in ${aquariumName}`,
                tag: `alert-${alert.id}`,
                url: `/aquarium/${alert.aquarium_id}`,
                notificationType: 'water_alert',
                referenceId: alert.id,
                requireInteraction: alert.severity === 'critical',
              },
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
            });

            if (sendError) {
              console.error(JSON.stringify({ requestId, error: 'Water alert push invoke failed', message: sendError.message, alertId: alert.id }));
            } else {
              alertNotificationsSent++;
              console.log(JSON.stringify({ requestId, message: 'Water alert notification sent', alertId: alert.id }));
            }
          } catch (error) {
            console.error(JSON.stringify({ requestId, error: 'Failed to send alert notification', alertId: alert.id, message: String(error) }));
          }
        }
      }
    }

    // Process health score alerts
    const { data: healthUsers, error: healthUsersError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('push_enabled', true)
      .eq('health_alerts_enabled', true)
      .limit(5000);

    if (!healthUsersError && healthUsers) {
      console.log(JSON.stringify({ requestId, message: `Processing health alerts for ${healthUsers.length} users` }));

      for (const userPref of healthUsers) {
        // Get all aquariums for this user
        const { data: aquariums, error: aquariumsError } = await supabase
          .from('aquariums')
          .select('id, name')
          .eq('user_id', userPref.user_id)
          .eq('status', 'active');

        if (aquariumsError || !aquariums) {
          console.error(JSON.stringify({ requestId, error: 'Failed to fetch aquariums', userId: userPref.user_id }));
          continue;
        }

        for (const aquarium of aquariums) {
          // Fetch data needed for health calculation
          const [testsResult, livestockResult, tasksResult] = await Promise.all([
            supabase
              .from('water_tests')
              .select('id, test_date')
              .eq('aquarium_id', aquarium.id)
              .order('test_date', { ascending: false })
              .limit(10),
            supabase
              .from('livestock')
              .select('id, quantity, health_status')
              .eq('aquarium_id', aquarium.id),
            supabase
              .from('maintenance_tasks')
              .select('id, due_date, status, completed_date')
              .eq('aquarium_id', aquarium.id)
              .gte('due_date', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          ]);

          const tests = testsResult.data || [];
          const livestock = livestockResult.data || [];
          const tasks = tasksResult.data || [];

          // Calculate health score
          const healthScore = calculateHealthScore(tests, livestock, tasks);

          // Only alert if below 50%
          if (healthScore >= 50) {
            // Health is OK - check if we need to clear old notifications for recovery
            // Delete old health alert log entries for this aquarium so future drops can be notified
            await supabase
              .from('notification_log')
              .delete()
              .eq('user_id', userPref.user_id)
              .eq('notification_type', 'health_alert')
              .like('reference_id', `${aquarium.id}-%`);
            continue;
          }

          // Determine severity bucket for deduplication
          const { severity } = getHealthLabel(healthScore);
          const notificationRefId = `${aquarium.id}-${severity}`;

          // Check if already notified for this severity level in last 24 hours
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const { data: existingLog } = await supabase
            .from('notification_log')
            .select('id, sent_at')
            .eq('user_id', userPref.user_id)
            .eq('notification_type', 'health_alert')
            .eq('reference_id', notificationRefId)
            .gte('sent_at', oneDayAgo.toISOString())
            .maybeSingle();

          if (existingLog) {
            console.log(JSON.stringify({ 
              requestId, 
              message: 'Health alert already sent', 
              aquariumId: aquarium.id, 
              score: healthScore 
            }));
            continue;
          }

          // Send health alert notification
          const severityEmoji = severity === 'critical' ? '🔴' : '🟡';
          const title = severity === 'critical' 
            ? `${severityEmoji} Critical: ${aquarium.name} Needs Attention`
            : `${severityEmoji} Health Declining: ${aquarium.name}`;
          const body = severity === 'critical'
            ? `Health score is ${healthScore}%. Immediate action recommended!`
            : `Health score dropped to ${healthScore}%. Check water parameters and maintenance.`;

          try {
            const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: userPref.user_id,
                title,
                body,
                tag: `health-${aquarium.id}`,
                url: `/aquarium/${aquarium.id}`,
                notificationType: 'health_alert',
                referenceId: notificationRefId,
                requireInteraction: severity === 'critical',
              },
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
            });

            if (sendError) {
              console.error(JSON.stringify({ 
                requestId, 
                error: 'Health push invoke failed', 
                message: sendError.message,
                aquariumId: aquarium.id 
              }));
            } else {
              healthNotificationsSent++;
              console.log(JSON.stringify({ 
                requestId, 
                message: 'Health alert sent', 
                aquariumId: aquarium.id, 
                score: healthScore,
                severity
              }));
            }
          } catch (error) {
            console.error(JSON.stringify({ 
              requestId, 
              error: 'Failed to send health notification', 
              aquariumId: aquarium.id,
              message: String(error)
            }));
          }
        }
      }
    }

    // Process severe weather alerts (NWS API - US only)
    const { data: weatherUsers, error: weatherUsersError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('push_enabled', true)
      .eq('weather_alerts_enabled', true)
      .limit(5000);

    if (!weatherUsersError && weatherUsers) {
      for (const userPref of weatherUsers) {
        // Get user's location from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('latitude, longitude, weather_enabled')
          .eq('user_id', userPref.user_id)
          .maybeSingle();

        if (profileError || !profile?.weather_enabled || !profile?.latitude || !profile?.longitude) {
          continue;
        }

        // Fetch NWS alerts for user's location
        const nwsAlerts = await fetchNWSAlerts(profile.latitude, profile.longitude);
        
        // Filter for Extreme or Severe severity only
        const severeAlerts = nwsAlerts.filter(alert => 
          alert.properties.severity === 'Extreme' || alert.properties.severity === 'Severe'
        );

        for (const nwsAlert of severeAlerts) {
          const alertId = nwsAlert.id;
          
          // Check if already notified for this alert
          const { data: existingNotification } = await supabase
            .from('weather_alerts_notified')
            .select('id')
            .eq('user_id', userPref.user_id)
            .eq('alert_id', alertId)
            .maybeSingle();

          if (existingNotification) continue;

          const props = nwsAlert.properties;
          const severityEmoji = props.severity === 'Extreme' ? '🔴' : '🟠';

          try {
            // Send push notification
            const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: userPref.user_id,
                title: `${severityEmoji} ${props.severity} Weather Alert`,
                body: props.headline || props.event,
                tag: `weather-${alertId}`,
                url: '/weather',
                notificationType: 'weather_alert',
                requireInteraction: true,
              },
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
            });

            if (sendError) {
              console.error(JSON.stringify({ requestId, error: 'Weather push invoke failed', message: sendError.message, alertId }));
            } else {
              // Record that we sent this alert
              const { error: insertError } = await supabase.from('weather_alerts_notified').insert({
                user_id: userPref.user_id,
                alert_id: alertId,
                severity: props.severity,
                headline: props.headline || props.event,
                expires_at: props.expires,
              });
              if (insertError) {
                console.warn(JSON.stringify({ requestId, warning: 'Failed to insert weather_alerts_notified', error: insertError.message, alertId }));
              }

              weatherNotificationsSent++;
              console.log(JSON.stringify({ requestId, message: 'Weather notification sent', alertId }));
            }
          } catch (error) {
            console.error(JSON.stringify({ requestId, error: 'Failed to send weather notification', alertId, message: String(error) }));
          }
        }
      }
    }

    // Clean up expired weather alerts (older than 24 hours past expiry)
    const cleanupCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await supabase
      .from('weather_alerts_notified')
      .delete()
      .lt('expires_at', cleanupCutoff.toISOString());

    console.log(JSON.stringify({ 
      requestId, 
      message: 'Scheduled notifications complete',
      taskNotificationsSent,
      alertNotificationsSent,
      weatherNotificationsSent,
      healthNotificationsSent,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        taskNotificationsSent,
        alertNotificationsSent,
        weatherNotificationsSent,
        healthNotificationsSent,
      }),
      { headers: { ...getCorsHeaders(req), ...securityHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(JSON.stringify({ requestId, error: 'Unexpected error', message: error instanceof Error ? error.message : String(error) }));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), ...securityHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
