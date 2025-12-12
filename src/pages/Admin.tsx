import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Download, Search, Trash2, Users, Mail, MessageSquare, Home, Ticket, UserCog, Megaphone, FileText, Shield, UserPlus, Activity, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupportTickets from '@/components/admin/SupportTickets';
import UserManagement from '@/components/admin/UserManagement';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import BlogManager from '@/components/admin/BlogManager';
import { RoleManager } from '@/components/admin/RoleManager';
import { BetaAccessManager } from '@/components/admin/BetaAccessManager';
import UserActivityLogs from '@/components/admin/UserActivityLogs';
import AIAnalytics from '@/components/admin/AIAnalytics';
import { formatDate } from '@/lib/formatters';
import { SectionErrorBoundary } from '@/components/error-boundaries';
import { FeatureArea } from '@/lib/sentry';

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
}

interface ContactEntry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export default function Admin() {
  const { signOut, user, hasPermission, hasAnyRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [contactsSearch, setContactsSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: waitlistData } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (waitlistData) setWaitlist(waitlistData);
    if (contactsData) setContacts(contactsData);
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const deleteWaitlistEntry = async (id: string) => {
    const { error } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Entry deleted' });
      fetchData();
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
      toast({ title: 'Success', description: 'Contact deleted' });
      fetchData();
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredWaitlist = waitlist.filter(entry =>
    entry.email.toLowerCase().includes(waitlistSearch.toLowerCase())
  );

  const filteredContacts = contacts.filter(entry =>
    entry.name.toLowerCase().includes(contactsSearch.toLowerCase()) ||
    entry.email.toLowerCase().includes(contactsSearch.toLowerCase()) ||
    entry.message.toLowerCase().includes(contactsSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Waitlist</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{waitlist.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Contacts</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contacts.filter(c => c.status === 'new').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={hasPermission('manage_users') ? 'users' : hasAnyRole(['admin']) ? 'beta' : hasPermission('manage_roles') ? 'roles' : hasPermission('manage_blog') ? 'blog' : 'tickets'} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {hasPermission('manage_users') && (
              <TabsTrigger value="users">
                <UserCog className="mr-2 h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            {hasAnyRole(['admin']) && (
              <TabsTrigger value="beta">
                <UserPlus className="mr-2 h-4 w-4" />
                Beta Access
              </TabsTrigger>
            )}
            {hasPermission('manage_roles') && (
              <TabsTrigger value="roles">
                <Shield className="mr-2 h-4 w-4" />
                Roles
              </TabsTrigger>
            )}
            {(hasPermission('manage_blog') || hasPermission('publish_blog')) && (
              <TabsTrigger value="blog">
                <FileText className="mr-2 h-4 w-4" />
                Blog
              </TabsTrigger>
            )}
            {hasPermission('manage_announcements') && (
              <TabsTrigger value="announcements">
                <Megaphone className="mr-2 h-4 w-4" />
                Announcements
              </TabsTrigger>
            )}
            {hasAnyRole(['admin']) && (
              <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            )}
            {hasAnyRole(['admin']) && (
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            )}
            {(hasPermission('moderate_support') || hasAnyRole(['admin'])) && (
              <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            )}
            {hasAnyRole(['admin']) && (
              <TabsTrigger value="activity">
                <Activity className="mr-2 h-4 w-4" />
                Activity Logs
              </TabsTrigger>
            )}
            {hasAnyRole(['admin']) && (
              <TabsTrigger value="ai-analytics">
                <Brain className="mr-2 h-4 w-4" />
                AI Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {hasAnyRole(['admin']) && (
            <TabsContent value="beta" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load beta access manager" featureArea={FeatureArea.ADMIN}>
                <BetaAccessManager />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          {hasPermission('manage_users') && (
            <TabsContent value="users" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load user management" featureArea={FeatureArea.ADMIN}>
                <UserManagement />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          {hasPermission('manage_roles') && (
            <TabsContent value="roles" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load role manager" featureArea={FeatureArea.ADMIN}>
                <RoleManager />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          {(hasPermission('manage_blog') || hasPermission('publish_blog')) && (
            <TabsContent value="blog" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load blog manager" featureArea={FeatureArea.ADMIN}>
                <BlogManager />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          {hasPermission('manage_announcements') && (
            <TabsContent value="announcements" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load announcements" featureArea={FeatureArea.ADMIN}>
                <AnnouncementManager />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          {hasAnyRole(['admin']) && (
            <TabsContent value="waitlist" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Waitlist Signups</CardTitle>
                      <CardDescription>Manage and export waitlist entries</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV(waitlist, 'waitlist')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                <div className="flex items-center gap-2 mt-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={waitlistSearch}
                    onChange={(e) => setWaitlistSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWaitlist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell>{formatDate(entry.created_at, 'PP')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWaitlistEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {hasAnyRole(['admin']) && (
            <TabsContent value="contacts" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Contact Submissions</CardTitle>
                      <CardDescription>View and manage contact form messages</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV(contacts, 'contacts')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                <div className="flex items-center gap-2 mt-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={contactsSearch}
                    onChange={(e) => setContactsSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.name}</TableCell>
                        <TableCell>{entry.email}</TableCell>
                        <TableCell className="max-w-md truncate">{entry.message}</TableCell>
                        <TableCell>{formatDate(entry.created_at, 'PP')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteContact(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {(hasPermission('moderate_support') || hasAnyRole(['admin'])) && (
            <TabsContent value="tickets" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load support tickets" featureArea={FeatureArea.ADMIN}>
                <SupportTickets />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          {hasAnyRole(['admin']) && (
            <TabsContent value="activity" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load activity logs" featureArea={FeatureArea.ADMIN}>
                <UserActivityLogs />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          {hasAnyRole(['admin']) && (
            <TabsContent value="ai-analytics" className="space-y-4">
              <SectionErrorBoundary fallbackTitle="Failed to load AI analytics" featureArea={FeatureArea.ADMIN}>
                <AIAnalytics />
              </SectionErrorBoundary>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
