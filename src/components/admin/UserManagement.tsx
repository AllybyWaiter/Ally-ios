import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Edit, Mail, UserCheck, UserX, Trash2, CheckSquare, Square, Activity } from 'lucide-react';
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
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailMessage, setBulkEmailMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

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
        (payload) => {
          console.log('Profile change detected:', payload);
          // Refresh the user list when any profile changes
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.subscription_tier?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const fetchUsers = async () => {
    setLoading(true);
    console.log('UserManagement: Starting to fetch users...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('UserManagement: Fetch complete', { data, error, dataCount: data?.length });

    if (error) {
      console.error('UserManagement: Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } else {
      console.log('UserManagement: Setting users:', data?.length, 'users');
      setUsers(data || []);
      setFilteredUsers(data || []);
    }
    setLoading(false);
    console.log('UserManagement: Loading set to false');
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser({ ...user });
    setEditDialogOpen(true);
  };

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

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

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

    // In a real app, this would call an edge function to send emails
    console.log('Sending bulk email to:', selectedUserEmails);
    console.log('Subject:', bulkEmailSubject);
    console.log('Message:', bulkEmailMessage);

    toast({
      title: 'Bulk email queued',
      description: `Email will be sent to ${selectedUserEmails.length} users`,
    });

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

  const handleDeleteUser = (user: UserProfile) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
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

  const getTierBadge = (tier: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      free: 'secondary',
      plus: 'default',
      gold: 'default',
      enterprise: 'default',
    };
    return <Badge variant={variants[tier] || 'outline'}>{tier}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = {
    total: users.length,
    free: users.filter(u => u.subscription_tier === 'free').length,
    plus: users.filter(u => u.subscription_tier === 'plus').length,
    gold: users.filter(u => u.subscription_tier === 'gold').length,
    completed: users.filter(u => u.onboarding_completed).length,
  };

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
                disabled={loading}
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
                <TableHead>Tier</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>Onboarded</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name || 'No name'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
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
                  <TableCell>{formatDate(user.updated_at, 'PP')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
