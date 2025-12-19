import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const SITE_URL = 'https://allybywaiter.com';

// Static pages with their priority and change frequency
const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/features', priority: 0.9, changefreq: 'weekly' },
  { path: '/pricing', priority: 0.9, changefreq: 'monthly' },
  { path: '/how-it-works', priority: 0.8, changefreq: 'monthly' },
  { path: '/about', priority: 0.7, changefreq: 'monthly' },
  { path: '/faq', priority: 0.8, changefreq: 'monthly' },
  { path: '/contact', priority: 0.6, changefreq: 'monthly' },
  { path: '/blog', priority: 0.8, changefreq: 'daily' },
  { path: '/compare', priority: 0.8, changefreq: 'monthly' },
  { path: '/best-aquatic-app', priority: 0.9, changefreq: 'monthly' },
  { path: '/best-aquarium-app', priority: 0.9, changefreq: 'monthly' },
  { path: '/best-pool-app', priority: 0.9, changefreq: 'monthly' },
  { path: '/best-spa-app', priority: 0.9, changefreq: 'monthly' },
  { path: '/ai-water-testing', priority: 0.9, changefreq: 'monthly' },
  { path: '/help', priority: 0.7, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published blog posts
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
    }

    const now = new Date().toISOString().split('T')[0];

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${page.path}" />
    <xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}${page.path}?lang=es" />
    <xhtml:link rel="alternate" hreflang="fr" href="${SITE_URL}${page.path}?lang=fr" />
  </url>
`;
    }

    // Add blog posts
    if (blogPosts && blogPosts.length > 0) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at 
          ? new Date(post.updated_at).toISOString().split('T')[0]
          : new Date(post.published_at).toISOString().split('T')[0];
        
        sitemap += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    console.log(`Generated sitemap with ${staticPages.length} static pages and ${blogPosts?.length || 0} blog posts`);

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { headers: corsHeaders }
    );
  }
});
