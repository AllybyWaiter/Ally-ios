import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  emails: string[];
  subject: string;
  message: string;
  fromName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { emails, subject, message, fromName = "AquaAlly" }: BulkEmailRequest = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No email addresses provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
            from: `${fromName} <onboarding@resend.dev>`,
            to: [email],
            subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
