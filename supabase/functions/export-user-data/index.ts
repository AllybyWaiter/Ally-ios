import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';

// Helper to mask IP addresses for privacy (show only first two octets)
const maskIpAddress = (ip: string | null): string | null => {
  if (!ip) return null;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  // Handle IPv6 or other formats
  return ip.substring(0, Math.min(ip.length, 10)) + '***';
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Data export started');

    // Fetch all user data in parallel - including activity logs and login history for GDPR compliance
    const [
      profileResult,
      aquariumsResult,
      waterTestsResult,
      livestockResult,
      plantsResult,
      equipmentResult,
      tasksResult,
      memoriesResult,
      conversationsResult,
      notificationPrefsResult,
      activityLogsResult,
      loginHistoryResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('aquariums').select('*').eq('user_id', user.id),
      supabase.from('water_tests').select('*, test_parameters(*)').eq('user_id', user.id),
      supabase.from('livestock').select('*').eq('user_id', user.id),
      supabase.from('plants').select('*').eq('user_id', user.id),
      supabase.from('equipment').select('*, aquariums!inner(user_id)').eq('aquariums.user_id', user.id),
      supabase.from('maintenance_tasks').select('*, aquariums!inner(user_id)').eq('aquariums.user_id', user.id),
      supabase.from('user_memories').select('*').eq('user_id', user.id),
      supabase.from('chat_conversations').select('*, chat_messages(*)').eq('user_id', user.id),
      supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('activity_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000),
      supabase.from('login_history').select('*').eq('user_id', user.id).order('login_at', { ascending: false }).limit(1000)
    ]);

    // Mask IP addresses in activity logs and login history for privacy
    const maskedActivityLogs = (activityLogsResult.data || []).map(log => ({
      ...log,
      ip_address: maskIpAddress(log.ip_address)
    }));

    const maskedLoginHistory = (loginHistoryResult.data || []).map(log => ({
      ...log,
      ip_address: maskIpAddress(log.ip_address)
    }));

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      profile: profileResult.data,
      aquariums: aquariumsResult.data || [],
      waterTests: waterTestsResult.data || [],
      livestock: livestockResult.data || [],
      plants: plantsResult.data || [],
      equipment: equipmentResult.data || [],
      maintenanceTasks: tasksResult.data || [],
      memories: memoriesResult.data || [],
      conversations: conversationsResult.data || [],
      notificationPreferences: notificationPrefsResult.data,
      // GDPR compliance: include user's activity and login data with masked IPs
      activityLogs: maskedActivityLogs,
      loginHistory: maskedLoginHistory,
      // Include data retention notice
      _dataRetentionNotice: {
        ipAddresses: "IP addresses are partially masked for privacy. Full IP addresses are retained for 90 days for security purposes.",
        activityLogs: "Activity logs are retained for 1 year.",
        loginHistory: "Login history is retained for 1 year."
      }
    };

    console.log(`Export complete - included ${maskedActivityLogs.length} activity logs and ${maskedLoginHistory.length} login records`);

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        status: 200, 
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="ally-data-export-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export data' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
