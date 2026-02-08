import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, escapeHtml } from "../_shared/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface BulkEmailRequest {
  emails: string[];
  subject: string;
  message: string;
  fromName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const cors = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error('Failed to fetch user roles:', rolesError.message);
      return new Response(
        JSON.stringify({ error: "Failed to verify admin access" }),
        { status: 500, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    const isAdmin = roles?.some(r => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    let body: BulkEmailRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    const { emails, subject, message, fromName = "AquaAlly" } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No email addresses provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Limit maximum emails per request to prevent abuse
    const MAX_EMAILS_PER_REQUEST = 1000;
    if (emails.length > MAX_EMAILS_PER_REQUEST) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_EMAILS_PER_REQUEST} emails per request` }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Send emails in batches of 50
    const batchSize = 50;
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const promises = batch.map(async (email) => {
        try {
          await resend.emails.send({
            from: "Ally <support@allyaquatic.com>",
            to: [email],
            subject: escapeHtml(subject),
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                ${message.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('')}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #666; font-size: 12px;">
                  You're receiving this email because you're a registered user of AquaAlly.
                </p>
              </div>
            `,
          });
          results.success.push(email);
        } catch (err) {
          console.error(`Failed to send to ${email}:`, err);
          results.failed.push(email);
        }
      });

      await Promise.all(promises);
    }

    console.log(`Bulk email sent: ${results.success.length} success, ${results.failed.length} failed`);

    return new Response(
      JSON.stringify({
        message: `Sent ${results.success.length} emails successfully`,
        successCount: results.success.length,
        failedCount: results.failed.length,
        failed: results.failed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-bulk-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      }
    );
  }
};

serve(handler);
