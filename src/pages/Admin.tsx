import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';
import SupportTickets from '@/components/admin/SupportTickets';
import UserManagement from '@/components/admin/UserManagement';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
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
import { SectionErrorBoundary } from '@/components/error-boundaries';
import { FeatureArea } from '@/lib/sentry';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { ContactsManager } from '@/components/admin/ContactsManager';
import { SystemHealth } from '@/components/admin/SystemHealth';
import { KeyboardShortcuts } from '@/components/admin/KeyboardShortcuts';

export default function Admin() {
  const { hasPermission, hasAnyRole } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    // Simulate initial load
    setIsLoading(false);
  }, []);

  const renderContent = () => {
    if (isLoading) {
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
