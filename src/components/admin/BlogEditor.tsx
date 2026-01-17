import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, Upload, X, Calendar as CalendarIcon, Clock, Table } from 'lucide-react';
import { z } from 'zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import BlogContentStats from './BlogContentStats';
import BlogAISidebar from './BlogAISidebar';
import BlogPreview from './BlogPreview';

const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug must be less than 200 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  excerpt: z.string().max(300, 'Excerpt must be less than 300 characters').optional(),
  content: z.string().min(1, 'Content is required'),
  author_name: z.string().min(1, 'Author name is required').max(100, 'Author name must be less than 100 characters'),
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
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author_name: '',
    featured_image_url: '',
    seo_title: '',
    seo_description: '',
    tags: '',
  });

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (featuredImagePreview && !featuredImagePreview.startsWith('http')) {
        URL.revokeObjectURL(featuredImagePreview);
      }
    };
  }, [featuredImagePreview]);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchPost();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Failed to fetch categories:', error);
        toast({
          title: 'Warning',
          description: 'Failed to load categories',
          variant: 'destructive',
        });
      }
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, blog_post_categories(category_id)')
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
        author_name: data.author_name || '',
        featured_image_url: data.featured_image_url || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        tags: data.tags?.join(', ') || '',
      });
      if (data.featured_image_url) {
        setFeaturedImagePreview(data.featured_image_url);
      }
      // Load selected categories
      const postCategories = data.blog_post_categories?.map((pc: { category_id: string }) => pc.category_id) || [];
      setSelectedCategories(postCategories);
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
      
      // Revoke previous preview URL to prevent memory leak
      if (featuredImagePreview && !featuredImagePreview.startsWith('http')) {
        URL.revokeObjectURL(featuredImagePreview);
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
        author_name: validatedData.author_name,
        featured_image_url: imageUrl,
        seo_title: validatedData.seo_title || null,
        seo_description: validatedData.seo_description || null,
        tags: tags.length > 0 ? tags : null,
        status,
        published_at: publishedAt,
        author_id: user?.id,
      };

      let postId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Check if slug already exists
        const { data: existingPost } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', validatedData.slug)
          .maybeSingle();

        if (existingPost) {
          throw new Error('A post with this slug already exists. Please choose a different slug.');
        }

        const { data: newPost, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!newPost) throw new Error('Failed to create post');
        postId = newPost.id;
      }

      // Update categories - delete then insert (transaction-like behavior via error handling)
      if (postId) {
        // Delete existing categories
        const { error: deleteError } = await supabase
          .from('blog_post_categories')
          .delete()
          .eq('post_id', postId);

        if (deleteError) {
          console.error('Failed to delete existing categories:', deleteError);
          throw new Error('Failed to update categories');
        }

        // Insert new categories
        if (selectedCategories.length > 0) {
          const categoryData = selectedCategories.map(categoryId => ({
            post_id: postId,
            category_id: categoryId,
          }));
          const { error: insertError } = await supabase.from('blog_post_categories').insert(categoryData);
          if (insertError) {
            console.error('Failed to insert categories:', insertError);
            throw new Error('Failed to save categories');
          }
        }
      }

      const actionText = schedule ? 'scheduled' : (publish ? 'published' : 'saved as draft');
      toast({
        title: 'Success',
        description: `Post ${actionText} successfully`,
      });

      navigate('/admin');
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const insertTable = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) {
      toast({
        title: "Error",
        description: "Editor not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Build HTML table with proper styling
    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;"><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 50px;">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';
    
    // Get current selection or end of content
    const range = quill.getSelection();
    const insertIndex = range ? range.index : quill.getLength();
    
    // Insert the table HTML directly using Quill's API
    quill.clipboard.dangerouslyPasteHTML(insertIndex, tableHtml, 'user');
    
    // Move cursor after the table
    quill.setSelection(insertIndex + 1, 0);
    
    setTablePopoverOpen(false);
    
    toast({
      title: "Table inserted",
      description: `A ${tableRows}x${tableCols} table has been added.`,
    });
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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Button>
            <div className="flex gap-2">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  {/* Content Tab */}
                  <TabsContent value="content" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Enter an engaging post title..."
                        className="text-lg"
                      />
                    </div>

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

                    <div className="space-y-2">
                      <Label htmlFor="author_name">Author Name *</Label>
                      <Input
                        id="author_name"
                        value={formData.author_name}
                        onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                        placeholder="Enter author's name..."
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Brief summary of your post..."
                        rows={3}
                        maxLength={300}
                      />
                      <p className="text-sm text-muted-foreground">
                        {formData.excerpt.length}/300 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Content *</Label>
                        <Popover open={tablePopoverOpen} onOpenChange={setTablePopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Table className="h-4 w-4 mr-2" />
                              Insert Table
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48" align="end">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Rows</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  max={10}
                                  value={tableRows}
                                  onChange={(e) => setTableRows(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)))}
                                  className="w-16 h-8"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Columns</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  max={6}
                                  value={tableCols}
                                  onChange={(e) => setTableCols(Math.min(6, Math.max(2, parseInt(e.target.value) || 2)))}
                                  className="w-16 h-8"
                                />
                              </div>
                              <Button onClick={insertTable} className="w-full" size="sm">
                                Insert
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="border rounded-md">
                        <ReactQuill
                          ref={quillRef}
                          theme="snow"
                          value={formData.content}
                          onChange={(content) => setFormData({ ...formData, content })}
                          modules={modules}
                          className="min-h-[400px]"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Media Tab */}
                  <TabsContent value="media" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="image">Featured Image</Label>
                      {featuredImagePreview && (
                        <div className="relative w-full max-w-2xl">
                          <img
                            src={featuredImagePreview}
                            alt="Preview"
                            className="w-full h-64 object-cover rounded-lg"
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
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    <div className="space-y-2">
                      <Label>Categories</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={category.id}
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={() => toggleCategory(category.id)}
                            />
                            <label
                              htmlFor={category.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="aquarium, fish, care, tips"
                      />
                    </div>
                  </TabsContent>

                  {/* SEO Tab */}
                  <TabsContent value="seo" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={formData.seo_title}
                        onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                        placeholder="Optimized title for search engines"
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
                        placeholder="Meta description for search engines"
                        rows={4}
                        maxLength={160}
                      />
                      <p className="text-sm text-muted-foreground">
                        {formData.seo_description.length}/160 characters
                      </p>
                    </div>
                  </TabsContent>

                  {/* Preview Tab */}
                  <TabsContent value="preview">
                    <BlogPreview
                      title={formData.title}
                      excerpt={formData.excerpt}
                      content={formData.content}
                      featuredImage={featuredImagePreview}
                      author={formData.author_name || 'Unknown Author'}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            <BlogContentStats
              title={formData.title}
              content={formData.content}
              excerpt={formData.excerpt}
              authorName={formData.author_name}
              seoTitle={formData.seo_title}
              seoDescription={formData.seo_description}
              featuredImage={featuredImagePreview}
              categories={selectedCategories}
            />
            <BlogAISidebar
              formData={formData}
              onUpdate={(updates) => setFormData({ ...formData, ...updates })}
              generateSlug={generateSlug}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
