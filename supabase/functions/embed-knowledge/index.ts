/**
 * Embed Knowledge Base Function
 *
 * Generates embeddings for knowledge base entries that don't have them.
 * Run after seeding knowledge base or adding new content.
 *
 * Requires admin auth or service role key.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { generateEmbedding, formatEmbeddingForPostgres } from '../_shared/embeddings.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Use service role for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get knowledge base entries without embeddings
    const { data: entries, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('id, title, content, category')
      .is('embedding', null)
      .limit(50); // Process in batches to avoid timeout

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch entries', details: fetchError.message }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No entries need embedding', processed: 0 }),
        { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Create embedding text from title and content
        const embeddingText = `${entry.category}: ${entry.title}\n\n${entry.content}`;
        const embeddingResult = await generateEmbedding(embeddingText);
        const formattedEmbedding = formatEmbeddingForPostgres(embeddingResult.embedding);

        // Update the entry with embedding
        const { error: updateError } = await supabase
          .from('knowledge_base')
          .update({ embedding: formattedEmbedding })
          .eq('id', entry.id);

        if (updateError) {
          failed++;
          errors.push(`${entry.id}: ${updateError.message}`);
        } else {
          processed++;
        }
      } catch (e) {
        failed++;
        errors.push(`${entry.id}: ${String(e)}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processed} entries`,
        processed,
        failed,
        remaining: entries.length - processed - failed,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
