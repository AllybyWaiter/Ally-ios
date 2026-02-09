import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import {
  handleCors,
  createLogger,
  validateUuid,
  collectErrors,
  validationErrorResponse,
  checkRateLimit,
  rateLimitExceededResponse,
  extractIdentifier,
  createErrorResponse,
  createSuccessResponse,
  escapeHtml,
} from "../_shared/mod.ts";

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('send-announcement');

  try {
    // ========== AUTHENTICATION FIRST ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return createErrorResponse('Authentication required', logger, { status: 401 });
    }

    // Create user-scoped client to verify auth
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      logger.warn('Authentication failed', { error: authError?.message });
      return createErrorResponse('Authentication failed', logger, { status: 401 });
    }

    // ========== ADMIN CHECK IMMEDIATELY ==========
    const { data: roles } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      logger.warn('Non-admin attempted to send announcement', { userId: user.id });
      return createErrorResponse('Admin access required', logger, { status: 403 });
    }

    logger.info('Admin authenticated', { userId: user.id });

    // ========== NOW PROCEED WITH SERVICE ROLE FOR OPERATIONS ==========
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const body = await req.json();
    const { announcementId } = body;

    // Input validation
    const errors = collectErrors(
      validateUuid(announcementId, 'announcementId')
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Rate limiting (5 announcements per minute - prevent spam)
    const identifier = extractIdentifier(req, user.id);
    const rateLimitResult = checkRateLimit({
      maxRequests: 5,
      windowMs: 60 * 1000,
      identifier: `announcement:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    logger.info('Processing announcement', { announcementId, adminId: user.id });

    // Fetch announcement details
    const { data: announcement, error: announcementError } = await supabaseClient
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (announcementError || !announcement) {
      logger.error('Announcement not found', { announcementId, error: announcementError?.message });
      return createErrorResponse('Announcement not found', logger, { status: 404 });
    }

    logger.info('Announcement loaded', {
      title: announcement.title,
      targetAudience: announcement.target_audience,
    });

    // Build query for target users
    let query = supabaseClient
      .from("profiles")
      .select("user_id, email, name, subscription_tier");

    // Apply targeting filters
    if (announcement.target_audience !== "all") {
      if (announcement.target_audience === "custom" && announcement.custom_user_ids) {
        query = query.in("user_id", announcement.custom_user_ids);
      } else {
        query = query.eq("subscription_tier", announcement.target_audience);
      }
    }

    const { data: targetUsers, error: usersError } = await query.limit(10000);

    if (usersError) {
      logger.error('Failed to fetch target users', { error: usersError.message });
      return createErrorResponse('Failed to process announcement', logger, { status: 500 });
    }

    logger.info('Target users found', { count: targetUsers?.length || 0 });

    const results = {
      emailsSent: 0,
      notificationsCreated: 0,
      errors: [] as string[],
    };

    // Send emails if enabled
    if (announcement.send_email && targetUsers) {
      for (const user of targetUsers) {
        if (!user.email) {
          logger.warn('User has no email, skipping', { userId: user.user_id });
          continue;
        }
        try {
          await resend.emails.send({
            from: "Ally <support@allyaquatic.com>",
            to: [user.email],
            subject: announcement.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">${escapeHtml(announcement.title)}</h1>
                <p style="color: #666; line-height: 1.6;">${escapeHtml(announcement.message)}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">
                  You received this announcement because you are a valued member of our community.
                </p>
              </div>
            `,
          });
          results.emailsSent++;
          logger.debug('Email sent', { email: user.email });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to send email', { email: user.email, error });
          results.errors.push(`Email to ${user.email}: ${errorMsg}`);
        }
      }
    }

    // Create in-app notifications if enabled
    if (announcement.send_in_app && targetUsers) {
      const notifications = targetUsers.map((user) => ({
        user_id: user.user_id,
        announcement_id: announcementId,
        read: false,
      }));

      const { error: notifError } = await supabaseClient
        .from("user_notifications")
        .insert(notifications);

      if (notifError) {
        logger.error('Failed to create notifications', notifError);
        results.errors.push(`Notifications: ${notifError.message}`);
      } else {
        results.notificationsCreated = notifications.length;
        logger.info('Notifications created', { count: notifications.length });
      }
    }

    // Send push notifications if in-app notifications are enabled
    if (announcement.send_in_app && targetUsers) {
      for (const user of targetUsers) {
        try {
          await supabaseClient.functions.invoke('send-push-notification', {
            body: {
              userId: user.user_id,
              title: `📢 ${escapeHtml(announcement.title)}`,
              body: announcement.message ? (announcement.message.slice(0, 100) + (announcement.message.length > 100 ? '...' : '')) : '',
              tag: `announcement-${announcementId}`,
              url: '/dashboard',
              notificationType: 'announcement',
              referenceId: `announcement-${announcementId}`,
            },
          });
        } catch (pushError) {
          // Don't fail the whole announcement for push errors - they're optional
          logger.debug('Push notification failed for user', { userId: user.user_id, error: String(pushError) });
        }
      }
    }

    // Update announcement status
    const { error: updateError } = await supabaseClient
      .from("announcements")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", announcementId);

    if (updateError) {
      logger.error('Failed to update announcement status', updateError);
      results.errors.push(`Status update: ${updateError.message}`);
    }

    logger.info('Announcement sent successfully', results);

    return createSuccessResponse(results);

  } catch (error) {
    return createErrorResponse(error, logger);
  }
};

serve(handler);
