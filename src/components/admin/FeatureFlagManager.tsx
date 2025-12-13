import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  fetchFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  fetchFlagOverrides,
  deleteFlagOverride,
  FeatureFlag,
  FeatureFlagOverride,
} from '@/infrastructure/queries/featureFlags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Flag, Users, ToggleLeft } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const SUBSCRIPTION_TIERS = ['free', 'basic', 'plus', 'gold', 'business', 'enterprise'];
const ROLES: AppRole[] = ['user', 'admin', 'super_admin'];

export default function FeatureFlagManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [selectedFlagForOverrides, setSelectedFlagForOverrides] = useState<FeatureFlag | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    rollout_percentage: 0,
    target_tiers: [] as string[],
    target_roles: [] as AppRole[],
  });

  // Queries
  const { data: flags = [], isLoading } = useQuery({
    queryKey: queryKeys.featureFlags.all,
    queryFn: fetchFeatureFlags,
  });

  const { data: overrides = [] } = useQuery({
    queryKey: queryKeys.featureFlags.overrides(selectedFlagForOverrides?.id ?? ''),
    queryFn: () => fetchFlagOverrides(selectedFlagForOverrides!.id),
    enabled: !!selectedFlagForOverrides,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast({ title: 'Success', description: 'Feature flag created' });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateFeatureFlag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast({ title: 'Success', description: 'Feature flag updated' });
      setEditingFlag(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast({ title: 'Success', description: 'Feature flag deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => 
      updateFeatureFlag(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: ({ flagId, userId }: { flagId: string; userId: string }) => 
      deleteFlagOverride(flagId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.featureFlags.overrides(selectedFlagForOverrides?.id ?? '') 
      });
      toast({ title: 'Success', description: 'Override removed' });
    },
  });

  // Filtered flags
  const filteredFlags = useMemo(() => {
    if (!search) return flags;
    const searchLower = search.toLowerCase();
    return flags.filter(f => 
      f.key.toLowerCase().includes(searchLower) ||
      f.name.toLowerCase().includes(searchLower) ||
      f.description?.toLowerCase().includes(searchLower)
    );
  }, [flags, search]);

  const resetForm = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      enabled: false,
      rollout_percentage: 0,
      target_tiers: [],
      target_roles: [] as AppRole[],
    });
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description || '',
      enabled: flag.enabled,
      rollout_percentage: flag.rollout_percentage,
      target_tiers: flag.target_tiers || [],
      target_roles: (flag.target_roles || []) as AppRole[],
    });
  };

  const handleSubmit = () => {
    if (editingFlag) {
      updateMutation.mutate({
        id: editingFlag.id,
        data: {
          name: formData.name,
          description: formData.description || null,
          enabled: formData.enabled,
          rollout_percentage: formData.rollout_percentage,
          target_tiers: formData.target_tiers,
          target_roles: formData.target_roles,
        },
      });
    } else {
      createMutation.mutate({
        key: formData.key,
        name: formData.name,
        description: formData.description || undefined,
        enabled: formData.enabled,
        rollout_percentage: formData.rollout_percentage,
        target_tiers: formData.target_tiers,
        target_roles: formData.target_roles,
      });
    }
  };

  const handleTierToggle = (tier: string) => {
    setFormData(prev => ({
      ...prev,
      target_tiers: prev.target_tiers.includes(tier)
        ? prev.target_tiers.filter(t => t !== tier)
        : [...prev.target_tiers, tier],
    }));
  };

  const handleRoleToggle = (role: AppRole) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6" />
            Feature Flags
          </h2>
          <p className="text-muted-foreground">Manage feature rollouts and A/B testing</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Flag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Feature Flag</DialogTitle>
              <DialogDescription>
                Create a new feature flag with optional targeting rules
              </DialogDescription>
            </DialogHeader>
            <FlagForm
              formData={formData}
              setFormData={setFormData}
              onTierToggle={handleTierToggle}
              onRoleToggle={handleRoleToggle}
              isEdit={false}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.key || !formData.name || createMutation.isPending}
              >
                Create Flag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search flags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {flags.filter(f => f.enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Targeting</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {flags.filter(f => 
                (f.target_tiers?.length ?? 0) > 0 || 
                (f.target_roles?.length ?? 0) > 0 ||
                f.rollout_percentage < 100
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flags Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rollout</TableHead>
                <TableHead>Targeting</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlags.map(flag => (
                <TableRow key={flag.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{flag.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{flag.key}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={enabled => 
                        toggleMutation.mutate({ id: flag.id, enabled })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={flag.rollout_percentage === 100 ? 'default' : 'secondary'}>
                      {flag.rollout_percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(flag.target_tiers?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {flag.target_tiers?.length} tier{(flag.target_tiers?.length ?? 0) > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {(flag.target_roles?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {flag.target_roles?.length} role{(flag.target_roles?.length ?? 0) > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {(flag.target_tiers?.length ?? 0) === 0 && (flag.target_roles?.length ?? 0) === 0 && (
                        <span className="text-muted-foreground text-sm">All users</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(flag.created_at, 'PP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedFlagForOverrides(flag)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(flag)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteMutation.mutate(flag.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFlags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No feature flags found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingFlag} onOpenChange={() => setEditingFlag(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update the feature flag settings
            </DialogDescription>
          </DialogHeader>
          <FlagForm
            formData={formData}
            setFormData={setFormData}
            onTierToggle={handleTierToggle}
            onRoleToggle={handleRoleToggle}
            isEdit={true}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFlag(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overrides Dialog */}
      <Dialog 
        open={!!selectedFlagForOverrides} 
        onOpenChange={() => setSelectedFlagForOverrides(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Overrides</DialogTitle>
            <DialogDescription>
              Manage user-specific overrides for {selectedFlagForOverrides?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {overrides.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                No user overrides configured
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map(override => (
                    <TableRow key={override.id}>
                      <TableCell className="font-mono text-xs">
                        {override.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={override.enabled ? 'default' : 'secondary'}>
                          {override.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOverrideMutation.mutate({
                            flagId: selectedFlagForOverrides!.id,
                            userId: override.user_id,
                          })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFlagForOverrides(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FormDataType {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  target_tiers: string[];
  target_roles: AppRole[];
}

interface FlagFormProps {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  onTierToggle: (tier: string) => void;
  onRoleToggle: (role: AppRole) => void;
  isEdit: boolean;
}

function FlagForm({ formData, setFormData, onTierToggle, onRoleToggle, isEdit }: FlagFormProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="targeting">Targeting</TabsTrigger>
        <TabsTrigger value="rollout">Rollout</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="key">Flag Key</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') 
            }))}
            placeholder="new_feature_name"
            disabled={isEdit}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier used in code. Cannot be changed after creation.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="New Feature"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What does this feature flag control?"
            rows={3}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Enabled</Label>
            <p className="text-xs text-muted-foreground">
              Master switch for this feature
            </p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={enabled => setFormData(prev => ({ ...prev, enabled }))}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="targeting" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div>
            <Label className="mb-3 block">Target Subscription Tiers</Label>
            <p className="text-xs text-muted-foreground mb-3">
              If selected, only users with these tiers will see the feature.
              Leave empty for all tiers.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SUBSCRIPTION_TIERS.map(tier => (
                <label 
                  key={tier}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={formData.target_tiers.includes(tier)}
                    onCheckedChange={() => onTierToggle(tier)}
                  />
                  <span className="text-sm capitalize">{tier}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="mb-3 block">Target Roles</Label>
            <p className="text-xs text-muted-foreground mb-3">
              If selected, only users with these roles will see the feature.
              Leave empty for all roles.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(role => (
                <label 
                  key={role}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={formData.target_roles.includes(role)}
                    onCheckedChange={() => onRoleToggle(role)}
                  />
                  <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="rollout" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Rollout Percentage</Label>
              <Badge variant="outline">{formData.rollout_percentage}%</Badge>
            </div>
            <Slider
              value={[formData.rollout_percentage]}
              onValueChange={([value]) => 
                setFormData(prev => ({ ...prev, rollout_percentage: value }))
              }
              max={100}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Percentage of users who will see this feature.
              Users are assigned consistently based on their ID.
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Rollout Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Start with 10% for initial testing</li>
              <li>• Increase gradually (10% → 25% → 50% → 100%)</li>
              <li>• Monitor errors and feedback at each stage</li>
              <li>• User assignment is stable - same users stay in the rollout</li>
            </ul>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
