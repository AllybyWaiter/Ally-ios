import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreVertical, Pencil, Trash2, Fish, Bug, Flower2, HelpCircle, Activity, Leaf, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LivestockDialog } from './LivestockDialog';
import { PlantDialog } from './PlantDialog';
import { formatDate } from '@/lib/formatters';
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

const healthColors = {
  healthy: 'default',
  sick: 'destructive',
  quarantine: 'secondary',
} as const;

const placementIcons = {
  foreground: Leaf,
  midground: Leaf,
  background: Leaf,
  floating: Leaf,
};

const conditionColors = {
  growing: 'default',
  melting: 'destructive',
  stable: 'secondary',
} as const;

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

  const handleEditLivestock = (item: Livestock) => {
    setTimeout(() => {
      setEditingLivestock(item);
      setLivestockDialogOpen(true);
    }, 0);
  };

  const handleAddLivestock = () => {
    setEditingLivestock(undefined);
    setLivestockDialogOpen(true);
  };

  const handleEditPlant = (item: Plant) => {
    setTimeout(() => {
      setEditingPlant(item);
      setPlantDialogOpen(true);
    }, 0);
  };

  const handleAddPlant = () => {
    setEditingPlant(undefined);
    setPlantDialogOpen(true);
  };

  const handleDeleteClick = (id: string, type: 'livestock' | 'plant') => {
    setTimeout(() => {
      setDeletingId(id);
      setDeletingType(type);
      setDeleteDialogOpen(true);
    }, 0);
  };

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

  const groupedLivestock = livestock.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, Livestock[]>);

  const groupedPlants = plants.reduce((acc, item) => {
    if (!acc[item.placement]) {
      acc[item.placement] = [];
    }
    acc[item.placement].push(item);
    return acc;
  }, {} as Record<string, Plant[]>);

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
                      {items.map((item) => {
                        const ItemIcon = categoryIcons[item.category as keyof typeof categoryIcons];
                        return (
                          <Card key={item.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <ItemIcon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base truncate">{item.name}</CardTitle>
                                    <CardDescription className="text-sm truncate">
                                      {item.species}
                                    </CardDescription>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditLivestock(item)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(item.id, 'livestock')}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Quantity</span>
                                <Badge variant="outline">{item.quantity}</Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Health</span>
                                <Badge variant={healthColors[item.health_status as keyof typeof healthColors]} className="capitalize">
                                  <Activity className="mr-1 h-3 w-3" />
                                  {item.health_status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Added</span>
                                <span className="font-medium">{formatDate(item.date_added, 'PP')}</span>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
                                  {item.notes}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
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
                        <Card key={item.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Leaf className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base truncate">{item.name}</CardTitle>
                                  <CardDescription className="text-sm truncate">
                                    {item.species}
                                  </CardDescription>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditPlant(item)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(item.id, 'plant')}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Quantity</span>
                              <Badge variant="outline">{item.quantity}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Condition</span>
                              <Badge variant={conditionColors[item.condition as keyof typeof conditionColors]} className="capitalize">
                                <Activity className="mr-1 h-3 w-3" />
                                {item.condition}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Added</span>
                              <span className="font-medium">{formatDate(item.date_added, 'PP')}</span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
                                {item.notes}
                              </p>
                            )}
                          </CardContent>
                        </Card>
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
