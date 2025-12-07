import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreVertical, Pencil, Trash2, Fish, Bug, Flower2, HelpCircle, Activity, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LivestockDialog } from './LivestockDialog';
import { PlantDialog } from './PlantDialog';
import { formatDate } from '@/lib/formatters';

interface Livestock {
  id: string;
  name: string;
  species: string;
  category: string;
  quantity: number;
  date_added: string;
  health_status: string;
  notes: string | null;
}

interface Plant {
  id: string;
  name: string;
  species: string;
  placement: string;
  quantity: number;
  date_added: string;
  condition: string;
  notes: string | null;
}

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
  const { toast } = useToast();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [livestockDialogOpen, setLivestockDialogOpen] = useState(false);
  const [plantDialogOpen, setPlantDialogOpen] = useState(false);
  const [editingLivestock, setEditingLivestock] = useState<Livestock | undefined>();
  const [editingPlant, setEditingPlant] = useState<Plant | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<'livestock' | 'plant'>('livestock');

  useEffect(() => {
    loadLivestock();
    loadPlants();
  }, [aquariumId]);

  const loadLivestock = async () => {
    try {
      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .eq('aquarium_id', aquariumId)
        .order('date_added', { ascending: false });

      if (error) throw error;
      setLivestock(data || []);
    } catch (error: any) {
      console.error('Error loading livestock:', error);
      toast({
        title: 'Error',
        description: 'Failed to load livestock',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('aquarium_id', aquariumId)
        .order('date_added', { ascending: false });

      if (error) throw error;
      setPlants(data || []);
    } catch (error: any) {
      console.error('Error loading plants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plants',
        variant: 'destructive',
      });
    }
  };

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

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      const table = deletingType === 'livestock' ? 'livestock' : 'plants';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      toast({ 
        title: 'Success', 
        description: `${deletingType === 'livestock' ? 'Livestock' : 'Plant'} removed successfully` 
      });
      
      if (deletingType === 'livestock') {
        await loadLivestock();
      } else {
        await loadPlants();
      }
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast({
        title: 'Error',
        description: `Failed to remove ${deletingType}`,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
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

  if (loading) {
    return <div className="animate-pulse space-y-4">Loading livestock...</div>;
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
        onSuccess={loadLivestock}
      />

      <PlantDialog
        open={plantDialogOpen}
        onOpenChange={setPlantDialogOpen}
        aquariumId={aquariumId}
        plant={editingPlant}
        onSuccess={loadPlants}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Livestock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this livestock? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
