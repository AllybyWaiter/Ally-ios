import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface BadgeCounts {
  openTickets: number;
  pendingContacts: number;
  pendingWaitlist: number;
  pendingPartners: number;
}

export const useAdminBadgeCounts = () => {
  return useQuery({
    queryKey: ['admin-badge-counts'],
    queryFn: async (): Promise<BadgeCounts> => {
      const [ticketsResult, contactsResult, waitlistResult, partnersResult] = await Promise.all([
        // Open support tickets (not resolved/closed)
        supabase
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress', 'waiting_for_user']),
        
        // Contacts with pending status or null
        supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .or('status.is.null,status.eq.pending'),
        
        // Waitlist without beta access
        supabase
          .from('waitlist')
          .select('id', { count: 'exact', head: true })
          .or('beta_access_granted.is.null,beta_access_granted.eq.false'),
        
        // Pending partner applications
        supabase
          .from('partner_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      if (ticketsResult.error) logger.error('Failed to fetch ticket counts:', ticketsResult.error);
      if (contactsResult.error) logger.error('Failed to fetch contact counts:', contactsResult.error);
      if (waitlistResult.error) logger.error('Failed to fetch waitlist counts:', waitlistResult.error);
      if (partnersResult.error) logger.error('Failed to fetch partner counts:', partnersResult.error);

      return {
        openTickets: ticketsResult.count || 0,
        pendingContacts: contactsResult.count || 0,
        pendingWaitlist: waitlistResult.count || 0,
        pendingPartners: partnersResult.count || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
