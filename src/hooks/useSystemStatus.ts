import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  description: string;
  responseTime?: number;
}

export interface SystemIncident {
  id: string;
  title: string;
  description: string | null;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  affected_services: string[];
  started_at: string;
  resolved_at: string | null;
  created_at: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  created_at: string;
}

export interface ScheduledMaintenance {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  affected_services: string[];
}

export interface UptimeStats {
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

export interface SystemStatusData {
  services: ServiceHealth[];
  incidents: SystemIncident[];
  scheduledMaintenance: ScheduledMaintenance[];
  uptime: UptimeStats;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

export const useSystemStatus = () => {
  const [data, setData] = useState<SystemStatusData>({
    services: [],
    incidents: [],
    scheduledMaintenance: [],
    uptime: { last24Hours: 99.9, last7Days: 99.9, last30Days: 99.9 },
    lastUpdated: new Date(),
    isLoading: true,
    error: null,
  });

  const checkServiceHealth = useCallback(async (): Promise<ServiceHealth[]> => {
    const services: ServiceHealth[] = [];
    
    // Check Database
    const dbStart = performance.now();
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const dbTime = performance.now() - dbStart;
      services.push({
        name: 'Database',
        status: error ? 'degraded' : dbTime > 2000 ? 'degraded' : 'operational',
        description: 'Data storage and retrieval',
        responseTime: Math.round(dbTime),
      });
    } catch {
      services.push({
        name: 'Database',
        status: 'outage',
        description: 'Data storage and retrieval',
      });
    }

    // Check Auth
    const authStart = performance.now();
    try {
      const { error } = await supabase.auth.getSession();
      const authTime = performance.now() - authStart;
      services.push({
        name: 'Authentication',
        status: error ? 'degraded' : authTime > 2000 ? 'degraded' : 'operational',
        description: 'User authentication and sessions',
        responseTime: Math.round(authTime),
      });
    } catch {
      services.push({
        name: 'Authentication',
        status: 'outage',
        description: 'User authentication and sessions',
      });
    }

    // Check Storage
    const storageStart = performance.now();
    try {
      const { error } = await supabase.storage.listBuckets();
      const storageTime = performance.now() - storageStart;
      services.push({
        name: 'File Storage',
        status: error ? 'degraded' : storageTime > 2000 ? 'degraded' : 'operational',
        description: 'Image and file storage',
        responseTime: Math.round(storageTime),
      });
    } catch {
      services.push({
        name: 'File Storage',
        status: 'outage',
        description: 'Image and file storage',
      });
    }

    // Web Application - always operational if we got here
    services.push({
      name: 'Web Application',
      status: 'operational',
      description: 'Main web application and dashboard',
    });

    // AI Services - check via edge function ping
    try {
      const aiStart = performance.now();
      const { error } = await supabase.functions.invoke('ally-chat', {
        body: { healthCheck: true },
      });
      const aiTime = performance.now() - aiStart;
      services.push({
        name: 'AI Services',
        status: error ? 'degraded' : aiTime > 5000 ? 'degraded' : 'operational',
        description: 'AI-powered recommendations and analysis',
        responseTime: Math.round(aiTime),
      });
    } catch {
      services.push({
        name: 'AI Services',
        status: 'degraded',
        description: 'AI-powered recommendations and analysis',
      });
    }

    return services;
  }, []);

  const fetchIncidents = useCallback(async (): Promise<SystemIncident[]> => {
    // Fetch incidents from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: incidentsData, error } = await supabase
      .from('system_incidents')
      .select('*')
      .gte('started_at', ninetyDaysAgo.toISOString())
      .order('started_at', { ascending: false });

    if (error || !incidentsData) {
      return [];
    }

    // Fetch updates for each incident
    const incidentsWithUpdates: SystemIncident[] = await Promise.all(
      incidentsData.map(async (incident) => {
        const { data: updates } = await supabase
          .from('incident_updates')
          .select('*')
          .eq('incident_id', incident.id)
          .order('created_at', { ascending: false });

        return {
          id: incident.id,
          title: incident.title,
          description: incident.description,
          status: incident.status as SystemIncident['status'],
          severity: incident.severity as SystemIncident['severity'],
          affected_services: incident.affected_services || [],
          started_at: incident.started_at,
          resolved_at: incident.resolved_at,
          created_at: incident.created_at,
          updates: (updates || []).map((u) => ({
            id: u.id,
            message: u.message,
            status: u.status,
            created_at: u.created_at,
          })),
        };
      })
    );

    return incidentsWithUpdates;
  }, []);

