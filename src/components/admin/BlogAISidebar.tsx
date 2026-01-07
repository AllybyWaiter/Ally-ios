import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BlogAISidebarProps {
  formData: {
    title: string;
    excerpt: string;
    content: string;
    seo_title: string;
    seo_description: string;
    tags: string;
  };
  onUpdate: (updates: Partial<BlogAISidebarProps['formData']>) => void;
  generateSlug: (title: string) => string;
}

export default function BlogAISidebar({ formData, onUpdate, generateSlug }: BlogAISidebarProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');

  const handleAiAction = async (action: 'generate' | 'improve' | 'seo') => {
    setLoading(true);
    try {
      const body: { action: string; input?: Record<string, string> } = { action };

      if (action === 'generate') {
        if (!topic.trim()) {
          toast({
            title: 'Error',
            description: 'Please enter a topic',
            variant: 'destructive',
          });
          return;
        }
        body.input = { topic };
      } else if (action === 'improve') {
        if (!formData.content.trim()) {
          toast({
            title: 'Error',
            description: 'Please add some content first',
            variant: 'destructive',
          });
          return;
        }
        body.input = { title: formData.title, content: formData.content };
      } else if (action === 'seo') {
        if (!formData.title.trim() && !formData.content.trim()) {
          toast({
            title: 'Error',
            description: 'Please add title or content first',
            variant: 'destructive',
          });
          return;
        }
        body.input = { title: formData.title, content: formData.content };
      }

      const { data, error } = await supabase.functions.invoke('blog-ai-assistant', { body });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (action === 'generate') {
        onUpdate({
          title: data.title || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          tags: data.tags || '',
        });
        setTopic('');
      } else if (action === 'improve') {
        onUpdate({ content: data.content || formData.content });
      } else if (action === 'seo') {
        onUpdate({
          seo_title: data.seo_title || formData.seo_title,
          seo_description: data.seo_description || formData.seo_description,
          tags: data.tags || formData.tags,
        });
      }

      toast({
        title: 'Success',
        description: `${action === 'generate' ? 'Post generated' : action === 'improve' ? 'Content improved' : 'SEO fields generated'} successfully`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'AI operation failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate from Topic */}
        <div className="space-y-2">
          <Label htmlFor="ai-topic">Generate from Topic</Label>
          <Textarea
            id="ai-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., 'How to set up a planted aquarium'"
            rows={3}
            disabled={loading}
          />
          <Button
            onClick={() => handleAiAction('generate')}
            disabled={loading}
            className="w-full"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Post'
            )}
          </Button>
        </div>

        <div className="border-t pt-4 space-y-2">
          <Label>Quick Actions</Label>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => handleAiAction('improve')}
              disabled={loading || !formData.content}
              className="w-full justify-start"
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Improve Content
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAiAction('seo')}
              disabled={loading || (!formData.title && !formData.content)}
              className="w-full justify-start"
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate SEO
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
