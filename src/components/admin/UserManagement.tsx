import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Edit, Mail, UserCheck, UserX, Trash2, Activity } from 'lucide-react';
import UserActivityLogs from './UserActivityLogs';
import { formatDate } from '@/lib/formatters';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  subscription_tier: string;
  skill_level: string;
  theme_preference: string;
  language_preference: string;
  unit_preference: string;
  onboarding_completed: boolean;
  status: string;
  suspended_until: string | null;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailMessage, setBulkEmailMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState<UserProfile | null>(null);
  const [suspensionType, setSuspensionType] = useState<'suspend' | 'ban'>('suspend');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState<string>('7');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  const fetchUsersRef = useRef(fetchUsers);
  useEffect(() => {
    fetchUsersRef.current = fetchUsers;
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();

    // Set up realtime subscription for new users
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Refresh the user list when any profile changes
          fetchUsersRef.current();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error for profiles-changes');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  // Filter users based on debounced search
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) {
      return users;
    }
    const searchLower = debouncedSearch.toLowerCase();
    return users.filter(user =>
      user.email?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.subscription_tier?.toLowerCase().includes(searchLower)
    );
  }, [debouncedSearch, users]);

  const handleEditUser = useCallback((user: UserProfile) => {
    setEditingUser({ ...user });
    setEditDialogOpen(true);
  }, []);

  const handleSaveUser = async () => {
    if (!editingUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: editingUser.name,
        subscription_tier: editingUser.subscription_tier,
        skill_level: editingUser.skill_level,
        theme_preference: editingUser.theme_preference,
        language_preference: editingUser.language_preference,
        unit_preference: editingUser.unit_preference,
      })
      .eq('id', editingUser.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      setEditDialogOpen(false);
      fetchUsers();
    }
  };

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
      return newSelected;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkEmail = () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to send emails to',
        variant: 'destructive',
      });
      return;
    }
    setBulkEmailDialogOpen(true);
  };

  const sendBulkEmail = async () => {
    const selectedUserEmails = users
      .filter(u => selectedUsers.has(u.id))
      .map(u => u.email);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to send emails',
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('send-bulk-email', {
        body: {
          emails: selectedUserEmails,
          subject: bulkEmailSubject,
          message: bulkEmailMessage,
          fromName: 'Ally Team',
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Emails sent',
        description: `Successfully sent to ${response.data?.successCount || selectedUserEmails.length} users`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send bulk email';
      toast({
        title: 'Error sending emails',
        description: message,
        variant: 'destructive',
      });
    }

    setBulkEmailDialogOpen(false);
    setBulkEmailSubject('');
    setBulkEmailMessage('');
    setSelectedUsers(new Set());
  };

  const handleBulkUpdateTier = async (tier: string) => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to update',
        variant: 'destructive',
      });
      return;
    }

    const userIds = Array.from(selectedUsers);
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .in('id', userIds);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update users',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Updated ${userIds.length} users to ${tier} tier`,
      });
      setSelectedUsers(new Set());
      fetchUsers();
    }
  };

  const handleDeleteUser = useCallback((user: UserProfile) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }, []);

  const handleSuspendUser = useCallback((user: UserProfile) => {
    setSuspendingUser(user);
    setSuspensionType('suspend');
    setSuspensionReason('');
    setSuspensionDuration('7');
    setSuspendDialogOpen(true);
  }, []);

  const handleBanUser = useCallback((user: UserProfile) => {
    setSuspendingUser(user);
    setSuspensionType('ban');
    setSuspensionReason('');
    setSuspendDialogOpen(true);
  }, []);

  const handleReactivateUser = useCallback(async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          suspended_until: null,
          suspension_reason: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User reactivated successfully',
      });

      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reactivate user';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchUsers]);

  const confirmSuspendUser = async () => {
    if (!suspendingUser) return;

    try {
      const updates: {
        status: string;
        suspension_reason: string;
        suspended_until: string | null;
      } = {
        status: suspensionType === 'ban' ? 'banned' : 'suspended',
        suspension_reason: suspensionReason,
        suspended_until: null,
      };

      if (suspensionType === 'suspend' && suspensionDuration) {
        const days = parseInt(suspensionDuration, 10);
        // Validate that days is a valid number, default to 7 if NaN
        const validDays = Number.isNaN(days) || days <= 0 ? 7 : days;
        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + validDays);
        updates.suspended_until = suspendedUntil.toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', suspendingUser.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${suspensionType === 'ban' ? 'banned' : 'suspended'} successfully`,
      });

      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to ${suspensionType} user`;
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSuspendDialogOpen(false);
      setSuspendingUser(null);
      setSuspensionReason('');
    }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      // Delete from profiles table (will cascade to other tables via foreign keys)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Name', 'Subscription Tier', 'Skill Level', 'Onboarding', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.email,
        user.name || '',
        user.subscription_tier,
        user.skill_level,
        user.onboarding_completed ? 'Yes' : 'No',
        formatDate(user.created_at, 'PP')
      ].map(field => JSON.stringify(field)).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTierBadge = useCallback((tier: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      free: 'secondary',
      plus: 'default',
      gold: 'default',
      enterprise: 'default',
    };
    return <Badge variant={variants[tier] || 'outline'}>{tier}</Badge>;
  }, []);

  const getStatusBadge = useCallback((status: string, suspended_until: string | null) => {
    if (status === 'active') {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    } else if (status === 'suspended') {
      const until = suspended_until ? new Date(suspended_until) : null;
      const isPermanent = !until;
      const isExpired = until && until <= new Date();

      if (isExpired) {
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      }

      return (
        <Badge variant="destructive">
          Suspended {isPermanent ? '(Permanent)' : `until ${formatDate(suspended_until!, 'PP')}`}
        </Badge>
      );
    } else if (status === 'banned') {
      return <Badge variant="destructive" className="bg-red-600">Banned</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  }, []);

  // All hooks must be called before any conditional returns (React rules of hooks)
  const ROW_HEIGHT = 72; // Approximate height of each table row

  // Memoize stats calculation to avoid filtering on every render
  const stats = useMemo(() => {
    let free = 0, plus = 0, gold = 0, completed = 0;
    for (const user of users) {
      if (user.subscription_tier === 'free') free++;
      else if (user.subscription_tier === 'plus') plus++;
      else if (user.subscription_tier === 'gold') gold++;
      if (user.onboarding_completed) completed++;
    }
    return { total: users.length, free, plus, gold, completed };
  }, [users]);

  // Virtualization setup for the user table
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // Memoized row renderer for better performance
  const renderUserRow = useCallback((user: UserProfile, virtualRow: { index: number; start: number; size: number }) => {
    return (
      <TableRow
        key={user.id}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <TableCell className="w-[50px]">
          <Checkbox
            checked={selectedUsers.has(user.id)}
            onCheckedChange={() => toggleUserSelection(user.id)}
          />
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{user.name || 'No name'}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            {user.suspension_reason && (
              <div className="text-xs text-muted-foreground mt-1">
                Reason: {user.suspension_reason}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>{getStatusBadge(user.status, user.suspended_until)}</TableCell>
        <TableCell>{getTierBadge(user.subscription_tier)}</TableCell>
        <TableCell className="capitalize">{user.skill_level}</TableCell>
        <TableCell>
          {user.onboarding_completed ? (
            <UserCheck className="h-4 w-4 text-green-500" />
          ) : (
            <UserX className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell>{formatDate(user.created_at, 'PP')}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditUser(user)}
              aria-label="Edit user"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {isSuperAdmin && (
              <>
                {user.status === 'active' ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuspendUser(user)}
                      className="text-orange-500 hover:text-orange-600"
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBanUser(user)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Ban
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReactivateUser(user)}
                    className="text-green-500 hover:text-green-600"
                  >
                    Reactivate
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Delete user"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }, [selectedUsers, isSuperAdmin, toggleUserSelection, handleEditUser, handleSuspendUser, handleBanUser, handleReactivateUser, handleDeleteUser, getTierBadge, getStatusBadge]);

  // Early return for loading state - AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Logs Section */}
      <UserActivityLogs />
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Free Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plus Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.plus}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gold Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Onboarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user profiles, track activity, and perform bulk operations</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchUsers}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <Activity className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or tier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedUsers.size} users selected</span>
              <div className="flex items-center gap-2 ml-auto">
                <Button onClick={handleBulkEmail} variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Select onValueChange={handleBulkUpdateTier}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Update Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="plus">Plus</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => setSelectedUsers(new Set())} 
                  variant="ghost" 
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Fixed header table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>Onboarded</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          {/* Virtualized scrollable body */}
          <div
            ref={tableContainerRef}
            className="h-[500px] overflow-auto border rounded-md"
            style={{ contain: 'strict' }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <Table>
                <tbody>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const user = filteredUsers[virtualRow.index];
                    return renderUserRow(user, virtualRow);
                  })}
                </tbody>
              </Table>
            </div>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Update user profile information and preferences</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={editingUser.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Subscription Tier</Label>
                  <Select
                    value={editingUser.subscription_tier}
                    onValueChange={(value) => setEditingUser({ ...editingUser, subscription_tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="plus">Plus</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill">Skill Level</Label>
                  <Select
                    value={editingUser.skill_level}
                    onValueChange={(value) => setEditingUser({ ...editingUser, skill_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={editingUser.theme_preference}
                    onValueChange={(value) => setEditingUser({ ...editingUser, theme_preference: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={editingUser.language_preference}
                    onValueChange={(value) => setEditingUser({ ...editingUser, language_preference: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="units">Units</Label>
                  <Select
                    value={editingUser.unit_preference}
                    onValueChange={(value) => setEditingUser({ ...editingUser, unit_preference: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imperial">Imperial</SelectItem>
                      <SelectItem value="metric">Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={bulkEmailDialogOpen} onOpenChange={setBulkEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedUsers.size} selected user{selectedUsers.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={bulkEmailSubject}
                onChange={(e) => setBulkEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={bulkEmailMessage}
                onChange={(e) => setBulkEmailMessage(e.target.value)}
                placeholder="Email message..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendBulkEmail} disabled={!bulkEmailSubject || !bulkEmailMessage}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Ban User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{suspensionType === 'ban' ? 'Ban User' : 'Suspend User'}</DialogTitle>
            <DialogDescription>
              {suspensionType === 'ban' 
                ? `Permanently ban ${suspendingUser?.name || suspendingUser?.email} from accessing the platform.`
                : `Temporarily suspend ${suspendingUser?.name || suspendingUser?.email} from accessing the platform.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {suspensionType === 'suspend' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Suspension Duration</Label>
                <Select value={suspensionDuration} onValueChange={setSuspensionDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension/ban..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmSuspendUser} 
              disabled={!suspensionReason}
              className={suspensionType === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {suspensionType === 'ban' ? 'Ban User' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.name || deletingUser?.email}? This action cannot be undone and will remove all user data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profile information</li>
                <li>Aquariums and related data</li>
                <li>Water test records</li>
                <li>Maintenance tasks</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
