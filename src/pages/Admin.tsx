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
import AIUserInsights from '@/components/admin/AIUserInsights';
import AdminMemoryManager from '@/components/admin/AdminMemoryManager';
import ConversationAnalytics from '@/components/admin/ConversationAnalytics';
import AIModelSettings from '@/components/admin/AIModelSettings';
import AIMonitoring from '@/components/admin/AIMonitoring';
import FeatureFlagManager from '@/components/admin/FeatureFlagManager';
import { AdminDashboardHome } from '@/components/admin/AdminDashboardHome';
import { ReferralLeaderboard } from '@/components/admin/ReferralLeaderboard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { formatDate } from '@/lib/formatters';
import { SectionErrorBoundary } from '@/components/error-boundaries';
import { FeatureArea } from '@/lib/sentry';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { ContactsManager } from '@/components/admin/ContactsManager';
import { SystemHealth } from '@/components/admin/SystemHealth';
import { KeyboardShortcuts } from '@/components/admin/KeyboardShortcuts';
import { PartnerApplicationsManager } from '@/components/admin/PartnerApplicationsManager';

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
  // Determine default section based on role - content creators go directly to blog
  const getDefaultSection = () => {
    if (hasPermission('manage_blog') && !hasAnyRole(['admin', 'super_admin'])) {
      return 'blog';
    }
    return 'overview';
  };
  
  const [activeSection, setActiveSection] = useState(getDefaultSection);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

  const exportToCSV = <T extends object>(data: T[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify((row as Record<string, unknown>)[header] ?? '')).join(','))
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

      case 'referrals':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load referral leaderboard" featureArea={FeatureArea.ADMIN}>
            <ReferralLeaderboard />
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
          <SectionErrorBoundary fallbackTitle="Failed to load contacts" featureArea={FeatureArea.ADMIN}>
            <ContactsManager />
          </SectionErrorBoundary>
        );

      case 'partners':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load partner applications" featureArea={FeatureArea.ADMIN}>
            <PartnerApplicationsManager />
          </SectionErrorBoundary>
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

      case 'system-health':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load system health" featureArea={FeatureArea.ADMIN}>
            <SystemHealth />
          </SectionErrorBoundary>
        );

      case 'ai-users':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load AI user insights" featureArea={FeatureArea.ADMIN}>
            <AIUserInsights />
          </SectionErrorBoundary>
        );

      case 'ai-memory':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load memory manager" featureArea={FeatureArea.ADMIN}>
            <AdminMemoryManager />
          </SectionErrorBoundary>
        );

      case 'ai-conversations':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load conversation analytics" featureArea={FeatureArea.ADMIN}>
            <ConversationAnalytics />
          </SectionErrorBoundary>
        );

      case 'ai-settings':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load AI model settings" featureArea={FeatureArea.ADMIN}>
            <AIModelSettings />
          </SectionErrorBoundary>
        );

      case 'ai-monitoring':
        if (!hasAnyRole(['admin'])) return <AccessDenied />;
        return (
          <SectionErrorBoundary fallbackTitle="Failed to load AI monitoring" featureArea={FeatureArea.ADMIN}>
            <AIMonitoring />
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
      
      {/* Global components */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen}
        onSectionChange={setActiveSection}
      />
      <KeyboardShortcuts 
        open={shortcutsOpen} 
        onOpenChange={setShortcutsOpen}
        onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
        onSectionChange={setActiveSection}
      />
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
