import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import { Eye, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO, StructuredData, generateBreadcrumbData } from '@/components/SEO';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string;
  view_count: number;
  tags: string[] | null;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image_url, published_at, view_count, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <SEO
        title="Blog - Aquarium, Pool & Spa Care Tips and Guides"
        description="Expert tips, guides, and insights for aquarium, pool, and spa enthusiasts. Learn about water chemistry, maintenance best practices, and get the most out of Ally."
        path="/blog"
      />
      <StructuredData
        type="BreadcrumbList"
        data={{ items: generateBreadcrumbData([{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }]) }}
      />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
            <p className="text-xl text-muted-foreground">
              Tips, guides, and insights for aquarium enthusiasts
            </p>
          </div>

          {/* Blog Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.id}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="md:flex">
                      {post.featured_image_url && (
                        <div className="md:w-1/3">
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className={post.featured_image_url ? 'md:w-2/3' : 'w-full'}>
                        <CardHeader>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Clock className="h-4 w-4" />
                            {formatDate(post.published_at, 'PPP')}
                            <span>•</span>
                            <Eye className="h-4 w-4" />
                            {post.view_count} views
                          </div>
                          <CardTitle className="text-2xl hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                          {post.excerpt && (
                            <CardDescription className="text-base mt-2">
                              {post.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        {post.tags && post.tags.length > 0 && (
                          <CardContent>
                            <div className="flex gap-2 flex-wrap">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
