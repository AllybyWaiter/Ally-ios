import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { 
  fetchAquariumsWithTaskCounts, 
  fetchUpcomingTaskCount,
  deleteAquarium as deleteAquariumApi,
  type Aquarium 
} from '@/infrastructure/queries/aquariums';
import { isPoolType } from '@/lib/waterBodyUtils';

// DashboardAquarium uses Aquarium base type - these fields are already optional in Aquarium
// We just re-export the type for dashboard-specific use
type DashboardAquarium = Aquarium;

export function useDashboardData() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [aquariums, setAquariums] = useState<DashboardAquarium[]>([]);
  const [upcomingTaskCount, setUpcomingTaskCount] = useState(0);

  const loadAquariums = useCallback(async (userId?: string) => {
    if (!userId) {
      console.warn('loadAquariums: No user ID available, skipping');
      setLoading(false);
      return;
    }
    
    try {
      const data = await fetchAquariumsWithTaskCounts(userId);
      
      // Calculate upcoming tasks (within 7 days) or reset to 0 if no aquariums
      if (data && data.length > 0) {
        const count = await fetchUpcomingTaskCount(data.map(a => a.id), 7);
        setUpcomingTaskCount(count);
      } else {
        setUpcomingTaskCount(0);
      }
      
      setAquariums((data || []) as DashboardAquarium[]);
      setDataFetched(true);
      
      return data || [];
    } catch (error: unknown) {
      console.error('Error loading aquariums:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load aquariums';
      const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                             errorMessage.toLowerCase().includes('fetch');
      
      toast({
        title: isNetworkError ? 'Network Error' : t('common.error'),
        description: isNetworkError 
          ? 'Unable to connect. Please check your internet connection.'
          : t('dashboard.failedToLoad'),
        variant: 'destructive',
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const deleteAquarium = useCallback(async (aquariumId: string, _userId?: string) => {
    try {
      await deleteAquariumApi(aquariumId);
      
      // Update local state directly - no need to refetch since React Query invalidation handles it
      setAquariums(prev => prev.filter(a => a.id !== aquariumId));
      
      // Invalidate related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['aquariums'] });
      queryClient.invalidateQueries({ queryKey: ['aquarium', aquariumId] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] });
      
      toast({
        title: t('common.success'),
        description: t('dashboard.aquariumDeleted'),
      });
    } catch (error) {
      console.error("Error deleting aquarium:", error);
      toast({
        title: t('common.error'),
        description: t('dashboard.failedToDelete'),
        variant: "destructive",
      });
    }
  }, [toast, t, queryClient]);

  const totalVolume = useMemo(() => 
    aquariums.reduce((sum, a) => sum + (a.volume_gallons || 0), 0), 
    [aquariums]
  );
  
  // Count of active aquariums - used for dashboard stats display
  const activeCount = useMemo(() => 
    aquariums.filter(a => a.status === 'active').length, 
    [aquariums]
  );

  // Separate aquariums from pools/spas
  const aquariumsOnly = useMemo(() => aquariums.filter(a => !isPoolType(a.type)), [aquariums]);
  const poolsOnly = useMemo(() => aquariums.filter(a => isPoolType(a.type)), [aquariums]);
  const hasOnlyAquariums = aquariumsOnly.length > 0 && poolsOnly.length === 0;
  const hasOnlyPools = poolsOnly.length > 0 && aquariumsOnly.length === 0;
  const hasMixed = aquariumsOnly.length > 0 && poolsOnly.length > 0;

  return {
    loading,
    setLoading,
    dataFetched,
    aquariums,
    aquariumsOnly,
    poolsOnly,
    hasOnlyAquariums,
    hasOnlyPools,
    hasMixed,
    upcomingTaskCount,
    totalVolume,
    activeCount,
    loadAquariums,
    deleteAquarium,
  };
}
