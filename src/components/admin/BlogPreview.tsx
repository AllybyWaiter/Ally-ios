import { Card, CardContent } from '@/components/ui/card';

interface BlogPreviewProps {
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
}

export default function BlogPreview({
  title,
  excerpt,
  content,
  featuredImage,
  author,
}: BlogPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-8">
          {featuredImage && (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          <h1 className="text-4xl font-bold mb-4 text-foreground">{title || 'Untitled Post'}</h1>
          {excerpt && <p className="text-lg text-muted-foreground mb-6">{excerpt}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <span>By {author || 'Unknown Author'}</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content || '<p>No content yet...</p>' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
