import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  tag?: string;
  url?: string;
  notificationType?: string;
  referenceId?: string;
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

// Web Push requires signing with VAPID keys
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidKeys: { publicKey: string; privateKey: string; subject: string }
): Promise<Response> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(JSON.stringify(payload));

  // Import VAPID private key for signing
  const privateKeyBase64 = vapidKeys.privateKey
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));

  // Create JWT for VAPID authentication
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: new URL(subscription.endpoint).origin,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: vapidKeys.subject,
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Sign the JWT
  const key = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Generate encryption keys for payload
  const p256dhBytes = Uint8Array.from(
    atob(subscription.p256dh.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  const authBytes = Uint8Array.from(
    atob(subscription.auth.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );

  // For simplicity, we'll use a direct POST with the payload
  // In production, you'd want to use proper web-push encryption
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${vapidKeys.publicKey}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body: payloadBytes,
  });

  return response;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(JSON.stringify({ requestId, message: 'send-push-notification started' }));

  try {
    const payload: PushPayload = await req.json();
    const { userId, title, body, tag, url, notificationType, referenceId, actions, requireInteraction } = payload;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error(JSON.stringify({ requestId, error: 'VAPID keys not configured' }));
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefs) {
      // Check if push is enabled
      if (!prefs.push_enabled) {
        console.log(JSON.stringify({ requestId, message: 'Push disabled for user', userId }));
        return new Response(
          JSON.stringify({ sent: false, reason: 'push_disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check category preferences
      if (notificationType === 'task_reminder' && !prefs.task_reminders_enabled) {
        return new Response(
          JSON.stringify({ sent: false, reason: 'category_disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (notificationType === 'water_alert' && !prefs.water_alerts_enabled) {
        return new Response(
          JSON.stringify({ sent: false, reason: 'category_disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (notificationType === 'announcement' && !prefs.announcements_enabled) {
        return new Response(
          JSON.stringify({ sent: false, reason: 'category_disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check quiet hours
      if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const start = prefs.quiet_hours_start.slice(0, 5);
        const end = prefs.quiet_hours_end.slice(0, 5);

        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        const isQuietTime = start > end
          ? currentTime >= start || currentTime < end
          : currentTime >= start && currentTime < end;

        if (isQuietTime) {
          console.log(JSON.stringify({ requestId, message: 'Quiet hours active', userId }));
          return new Response(
            JSON.stringify({ sent: false, reason: 'quiet_hours' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check for duplicate notifications
    if (referenceId) {
      const { data: existingLog } = await supabase
        .from('notification_log')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', notificationType || 'general')
        .eq('reference_id', referenceId)
        .single();

      if (existingLog) {
        console.log(JSON.stringify({ requestId, message: 'Duplicate notification', referenceId }));
        return new Response(
          JSON.stringify({ sent: false, reason: 'duplicate' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log(JSON.stringify({ requestId, message: 'No subscriptions found', userId }));
      return new Response(
        JSON.stringify({ sent: false, reason: 'no_subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pushPayload = {
      title,
      body,
      tag: tag || `ally-${notificationType || 'notification'}`,
      url: url || '/dashboard',
      notificationType,
      referenceId,
      actions,
      requireInteraction,
    };

    let successCount = 0;
    const expiredEndpoints: string[] = [];

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        const response = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          pushPayload,
          { publicKey: vapidPublicKey, privateKey: vapidPrivateKey, subject: vapidSubject }
        );

        if (response.ok || response.status === 201) {
          successCount++;
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired, mark for cleanup
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error(JSON.stringify({ 
            requestId, 
            error: 'Push failed', 
            status: response.status, 
            endpoint: sub.endpoint.slice(0, 50) 
          }));
        }
      } catch (error) {
        console.error(JSON.stringify({ requestId, error: 'Push error', message: error instanceof Error ? error.message : String(error) }));
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .in('endpoint', expiredEndpoints);
      
      console.log(JSON.stringify({ requestId, message: 'Cleaned expired subscriptions', count: expiredEndpoints.length }));
    }

    // Log successful notification
    if (successCount > 0 && referenceId) {
      await supabase
        .from('notification_log')
        .insert({
          user_id: userId,
          notification_type: notificationType || 'general',
          reference_id: referenceId,
        });
    }

    console.log(JSON.stringify({ requestId, message: 'Push complete', successCount, total: subscriptions.length }));

    return new Response(
      JSON.stringify({ sent: true, successCount, total: subscriptions.length }),
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
