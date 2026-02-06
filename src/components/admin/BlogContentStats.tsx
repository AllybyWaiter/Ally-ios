import { FileText, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BlogContentStatsProps {
  title: string;
  content: string;
  excerpt: string;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
  featuredImage: string;
  categories: string[];
}

export default function BlogContentStats({
  title,
  content,
  excerpt,
  authorName,
  seoTitle,
  seoDescription,
  featuredImage,
  categories,
}: BlogContentStatsProps) {
  // Calculate word count (strip HTML tags safely via regex — no DOM parsing of untrusted content)
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const wordCount = stripHtml(content).split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

  // Calculate completion percentage
  const checklist = [
    { label: 'Title', completed: !!title },
    { label: 'Author Name', completed: !!authorName },
    { label: 'Content', completed: wordCount > 100 },
    { label: 'Excerpt', completed: !!excerpt },
    { label: 'Featured Image', completed: !!featuredImage },
    { label: 'SEO Title', completed: !!seoTitle },
    { label: 'SEO Description', completed: !!seoDescription },
    { label: 'Categories', completed: categories.length > 0 },
  ];

  const completedItems = checklist.filter((item) => item.completed).length;
  const completionPercentage = Math.round((completedItems / checklist.length) * 100);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Words</p>
                <p className="text-lg font-semibold">{wordCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Read Time</p>
                <p className="text-lg font-semibold">{readingTime} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Checklist */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Post Completion</h4>
              <span className="text-sm font-medium text-primary">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      item.completed ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
