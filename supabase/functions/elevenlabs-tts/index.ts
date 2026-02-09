import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { createErrorResponse } from '../_shared/errorHandler.ts';
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Input validation schema
const ttsSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
});

serve(async (req) => {
  const logger = createLogger('elevenlabs-tts');

  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting - 10 requests per minute per IP
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit({
      identifier: `tts:${clientIP}`,
      maxRequests: 10,
      windowMs: 60000,
    }, logger);
    
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { clientIP });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }),
        { status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const validation = ttsSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn('Invalid input', { errors: validation.error.errors });
      return createErrorResponse(new Error('Invalid input: ' + validation.error.errors[0].message), logger, { status: 400, request: req });
    }

    const { text, voiceId } = validation.data;
    
    // Default to Sarah voice - clear, professional female voice
    const selectedVoiceId = voiceId || 'EXAVITQu4vr4xnSDxMaL';
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      logger.error('ELEVENLABS_API_KEY not configured');
      return createErrorResponse(new Error('TTS service not configured'), logger, { status: 500, request: req });
    }

    logger.info('Generating TTS', { textLength: text.length, voiceId: selectedVoiceId });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Low latency model
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('ElevenLabs API error', { status: response.status, error: errorText });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'TTS rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
      
      return createErrorResponse(new Error('Failed to generate speech'), logger, { status: 502, request: req });
    }

    const audioBuffer = await response.arrayBuffer();
    logger.info('TTS generated successfully', { audioSize: audioBuffer.byteLength });

    return new Response(audioBuffer, {
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    logger.error('TTS error', error);
    return createErrorResponse(error, logger, { status: 500, request: req });
  }
});
