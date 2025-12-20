import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Trash2, Menu } from 'lucide-react';
import SupportTickets from '@/components/admin/SupportTickets';
import UserManagement from '@/components/admin/UserManagement';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import BlogManager from '@/components/admin/BlogManager';
import { RoleManager } from '@/components/admin/RoleManager';
import { BetaAccessManager } from '@/components/admin/BetaAccessManager';
import UserActivityLogs from '@/components/admin/UserActivityLogs';
import AIAnalytics from '@/components/admin/AIAnalytics';
import FeatureFlagManager from '@/components/admin/FeatureFlagManager';
import { AdminDashboardHome } from '@/components/admin/AdminDashboardHome';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { formatDate } from '@/lib/formatters';
import { SectionErrorBoundary } from '@/components/error-boundaries';
import { FeatureArea } from '@/lib/sentry';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

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
  const { hasPermission, hasAnyRole } = useAuth();
  const { toast } = useToast();
  
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [contactsSearch, setContactsSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load dashboard" featureArea={FeatureArea.ADMIN}>
            <AdminDashboardHome onTabChange={setActiveSection} />
          </SectionErrorBoundary>
        );

      case 'users':
        if (!hasPermission('manage_users')) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load user management" featureArea={FeatureArea.ADMIN}>
            <UserManagement />
          </SectionErrorBoundary>
        );

      case 'roles':
        if (!hasPermission('manage_roles')) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load role manager" featureArea={FeatureArea.ADMIN}>
            <RoleManager />
          </SectionErrorBoundary>
        );

      case 'beta':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load beta access manager" featureArea={FeatureArea.ADMIN}>
            <BetaAccessManager />
          </SectionErrorBoundary>
        );

      case 'blog':
        if (!hasPermission('manage_blog') && !hasPermission('publish_blog')) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load blog manager" featureArea={FeatureArea.ADMIN}>
            <BlogManager />
          </SectionErrorBoundary>
        );

      case 'announcements':
        if (!hasPermission('manage_announcements')) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load announcements" featureArea={FeatureArea.ADMIN}>
            <AnnouncementManager />
          </SectionErrorBoundary>
        );

      case 'contacts':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
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
        );

      case 'waitlist':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
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
        );

      case 'tickets':
        if (!hasPermission('moderate_support') && !hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load support tickets" featureArea={FeatureArea.ADMIN}>
            <SupportTickets />
          </SectionErrorBoundary>
        );

      case 'activity':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load activity logs" featureArea={FeatureArea.ADMIN}>
            <UserActivityLogs />
          </SectionErrorBoundary>
        );

      case 'ai-analytics':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load AI analytics" featureArea={FeatureArea.ADMIN}>
            <AIAnalytics />
          </SectionErrorBoundary>
        );

      case 'feature-flags':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load feature flags" featureArea={FeatureArea.ADMIN}>
            <FeatureFlagManager />
          </SectionErrorBoundary>
        );

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <SidebarInset className="flex-1">
          <header className="flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 pt-safe">
            <SidebarTrigger className="md:hidden">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold capitalize">
              {activeSection === 'overview' ? 'Admin Dashboard' : activeSection.replace(/-/g, ' ')}
            </h1>
          </header>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AccessDenied() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">You don't have permission to access this section.</p>
      </CardContent>
    </Card>
  );
}
