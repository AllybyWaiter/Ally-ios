import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import {
  corsHeaders,
  handleCors,
  createLogger,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/mod.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('publish-scheduled-posts');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all scheduled posts where published_at is now or in the past
    const now = new Date().toISOString();
    
    logger.info('Checking for scheduled posts', { currentTime: now });

    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, published_at')
      .eq('status', 'scheduled')
      .lte('published_at', now);

    if (fetchError) {
      logger.error('Error fetching scheduled posts', fetchError);
      throw fetchError;
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      logger.info('No posts to publish');
      return createSuccessResponse({ message: 'No posts to publish', count: 0 });
    }

    // Publish all scheduled posts
    const postIds = scheduledPosts.map(post => post.id);
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ status: 'published' })
      .in('id', postIds);

    if (updateError) {
      logger.error('Error publishing posts', updateError);
      throw updateError;
    }

    logger.info('Posts published successfully', {
      count: scheduledPosts.length,
      titles: scheduledPosts.map(p => p.title),
    });

    return createSuccessResponse({ 
      message: 'Posts published successfully', 
      count: scheduledPosts.length,
      posts: scheduledPosts 
    });

  } catch (error) {
    return createErrorResponse(error, logger);
  }
});
