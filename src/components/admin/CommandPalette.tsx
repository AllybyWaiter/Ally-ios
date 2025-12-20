import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { 
  Users, 
  FileText, 
  Ticket, 
  Mail, 
  ClipboardList, 
  Megaphone,
  LayoutDashboard,
  Shield,
  Activity,
  Brain,
  Flag,
  UserPlus,
  Search,
  Keyboard,
  Server
} from 'lucide-react';
import { useGlobalAdminSearch, SearchResult } from '@/hooks/useGlobalAdminSearch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, keywords: ['home', 'main', 'stats'] },
  { id: 'users', label: 'User Management', icon: Users, keywords: ['profiles', 'accounts'] },
  { id: 'roles', label: 'Role Manager', icon: Shield, keywords: ['permissions', 'access'] },
  { id: 'beta', label: 'Beta Access', icon: UserPlus, keywords: ['waitlist', 'invite'] },
  { id: 'blog', label: 'Blog Manager', icon: FileText, keywords: ['posts', 'articles', 'content'] },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, keywords: ['notifications', 'news'] },
  { id: 'contacts', label: 'Contact Submissions', icon: Mail, keywords: ['messages', 'inquiries'] },
  { id: 'waitlist', label: 'Waitlist', icon: ClipboardList, keywords: ['signups', 'subscribers'] },
  { id: 'tickets', label: 'Support Tickets', icon: Ticket, keywords: ['help', 'issues', 'support'] },
  { id: 'activity', label: 'Activity Logs', icon: Activity, keywords: ['audit', 'history'] },
  { id: 'ai-analytics', label: 'AI Analytics', icon: Brain, keywords: ['metrics', 'usage'] },
  { id: 'feature-flags', label: 'Feature Flags', icon: Flag, keywords: ['toggles', 'features'] },
  { id: 'system-health', label: 'System Health', icon: Server, keywords: ['status', 'monitoring'] },
];

const quickActions = [
  { id: 'search', label: 'Search Everything', icon: Search, shortcut: '⌘K' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, shortcut: '?' },
];

const resultTypeIcons: Record<string, React.ElementType> = {
  user: Users,
  ticket: Ticket,
  blog: FileText,
  contact: Mail,
  waitlist: ClipboardList,
  announcement: Megaphone,
};

const resultTypeSections: Record<string, string> = {
  user: 'users',
  ticket: 'tickets',
  blog: 'blog',
  contact: 'contacts',
  waitlist: 'waitlist',
  announcement: 'announcements',
};

export function CommandPalette({ open, onOpenChange, onSectionChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, search, debouncedQuery } = useGlobalAdminSearch();
  const [recentSections, setRecentSections] = useState<string[]>([]);

  // Load recent sections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-recent-sections');
    if (saved) {
      setRecentSections(JSON.parse(saved));
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  const handleSelect = useCallback((section: string) => {
    // Update recent sections
    const updated = [section, ...recentSections.filter(s => s !== section)].slice(0, 5);
    setRecentSections(updated);
    localStorage.setItem('admin-recent-sections', JSON.stringify(updated));
    
    onSectionChange(section);
    onOpenChange(false);
    setQuery('');
  }, [recentSections, onSectionChange, onOpenChange, setQuery]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    const section = resultTypeSections[result.type];
    if (section) {
      handleSelect(section);
    }
  }, [handleSelect]);

  const filteredNavItems = navigationItems.filter(item => {
    if (!query) return true;
    const searchLower = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.id.toLowerCase().includes(searchLower) ||
      item.keywords.some(k => k.includes(searchLower))
    );
  });

  const recentNavItems = recentSections
    .map(id => navigationItems.find(item => item.id === id))
    .filter(Boolean) as typeof navigationItems;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search admin panel..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {/* Search Results */}
        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((result) => {
              const Icon = resultTypeIcons[result.type] || Search;
              return (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleResultSelect(result)}
                  className="flex items-center gap-3"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {result.type}
                  </Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Recent Sections */}
        {!query && recentNavItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentNavItems.map((item) => (
                <CommandItem
                  key={`recent-${item.id}`}
                  onSelect={() => handleSelect(item.id)}
                  className="flex items-center gap-3"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {filteredNavItems.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              className="flex items-center gap-3"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Quick Actions */}
        {!query && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{action.label}</span>
                  </div>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    {action.shortcut}
                  </kbd>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
