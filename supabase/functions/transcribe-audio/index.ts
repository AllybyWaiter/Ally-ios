import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  handleCors,
  createLogger,
  validateString,
  collectErrors,
  validationErrorResponse,
  checkRateLimit,
  rateLimitExceededResponse,
  extractIdentifier,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
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
    const body = await req.json();
    const { audio } = body;

    // Input validation
    const errors = collectErrors(
      validateString(audio, 'audio', { minLength: 100, maxLength: 10000000 })
    );

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors);
    }

    // Rate limiting (10 transcriptions per minute)
    const identifier = extractIdentifier(req);
    const rateLimitResult = checkRateLimit({
      maxRequests: 10,
      windowMs: 60 * 1000,
      identifier: `transcribe:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    logger.info('Processing audio transcription', {
      audioSize: audio.length,
    });
    
    const binaryAudio = processBase64Chunks(audio);
    
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenAI API error', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    logger.info('Transcription successful', {
      textLength: result.text?.length || 0,
    });

    return createSuccessResponse({ text: result.text });

  } catch (error) {
    return createErrorResponse(error, logger);
  }
});
