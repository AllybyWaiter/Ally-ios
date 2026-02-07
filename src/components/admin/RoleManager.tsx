import { useState, useEffect, useMemo } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/RoleBadge';
import { toast } from 'sonner';
import { Shield, UserCog, Edit, Eye, Users, Search, Plus, Trash2, History, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/errorUtils';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
}

interface RoleStats {
  super_admin: number;
  admin: number;
  moderator: number;
  editor: number;
  viewer: number;
  user: number;
}

interface AuditLog {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action: string;
  old_roles: string[];
  new_roles: string[];
  reason: string;
  created_at: string;
  admin_name?: string;
  target_name?: string;
}

const PAGE_SIZE = 20;

export const RoleManager = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(0);

  // Fetch users with roles using React Query
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-with-roles', page],
    queryFn: async () => {
      // Fetch profiles with pagination
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const { data: profiles, error: profilesError, count } = await supabase
        .from('profiles')
        .select('user_id, email, name', { count: 'exact' })
        .range(from, to);

      if (profilesError) throw profilesError;

      // Fetch all user roles for these profiles
      const userIds = profiles?.map(p => p.user_id) || [];

      // Guard against empty array — .in() with [] returns ALL rows
      if (userIds.length === 0) {
        setUsers([]);
        return;
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const roles = (userRoles || [])
          .filter(ur => ur.user_id === profile.user_id)
          .map(ur => ur.role);
        
        return {
          user_id: profile.user_id,
          email: profile.email,
          name: profile.name || 'N/A',
          roles: roles.length > 0 ? roles : ['user']
        };
      });

      return { users: usersWithRoles, totalCount: count || 0 };
    },
  });

  // Calculate role statistics from current page (or fetch separately for accuracy)
  const roleStats = useMemo((): RoleStats => {
    const stats: RoleStats = { super_admin: 0, admin: 0, moderator: 0, editor: 0, viewer: 0, user: 0 };
    (usersData?.users || []).forEach(user => {
      user.roles.forEach(role => {
        if (role in stats) {
          stats[role as keyof RoleStats]++;
        }
      });
    });
    return stats;
  }, [usersData?.users]);

  // Filter users based on debounced search query
  const filteredUsers = useMemo(() => {
    if (!debouncedSearchQuery) return usersData?.users || [];
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (usersData?.users || []).filter(user =>
      user.email.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.roles.some(role => role.toLowerCase().includes(searchLower))
    );
  }, [debouncedSearchQuery, usersData?.users]);

  // Fetch audit logs using React Query
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-role-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user names for admin and target users
      const adminIds = [...new Set(data?.map((log) => log.admin_user_id) || [])];
      const targetIds = [...new Set(data?.map((log) => log.target_user_id) || [])];
      const allUserIds = [...new Set([...adminIds, ...targetIds])];

      if (allUserIds.length > 0 && data) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', allUserIds);

        const userMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        return data.map((log) => ({
          ...log,
          admin_name: userMap.get(log.admin_user_id)?.name || userMap.get(log.admin_user_id)?.email || 'Unknown',
          target_name: userMap.get(log.target_user_id)?.name || userMap.get(log.target_user_id)?.email || 'Unknown',
        })) as AuditLog[];
      }

      return (data || []) as AuditLog[];
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role, userRoles }: { userId: string; role: string; userRoles: string[] }) => {
      if (!currentUser) throw new Error('Not authenticated');

      // Check if user already has this role
      if (userRoles.includes(role)) {
        throw new Error('User already has this role');
      }

      // Check permissions for assigning admin/super_admin roles
      const { data: currentUserRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      const isSuperAdmin = currentUserRoles?.some((r) => r.role === 'super_admin');

      // Only super admins can assign super_admin or admin roles
      if ((role === 'admin' || role === 'super_admin') && !isSuperAdmin) {
        throw new Error('Only super admins can assign admin or super admin roles');
      }

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role as AppRole
        });

      if (insertError) throw insertError;

      // Log the role change for audit
      await supabase.from('role_audit_log').insert({
        admin_user_id: currentUser.id,
        target_user_id: userId,
        action: 'assign_role',
        old_roles: userRoles,
        new_roles: [...userRoles, role],
        reason: reason || 'No reason provided'
      });
    },
    onSuccess: () => {
      toast.success(`${selectedRole} role assigned successfully`);
      setShowAssignDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-role-audit-logs'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role, userRoles, allUsers }: { userId: string; role: string; userRoles: string[]; allUsers: UserWithRoles[] }) => {
      if (!currentUser) throw new Error('Not authenticated');

      // Check permissions for removing admin/super_admin roles
      const { data: currentUserRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      const isSuperAdmin = currentUserRoles?.some((r) => r.role === 'super_admin');

      // Only super admins can remove super_admin or admin roles
      if ((role === 'admin' || role === 'super_admin') && !isSuperAdmin) {
        throw new Error('Only super admins can remove admin or super admin roles');
      }

      // Check if this is the last super admin
      if (role === 'super_admin') {
        const superAdminCount = allUsers.filter(u => u.roles.includes('super_admin')).length;
        if (superAdminCount <= 1) {
          throw new Error('Cannot remove the last super admin role');
        }
      }

      // Check if this is the last admin
      if (role === 'admin') {
        const adminCount = allUsers.filter(u => u.roles.includes('admin')).length;
        if (adminCount <= 1 && !isSuperAdmin) {
          throw new Error('Cannot remove the last admin role');
        }
      }

      // Remove role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as AppRole);

      if (deleteError) throw deleteError;

      // Log the role change for audit
      await supabase.from('role_audit_log').insert({
        admin_user_id: currentUser.id,
        target_user_id: userId,
        action: 'remove_role',
        old_roles: userRoles,
        new_roles: userRoles.filter(r => r !== role),
        reason: reason || 'No reason provided'
      });
    },
    onSuccess: () => {
      toast.success(`${selectedRole} role removed successfully`);
      setShowRemoveDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-role-audit-logs'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const openAssignDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedRole('');
    setReason('');
    setShowAssignDialog(true);
  };

  const openRemoveDialog = (user: UserWithRoles, role: string) => {
    setSelectedUser(user);
    setSelectedRole(role);
    setReason('');
    setShowRemoveDialog(true);
  };

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) return;
    assignRoleMutation.mutate({
      userId: selectedUser.user_id,
      role: selectedRole,
      userRoles: selectedUser.roles,
    });
  };

  const handleRemoveRole = () => {
    if (!selectedUser || !selectedRole) return;
    removeRoleMutation.mutate({
      userId: selectedUser.user_id,
      role: selectedRole,
      userRoles: selectedUser.roles,
      allUsers: usersData?.users || [],
    });
  };

  const totalPages = Math.ceil((usersData?.totalCount || 0) / PAGE_SIZE);

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              Super Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.super_admin || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Moderators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.moderator}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.editor}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Viewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.viewer}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData?.totalCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </div>
            <Button onClick={() => setShowAuditDialog(true)} variant="outline">
              <History className="h-4 w-4 mr-2" />
              View Audit Log
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, emails, or roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <div key={`${user.user_id}-${role}`} className="flex items-center gap-1">
                          <RoleBadge role={role} />
                          {role !== 'user' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRemoveDialog(user, role)}
                            className="h-6 w-6 p-0"
                            aria-label={`Remove ${role} role`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssignDialog(user)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a new role to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Reason for assigning this role..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRole || assignRoleMutation.isPending}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Role</DialogTitle>
            <DialogDescription>
              Remove {selectedRole} role from {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Reason for removing this role..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveRole} disabled={removeRoleMutation.isPending}>
              Remove Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Role Change Audit Log</DialogTitle>
            <DialogDescription>
              History of role assignments and removals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.action === 'assign_role' ? 'default' : 'destructive'}>
                          {log.action === 'assign_role' ? 'Assigned' : 'Removed'}
                        </Badge>
                        <span className="text-sm font-medium">{log.admin_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {log.action === 'assign_role' ? 'assigned roles to' : 'removed roles from'}
                        </span>
                        <span className="text-sm font-medium">{log.target_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Old roles:</span>
                        {log.old_roles?.map((role, idx) => <RoleBadge key={`${log.id}-old-${idx}`} role={role} />)}
                        <span className="text-muted-foreground">→ New roles:</span>
                        {log.new_roles?.map((role, idx) => <RoleBadge key={`${log.id}-new-${idx}`} role={role} />)}
                      </div>
                      {log.reason && (
                        <p className="text-sm text-muted-foreground">Reason: {log.reason}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
