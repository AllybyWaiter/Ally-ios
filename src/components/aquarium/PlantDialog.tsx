import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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

interface PlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  plant?: Plant;
  onSuccess: () => void;
}

export function PlantDialog({ open, onOpenChange, aquariumId, plant, onSuccess }: PlantDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        aquarium_id: aquariumId,
        user_id: user.id,
      };

      if (plant) {
        const { error } = await supabase
          .from('plants')
          .update(data)
          .eq('id', plant.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Plant updated successfully' });
      } else {
        const { error } = await supabase.from('plants').insert([data]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Plant added successfully' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving plant:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
              <Label htmlFor="name">Common Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Java Fern"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Input
                id="species"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                placeholder="e.g., Microsorum pteropus"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placement">Placement *</Label>
              <Select value={formData.placement} onValueChange={(value) => setFormData({ ...formData, placement: value })}>
                <SelectTrigger>
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
              <Label htmlFor="condition">Condition *</Label>
              <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                <SelectTrigger>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : plant ? 'Update' : 'Add Plant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
