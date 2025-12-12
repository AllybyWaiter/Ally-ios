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
import { Fish, Bug, Flower2, HelpCircle } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { createLivestock, updateLivestock, type Livestock } from '@/infrastructure/queries/livestock';

interface LivestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  livestock?: Livestock;
}

const categoryIcons = {
  fish: Fish,
  invertebrate: Bug,
  coral: Flower2,
  other: HelpCircle,
};

export function LivestockDialog({ open, onOpenChange, aquariumId, livestock }: LivestockDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    category: 'fish',
    quantity: 1,
    date_added: new Date().toISOString().split('T')[0],
    health_status: 'healthy',
    notes: '',
  });

  useEffect(() => {
    if (livestock) {
      setFormData({
        name: livestock.name,
        species: livestock.species,
        category: livestock.category,
        quantity: livestock.quantity,
        date_added: livestock.date_added,
        health_status: livestock.health_status,
        notes: livestock.notes || '',
      });
    } else {
      setFormData({
        name: '',
        species: '',
        category: 'fish',
        quantity: 1,
        date_added: new Date().toISOString().split('T')[0],
        health_status: 'healthy',
        notes: '',
      });
    }
  }, [livestock, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      if (livestock) {
        return updateLivestock(livestock.id, {
          name: data.name,
          species: data.species,
          category: data.category,
          quantity: data.quantity,
          date_added: data.date_added,
          health_status: data.health_status,
          notes: data.notes || null,
        });
      } else {
        return createLivestock({
          aquarium_id: aquariumId,
          user_id: user.id,
          name: data.name,
          species: data.species,
          category: data.category,
          quantity: data.quantity,
          date_added: data.date_added,
          health_status: data.health_status,
          notes: data.notes || undefined,
        });
      }
    },
    onSuccess: () => {
      toast({ 
        title: 'Success', 
        description: livestock ? 'Livestock updated successfully' : 'Livestock added successfully' 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.livestock.list(aquariumId) });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error saving livestock:', error);
      toast({
        title: 'Error',
        description: error.message,
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
          <DialogTitle>{livestock ? 'Edit Livestock' : 'Add Livestock'}</DialogTitle>
          <DialogDescription>
            Track fish, invertebrates, corals, and other tank inhabitants
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Common Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Clownfish, Nemo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Input
                id="species"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                placeholder="e.g., Amphiprion ocellaris"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fish">
                    <div className="flex items-center gap-2">
                      <Fish className="h-4 w-4" />
                      Fish
                    </div>
                  </SelectItem>
                  <SelectItem value="invertebrate">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Invertebrate
                    </div>
                  </SelectItem>
                  <SelectItem value="coral">
                    <div className="flex items-center gap-2">
                      <Flower2 className="h-4 w-4" />
                      Coral
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_added">Date Added *</Label>
              <Input
                id="date_added"
                type="date"
                value={formData.date_added}
                onChange={(e) => setFormData({ ...formData, date_added: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health_status">Health Status *</Label>
              <Select value={formData.health_status} onValueChange={(value) => setFormData({ ...formData, health_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="quarantine">Quarantine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any special care requirements, behavior notes, or observations..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : livestock ? 'Update' : 'Add Livestock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
