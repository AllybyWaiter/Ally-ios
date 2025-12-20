import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Search, 
  Trash2, 
  Mail, 
  Eye, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  Filter
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  subject: string | null;
  company: string | null;
  inquiry_type: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  resolved: 'bg-green-500',
  spam: 'bg-red-500',
};

const responseTemplates = [
  {
    name: 'Thank You',
    subject: 'Thank you for contacting us',
    body: `Hi {{name}},

Thank you for reaching out to us. We've received your message and will get back to you shortly.

Best regards,
The Team`,
  },
  {
    name: 'Follow Up',
    subject: 'Following up on your inquiry',
    body: `Hi {{name}},

Thank you for your patience. We wanted to follow up on your inquiry about your message.

Is there anything else we can help you with?

Best regards,
The Team`,
  },
  {
    name: 'Issue Resolved',
    subject: 'Your inquiry has been resolved',
    body: `Hi {{name}},

We're pleased to inform you that your inquiry has been resolved.

If you have any further questions, please don't hesitate to reach out.

Best regards,
The Team`,
  },
];

export function ContactsManager() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    let filtered = contacts;
    
    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.message.toLowerCase().includes(search.toLowerCase()) ||
        c.subject?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    setFilteredContacts(filtered);
  }, [search, statusFilter, contacts]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch contacts',
        variant: 'destructive',
      });
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('contacts')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Status updated' });
      fetchContacts();
    }
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Contact deleted' });
      fetchContacts();
    }
  };

  const openViewDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setViewDialogOpen(true);
    
    // Mark as in_progress if new
    if (contact.status === 'new') {
      updateStatus(contact.id, 'in_progress');
    }
  };

  const openReplyDialog = (contact: Contact, template?: typeof responseTemplates[0]) => {
    setSelectedContact(contact);
    if (template) {
      setReplySubject(template.subject);
      setReplyMessage(template.body.replace('{{name}}', contact.name));
    } else {
      setReplySubject(`Re: ${contact.subject || 'Your inquiry'}`);
      setReplyMessage('');
    }
    setReplyDialogOpen(true);
  };

  const sendReply = async () => {
    if (!selectedContact) return;

    // For now, just open mailto - in production, use edge function
    const mailtoUrl = `mailto:${selectedContact.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyMessage)}`;
    window.open(mailtoUrl, '_blank');
    
    // Update status to resolved
    await updateStatus(selectedContact.id, 'resolved');
    
    toast({ title: 'Reply opened in email client' });
    setReplyDialogOpen(false);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Subject', 'Message', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...contacts.map(c => [
        c.name,
        c.email,
        c.subject || '',
        c.message.replace(/"/g, '""'),
        c.status,
        formatDate(c.created_at, 'PP')
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    inProgress: contacts.filter(c => c.status === 'in_progress').length,
    resolved: contacts.filter(c => c.status === 'resolved').length,
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-yellow-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Contact Submissions</CardTitle>
              <CardDescription>Manage and respond to contact form messages</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer" onClick={() => openViewDialog(contact)}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[200px] truncate">{contact.subject || contact.message.substring(0, 50)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[contact.status] || 'bg-gray-500'}>
                      {contact.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(contact.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReplyDialog(contact)}>
                            Custom Reply
                          </DropdownMenuItem>
                          {responseTemplates.map((template) => (
                            <DropdownMenuItem
                              key={template.name}
                              onClick={() => openReplyDialog(contact, template)}
                            >
                              {template.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Select
                        value={contact.status}
                        onValueChange={(value) => updateStatus(contact.id, value)}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="spam">Spam</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContact(contact.id)}
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              From {selectedContact?.name} ({selectedContact?.email})
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p>{selectedContact.subject || 'No subject'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p>{selectedContact.company || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p>{selectedContact.inquiry_type || 'General'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Received</Label>
                  <p>{formatDate(selectedContact.created_at, 'PPpp')}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Message</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedContact) openReplyDialog(selectedContact);
            }}>
              <Mail className="mr-2 h-4 w-4" />
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {selectedContact?.name}</DialogTitle>
            <DialogDescription>
              Send a response to {selectedContact?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Message</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Use Template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {responseTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.name}
                        onClick={() => {
                          setReplySubject(template.subject);
                          setReplyMessage(template.body.replace('{{name}}', selectedContact?.name || ''));
                        }}
                      >
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendReply}>
              <Mail className="mr-2 h-4 w-4" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
