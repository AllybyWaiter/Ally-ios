import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from "../_shared/rateLimit.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/errorHandler.ts";
import { escapeHtml } from "../_shared/validation.ts";

// Validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").toLowerCase(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
  inquiry_type: z.enum(["general", "partnership", "business", "press", "other"]).optional().default("general"),
  subject: z.string().trim().max(200, "Subject must be less than 200 characters").optional(),
  company: z.string().trim().max(100, "Company must be less than 100 characters").optional(),
});

serve(async (req: Request) => {
  const logger = createLogger('submit-contact');

  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      logger.warn('Method not allowed', { method: req.method });
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Server-side rate limiting: 5 requests per IP per hour
    const identifier = extractIdentifier(req);
    const rateLimitResult = checkRateLimit({
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      identifier,
    }, logger);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for contact submission', { identifier });
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Parse and validate request body
    const body = await req.json();
    logger.info('Contact submission received', { 
      inquiry_type: body.inquiry_type,
      hasCompany: !!body.company,
      hasSubject: !!body.subject,
    });

    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      logger.warn('Validation failed', { errors });
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const data = validationResult.data;

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert contact submission
    const { error: insertError } = await supabase.from('contacts').insert({
      name: data.name,
      email: data.email,
      message: data.message,
      inquiry_type: data.inquiry_type,
      subject: data.subject || null,
      company: data.company || null,
      status: 'new',
    });

    if (insertError) {
      logger.error('Database insert failed', insertError);
      
      // Handle duplicate email gracefully
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'We already have your contact information' }),
          { status: 409, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
      
      throw insertError;
    }

    logger.info('Contact submission saved successfully', { email: data.email });

    // Send confirmation email (non-blocking)
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        const resendModule = await import("https://esm.sh/resend@2.0.0");
        const resend = new resendModule.Resend(resendApiKey);
        
        await resend.emails.send({
          from: "Ally Support <support@allyaquatic.com>",
          to: [data.email],
          subject: "We received your message!",
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
                          <h2 style="margin: 0 0 16px 0; color: #333333; font-size: 22px;">Hi ${escapeHtml(data.name)},</h2>
                          <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                            Thank you for reaching out! We've received your message and our team will review it shortly.
                          </p>
                          
                          <!-- Message Box -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 8px; margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 24px;">
                                <span style="color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Message</span>
                                <p style="margin: 8px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5; font-style: italic;">"${escapeHtml(data.message.length > 200 ? data.message.substring(0, 200) + '...' : data.message)}"</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Response Time -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #D2C9B2; border-radius: 8px; margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <p style="margin: 0; color: #34406A; font-size: 14px;">
                                  <strong>Expected Response Time:</strong> Within 24 to 48 hours
                                </p>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                            In the meantime, feel free to explore our <a href="https://allyaquatic.com/help" style="color: #34406A;">Help Center</a> for quick answers.
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
        logger.info('Confirmation email sent', { email: data.email });
      }
    } catch (emailError) {
      logger.warn('Failed to send confirmation email', { error: emailError });
      // Don't fail the submission if email fails
    }

    return createSuccessResponse({ 
      success: true, 
      message: 'Your message has been sent successfully' 
    });

  } catch (error) {
    logger.error('Unexpected error in submit-contact', error);
    return createErrorResponse(error, logger);
  }
});
