import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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
  const searchIdRef = useRef(0);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const currentSearchId = ++searchIdRef.current;
    setLoading(true);
    const allResults: SearchResult[] = [];

    // Escape special LIKE/ILIKE characters to prevent wildcard injection
    const escaped = searchQuery.replace(/[%_\\]/g, '\\$&');

    try {
      // Search users - only search on text columns (email, name), not UUIDs
      const { data: users } = await supabase
        .from('profiles')
        .select('user_id, email, name')
        .or(`email.ilike.%${escaped}%,name.ilike.%${escaped}%`)
        .limit(5);

      if (users) {
        allResults.push(...users.map(u => ({
          id: u.user_id as string,
          type: 'user' as const,
          title: u.name || u.email,
          subtitle: u.email,
        })));
      }

      // Search tickets - only search on text columns (subject, email), not UUIDs
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, subject, email, status')
        .or(`subject.ilike.%${escaped}%,email.ilike.%${escaped}%`)
        .limit(5);

      if (tickets) {
        allResults.push(...tickets.map(t => ({
          id: t.id as string,
          type: 'ticket' as const,
          title: t.subject,
          subtitle: `${t.email} • ${t.status}`,
        })));
      }

      // Search blog posts - only search on text columns (title), not UUIDs
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, status, slug')
        .ilike('title', `%${escaped}%`)
        .limit(5);

      if (posts) {
        allResults.push(...posts.map(p => ({
          id: p.id as string,
          type: 'blog' as const,
          title: p.title,
          subtitle: p.status,
          url: `/blog/${p.slug}`,
        })));
      }

      // Search contacts - only search on text columns, not UUIDs
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, subject')
        .or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,subject.ilike.%${escaped}%`)
        .limit(5);

      if (contacts) {
        allResults.push(...contacts.map(c => ({
          id: c.id as string,
          type: 'contact' as const,
          title: c.name,
          subtitle: c.email,
        })));
      }

      // Search waitlist - only search on text columns (email), not UUIDs
      const { data: waitlist } = await supabase
        .from('waitlist')
        .select('id, email')
        .ilike('email', `%${escaped}%`)
        .limit(5);

      if (waitlist) {
        allResults.push(...waitlist.map(w => ({
          id: w.id as string,
          type: 'waitlist' as const,
          title: w.email,
          subtitle: 'Waitlist',
        })));
      }

      // Search announcements - only search on text columns (title), not UUIDs
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title, status')
        .ilike('title', `%${escaped}%`)
        .limit(5);

      if (announcements) {
        allResults.push(...announcements.map(a => ({
          id: a.id as string,
          type: 'announcement' as const,
          title: a.title,
          subtitle: a.status,
        })));
      }

      // Only update results if this is still the latest search
      if (currentSearchId === searchIdRef.current) {
        setResults(allResults);
      }
    } catch (error) {
      logger.error('Search error:', error);
    } finally {
      if (currentSearchId === searchIdRef.current) {
        setLoading(false);
      }
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
