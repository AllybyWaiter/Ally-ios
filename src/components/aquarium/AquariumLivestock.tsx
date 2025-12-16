import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Fish, Leaf, Loader2, Bug, Flower2, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LivestockDialog } from './LivestockDialog';
import { PlantDialog } from './PlantDialog';
import { LivestockCard } from './LivestockCard';
import { PlantCard } from './PlantCard';
import { queryKeys } from '@/lib/queryKeys';
import { fetchLivestock, deleteLivestock, type Livestock } from '@/infrastructure/queries/livestock';
import { fetchPlants, deletePlant, type Plant } from '@/infrastructure/queries/plants';

interface AquariumLivestockProps {
  aquariumId: string;
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

export function AquariumLivestock({ aquariumId }: AquariumLivestockProps) {
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
      if (type === 'livestock') {
        await deleteLivestock(id);
      } else {
        await deletePlant(id);
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
      queryClient.setQueryData(queryKey, (old: any[] | undefined) => 
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
    onError: (error: any, { type }, context) => {
      // Rollback on error
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      console.error('Error deleting:', error);
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
    setTimeout(() => {
      setEditingLivestock(item);
      setLivestockDialogOpen(true);
    }, 0);
  }, []);

  const handleAddLivestock = useCallback(() => {
    setEditingLivestock(undefined);
    setLivestockDialogOpen(true);
  }, []);

  const handleEditPlant = useCallback((item: Plant) => {
    setTimeout(() => {
      setEditingPlant(item);
      setPlantDialogOpen(true);
    }, 0);
  }, []);

  const handleAddPlant = useCallback(() => {
    setEditingPlant(undefined);
    setPlantDialogOpen(true);
  }, []);

  const handleDeleteLivestockClick = useCallback((id: string) => {
    setTimeout(() => {
      setDeletingId(id);
      setDeletingType('livestock');
      setDeleteDialogOpen(true);
    }, 0);
  }, []);

  const handleDeletePlantClick = useCallback((id: string) => {
    setTimeout(() => {
      setDeletingId(id);
      setDeletingType('plant');
      setDeleteDialogOpen(true);
    }, 0);
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
    <div className="space-y-6">
      <Tabs defaultValue="livestock" className="space-y-6">
        <TabsList>
          <TabsTrigger value="livestock">Animals</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
        </TabsList>

        <TabsContent value="livestock" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Livestock</h2>
              <p className="text-muted-foreground">Track your aquarium inhabitants</p>
            </div>
            <Button onClick={handleAddLivestock}>
              <Plus className="mr-2 h-4 w-4" />
              Add Livestock
            </Button>
          </div>

          {livestock.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Fish className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No livestock yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your fish, invertebrates, and other tank inhabitants
                </p>
                <Button onClick={handleAddLivestock}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Livestock
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLivestock).map(([category, items]) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || HelpCircle;
                return (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 capitalize">
                      <Icon className="h-5 w-5" />
                      {category} ({items.length})
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <LivestockCard
                          key={item.id}
                          livestock={item}
                          onEdit={handleEditLivestock}
                          onDelete={handleDeleteLivestockClick}
                          userId={user?.id || ''}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plants" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Plants</h2>
              <p className="text-muted-foreground">Track your aquarium plants</p>
            </div>
            <Button onClick={handleAddPlant}>
              <Plus className="mr-2 h-4 w-4" />
              Add Plant
            </Button>
          </div>

          {plants.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Leaf className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No plants yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your aquatic plants
                </p>
                <Button onClick={handleAddPlant}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Plant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPlants).map(([placement, items]) => {
                const Icon = placementIcons[placement as keyof typeof placementIcons] || Leaf;
                return (
                  <div key={placement}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 capitalize">
                      <Icon className="h-5 w-5" />
                      {placement} ({items.length})
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <PlantCard
                          key={item.id}
                          plant={item}
                          onEdit={handleEditPlant}
                          onDelete={handleDeletePlantClick}
                        />
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
