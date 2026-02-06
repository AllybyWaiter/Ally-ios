import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';

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

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// ============= Crypto Helpers =============

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = (4 - (str.length % 4)) % 4;
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding);
  const binary = atob(base64);
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

// Validate VAPID keys format and return debug info
function validateVapidKeys(
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
  requestId: string
): { valid: boolean; errors: string[]; debug: Record<string, unknown> } {
  const errors: string[] = [];
  const debug: Record<string, unknown> = {};
  
  try {
    const publicKeyBytes = base64UrlDecode(vapidPublicKey);
    const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
    
    debug.publicKeyLength = publicKeyBytes.length;
    debug.privateKeyLength = privateKeyBytes.length;
    debug.publicKeyFirstByte = publicKeyBytes[0]?.toString(16);
    debug.vapidSubjectFormat = vapidSubject?.startsWith('mailto:') ? 'valid' : 'invalid';
    debug.vapidSubjectValue = vapidSubject?.slice(0, 30);
    
    // VAPID public key should be 65 bytes (uncompressed EC point: 0x04 || x || y)
    if (publicKeyBytes.length !== 65) {
      errors.push(`Public key should be 65 bytes, got ${publicKeyBytes.length}`);
    }
    
    // First byte must be 0x04 (uncompressed point format)
    if (publicKeyBytes[0] !== 0x04) {
      errors.push(`Public key must start with 0x04, got 0x${publicKeyBytes[0]?.toString(16)}`);
    }
    
    // VAPID private key should be 32 bytes (EC P-256 private key)
    if (privateKeyBytes.length !== 32) {
      errors.push(`Private key should be 32 bytes, got ${privateKeyBytes.length}`);
    }
    
    // VAPID subject must be mailto: format
    if (!vapidSubject?.startsWith('mailto:')) {
      errors.push(`VAPID_SUBJECT must start with 'mailto:', got '${vapidSubject?.slice(0, 20)}'`);
    }
    
    console.log(JSON.stringify({ 
      requestId, 
      message: 'VAPID key validation', 
      ...debug,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }));
    
  } catch (e) {
    errors.push(`Key decode error: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  return { valid: errors.length === 0, errors, debug };
}

// Create VAPID JWT for authorization
async function createVapidJwt(
  audience: string,
  subject: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  requestId: string
): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  console.log(JSON.stringify({ 
    requestId, 
    message: 'JWT payload', 
    audience, 
    subject,
    exp: payload.exp 
  }));

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Decode the keys
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  // VAPID public key is 65 bytes: 0x04 || x (32 bytes) || y (32 bytes)
  // Extract x and y coordinates from the public key
  const x = publicKeyBytes.slice(1, 33);   // bytes 1-32
  const y = publicKeyBytes.slice(33, 65);  // bytes 33-64
  
  // Log key extraction details
  console.log(JSON.stringify({ 
    requestId, 
    message: 'Key extraction',
    privateKeyLen: privateKeyBytes.length,
    publicKeyLen: publicKeyBytes.length,
    xLen: x.length,
    yLen: y.length,
    firstBytePublic: publicKeyBytes[0]?.toString(16)
  }));
  
  // Create a complete, valid JWK with matching key components
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: base64UrlEncode(privateKeyBytes),
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
  };
  
  console.log(JSON.stringify({ 
    requestId, 
    message: 'JWK created',
    dLen: jwk.d.length,
    xLen: jwk.x.length,
    yLen: jwk.y.length,
  }));
  
  let signingKey;
  try {
    signingKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    console.log(JSON.stringify({ requestId, message: 'Key import successful' }));
  } catch (importError) {
    console.error(JSON.stringify({ 
      requestId, 
      error: 'Key import failed', 
      message: importError instanceof Error ? importError.message : String(importError)
    }));
    throw importError;
  }

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signature);
  console.log(JSON.stringify({ 
    requestId, 
    message: 'Signature created', 
    signatureLen: signatureBytes.length 
  }));
  
  let r: Uint8Array, s: Uint8Array;
  
  if (signatureBytes.length === 64) {
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32, 64);
  } else {
    let offset = 2;
    offset++;
    const rLen = signatureBytes[offset++];
    const rStart = rLen === 33 ? offset + 1 : offset;
    r = signatureBytes.slice(rStart, rStart + 32);
    offset += rLen;
    offset++;
    const sLen = signatureBytes[offset++];
    const sStart = sLen === 33 ? offset + 1 : offset;
    s = signatureBytes.slice(sStart, sStart + 32);
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const jwt = `${unsignedToken}.${base64UrlEncode(rawSig)}`;
  console.log(JSON.stringify({ 
    requestId, 
    message: 'JWT created', 
    jwtLength: jwt.length,
    jwtParts: jwt.split('.').length
  }));
  
  return jwt;
}

// HKDF key derivation
async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    ikm.buffer as ArrayBuffer,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt.buffer as ArrayBuffer,
      info: info.buffer as ArrayBuffer,
    },
    key,
    length * 8
  );

  return new Uint8Array(bits);
}

// Create info for HKDF as per RFC 8291
function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(`Content-Encoding: ${type}\0`);
  const info = new Uint8Array(typeBytes.length + context.length);
  info.set(typeBytes);
  info.set(context, typeBytes.length);
  return info;
}

// Encrypt push message payload (RFC 8291)
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string,
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);
  
  const clientPublicKeyBytes = base64UrlDecode(p256dhKey);
  const authSecretBytes = base64UrlDecode(authSecret);

  // Generate server ephemeral key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes.buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // PRK info
  const prkInfo = new TextEncoder().encode('WebPush: info\0');
  const prkInfoFull = new Uint8Array(prkInfo.length + 65 + 65);
  prkInfoFull.set(prkInfo);
  prkInfoFull.set(clientPublicKeyBytes, prkInfo.length);
  prkInfoFull.set(serverPublicKey, prkInfo.length + 65);

  // Derive IKM
  const ikm = await hkdf(sharedSecret, authSecretBytes, prkInfoFull, 32);

  // Derive CEK and nonce
  const cekInfo = createInfo('aes128gcm', new Uint8Array(0));
  const nonceInfo = createInfo('nonce', new Uint8Array(0));

  const cek = await hkdf(ikm, salt, cekInfo, 16);
  const nonce = await hkdf(ikm, salt, nonceInfo, 12);

  // Pad payload
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 0x02;

  // Encrypt
  const aesKey = await crypto.subtle.importKey(
    'raw',
    cek.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce.buffer as ArrayBuffer },
    aesKey,
    paddedPayload
  );

  return {
    encrypted: new Uint8Array(encrypted),
    salt,
    serverPublicKey,
  };
}

// Build aes128gcm body
function buildEncryptedBody(
  encrypted: Uint8Array,
  salt: Uint8Array,
  serverPublicKey: Uint8Array
): Uint8Array {
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  header[16] = (rs >> 24) & 0xff;
  header[17] = (rs >> 16) & 0xff;
  header[18] = (rs >> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = 65;
  header.set(serverPublicKey, 21);

  const body = new Uint8Array(header.length + encrypted.length);
  body.set(header);
  body.set(encrypted, header.length);
  return body;
}

// Send Web Push notification
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
  requestId: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    console.log(JSON.stringify({ 
      requestId, 
      message: 'Sending to endpoint', 
      audience,
      endpointHost: endpointUrl.host
    }));

    const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey, vapidPublicKey, requestId);

    const { encrypted, salt, serverPublicKey } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth,
    );

    const body = buildEncryptedBody(encrypted, salt, serverPublicKey);

    const authHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;
    console.log(JSON.stringify({ 
      requestId, 
      message: 'Auth header', 
      headerLength: authHeader.length,
      kParamLength: vapidPublicKey.length
    }));

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'normal',
      },
      body: body.buffer as ArrayBuffer,
    });

    if (response.ok || response.status === 201) {
      return { success: true, statusCode: response.status };
    }

    const errorText = await response.text();
    console.error(JSON.stringify({ 
      requestId, 
      error: 'Push response error', 
      statusCode: response.status,
      errorBody: errorText,
      responseHeaders: Object.fromEntries(response.headers.entries())
    }));

    return {
      success: false,
      statusCode: response.status,
      error: errorText,
    };
  } catch (error) {
    console.error(JSON.stringify({ 
      requestId, 
      error: 'Push exception', 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }));
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============= Main Handler =============

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(JSON.stringify({ requestId, message: 'send-push-notification started' }));

  try {
    // ========== SERVICE-ROLE AUTH ==========
    // This function is internal-only (called by scheduled-notifications and send-announcement)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(JSON.stringify({ requestId, error: 'Missing authorization header' }));
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey || token !== serviceRoleKey) {
      console.error(JSON.stringify({ requestId, error: 'Invalid service role key' }));
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const payload: PushPayload = await req.json();
    const { userId, title, body, tag, url, notificationType, referenceId, actions, requireInteraction } = payload;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error(JSON.stringify({ requestId, error: 'VAPID keys not configured' }));
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Validate VAPID keys format
    const validation = validateVapidKeys(vapidPublicKey, vapidPrivateKey, vapidSubject, requestId);
    if (!validation.valid) {
      console.error(JSON.stringify({ 
        requestId, 
        error: 'VAPID key validation failed', 
        errors: validation.errors,
        debug: validation.debug 
      }));
      // Continue anyway to see what error we get from push service
    }

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
      if (!prefs.push_enabled) {
        console.log(JSON.stringify({ requestId, message: 'Push disabled for user', userId }));
        return new Response(
          JSON.stringify({ sent: false, reason: 'push_disabled' }),
          { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      if (notificationType === 'task_reminder' && !prefs.task_reminders_enabled) {
        return new Response(
          JSON.stringify({ sent: false, reason: 'category_disabled' }),
          { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
      if (notificationType === 'water_alert' && !prefs.water_alerts_enabled) {
        return new Response(
          JSON.stringify({ sent: false, reason: 'category_disabled' }),
          { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
      if (notificationType === 'announcement' && !prefs.announcements_enabled) {
        return new Response(
          JSON.stringify({ sent: false, reason: 'category_disabled' }),
          { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Check quiet hours
      // NOTE: Quiet hours are evaluated in UTC. Consider user timezone for more accurate enforcement.
      if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
        const now = new Date();
        const currentTime = now.toISOString().slice(11, 16); // Use UTC time HH:MM
        const start = prefs.quiet_hours_start.slice(0, 5);
        const end = prefs.quiet_hours_end.slice(0, 5);

        const isQuietTime = start > end
          ? currentTime >= start || currentTime < end
          : currentTime >= start && currentTime < end;

        if (isQuietTime) {
          console.log(JSON.stringify({ requestId, message: 'Quiet hours active (UTC)', userId, currentTime, start, end }));
          return new Response(
            JSON.stringify({ sent: false, reason: 'quiet_hours' }),
            { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
          );
        }
      }
    }

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
          { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log(JSON.stringify({ requestId, message: 'No subscriptions found', userId }));
      return new Response(
        JSON.stringify({ sent: false, reason: 'no_subscriptions' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Determine if notification should be silent based on user sound preferences
    let silent = false;
    if (prefs) {
      if (notificationType === 'task_reminder' && prefs.sound_task_reminders === false) {
        silent = true;
      } else if (notificationType === 'water_alert' && prefs.sound_water_alerts === false) {
        silent = true;
      } else if (notificationType === 'announcement' && prefs.sound_announcements === false) {
        silent = true;
      } else if (notificationType === 'weather_alert' && prefs.sound_weather_alerts === false) {
        silent = true;
      } else if (notificationType === 'health_alert' && prefs.sound_health_alerts === false) {
        silent = true;
      }
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      tag: tag || `ally-${notificationType || 'notification'}`,
      url: url || '/dashboard',
      notificationType,
      referenceId,
      actions,
      requireInteraction,
      silent,
    });

    let successCount = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const result = await sendWebPush(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        pushPayload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject,
        requestId
      );

      if (result.success) {
        successCount++;
        console.log(JSON.stringify({ requestId, message: 'Push sent successfully', endpoint: sub.endpoint.slice(0, 50) }));
      } else {
        if (result.statusCode === 404 || result.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
          console.log(JSON.stringify({ requestId, message: 'Subscription expired', endpoint: sub.endpoint.slice(0, 50) }));
        } else {
          console.error(JSON.stringify({ 
            requestId, 
            error: 'Push failed', 
            statusCode: result.statusCode,
            message: result.error,
            endpoint: sub.endpoint.slice(0, 50) 
          }));
        }
      }
    }

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .in('endpoint', expiredEndpoints);
      
      console.log(JSON.stringify({ requestId, message: 'Cleaned expired subscriptions', count: expiredEndpoints.length }));
    }

    // Always log successful notifications for delivery history
    if (successCount > 0) {
      await supabase
        .from('notification_log')
        .insert({
          user_id: userId,
          notification_type: notificationType || 'general',
          reference_id: referenceId || null,
          title,
          body,
        });
    }

    console.log(JSON.stringify({ requestId, message: 'Push complete', successCount, total: subscriptions.length }));

    return new Response(
      JSON.stringify({ sent: true, successCount, total: subscriptions.length }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(JSON.stringify({ requestId, error: 'Unexpected error', message: error instanceof Error ? error.message : String(error) }));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
