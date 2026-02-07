import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createLogger } from "../_shared/logger.ts";
import { escapeHtml } from "../_shared/validation.ts";
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { timingSafeEqual } from '../_shared/validation.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface TicketConfirmationRequest {
  name: string;
  email: string;
  ticketId: string;
  priority: string;
  messagePreview: string;
}

// Get expected response time based on priority
function getResponseTime(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return '2 to 4 hours';
    case 'high':
      return '4 to 8 hours';
    case 'medium':
      return '24 hours';
    case 'low':
    default:
      return '48 hours';
  }
}

// Get priority color for email
function getPriorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return '#E74C3C';
    case 'high':
      return '#F1C40F';
    case 'medium':
      return '#34406A';
    case 'low':
    default:
      return '#5f677a';
  }
}

serve(async (req: Request): Promise<Response> => {
  const logger = createLogger('send-ticket-confirmation');

  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // ========== SERVICE-ROLE AUTH ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseServiceKey || !timingSafeEqual(token, supabaseServiceKey)) {
      logger.warn('Invalid service role key');
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    const { name, email, ticketId, priority, messagePreview }: TicketConfirmationRequest = await req.json();

    logger.info('Sending ticket confirmation', { email, ticketId, priority });

    const responseTime = getResponseTime(priority);
    const priorityColor = getPriorityColor(priority);
    const shortTicketId = ticketId.substring(0, 8).toUpperCase();

    // Escape user-provided values to prevent HTML injection in emails
    const safeName = escapeHtml(name);
    const safePriority = escapeHtml(priority);
    const safePreview = escapeHtml(
      messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview
    );

    const emailResponse = await resend.emails.send({
      from: "Ally Support <support@allyaquatic.com>",
      to: [email],
      subject: `We received your support request [#${shortTicketId}]`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #34406A; padding: 32px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #D2C9B2; font-size: 28px; font-weight: 600;">Ally</h1>
                      <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Aquatic Care Assistant</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #333333; font-size: 22px;">Hi ${safeName},</h2>
                      <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                        Thank you for reaching out! We've received your support request and our team is on it.
                      </p>
                      
                      <!-- Ticket Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 8px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 16px;">
                                  <span style="color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Ticket Reference</span>
                                  <p style="margin: 4px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">#${shortTicketId}</p>
                                </td>
                                <td style="padding-bottom: 16px; text-align: right;">
                                  <span style="color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Priority</span>
                                  <p style="margin: 4px 0 0 0;">
                                    <span style="display: inline-block; background-color: ${priorityColor}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${safePriority}</span>
                                  </p>
                                </td>
                              </tr>
                              <tr>
                                <td colspan="2">
                                  <span style="color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Message</span>
                                  <p style="margin: 8px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5; font-style: italic;">"${safePreview}"</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Response Time -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #D2C9B2; border-radius: 8px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #34406A; font-size: 14px;">
                              <strong>Expected Response Time:</strong> Within ${responseTime}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 16px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        While you wait, you might find answers in our Help Center:
                      </p>
                      
                      <!-- Help Center Button -->
                      <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background-color: #34406A; border-radius: 6px;">
                            <a href="https://allyaquatic.com/help" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                              Visit Help Center
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                        Please keep this email for your records. If you need to follow up, simply reply to this email and reference ticket #${shortTicketId}.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f8f8; padding: 24px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="margin: 0 0 8px 0; color: #999999; font-size: 12px;">
                        © ${new Date().getFullYear()} Ally Aquatic. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        <a href="https://allyaquatic.com/privacy" style="color: #666666; text-decoration: none;">Privacy Policy</a>
                        &nbsp;&middot;&nbsp;
                        <a href="https://allyaquatic.com/terms" style="color: #666666; text-decoration: none;">Terms of Service</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    logger.info("Ticket confirmation email sent", { emailResponse, ticketId });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Error sending ticket confirmation", { error: errorMessage });
    return new Response(
      JSON.stringify({ error: 'Failed to send confirmation' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
});
