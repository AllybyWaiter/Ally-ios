import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Mail, Download, Search, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  beta_access_granted: boolean;
  beta_access_granted_at: string | null;
}

export const BetaAccessManager = () => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [countToGrant, setCountToGrant] = useState('5');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch waitlist',
        variant: 'destructive',
      });
    } else {
      setWaitlist(data || []);
    }
    setLoading(false);
  };

  const grantRandomBetaAccess = async () => {
    if (!user?.id) return;
    
    const count = parseInt(countToGrant);
    if (isNaN(count) || count < 1) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number',
        variant: 'destructive',
      });
      return;
    }

    setGranting(true);
    try {
      const { data, error } = await supabase.rpc('grant_random_beta_access', {
        count_to_grant: count,
        admin_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Success! 🎉',
        description: `Granted beta access to ${data?.length || 0} users`,
      });
      fetchWaitlist();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGranting(false);
    }
  };

  const toggleBetaAccess = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('waitlist')
      .update({
        beta_access_granted: !currentStatus,
        beta_access_granted_at: !currentStatus ? new Date().toISOString() : null,
        granted_by: !currentStatus ? user?.id : null,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update beta access',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Beta access ${!currentStatus ? 'granted' : 'revoked'}`,
      });
      fetchWaitlist();
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Joined Date', 'Beta Access', 'Access Granted Date'];
    const csvContent = [
      headers.join(','),
      ...waitlist.map(entry => [
        entry.email,
        formatDate(entry.created_at, 'PP'),
        entry.beta_access_granted ? 'Yes' : 'No',
        entry.beta_access_granted_at ? formatDate(entry.beta_access_granted_at, 'PP') : 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beta-access-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredWaitlist = waitlist.filter(entry =>
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: waitlist.length,
    granted: waitlist.filter(e => e.beta_access_granted).length,
    pending: waitlist.filter(e => !e.beta_access_granted).length,
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waitlist</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beta Access Granted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.granted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Random Grant Section */}
      <Card>
        <CardHeader>
          <CardTitle>Grant Random Beta Access</CardTitle>
          <CardDescription>
            Randomly select users from the waitlist to grant beta access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-2 block">Number of users</label>
              <Input
                type="number"
                min="1"
                value={countToGrant}
                onChange={(e) => setCountToGrant(e.target.value)}
                placeholder="5"
              />
            </div>
            <Button onClick={grantRandomBetaAccess} disabled={granting || stats.pending === 0}>
              {granting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Granting...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Grant Random Access
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Waitlist Management</CardTitle>
              <CardDescription>View and manage beta access for waitlist users</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <TableHead>Status</TableHead>
                <TableHead>Access Granted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWaitlist.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {entry.email}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(entry.created_at, 'PP')}</TableCell>
                  <TableCell>
                    {entry.beta_access_granted ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Beta Access
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 h-3 w-3" />
                        Waitlist
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.beta_access_granted_at 
                      ? formatDate(entry.beta_access_granted_at, 'PP')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={entry.beta_access_granted ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleBetaAccess(entry.id, entry.beta_access_granted)}
                    >
                      {entry.beta_access_granted ? 'Revoke' : 'Grant Access'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
