import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { timingSafeEqual } from '../_shared/validation.ts';

// GDPR-compliant IP address retention period (90 days)
const RETENTION_DAYS = 90;

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(JSON.stringify({
    requestId,
    message: 'purge-old-pii started',
    time: new Date().toISOString(),
    retentionDays: RETENTION_DAYS,
  }));

  try {
    // ========== SERVICE-ROLE AUTH ==========
    // This is a scheduled GDPR function — only callable by cron/admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(JSON.stringify({ requestId, error: 'Missing authorization header' }));
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseServiceKey || !timingSafeEqual(token, supabaseServiceKey)) {
      console.error(JSON.stringify({ requestId, error: 'Invalid service role key' }));
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffISOString = cutoffDate.toISOString();

    console.log(JSON.stringify({
      requestId,
      message: 'Purging IP addresses older than',
      cutoffDate: cutoffISOString,
    }));

    // Purge old IP addresses from login_history
    const { data: loginHistoryData, error: loginHistoryError } = await supabase
      .from('login_history')
      .update({ ip_address: null })
      .lt('login_at', cutoffISOString)
      .not('ip_address', 'is', null)
      .select('id');

    if (loginHistoryError) {
      console.error(JSON.stringify({
        requestId,
        message: 'Error purging login_history',
        error: loginHistoryError.message,
      }));
    } else {
      console.log(JSON.stringify({
        requestId,
        message: 'Purged IP addresses from login_history',
        count: loginHistoryData?.length ?? 0,
      }));
    }

    // Purge old IP addresses from activity_logs
    const { data: activityLogsData, error: activityLogsError } = await supabase
      .from('activity_logs')
      .update({ ip_address: null })
      .lt('created_at', cutoffISOString)
      .not('ip_address', 'is', null)
      .select('id');

    if (activityLogsError) {
      console.error(JSON.stringify({
        requestId,
        message: 'Error purging activity_logs',
        error: activityLogsError.message,
      }));
    } else {
      console.log(JSON.stringify({
        requestId,
        message: 'Purged IP addresses from activity_logs',
        count: activityLogsData?.length ?? 0,
      }));
    }

    // Purge old IP addresses from role_audit_log
    const { data: roleAuditData, error: roleAuditError } = await supabase
      .from('role_audit_log')
      .update({ ip_address: null })
      .lt('created_at', cutoffISOString)
      .not('ip_address', 'is', null)
      .select('id');

    if (roleAuditError) {
      console.error(JSON.stringify({
        requestId,
        message: 'Error purging role_audit_log',
        error: roleAuditError.message,
      }));
    } else {
      console.log(JSON.stringify({
        requestId,
        message: 'Purged IP addresses from role_audit_log',
        count: roleAuditData?.length ?? 0,
      }));
    }

    const summary = {
      requestId,
      message: 'PII purge complete',
      loginHistoryPurged: loginHistoryData?.length ?? 0,
      activityLogsPurged: activityLogsData?.length ?? 0,
      roleAuditLogPurged: roleAuditData?.length ?? 0,
      retentionDays: RETENTION_DAYS,
      cutoffDate: cutoffISOString,
    };

    console.log(JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(JSON.stringify({
      requestId,
      message: 'Unexpected error in purge-old-pii',
      error: errorMessage,
    }));

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
