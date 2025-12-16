import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  fetchAquariumsWithTaskCounts, 
  fetchUpcomingTaskCount,
  deleteAquarium as deleteAquariumApi,
  type Aquarium 
} from '@/infrastructure/queries/aquariums';
import { isPoolType } from '@/lib/waterBodyUtils';

interface DashboardAquarium extends Aquarium {
  volume_gallons: number;
  status: string;
  setup_date: string;
}

export function useDashboardData() {
  const { toast } = useToast();
  const { t } = useTranslation();
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
      
      // Calculate upcoming tasks (within 7 days)
      if (data && data.length > 0) {
        const count = await fetchUpcomingTaskCount(data.map(a => a.id), 7);
        setUpcomingTaskCount(count);
      }
      
      setAquariums((data || []) as DashboardAquarium[]);
      setDataFetched(true);
      
      return data || [];
    } catch (error: any) {
      console.error('Error loading aquariums:', error);
      
      const errorMessage = error.message || 'Failed to load aquariums';
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

  const deleteAquarium = useCallback(async (aquariumId: string, userId?: string) => {
    try {
      await deleteAquariumApi(aquariumId);
      
      toast({
        title: t('common.success'),
        description: t('dashboard.aquariumDeleted'),
      });

      // Reload aquariums
      await loadAquariums(userId);
    } catch (error) {
      console.error("Error deleting aquarium:", error);
      toast({
        title: t('common.error'),
        description: t('dashboard.failedToDelete'),
        variant: "destructive",
      });
    }
  }, [toast, t, loadAquariums]);

  const totalVolume = aquariums.reduce((sum, a) => sum + (a.volume_gallons || 0), 0);
  const activeCount = aquariums.filter(a => a.status === 'active').length;

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
