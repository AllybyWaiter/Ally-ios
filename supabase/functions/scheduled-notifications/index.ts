import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(JSON.stringify({ requestId, message: 'scheduled-notifications started', time: new Date().toISOString() }));

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    let taskNotificationsSent = 0;
    let alertNotificationsSent = 0;
    let weatherNotificationsSent = 0;

    // Get all users with push enabled and task reminders enabled
    const { data: enabledUsers, error: usersError } = await supabase
      .from('notification_preferences')
      .select('user_id, reminder_hours_before')
      .eq('push_enabled', true)
      .eq('task_reminders_enabled', true);

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
          .single();

        if (existingLog) continue;

        // Send notification
        const aquariumName = (task.aquariums as any)?.name || 'your aquatic space';
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
          });

          if (!sendError) {
            taskNotificationsSent++;
          }
        } catch (error) {
          console.error(JSON.stringify({ requestId, error: 'Failed to send task notification', taskId: task.id }));
        }
      }
    }

    // Process water test alerts
    const { data: alertUsers, error: alertUsersError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('push_enabled', true)
      .eq('water_alerts_enabled', true);

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
            .single();

          if (existingLog) continue;

          const aquariumName = (alert.aquariums as any)?.name || 'your aquatic space';
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
            });

            if (!sendError) {
              alertNotificationsSent++;
            }
          } catch (error) {
            console.error(JSON.stringify({ requestId, error: 'Failed to send alert notification', alertId: alert.id }));
          }
        }
      }
    }

    // Process severe weather alerts (NWS API - US only)
    const { data: weatherUsers, error: weatherUsersError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('push_enabled', true)
      .eq('weather_alerts_enabled', true);

    if (!weatherUsersError && weatherUsers) {
      for (const userPref of weatherUsers) {
        // Get user's location from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('latitude, longitude, weather_enabled')
          .eq('user_id', userPref.user_id)
          .single();

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
            .single();

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
            });

            if (!sendError) {
              // Record that we sent this alert
              await supabase.from('weather_alerts_notified').insert({
                user_id: userPref.user_id,
                alert_id: alertId,
                severity: props.severity,
                headline: props.headline || props.event,
                expires_at: props.expires,
              });

              weatherNotificationsSent++;
            }
          } catch (error) {
            console.error(JSON.stringify({ requestId, error: 'Failed to send weather notification', alertId }));
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
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskNotificationsSent, 
        alertNotificationsSent,
        weatherNotificationsSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(JSON.stringify({ requestId, error: 'Unexpected error', message: error instanceof Error ? error.message : String(error) }));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
