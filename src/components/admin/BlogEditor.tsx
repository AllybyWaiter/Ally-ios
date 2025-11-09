import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, Upload, X, Sparkles, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { z } from 'zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug must be less than 200 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  excerpt: z.string().max(300, 'Excerpt must be less than 300 characters').optional(),
  content: z.string().min(1, 'Content is required'),
  seo_title: z.string().max(60, 'SEO title must be less than 60 characters').optional(),
  seo_description: z.string().max(160, 'SEO description must be less than 160 characters').optional(),
  tags: z.string().optional(),
});

export default function BlogEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    seo_title: '',
    seo_description: '',
    tags: '',
  });

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch post',
        variant: 'destructive',
      });
      navigate('/admin');
    } else if (data) {
      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        content: data.content,
        featured_image_url: data.featured_image_url || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        tags: data.tags?.join(', ') || '',
      });
      if (data.featured_image_url) {
        setFeaturedImagePreview(data.featured_image_url);
      }
    }
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (!isEditing) {
      setFormData(prev => ({ ...prev, slug: generateSlug(title) }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setFeaturedImage(file);
      setFeaturedImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!featuredImage) return formData.featured_image_url || null;

    const fileExt = featuredImage.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('blog-images')
      .upload(filePath, featuredImage);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('blog-ai-assistant', {
        body: { action: 'generate', input: { topic: aiTopic } },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setFormData({
        ...formData,
        title: data.title || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        tags: data.tags || '',
        slug: generateSlug(data.title || ''),
      });

      setAiDialogOpen(false);
      setAiTopic('');
      toast({
        title: 'Success',
        description: 'Blog post generated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImprove = async () => {
    if (!formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some content first',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('blog-ai-assistant', {
        body: {
          action: 'improve',
          input: { title: formData.title, content: formData.content },
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setFormData({ ...formData, content: data.content || formData.content });
      toast({
        title: 'Success',
        description: 'Content improved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to improve content',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSeo = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title or content first',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('blog-ai-assistant', {
        body: {
          action: 'seo',
          input: { title: formData.title, content: formData.content },
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setFormData({
        ...formData,
        seo_title: data.seo_title || formData.seo_title,
        seo_description: data.seo_description || formData.seo_description,
        tags: data.tags || formData.tags,
      });

      toast({
        title: 'Success',
        description: 'SEO fields generated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate SEO fields',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (publish: boolean = false, schedule: boolean = false) => {
    try {
      setSaving(true);
      
      const validatedData = blogPostSchema.parse(formData);

      const imageUrl = await uploadImage();

      const tags = validatedData.tags
        ? validatedData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      let status = 'draft';
      let publishedAt = null;

      if (schedule) {
        if (!scheduleDate) {
          toast({
            title: 'Error',
            description: 'Please select a schedule date',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
        
        const [hours, minutes] = scheduleTime.split(':');
        const scheduledDateTime = new Date(scheduleDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (scheduledDateTime <= new Date()) {
          toast({
            title: 'Error',
            description: 'Schedule date must be in the future',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        status = 'scheduled';
        publishedAt = scheduledDateTime.toISOString();
      } else if (publish) {
        status = 'published';
        publishedAt = new Date().toISOString();
      }

      const postData = {
        title: validatedData.title,
        slug: validatedData.slug,
        excerpt: validatedData.excerpt || null,
        content: validatedData.content,
        featured_image_url: imageUrl,
        seo_title: validatedData.seo_title || null,
        seo_description: validatedData.seo_description || null,
        tags: tags.length > 0 ? tags : null,
        status,
        published_at: publishedAt,
        author_id: user?.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);

        if (error) throw error;
      }

      const actionText = schedule ? 'scheduled' : (publish ? 'published' : 'saved as draft');
      toast({
        title: 'Success',
        description: `Post ${actionText} successfully`,
      });

      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Posts
        </Button>
        <div className="flex gap-2">
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={aiLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Blog Assistant</DialogTitle>
                <DialogDescription>
                  Generate a complete blog post from a topic
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-topic">Blog Topic</Label>
                  <Textarea
                    id="ai-topic"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="E.g., 'How to set up a planted aquarium for beginners'"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                  className="w-full"
                >
                  {aiLoading ? 'Generating...' : 'Generate Blog Post'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={handleAiImprove}
            disabled={aiLoading || !formData.content}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Improve Content
          </Button>
          <Button
            variant="outline"
            onClick={handleAiSeo}
            disabled={aiLoading || (!formData.title && !formData.content)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate SEO
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={saving}>
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Publication Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduleDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => handleSave(false, true)} 
                  disabled={saving || !scheduleDate}
                  className="w-full"
                >
                  Schedule Post
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Eye className="mr-2 h-4 w-4" />
            Publish Now
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit' : 'Create'} Blog Post</CardTitle>
          <CardDescription>Write and publish engaging content for your audience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title..."
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug * (URL-friendly)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="my-blog-post"
            />
            <p className="text-sm text-muted-foreground">
              Preview: /blog/{formData.slug || 'your-slug'}
            </p>
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <Label htmlFor="image">Featured Image</Label>
            {featuredImagePreview && (
              <div className="relative w-full max-w-md">
                <img
                  src={featuredImagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setFeaturedImage(null);
                    setFeaturedImagePreview('');
                    setFormData({ ...formData, featured_image_url: '' });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('image')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
              <span className="text-sm text-muted-foreground">Max 5MB</span>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief summary of your post..."
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Content *</Label>
            <div className="border rounded-md">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={modules}
                className="h-64 mb-12"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="aquarium, fish, care, tips"
            />
          </div>

          {/* SEO Section */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">SEO Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="Optimized title for search engines (max 60 chars)"
                maxLength={60}
              />
              <p className="text-sm text-muted-foreground">
                {formData.seo_title.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Meta description for search engines (max 160 chars)"
                rows={3}
                maxLength={160}
              />
              <p className="text-sm text-muted-foreground">
                {formData.seo_description.length}/160 characters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
