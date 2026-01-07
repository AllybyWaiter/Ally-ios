import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Fish, Bug, Flower2, HelpCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { createLivestock, updateLivestock, type Livestock, type LivestockHealthStatus, isValidHealthStatus } from '@/infrastructure/queries/livestock';
import { fetchLivestock } from '@/infrastructure/queries/livestock';
import { fetchAquarium } from '@/infrastructure/queries/aquariums';
import { getFishSpeciesByNames } from '@/infrastructure/queries/fishSpecies';
import { SpeciesSearch } from './SpeciesSearch';
import { CompatibilityWarningDialog } from './CompatibilityWarningDialog';
import { checkCompatibility, type FishSpecies, type CompatibilityResult } from '@/lib/fishCompatibility';

interface LivestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  livestock?: Livestock;
}

// Category icons for visual display in category selector
const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'fish': return <Fish className="h-4 w-4" />;
    case 'invertebrate': return <Bug className="h-4 w-4" />;
    case 'coral': return <Flower2 className="h-4 w-4" />;
    default: return <HelpCircle className="h-4 w-4" />;
  }
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

  // Selected species from search
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);
  
  // Compatibility warning state
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState(false);

  // Fetch aquarium details for compatibility checking
  const { data: aquarium } = useQuery({
    queryKey: queryKeys.aquariums.detail(aquariumId),
    queryFn: () => fetchAquarium(aquariumId),
    enabled: !!aquariumId && open,
  });

  // Fetch existing livestock for compatibility checking
  const { data: existingLivestock } = useQuery({
    queryKey: queryKeys.livestock.list(aquariumId),
    queryFn: () => fetchLivestock(aquariumId),
    enabled: !!aquariumId && open,
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
      setSelectedSpecies(null);
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
      setSelectedSpecies(null);
    }
    setCompatibilityResult(null);
    setPendingSubmission(false);
  }, [livestock, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      // Validate and cast health_status
      const healthStatus: LivestockHealthStatus = isValidHealthStatus(data.health_status) 
        ? data.health_status 
        : 'healthy';
      
      if (livestock) {
        return updateLivestock(livestock.id, {
          name: data.name,
          species: data.species,
          category: data.category,
          quantity: data.quantity,
          date_added: data.date_added,
          health_status: healthStatus,
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
          health_status: healthStatus,
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
    onError: (error: Error) => {
      console.error('Error saving livestock:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Run compatibility check
  const runCompatibilityCheck = async (): Promise<CompatibilityResult | null> => {
    if (!selectedSpecies || !aquarium || !existingLivestock) {
      return null;
    }

    try {
      // Get species data for existing livestock
      const existingSpeciesNames = existingLivestock
        .filter(l => l.id !== livestock?.id) // Exclude current if editing
        .map(l => l.species);
      
      const existingSpeciesData = await getFishSpeciesByNames(existingSpeciesNames);

      const result = checkCompatibility(
        selectedSpecies,
        existingLivestock.filter(l => l.id !== livestock?.id),
        {
          id: aquarium.id,
          name: aquarium.name,
          type: aquarium.type,
          volume_gallons: aquarium.volume_gallons,
        },
        existingSpeciesData
      );

      return result;
    } catch (error) {
      console.error('Error running compatibility check:', error);
      toast({
        title: 'Compatibility check failed',
        description: 'Could not verify species compatibility. You can still add the livestock.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // If adding new livestock (not editing) and we have selected species, check compatibility
    if (!livestock && selectedSpecies && !pendingSubmission) {
      const result = await runCompatibilityCheck();
      
      if (result && result.warnings.length > 0) {
        setCompatibilityResult(result);
        setShowCompatibilityWarning(true);
        return;
      }
    }

    // Proceed with submission
    mutation.mutate(formData);
  };

  const handleSpeciesSelect = (species: FishSpecies | null) => {
    setSelectedSpecies(species);
    if (species) {
      setFormData(prev => ({
        ...prev,
        species: species.scientific_name,
        name: prev.name || species.common_name,
        category: species.category === 'coral' ? 'coral' : 
                  species.category === 'invertebrate' ? 'invertebrate' : 'fish',
      }));
    }
  };

  const handleProceedWithWarnings = () => {
    setShowCompatibilityWarning(false);
    setPendingSubmission(true);
    mutation.mutate(formData);
  };

  const handleCancelWarning = () => {
    setShowCompatibilityWarning(false);
    setCompatibilityResult(null);
  };

  // Determine compatibility status indicator
  const getCompatibilityIndicator = () => {
    if (!selectedSpecies) return null;
    if (!compatibilityResult) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>Compatibility will be checked on save</span>
        </div>
      );
    }
    if (compatibilityResult.warnings.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-success">
          <ShieldCheck className="h-4 w-4" />
          <span>Compatible with current tank</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm text-warning">
        <AlertTriangle className="h-4 w-4" />
        <span>{compatibilityResult.warnings.length} compatibility concern(s)</span>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{livestock ? 'Edit Livestock' : 'Add Livestock'}</DialogTitle>
            <DialogDescription>
              Track fish, invertebrates, corals, and other tank inhabitants
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Species Search - only show for new entries */}
            {!livestock && (
              <div className="space-y-2">
                <Label>Search Species Database</Label>
                <SpeciesSearch
                  value={formData.species}
                  onChange={(value) => setFormData({ ...formData, species: value })}
                  onSpeciesSelect={handleSpeciesSelect}
                  aquariumType={aquarium?.type}
                  placeholder="Start typing to search our fish database..."
                />
                {getCompatibilityIndicator()}
              </div>
            )}

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
                  onChange={(e) => {
                    setFormData({ ...formData, species: e.target.value });
                    setSelectedSpecies(null); // Clear selection if manually editing
                  }}
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

      {/* Compatibility Warning Dialog */}
      {compatibilityResult && (
        <CompatibilityWarningDialog
          open={showCompatibilityWarning}
          onOpenChange={setShowCompatibilityWarning}
          result={compatibilityResult}
          speciesName={selectedSpecies?.common_name || formData.species}
          onProceed={handleProceedWithWarnings}
          onCancel={handleCancelWarning}
        />
      )}
    </>
  );
}
