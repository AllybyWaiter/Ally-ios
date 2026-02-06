import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';
import { logger } from '@/lib/logger';

export interface DashboardStats {
  totalUsers: number;
  userGrowth: number;
  activeAquariums: number;
  aquariumGrowth: number;
  monthlyWaterTests: number;
  waterTestGrowth: number;
  openTickets: number;
  urgentTickets: number;
  waitlistCount: number;
  betaAccessGranted: number;
  aiSatisfactionRate: number;
  totalFeedback: number;
}

export interface TrendDataPoint {
  date: string;
  users: number;
  waterTests: number;
  aquariums: number;
  chatMessages: number;
}

export interface PendingAction {
  id: string;
  type: 'ticket' | 'contact' | 'beta' | 'blog' | 'announcement';
  priority: 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  createdAt: string;
  link?: string;
}

export interface RecentActivity {
  id: string;
  type: 'user_signup' | 'ticket' | 'blog' | 'beta_grant' | 'water_test' | 'aquarium';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
}

// Fetch dashboard stats
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);

      // Fetch all counts in parallel
      const [
        usersResult,
        usersLastMonth,
        aquariumsResult,
        aquariumsLastMonth,
        waterTestsResult,
        waterTestsLastMonth,
        ticketsResult,
        waitlistResult,
        feedbackResult,
      ] = await Promise.all([
        // Total users (profiles)
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        // Users created last 30 days
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        // Total aquariums
        supabase.from('aquariums').select('id', { count: 'exact', head: true }),
        // Aquariums last 30 days
        supabase.from('aquariums').select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        // Water tests this month
        supabase.from('water_tests').select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        // Water tests last month
        supabase.from('water_tests').select('id', { count: 'exact', head: true })
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
        // Open tickets
        supabase.from('support_tickets').select('id, priority', { count: 'exact' })
          .in('status', ['open', 'in_progress']),
        // Waitlist
        supabase.from('waitlist').select('id, beta_access_granted', { count: 'exact' }),
        // AI feedback
        supabase.from('ai_feedback').select('id, rating'),
      ]);

      // Log any query errors (don't throw — partial stats are better than none)
      const results = [usersResult, usersLastMonth, aquariumsResult, aquariumsLastMonth, waterTestsResult, waterTestsLastMonth, ticketsResult, waitlistResult, feedbackResult];
      for (const res of results) {
        if (res.error) logger.error('Admin stats query error:', res.error);
      }

      const totalUsers = usersResult.count || 0;
      const newUsers = usersLastMonth.count || 0;
      const userGrowth = totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0;

      const totalAquariums = aquariumsResult.count || 0;
      const newAquariums = aquariumsLastMonth.count || 0;
      const aquariumGrowth = totalAquariums > 0 ? Math.round((newAquariums / totalAquariums) * 100) : 0;

      const monthlyWaterTests = waterTestsResult.count || 0;
      const lastMonthTests = waterTestsLastMonth.count || 0;
      const waterTestGrowth = lastMonthTests > 0 
        ? Math.round(((monthlyWaterTests - lastMonthTests) / lastMonthTests) * 100) 
        : 100;

      const tickets = ticketsResult.data || [];
      const openTickets = tickets.length;
      const urgentTickets = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

      const waitlistData = waitlistResult.data || [];
      const waitlistCount = waitlistData.length;
      const betaAccessGranted = waitlistData.filter(w => w.beta_access_granted).length;

      const feedbackData = feedbackResult.data || [];
      const positiveFeedback = feedbackData.filter(f => f.rating === 'positive').length;
      const aiSatisfactionRate = feedbackData.length > 0 
        ? Math.round((positiveFeedback / feedbackData.length) * 100) 
        : 0;

      return {
        totalUsers,
        userGrowth,
        activeAquariums: totalAquariums,
        aquariumGrowth,
        monthlyWaterTests,
        waterTestGrowth,
        openTickets,
        urgentTickets,
        waitlistCount,
        betaAccessGranted,
        aiSatisfactionRate,
        totalFeedback: feedbackData.length,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch trend data for charts
export function useAdminTrendData() {
  return useQuery({
    queryKey: ['admin', 'trend-data'],
    queryFn: async (): Promise<TrendDataPoint[]> => {
      const days = 30;
      const startDate = subDays(new Date(), days);

      // Fetch data for trends
      const [usersData, waterTestsData, aquariumsData, messagesData] = await Promise.all([
        supabase.from('profiles')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('water_tests')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('aquariums')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('chat_messages')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
      ]);

      // Log any errors
      for (const res of [usersData, waterTestsData, aquariumsData, messagesData]) {
        if (res.error) logger.error('Admin trend query error:', res.error);
      }

      // Group by date
      const dateMap = new Map<string, TrendDataPoint>();
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - i - 1), 'MMM dd');
        dateMap.set(date, { date, users: 0, waterTests: 0, aquariums: 0, chatMessages: 0 });
      }

      (usersData.data || []).forEach(item => {
        const date = format(new Date(item.created_at), 'MMM dd');
        const existing = dateMap.get(date);
        if (existing) existing.users++;
      });

      (waterTestsData.data || []).forEach(item => {
        const date = format(new Date(item.created_at), 'MMM dd');
        const existing = dateMap.get(date);
        if (existing) existing.waterTests++;
      });

      (aquariumsData.data || []).forEach(item => {
        const date = format(new Date(item.created_at), 'MMM dd');
        const existing = dateMap.get(date);
        if (existing) existing.aquariums++;
      });

      (messagesData.data || []).forEach(item => {
        const date = format(new Date(item.created_at), 'MMM dd');
        const existing = dateMap.get(date);
        if (existing) existing.chatMessages++;
      });

      return Array.from(dateMap.values());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch pending actions
export function useAdminPendingActions() {
  return useQuery({
    queryKey: ['admin', 'pending-actions'],
    queryFn: async (): Promise<PendingAction[]> => {
      const twentyFourHoursAgo = subDays(new Date(), 1);

      const [ticketsResult, contactsResult, betaResult, blogResult] = await Promise.all([
        // Urgent/high priority open tickets
        supabase.from('support_tickets')
          .select('id, subject, priority, created_at')
          .in('status', ['open', 'in_progress'])
          .in('priority', ['urgent', 'high'])
          .order('created_at', { ascending: false })
          .limit(5),
        // New contacts awaiting response
        supabase.from('contacts')
          .select('id, name, subject, created_at')
          .eq('status', 'new')
          .lt('created_at', twentyFourHoursAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
        // Pending beta access requests
        supabase.from('waitlist')
          .select('id, email, created_at')
          .eq('beta_access_granted', false)
          .order('created_at', { ascending: true })
          .limit(5),
        // Draft blog posts
        supabase.from('blog_posts')
          .select('id, title, created_at')
          .eq('status', 'draft')
          .order('updated_at', { ascending: false })
          .limit(5),
      ]);

      for (const res of [ticketsResult, contactsResult, betaResult, blogResult]) {
        if (res.error) logger.error('Admin pending actions query error:', res.error);
      }

      const actions: PendingAction[] = [];

      // Add urgent tickets
      (ticketsResult.data || []).forEach(ticket => {
        actions.push({
          id: ticket.id,
          type: 'ticket',
          priority: ticket.priority === 'urgent' ? 'urgent' : 'warning',
          title: `Support: ${ticket.subject}`,
          description: `${ticket.priority} priority ticket`,
          createdAt: ticket.created_at,
        });
      });

      // Add old contacts
      (contactsResult.data || []).forEach(contact => {
        actions.push({
          id: contact.id,
          type: 'contact',
          priority: 'warning',
          title: `Contact from ${contact.name}`,
          description: contact.subject || 'Awaiting response',
          createdAt: contact.created_at,
        });
      });

      // Add beta requests (limit to 3)
      (betaResult.data || []).slice(0, 3).forEach(beta => {
        actions.push({
          id: beta.id,
          type: 'beta',
          priority: 'info',
          title: 'Beta Access Request',
          description: beta.email,
          createdAt: beta.created_at,
        });
      });

      // Add draft blog posts
      (blogResult.data || []).forEach(post => {
        actions.push({
          id: post.id,
          type: 'blog',
          priority: 'info',
          title: 'Draft Post',
          description: post.title,
          createdAt: post.created_at,
        });
      });

      // Sort by priority and date
      const priorityOrder = { urgent: 0, warning: 1, info: 2 };
      return actions.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    staleTime: 30 * 1000,
  });
}

// Fetch recent activity
export function useAdminRecentActivity() {
  return useQuery({
    queryKey: ['admin', 'recent-activity'],
    queryFn: async (): Promise<RecentActivity[]> => {
      const [usersResult, ticketsResult, blogResult, aquariumsResult, waterTestsResult] = await Promise.all([
        supabase.from('profiles')
          .select('id, user_id, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('support_tickets')
          .select('id, subject, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('blog_posts')
          .select('id, title, published_at, status')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(5),
        supabase.from('aquariums')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('water_tests')
          .select('id, created_at, aquarium_id')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      for (const res of [usersResult, ticketsResult, blogResult, aquariumsResult, waterTestsResult]) {
        if (res.error) logger.error('Admin activity query error:', res.error);
      }

      const activities: RecentActivity[] = [];

      (usersResult.data || []).forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_signup',
          title: 'New User Registration',
          description: user.email,
          timestamp: user.created_at,
          userId: user.user_id,
        });
      });

      (ticketsResult.data || []).forEach(ticket => {
        activities.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket',
          title: 'Support Ticket Submitted',
          description: ticket.subject,
          timestamp: ticket.created_at,
        });
      });

      (blogResult.data || []).forEach(post => {
        activities.push({
          id: `blog-${post.id}`,
          type: 'blog',
          title: 'Blog Post Published',
          description: post.title,
          timestamp: post.published_at || '',
        });
      });

      (aquariumsResult.data || []).forEach(aquarium => {
        activities.push({
          id: `aquarium-${aquarium.id}`,
          type: 'aquarium',
          title: 'New Aquarium Created',
          description: aquarium.name,
          timestamp: aquarium.created_at,
        });
      });

      (waterTestsResult.data || []).forEach(test => {
        activities.push({
          id: `test-${test.id}`,
          type: 'water_test',
          title: 'Water Test Logged',
          description: `Test for aquarium`,
          timestamp: test.created_at,
        });
      });

      // Sort by timestamp
      return activities
        .filter(a => a.timestamp)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
    },
    staleTime: 30 * 1000,
  });
}
