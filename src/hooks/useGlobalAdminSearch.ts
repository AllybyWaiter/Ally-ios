import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'ticket' | 'blog' | 'contact' | 'waitlist' | 'announcement';
  title: string;
  subtitle?: string;
  url?: string;
}

export function useGlobalAdminSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Search users
      const { data: users } = await supabase
        .from('profiles')
        .select('user_id, email, name')
        .or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .limit(5);

      if (users) {
        allResults.push(...users.map(u => ({
          id: u.user_id,
          type: 'user' as const,
          title: u.name || u.email,
          subtitle: u.email,
        })));
      }

      // Search tickets
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, subject, email, status')
        .or(`subject.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      if (tickets) {
        allResults.push(...tickets.map(t => ({
          id: t.id,
          type: 'ticket' as const,
          title: t.subject,
          subtitle: `${t.email} • ${t.status}`,
        })));
      }

      // Search blog posts
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, status, slug')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (posts) {
        allResults.push(...posts.map(p => ({
          id: p.id,
          type: 'blog' as const,
          title: p.title,
          subtitle: p.status,
          url: `/blog/${p.slug}`,
        })));
      }

      // Search contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, subject')
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`)
        .limit(5);

      if (contacts) {
        allResults.push(...contacts.map(c => ({
          id: c.id,
          type: 'contact' as const,
          title: c.name,
          subtitle: c.email,
        })));
      }

      // Search waitlist
      const { data: waitlist } = await supabase
        .from('waitlist')
        .select('id, email')
        .ilike('email', `%${searchQuery}%`)
        .limit(5);

      if (waitlist) {
        allResults.push(...waitlist.map(w => ({
          id: w.id,
          type: 'waitlist' as const,
          title: w.email,
          subtitle: 'Waitlist',
        })));
      }

      // Search announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title, status')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (announcements) {
        allResults.push(...announcements.map(a => ({
          id: a.id,
          type: 'announcement' as const,
          title: a.title,
          subtitle: a.status,
        })));
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    search,
    debouncedQuery,
  };
}
