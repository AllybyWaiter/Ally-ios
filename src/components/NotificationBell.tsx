import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, ClipboardList, AlertTriangle, Megaphone, HeartPulse, CloudLightning } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/queryKeys';

interface Announcement {
  id: string;
  read: boolean;
  created_at: string;
  announcements: {
    title: string;
    message: string;
    type: string;
  };
}

interface NotificationLog {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  sent_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task_reminder':
      return <ClipboardList className="h-4 w-4 text-primary" />;
    case 'water_alert':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'health_alert':
      return <HeartPulse className="h-4 w-4 text-rose-500" />;
    case 'weather_alert':
      return <CloudLightning className="h-4 w-4 text-red-500" />;
    case 'announcement':
      return <Megaphone className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'task_reminder':
      return 'Task Reminder';
    case 'water_alert':
      return 'Water Alert';
    case 'health_alert':
      return 'Health Alert';
    case 'weather_alert':
      return 'Weather Alert';
    case 'announcement':
      return 'Announcement';
    default:
      return 'Notification';
  }
};

export default function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('activity');

  // Fetch announcements
  const { data: announcements = [] } = useQuery({
    queryKey: queryKeys.user.notifications(user?.id || ''),
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_notifications')
        .select(`
          id,
          read,
          created_at,
          announcements (
            title,
            message,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data || []) as Announcement[];
    },
    enabled: !!user,
  });

  // Fetch notification history
  const { data: notificationHistory = [] } = useQuery({
    queryKey: queryKeys.user.notificationHistory(user?.id || ''),
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notification_log')
        .select('id, notification_type, title, body, sent_at')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);
      return (data || []) as NotificationLog[];
    },
    enabled: !!user,
  });

  const unreadAnnouncementCount = announcements.filter(n => !n.read).length;
  const activityCount = notificationHistory.length;
  const totalUnread = unreadAnnouncementCount;

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('user_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    queryClient.invalidateQueries({ queryKey: queryKeys.user.notifications(user?.id || '') });
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('user_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false);

    queryClient.invalidateQueries({ queryKey: queryKeys.user.notifications(user?.id || '') });
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 rounded-full hover:bg-foreground/5 transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] font-medium"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {activeTab === 'announcements' && unreadAnnouncementCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs hover:bg-foreground/5">
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          
          <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="activity" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground transition-colors"
            >
              Activity
              {activityCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-[10px] font-medium">
                  {activityCount > 99 ? '99+' : activityCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="announcements"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground transition-colors"
            >
              Announcements
              {unreadAnnouncementCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 px-1.5 text-[10px] font-medium">
                  {unreadAnnouncementCount > 9 ? '9+' : unreadAnnouncementCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="m-0">
            <ScrollArea className="h-[350px]">
              {notificationHistory.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-7 w-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No notification history yet</p>
                  <p className="text-xs mt-1">Push notifications will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {notificationHistory.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex gap-3 p-4 hover:bg-foreground/5 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getNotificationTypeLabel(notification.notification_type)}
                          </span>
                        </div>
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.body}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="announcements" className="m-0">
            <ScrollArea className="h-[350px]">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Megaphone className="h-7 w-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No announcements yet</p>
                  <p className="text-xs mt-1">System announcements will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {announcements.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex flex-col p-4 cursor-pointer hover:bg-foreground/5 transition-colors",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {notification.announcements.title}
                        </span>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {notification.announcements.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
