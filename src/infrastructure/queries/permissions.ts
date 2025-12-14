/**
 * Permissions Data Access Layer
 * 
 * Centralized Supabase queries for user roles and permissions.
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'super_admin';
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string;
}

// Fetch user roles
export async function fetchUserRoles(userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map((r) => r.role) || [];
}

// Fetch user permissions via RPC
export async function fetchUserPermissions(userId: string) {
  const { data, error } = await supabase.rpc('get_user_permissions', { 
    _user_id: userId 
  });

  if (error) throw error;
  return data?.map((p: { permission_name: string }) => p.permission_name) || [];
}

// Fetch roles and permissions together (optimized)
export async function fetchRolesAndPermissions(userId: string) {
  const [rolesResult, permsResult] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', userId),
    supabase.rpc('get_user_permissions', { _user_id: userId })
  ]);

  if (rolesResult.error) throw rolesResult.error;
  if (permsResult.error) throw permsResult.error;

  const roles = rolesResult.data?.map((r) => r.role) || [];
  const permissions = permsResult.data?.map((p: { permission_name: string }) => p.permission_name) || [];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');

  return { roles, permissions, isAdmin };
}

// Check if user has specific role
export async function hasRole(userId: string, role: 'admin' | 'user' | 'super_admin') {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: role
  });

  if (error) throw error;
  return data as boolean;
}

// Check if user is super admin
export async function isSuperAdmin(userId: string) {
  const { data, error } = await supabase.rpc('is_super_admin', {
    _user_id: userId
  });

  if (error) throw error;
  return data as boolean;
}
