import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Send, Edit, Trash2, Calendar, Mail, Bell } from 'lucide-react';
import { z } from 'zod';

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
  type: z.enum(["info", "warning", "success", "error"]),
  target_audience: z.enum(["all", "free", "plus", "gold", "enterprise"]),
  send_email: z.boolean(),
  send_in_app: z.boolean(),
  scheduled_at: z.string().optional(),
});

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  send_email: boolean;
  send_in_app: boolean;
  created_at: string;
}

export default function AnnouncementManager() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all',
    send_email: false,
    send_in_app: true,
    scheduled_at: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch announcements',
        variant: 'destructive',
      });
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      announcementSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('announcements').insert({
        ...formData,
        scheduled_at: formData.scheduled_at || null,
        created_by: user.id,
        status: formData.scheduled_at ? 'scheduled' : 'draft',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement created successfully',
      });

      setDialogOpen(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_audience: 'all',
        send_email: false,
        send_in_app: true,
        scheduled_at: '',
      });
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create announcement',
        variant: 'destructive',
      });
    }
  };

  const handleSendNow = async (announcementId: string) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-announcement', {
        body: { announcementId },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement sent successfully',
      });
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send announcement',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (announcementId: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Announcement deleted',
      });
      fetchAnnouncements();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'outline',
      scheduled: 'secondary',
      sent: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      info: 'default',
      warning: 'outline',
      success: 'secondary',
      error: 'destructive',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = {
    total: announcements.length,
    draft: announcements.filter(a => a.status === 'draft').length,
    scheduled: announcements.filter(a => a.status === 'scheduled').length,
    sent: announcements.filter(a => a.status === 'sent').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Create and send announcements to your users</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{announcement.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {announcement.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(announcement.type)}</TableCell>
                  <TableCell className="capitalize">{announcement.target_audience}</TableCell>
                  <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {announcement.send_email && <Mail className="h-4 w-4 text-muted-foreground" />}
                      {announcement.send_in_app && <Bell className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    {announcement.scheduled_at ? formatDate(announcement.scheduled_at, 'PP') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {announcement.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendNow(announcement.id)}
                          disabled={sending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Send announcements to your users via email and in-app notifications</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Important update about..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your announcement message here..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="free">Free Tier</SelectItem>
                    <SelectItem value="plus">Plus Tier</SelectItem>
                    <SelectItem value="gold">Gold Tier</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled">Schedule For (Optional)</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="send_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Email
              </Label>
              <Switch
                id="send_email"
                checked={formData.send_email}
                onCheckedChange={(checked) => setFormData({ ...formData, send_email: checked })}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="send_in_app" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                In-App Notification
              </Label>
              <Switch
                id="send_in_app"
                checked={formData.send_in_app}
                onCheckedChange={(checked) => setFormData({ ...formData, send_in_app: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
