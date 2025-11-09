import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import { Clock, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
}

interface BlogCalendarProps {
  posts: BlogPost[];
}

export default function BlogCalendar({ posts }: BlogCalendarProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Filter scheduled posts
  const scheduledPosts = posts.filter(
    (post) => post.status === 'scheduled' && post.published_at
  );

  // Get posts for selected date
  const postsForSelectedDate = selectedDate
    ? scheduledPosts.filter((post) =>
        isSameDay(new Date(post.published_at!), selectedDate)
      )
    : [];

  // Get all dates with scheduled posts
  const datesWithPosts = scheduledPosts.map((post) => new Date(post.published_at!));

  // Custom day content to show indicators for dates with posts
  const modifiers = {
    hasPost: datesWithPosts,
  };

  const modifiersStyles = {
    hasPost: {
      fontWeight: 'bold',
      position: 'relative' as const,
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Publication Schedule</CardTitle>
          <CardDescription>
            View all scheduled blog posts on the calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className={cn("rounded-md border pointer-events-auto")}
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
            }}
            components={{
              DayContent: ({ date }) => {
                const hasPost = datesWithPosts.some((d) => isSameDay(d, date));
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {hasPost && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Posts for selected date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
          <CardDescription>
            {postsForSelectedDate.length === 0
              ? 'No scheduled posts'
              : `${postsForSelectedDate.length} scheduled post${postsForSelectedDate.length > 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {postsForSelectedDate.map((post) => (
              <div
                key={post.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm line-clamp-2">{post.title}</h4>
                    <Badge variant="outline" className="shrink-0">
                      Scheduled
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(post.published_at!), 'h:mm a')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
