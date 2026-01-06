import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';
import { createPlant, updatePlant, type Plant } from '@/infrastructure/queries/plants';

interface PlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  plant?: Plant;
}

export function PlantDialog({ open, onOpenChange, aquariumId, plant }: PlantDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    quantity: 1,
    date_added: new Date().toISOString().split('T')[0],
    placement: 'midground',
    condition: 'growing',
    notes: '',
  });

  useEffect(() => {
    if (plant) {
      setFormData({
        name: plant.name,
        species: plant.species,
        quantity: plant.quantity,
        date_added: plant.date_added,
        placement: plant.placement,
        condition: plant.condition,
        notes: plant.notes || '',
      });
    } else {
      setFormData({
        name: '',
        species: '',
        quantity: 1,
        date_added: new Date().toISOString().split('T')[0],
        placement: 'midground',
        condition: 'growing',
        notes: '',
      });
    }
  }, [plant, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      if (plant) {
        return updatePlant(plant.id, {
          name: data.name,
          species: data.species,
          quantity: data.quantity,
          date_added: data.date_added,
          placement: data.placement,
          condition: data.condition,
          notes: data.notes || null,
        });
      } else {
        return createPlant({
          aquarium_id: aquariumId,
          user_id: user.id,
          name: data.name,
          species: data.species,
          quantity: data.quantity,
          date_added: data.date_added,
          placement: data.placement,
          condition: data.condition,
          notes: data.notes || undefined,
        });
      }
    },
    onSuccess: () => {
      toast({ 
        title: 'Success', 
        description: plant ? 'Plant updated successfully' : 'Plant added successfully' 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.list(aquariumId) });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      console.error('Error saving plant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save plant',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plant ? 'Edit Plant' : 'Add Plant'}</DialogTitle>
          <DialogDescription>
            Track aquatic plants in your aquarium
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-name">Common Name *</Label>
              <Input
                id="plant-name"
                aria-label="Plant common name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Java Fern"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plant-species">Species *</Label>
              <Input
                id="plant-species"
                aria-label="Plant species"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                placeholder="e.g., Microsorum pteropus"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-quantity">Quantity *</Label>
              <Input
                id="plant-quantity"
                aria-label="Plant quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plant-date-added">Date Added *</Label>
              <Input
                id="plant-date-added"
                aria-label="Date plant was added"
                type="date"
                value={formData.date_added}
                onChange={(e) => setFormData({ ...formData, date_added: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-placement">Placement *</Label>
              <Select 
                value={formData.placement} 
                onValueChange={(value) => setFormData({ ...formData, placement: value })}
              >
                <SelectTrigger id="plant-placement" aria-label="Plant placement in tank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foreground">Foreground</SelectItem>
                  <SelectItem value="midground">Midground</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="floating">Floating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plant-condition">Condition *</Label>
              <Select 
                value={formData.condition} 
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger id="plant-condition" aria-label="Plant condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thriving">Thriving</SelectItem>
                  <SelectItem value="growing">Growing</SelectItem>
                  <SelectItem value="struggling">Struggling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plant-notes">Notes</Label>
            <Textarea
              id="plant-notes"
              aria-label="Additional notes about the plant"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add care requirements, growth observations, or fertilization schedule..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : plant ? 'Update' : 'Add Plant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
