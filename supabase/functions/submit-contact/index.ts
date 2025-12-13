import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from "../_shared/rateLimit.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/errorHandler.ts";

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      logger.warn('Method not allowed', { method: req.method });
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw insertError;
    }

    logger.info('Contact submission saved successfully', { email: data.email });

    return createSuccessResponse({ 
      success: true, 
      message: 'Your message has been sent successfully' 
    });

  } catch (error) {
    logger.error('Unexpected error in submit-contact', error);
    return createErrorResponse(error, logger);
  }
});
