import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  UserPlus, 
  FileText, 
  Megaphone, 
  Mail, 
  ClipboardList, 
  Ticket, 
  Activity, 
  Brain, 
  Flag,
  Home,
  LogOut,
  ChevronDown,
  Server
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminBadgeCounts } from '@/hooks/useAdminBadgeCounts';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
  roles?: string[];
  badgeKey?: 'openTickets' | 'pendingContacts' | 'pendingWaitlist';
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    items: [
      { id: 'users', label: 'Users', icon: Users, permission: 'manage_users' },
      { id: 'roles', label: 'Roles', icon: Shield, permission: 'manage_roles' },
      { id: 'beta', label: 'Beta Access', icon: UserPlus, roles: ['admin'] },
    ],
  },
  {
    id: 'content',
    label: 'Content & Communications',
    items: [
      { id: 'blog', label: 'Blog', icon: FileText, permission: 'manage_blog' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, permission: 'manage_announcements' },
      { id: 'contacts', label: 'Contacts', icon: Mail, roles: ['admin'], badgeKey: 'pendingContacts' },
      { id: 'waitlist', label: 'Waitlist', icon: ClipboardList, roles: ['admin'], badgeKey: 'pendingWaitlist' },
      { id: 'tickets', label: 'Support Tickets', icon: Ticket, permission: 'moderate_support', badgeKey: 'openTickets' },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Machine Learning',
    items: [
      { id: 'ai-analytics', label: 'AI Analytics', icon: Brain, roles: ['admin'] },
      { id: 'ai-users', label: 'User Insights', icon: Users, roles: ['admin'] },
      { id: 'ai-memory', label: 'Memory Manager', icon: Brain, roles: ['admin'] },
      { id: 'ai-conversations', label: 'Conversations', icon: Activity, roles: ['admin'] },
      { id: 'ai-settings', label: 'Model Settings', icon: Server, roles: ['admin'] },
      { id: 'ai-monitoring', label: 'Live Monitor', icon: Activity, roles: ['admin'] },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'activity', label: 'Activity Logs', icon: Activity, roles: ['admin'] },
      { id: 'feature-flags', label: 'Feature Flags', icon: Flag, roles: ['admin'] },
      { id: 'system-health', label: 'System Health', icon: Server, roles: ['admin'] },
    ],
  },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { user, signOut, hasPermission, hasAnyRole } = useAuth();
  const { data: badgeCounts } = useAdminBadgeCounts();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const canAccessItem = (item: MenuItem): boolean => {
    if (item.permission && hasPermission(item.permission)) return true;
    if (item.roles && hasAnyRole(item.roles)) return true;
    if (!item.permission && !item.roles) return true;
    return false;
  };

  const getVisibleItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(canAccessItem);
  };

  const isGroupActive = (group: MenuGroup): boolean => {
    return group.items.some(item => item.id === activeSection && canAccessItem(item));
  };

  const getBadgeCount = (badgeKey?: 'openTickets' | 'pendingContacts' | 'pendingWaitlist'): number => {
    if (!badgeKey || !badgeCounts) return 0;
    return badgeCounts[badgeKey] || 0;
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="font-semibold text-lg">Admin Panel</span>
          )}
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuGroups.map((group) => {
          const visibleItems = getVisibleItems(group.items);
          if (visibleItems.length === 0) return null;

          return (
            <Collapsible
              key={group.id}
              defaultOpen={isGroupActive(group) || group.id === 'dashboard'}
              className="group/collapsible"
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md transition-colors">
                    <span className="flex-1">{!isCollapsed && group.label}</span>
                    {!isCollapsed && (
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.map((item) => {
                        const isActive = activeSection === item.id;
                        const badgeCount = getBadgeCount(item.badgeKey);
                        const Icon = item.icon;

                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => onSectionChange(item.id)}
                              isActive={isActive}
                              tooltip={isCollapsed ? item.label : undefined}
                              className={cn(
                                'transition-colors',
                                isActive && 'bg-primary/10 text-primary font-medium'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {!isCollapsed && <span>{item.label}</span>}
                            </SidebarMenuButton>
                            {badgeCount > 0 && (
                              <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </SidebarMenuBadge>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!isCollapsed && user?.email && (
          <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>
        )}
        <div className={cn('flex gap-2', isCollapsed ? 'flex-col' : 'flex-row')}>
          <Button
            variant="outline"
            size={isCollapsed ? 'icon' : 'sm'}
            onClick={() => navigate('/')}
            className="flex-1"
          >
            <Home className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Home</span>}
          </Button>
          <Button
            variant="outline"
            size={isCollapsed ? 'icon' : 'sm'}
            onClick={handleSignOut}
            className="flex-1"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
