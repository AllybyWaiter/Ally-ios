import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import { ArrowLeft, Clock, Eye } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  featured_image_url: string | null;
  published_at: string;
  view_count: number;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!error && data) {
      setPost(data);
      
      // Increment view count
      await supabase
        .from('blog_posts')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id);
        
      // Update SEO meta tags
      if (data.seo_title) {
        document.title = data.seo_title;
      } else {
        document.title = data.title;
      }
      
      if (data.seo_description) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', data.seo_description);
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The blog post you are looking for does not exist.
            </p>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <article className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link to="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          {/* Featured Image */}
          {post.featured_image_url && (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}

          {/* Post Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatDate(post.published_at, 'PPP')}
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {post.view_count} views
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Post Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
}
