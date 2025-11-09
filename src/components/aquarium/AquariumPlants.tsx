import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Pencil, Trash2, Leaf, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlantDialog } from './PlantDialog';
import { formatDate } from '@/lib/formatters';

interface Plant {
  id: string;
  name: string;
  species: string;
  quantity: number;
  date_added: string;
  placement: string;
  condition: string;
  notes: string | null;
}

interface AquariumPlantsProps {
  aquariumId: string;
}

const conditionColors = {
  thriving: 'default',
  growing: 'secondary',
  struggling: 'destructive',
} as const;

export function AquariumPlants({ aquariumId }: AquariumPlantsProps) {
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPlants();
  }, [aquariumId]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPlant(undefined);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Plant removed successfully' });
      await loadPlants();
    } catch (error: any) {
      console.error('Error deleting plant:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove plant',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const groupedPlants = plants.reduce((acc, plant) => {
    if (!acc[plant.placement]) {
      acc[plant.placement] = [];
    }
    acc[plant.placement].push(plant);
    return acc;
  }, {} as Record<string, Plant[]>);

  if (loading) {
    return <div className="animate-pulse space-y-4">Loading plants...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plants</h2>
          <p className="text-muted-foreground">Track your aquatic plants</p>
        </div>
        <Button onClick={handleAdd}>
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
              Start tracking your aquatic plants and their growth
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Plant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPlants).map(([placement, items]) => (
            <div key={placement}>
              <h3 className="text-lg font-semibold mb-3 capitalize">
                {placement} ({items.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((plant) => (
                  <Card key={plant.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{plant.name}</CardTitle>
                            <CardDescription className="text-sm truncate">
                              {plant.species}
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
                            <DropdownMenuItem onClick={() => handleEdit(plant)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(plant.id)}
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
                        <Badge variant="outline">{plant.quantity}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Condition</span>
                        <Badge variant={conditionColors[plant.condition as keyof typeof conditionColors]} className="capitalize">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {plant.condition}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Added</span>
                        <span className="font-medium">{formatDate(plant.date_added, 'PP')}</span>
                      </div>
                      {plant.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
                          {plant.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PlantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aquariumId={aquariumId}
        plant={editingPlant}
        onSuccess={loadPlants}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this plant? This action cannot be undone.
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
