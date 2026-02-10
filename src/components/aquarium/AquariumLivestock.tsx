import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Fish, Leaf, Loader2, Bug, Flower2, HelpCircle, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { LivestockDialog } from './LivestockDialog';
import { PlantDialog } from './PlantDialog';
import { LivestockCard } from './LivestockCard';
import { PlantCard } from './PlantCard';
import { queryKeys } from '@/lib/queryKeys';
import { fetchLivestock, deleteLivestock, type Livestock } from '@/infrastructure/queries/livestock';
import { fetchPlants, deletePlant, type Plant } from '@/infrastructure/queries/plants';

export interface AquariumLivestockProps {
  aquariumId: string;
  initialAddNew?: string | null; // 'livestock' | 'plant' | null
}

const categoryIcons = {
  fish: Fish,
  invertebrate: Bug,
  coral: Flower2,
  other: HelpCircle,
};

const placementIcons = {
  foreground: Leaf,
  midground: Leaf,
  background: Leaf,
  floating: Leaf,
};

export function AquariumLivestock({ aquariumId, initialAddNew }: AquariumLivestockProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [livestockDialogOpen, setLivestockDialogOpen] = useState(false);
  const [plantDialogOpen, setPlantDialogOpen] = useState(false);
  const [editingLivestock, setEditingLivestock] = useState<Livestock | undefined>();
  const [editingPlant, setEditingPlant] = useState<Plant | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<'livestock' | 'plant'>('livestock');

  // Auto-open dialog based on URL param
  useEffect(() => {
    if (initialAddNew === 'livestock') {
      setLivestockDialogOpen(true);
    } else if (initialAddNew === 'plant') {
      setPlantDialogOpen(true);
    }
  }, [initialAddNew]);

  // Fetch livestock using useQuery
  const { data: livestock = [], isLoading: livestockLoading } = useQuery({
    queryKey: queryKeys.livestock.list(aquariumId),
    queryFn: () => fetchLivestock(aquariumId),
    enabled: !authLoading && !!user && !!aquariumId,
  });

  // Fetch plants using useQuery
  const { data: plants = [], isLoading: plantsLoading } = useQuery({
    queryKey: queryKeys.plants.list(aquariumId),
    queryFn: () => fetchPlants(aquariumId),
    enabled: !authLoading && !!user && !!aquariumId,
  });

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'livestock' | 'plant' }) => {
      if (!user) throw new Error('Not authenticated');
      if (type === 'livestock') {
        await deleteLivestock(id, user.id);
      } else {
        await deletePlant(id, user.id);
      }
    },
    onMutate: async ({ id, type }) => {
      // Cancel outgoing refetches
      const queryKey = type === 'livestock' 
        ? queryKeys.livestock.list(aquariumId) 
        : queryKeys.plants.list(aquariumId);
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous values
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically remove from cache
      queryClient.setQueryData(queryKey, (old: (Livestock | Plant)[] | undefined) => 
        old?.filter((item) => item.id !== id) ?? []
      );
      
      return { previousData, queryKey };
    },
    onSuccess: (_, { type }) => {
      toast({ 
        title: 'Success', 
        description: `${type === 'livestock' ? 'Livestock' : 'Plant'} removed successfully` 
      });
    },
    onError: (_error: unknown, { type }, context) => {
      // Rollback on error
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast({
        title: 'Error',
        description: `Failed to remove ${type}`,
        variant: 'destructive',
      });
    },
    onSettled: (_, __, { type }) => {
      // Always refetch to ensure consistency
      const queryKey = type === 'livestock' 
        ? queryKeys.livestock.list(aquariumId) 
        : queryKeys.plants.list(aquariumId);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleEditLivestock = useCallback((item: Livestock) => {
    setEditingLivestock(item);
    setLivestockDialogOpen(true);
  }, []);

  const handleAddLivestock = useCallback(() => {
    setEditingLivestock(undefined);
    setLivestockDialogOpen(true);
  }, []);

  const handleEditPlant = useCallback((item: Plant) => {
    setEditingPlant(item);
    setPlantDialogOpen(true);
  }, []);

  const handleAddPlant = useCallback(() => {
    setEditingPlant(undefined);
    setPlantDialogOpen(true);
  }, []);

  const handleDeleteLivestockClick = useCallback((id: string) => {
    setDeletingId(id);
    setDeletingType('livestock');
    setDeleteDialogOpen(true);
  }, []);

  const handleDeletePlantClick = useCallback((id: string) => {
    setDeletingId(id);
    setDeletingType('plant');
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    deleteMutation.mutate(
      { id: deletingId, type: deletingType },
      {
        onSettled: () => {
          setDeleteDialogOpen(false);
          setDeletingId(null);
        },
      }
    );
  };

  const groupedLivestock = useMemo(() => {
    return livestock.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, Livestock[]>);
  }, [livestock]);

  const groupedPlants = useMemo(() => {
    return plants.reduce((acc, item) => {
      if (!acc[item.placement]) {
        acc[item.placement] = [];
      }
      acc[item.placement].push(item);
      return acc;
    }, {} as Record<string, Plant[]>);
  }, [plants]);

  // Show loading while auth is initializing or data is loading
  if (authLoading || livestockLoading || plantsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="livestock" className="space-y-5">
        <TabsList className="bg-muted/50 p-1 rounded-full">
          <TabsTrigger value="livestock" className="rounded-full gap-1.5 data-[state=active]:shadow-sm">
            <Fish className="h-3.5 w-3.5" />
            Animals
            {livestock.length > 0 && (
              <span className="ml-0.5 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{livestock.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="plants" className="rounded-full gap-1.5 data-[state=active]:shadow-sm">
            <Leaf className="h-3.5 w-3.5" />
            Plants
            {plants.length > 0 && (
              <span className="ml-0.5 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{plants.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="livestock" className="space-y-5">
          {livestock.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-primary/5 via-background to-background"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />

              <div className="relative px-6 pt-10 pb-12 flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-5">
                  <Fish className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1.5">No livestock yet</h3>
                <p className="text-sm text-muted-foreground max-w-[260px] mb-6">
                  Start tracking your fish, invertebrates, and other tank inhabitants
                </p>
                <Button
                  onClick={handleAddLivestock}
                  className="rounded-full gap-2 shadow-sm px-6"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Livestock
                </Button>
              </div>

              {/* Subtle wave decoration at bottom */}
              <div className="flex justify-center pb-4 opacity-[0.08]">
                <Waves className="h-24 w-full text-primary" />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-end">
                <Button
                  onClick={handleAddLivestock}
                  size="sm"
                  className="rounded-full gap-1.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Livestock
                </Button>
              </div>
              {Object.entries(groupedLivestock).map(([category, items]) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || HelpCircle;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold capitalize">{category}</h3>
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                        >
                          <LivestockCard
                            livestock={item}
                            onEdit={handleEditLivestock}
                            onDelete={handleDeleteLivestockClick}
                            userId={user?.id || ''}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plants" className="space-y-5">
          {plants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-emerald-500/5 via-background to-background"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/5 rounded-full blur-3xl" />

              <div className="relative px-6 pt-10 pb-12 flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 mb-5">
                  <Leaf className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1.5">No plants yet</h3>
                <p className="text-sm text-muted-foreground max-w-[240px] mb-6">
                  Start tracking your aquatic plants and their growth
                </p>
                <Button
                  onClick={handleAddPlant}
                  className="rounded-full gap-2 shadow-sm px-6"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Plant
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-end">
                <Button
                  onClick={handleAddPlant}
                  size="sm"
                  className="rounded-full gap-1.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Plant
                </Button>
              </div>
              {Object.entries(groupedPlants).map(([placement, items]) => {
                const Icon = placementIcons[placement as keyof typeof placementIcons] || Leaf;
                return (
                  <div key={placement}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500/10">
                        <Icon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-semibold capitalize">{placement}</h3>
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                        >
                          <PlantCard
                            plant={item}
                            onEdit={handleEditPlant}
                            onDelete={handleDeletePlantClick}
                            userId={user?.id || ''}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LivestockDialog
        open={livestockDialogOpen}
        onOpenChange={setLivestockDialogOpen}
        aquariumId={aquariumId}
        livestock={editingLivestock}
      />

      <PlantDialog
        open={plantDialogOpen}
        onOpenChange={setPlantDialogOpen}
        aquariumId={aquariumId}
        plant={editingPlant}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this{' '}
              {deletingType === 'livestock' ? 'livestock' : 'plant'} from your aquarium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
