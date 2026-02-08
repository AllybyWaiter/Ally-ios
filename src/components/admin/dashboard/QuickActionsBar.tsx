import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PenLine, 
  UserPlus, 
  Megaphone, 
  Download,
  Zap,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsBarProps {
  onNavigate?: (tab: string) => void;
  onRefresh?: () => void;
}

export function QuickActionsBar({ onNavigate, onRefresh }: QuickActionsBarProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isGrantingBeta, setIsGrantingBeta] = useState(false);

  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, name, created_at, subscription_tier, status')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const headers = ['Email', 'Name', 'Created At', 'Tier', 'Status'];
      const csvContent = [
        headers.join(','),
        ...(data || []).map(row => [
          JSON.stringify(row.email || ''),
          JSON.stringify(row.name || ''),
          JSON.stringify(row.created_at || ''),
          JSON.stringify(row.subscription_tier || ''),
          JSON.stringify(row.status || ''),
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: 'Export complete', description: `Exported ${data?.length || 0} users` });
    } catch (_error) {
      toast({
        title: 'Export failed',
        description: 'Could not export user data',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGrantRandomBeta = async () => {
    setIsGrantingBeta(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('grant_random_beta_access', {
        admin_user_id: user.id,
        count_to_grant: 5
      });

      if (error) throw error;

      const grantedCount = Array.isArray(data) ? data.length : 0;
      toast({ 
        title: 'Beta access granted', 
        description: `Granted access to ${grantedCount} users`
      });
      onRefresh?.();
    } catch (_error) {
      toast({
        title: 'Failed to grant access',
        description: 'Could not grant beta access',
        variant: 'destructive'
      });
    } finally {
      setIsGrantingBeta(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => onNavigate?.('blog')}
          >
            <PenLine className="h-4 w-4" />
            Create Blog Post
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleGrantRandomBeta}
            disabled={isGrantingBeta}
          >
            {isGrantingBeta ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Grant 5 Beta Access
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => onNavigate?.('announcements')}
          >
            <Megaphone className="h-4 w-4" />
            Send Announcement
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExportUsers}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Users
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