  const fetchScheduledMaintenance = useCallback(async (): Promise<ScheduledMaintenance[]> => {
    const { data, error } = await supabase
      .from('scheduled_maintenance')
      .select('*')
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_end', new Date().toISOString())
      .order('scheduled_start', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      scheduled_start: m.scheduled_start,
      scheduled_end: m.scheduled_end,
      status: m.status as ScheduledMaintenance['status'],
      affected_services: m.affected_services || [],
    }));
  }, []);

  const calculateUptime = useCallback(async (): Promise<UptimeStats> => {
    // For now, calculate based on incident history
    // In production, you'd integrate with a monitoring service
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: incidents } = await supabase
      .from('system_incidents')
      .select('started_at, resolved_at, severity')
      .gte('started_at', thirtyDaysAgo.toISOString());

    if (!incidents || incidents.length === 0) {
      return { last24Hours: 100, last7Days: 100, last30Days: 100 };
    }

    // Calculate total downtime in minutes
    let totalDowntime24h = 0;
    let totalDowntime7d = 0;
    let totalDowntime30d = 0;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    incidents.forEach((incident) => {
      const start = new Date(incident.started_at);
      const end = incident.resolved_at ? new Date(incident.resolved_at) : now;
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

      // Weight by severity
      const weight = incident.severity === 'critical' ? 1 : incident.severity === 'major' ? 0.5 : 0.25;
      const weightedDuration = durationMinutes * weight;

      if (start >= oneDayAgo) {
        totalDowntime24h += weightedDuration;
      }
      if (start >= sevenDaysAgo) {
        totalDowntime7d += weightedDuration;
      }
      totalDowntime30d += weightedDuration;
    });

    const minutesIn24h = 24 * 60;
    const minutesIn7d = 7 * 24 * 60;
    const minutesIn30d = 30 * 24 * 60;

    return {
      last24Hours: Math.max(0, Math.min(100, ((minutesIn24h - totalDowntime24h) / minutesIn24h) * 100)),
      last7Days: Math.max(0, Math.min(100, ((minutesIn7d - totalDowntime7d) / minutesIn7d) * 100)),
      last30Days: Math.max(0, Math.min(100, ((minutesIn30d - totalDowntime30d) / minutesIn30d) * 100)),
    };
  }, []);

  const refresh = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [services, incidents, scheduledMaintenance, uptime] = await Promise.all([
        checkServiceHealth(),
        fetchIncidents(),
        fetchScheduledMaintenance(),
        calculateUptime(),
      ]);

      setData({
        services,
        incidents,
        scheduledMaintenance,
        uptime,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch system status',
      }));
    }
  }, [checkServiceHealth, fetchIncidents, fetchScheduledMaintenance, calculateUptime]);

  const subscribeToUpdates = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.from('status_subscribers').insert({ email });

      if (error) {
        if (error.code === '23505') {
          return { success: false, message: 'This email is already subscribed.' };
        }
        throw error;
      }

      return { success: true, message: 'Successfully subscribed to status updates!' };
    } catch {
      return { success: false, message: 'Failed to subscribe. Please try again.' };
    }
  }, []);

  useEffect(() => {
    refresh();

    // Only poll when tab is visible to save resources
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auto-refresh every 30 seconds only when visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  return {
    ...data,
    refresh,
    subscribeToUpdates,
  };
};
