import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCors,
  createLogger,
  validateString,
  collectErrors,
  validationErrorResponse,
  checkRateLimit,
  rateLimitExceededResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  // Strip data URI prefix if present (e.g. "data:audio/webm;base64,")
  let raw = base64String;
  const commaIndex = raw.indexOf(',');
  if (commaIndex !== -1 && commaIndex < 100) {
    raw = raw.substring(commaIndex + 1);
  }
  // Remove any whitespace/newlines that may be in the base64
  raw = raw.replace(/\s/g, '');

  // Ensure chunk size is a multiple of 4 so base64 decoding stays aligned
  const alignedChunkSize = chunkSize - (chunkSize % 4);

  const chunks: Uint8Array[] = [];
  let position = 0;

  while (position < raw.length) {
    const chunk = raw.slice(position, position + alignedChunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);

    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }

    chunks.push(bytes);
    position += alignedChunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('transcribe-audio');

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { audio, format = 'webm' } = body;

    // Input validation
    const errors = collectErrors(
      validateString(audio, 'audio', { minLength: 100, maxLength: 10000000 })
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors, req);
    }

    // Rate limiting (10 transcriptions per minute per user)
    const rateLimitResult = checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: `transcribe:${user.id}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult, req);
    }

    logger.info('Processing audio transcription', {
      audioSize: audio.length,
      format,
    });

    let binaryAudio: Uint8Array;
    try {
      binaryAudio = processBase64Chunks(audio);
    } catch (e) {
      logger.warn('Invalid base64 audio data', { error: String(e) });
      return validationErrorResponse([{ field: 'audio', message: 'Invalid base64-encoded audio data' }], req);
    }
    
    // Map format extension to proper MIME type for OpenAI Whisper
    const mimeTypes: Record<string, string> = {
      'm4a': 'audio/mp4',
      'mp4': 'audio/mp4',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'wav': 'audio/wav',
    };

    const mimeType = mimeTypes[format] || 'audio/webm';

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY not configured');
      return createErrorResponse('Transcription service not configured', logger, { status: 500, request: req });
    }

    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: mimeType });
    formData.append('file', blob, `audio.${format}`);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenAI API error', { status: response.status, error: errorText.slice(0, 200) });
      throw new Error('Failed to process audio transcription');
    }

    const result = await response.json();
    logger.info('Transcription successful', {
      textLength: result.text?.length || 0,
    });

    return createSuccessResponse({ text: result.text }, 200, req);

  } catch (error) {
    return createErrorResponse(error, logger, { request: req });
  }
});
