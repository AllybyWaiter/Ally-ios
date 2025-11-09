import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendAnnouncementRequest {
  announcementId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { announcementId }: SendAnnouncementRequest = await req.json();

    console.log("Processing announcement:", announcementId);

    // Fetch announcement details
    const { data: announcement, error: announcementError } = await supabaseClient
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (announcementError || !announcement) {
      throw new Error(`Announcement not found: ${announcementError?.message}`);
    }

    console.log("Announcement:", announcement.title, "Target:", announcement.target_audience);

    // Build query for target users
    let query = supabaseClient
      .from("profiles")
      .select("user_id, email, name, subscription_tier");

    // Apply targeting filters
    if (announcement.target_audience !== "all") {
      if (announcement.target_audience === "custom" && announcement.custom_user_ids) {
        query = query.in("user_id", announcement.custom_user_ids);
      } else {
        // Target by subscription tier
        query = query.eq("subscription_tier", announcement.target_audience);
      }
    }

    const { data: targetUsers, error: usersError } = await query;

    if (usersError) {
      throw new Error(`Failed to fetch target users: ${usersError.message}`);
    }

    console.log(`Found ${targetUsers?.length || 0} target users`);

    const results = {
      emailsSent: 0,
      notificationsCreated: 0,
      errors: [] as string[],
    };

    // Send emails if enabled
    if (announcement.send_email && targetUsers) {
      for (const user of targetUsers) {
        try {
          await resend.emails.send({
            from: "Aquahub <onboarding@resend.dev>",
            to: [user.email],
            subject: announcement.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">${announcement.title}</h1>
                <p style="color: #666; line-height: 1.6;">${announcement.message}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">
                  You received this announcement because you are a valued member of our community.
                </p>
              </div>
            `,
          });
          results.emailsSent++;
          console.log(`Email sent to ${user.email}`);
        } catch (error: any) {
          console.error(`Failed to send email to ${user.email}:`, error);
          results.errors.push(`Email to ${user.email}: ${error.message}`);
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
        console.error("Failed to create notifications:", notifError);
        results.errors.push(`Notifications: ${notifError.message}`);
      } else {
        results.notificationsCreated = notifications.length;
        console.log(`Created ${notifications.length} in-app notifications`);
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
      console.error("Failed to update announcement status:", updateError);
      results.errors.push(`Status update: ${updateError.message}`);
    }

    console.log("Announcement sent successfully:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-announcement function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
