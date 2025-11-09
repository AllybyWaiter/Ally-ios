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
import { Fish, Bug, Flower2, HelpCircle } from 'lucide-react';

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

interface LivestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  livestock?: Livestock;
  onSuccess: () => void;
}

const categoryIcons = {
  fish: Fish,
  invertebrate: Bug,
  coral: Flower2,
  other: HelpCircle,
};

export function LivestockDialog({ open, onOpenChange, aquariumId, livestock, onSuccess }: LivestockDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

      if (livestock) {
        const { error } = await supabase
          .from('livestock')
          .update(data)
          .eq('id', livestock.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Livestock updated successfully' });
      } else {
        const { error } = await supabase.from('livestock').insert([data]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Livestock added successfully' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving livestock:', error);
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : livestock ? 'Update' : 'Add Livestock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
