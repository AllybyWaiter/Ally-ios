import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';
import { handleCors } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from '../_shared/mod.ts';

Deno.serve(async (req) => {
  const logger = createLogger('validate-referral-code');

  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting — prevent brute-force of referral codes
    const identifier = extractIdentifier(req);
    const rateLimitResult = await checkRateLimit({
      maxRequests: 5,
      windowMs: 60 * 1000,
      identifier: `referral-validate:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    let body: { code?: string; referee_email?: string };
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON body', logger, { status: 400, request: req });
    }

    const { code, referee_email } = body;

    if (!code) {
      return createErrorResponse('Referral code is required', logger, { status: 400, request: req });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the referral code
    const { data: referralCode, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select('id, user_id, code, is_active')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !referralCode) {
      logger.warn('Invalid referral code', { code });
      return createErrorResponse('Invalid or expired referral code', logger, { status: 404, request: req });
    }

    // Get referrer's name for display
    const { data: referrerProfile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('user_id', referralCode.user_id)
      .single();

    // Check if referee email matches referrer (self-referral prevention)
    if (referee_email) {
      const { data: referrerAuth } = await supabaseAdmin.auth.admin.getUserById(referralCode.user_id);
      if (referrerAuth?.user?.email?.toLowerCase() === referee_email.toLowerCase()) {
        logger.warn('Self-referral attempt blocked', { code, referee_email });
        return createErrorResponse('You cannot use your own referral code', logger, { status: 400, request: req });
      }
    }

    logger.info('Referral code validated', { code, referrer_id: referralCode.user_id });

    return createSuccessResponse({
      valid: true,
      referral_code_id: referralCode.id,
      referrer_id: referralCode.user_id,
      referrer_name: referrerProfile?.name || 'A friend',
    }, 200, req);
  } catch (error) {
    logger.error('Failed to validate referral code', error);
    return createErrorResponse(error, logger, { status: 500, request: req });
  }
});
