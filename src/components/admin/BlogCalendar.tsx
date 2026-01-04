import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Clock, Edit, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Filter scheduled posts
  const scheduledPosts = posts.filter(
    (post) => post.status === 'scheduled' && post.published_at
  );

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Get posts for selected date
  const postsForSelectedDate = selectedDate
    ? scheduledPosts.filter((post) =>
        isSameDay(new Date(post.published_at!), selectedDate)
      )
    : [];

  // Get all dates with scheduled posts
  const datesWithPosts = scheduledPosts.map((post) => new Date(post.published_at!));

  // Get posts for any given date (for hover preview)
  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter((post) =>
      isSameDay(new Date(post.published_at!), date)
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Publication Schedule</CardTitle>
              <CardDescription>
                View all scheduled blog posts on the calendar
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className={cn("rounded-md border pointer-events-auto")}
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
            }}
            components={{
              DayContent: ({ date }) => {
                const postsOnDate = getPostsForDate(date);
                const hasPost = postsOnDate.length > 0;
                
                if (!hasPost) {
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {date.getDate()}
                    </div>
                  );
                }

                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative w-full h-full flex items-center justify-center cursor-pointer hover:bg-accent/50 rounded-sm">
                        {date.getDate()}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 p-0 pointer-events-auto" 
                      align="center"
                      side="top"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">
                            {format(date, 'MMMM d, yyyy')}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {postsOnDate.length} post{postsOnDate.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {postsOnDate.map((post) => (
                            <div
                              key={post.id}
                              className="border rounded-md p-3 hover:bg-accent/50 transition-colors"
                            >
                            <div className="space-y-1" role="article" aria-label={`Scheduled post: ${post.title}`}>
                                <p className="font-medium text-sm line-clamp-2">
                                  {post.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(post.published_at!), 'h:mm a')}
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs flex-1"
                                    onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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
