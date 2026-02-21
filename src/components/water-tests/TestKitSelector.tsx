import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FlaskConical, Plus, Star, Upload } from 'lucide-react';
import type { TestKitProfile, TestKitTemplate } from './hooks/useTestKitProfiles';

interface TestKitSelectorProps {
  profiles: TestKitProfile[];
  templates: TestKitTemplate[];
  selectedProfile: TestKitProfile | null;
  onSelectProfile: (profile: TestKitProfile | null) => void;
  onCreateFromTemplate: (templateId: string, name?: string) => Promise<TestKitProfile | null>;
  onUploadReferenceChart: (profileId: string, file: File) => Promise<string | null>;
  loading: boolean;
}

export function TestKitSelector({
  profiles,
  templates,
  selectedProfile,
  onSelectProfile,
  onCreateFromTemplate,
  onUploadReferenceChart,
  loading,
}: TestKitSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateKit = async () => {
    if (!selectedTemplateId) return;
    setIsCreating(true);
    const profile = await onCreateFromTemplate(selectedTemplateId, customName || undefined);
    if (profile) {
      onSelectProfile(profile);
      setShowAddDialog(false);
      setSelectedTemplateId('');
      setCustomName('');
    }
    setIsCreating(false);
  };

  const handleReferenceChartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProfile) return;
    await onUploadReferenceChart(selectedProfile.id, file);
  };

  if (loading) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Test Kit</Label>
      </div>

      <div className="flex gap-2">
        <Select
          value={selectedProfile?.id || 'none'}
          onValueChange={(val) => {
            if (val === 'none') {
              onSelectProfile(null);
            } else {
              const profile = profiles.find(p => p.id === val);
              onSelectProfile(profile || null);
            }
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select your test kit (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No kit selected</SelectItem>
            {profiles.length > 0 && (
              <SelectGroup>
                <SelectLabel>Your Test Kits</SelectLabel>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      {profile.is_default && <Star className="h-3 w-3 text-amber-500" />}
                      {profile.name}
                      <Badge variant="outline" className="text-[10px] ml-1">
                        {profile.kit_type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowAddDialog(true)}
          title="Add test kit"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Show reference chart upload if profile selected but no chart */}
      {selectedProfile && !selectedProfile.reference_chart_url && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-md bg-muted/50">
          <Upload className="h-3 w-3 flex-shrink-0" />
          <span>Upload your color chart for better accuracy:</span>
          <label className="cursor-pointer text-primary hover:underline">
            <input
              type="file"
              accept="image/*"
              onChange={handleReferenceChartUpload}
              className="hidden"
            />
            Upload
          </label>
        </div>
      )}

      {selectedProfile?.reference_chart_url && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-200">
            Reference chart saved
          </Badge>
        </div>
      )}

      {/* Add kit dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Test Kit</DialogTitle>
            <DialogDescription>
              Select your test kit brand and model for more accurate photo analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Test Kit</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your test kit..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Group templates by brand */}
                  {Array.from(new Set(templates.map(t => t.brand))).map(brand => (
                    <SelectGroup key={brand}>
                      <SelectLabel>{brand}</SelectLabel>
                      {templates.filter(t => t.brand === brand).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.model}
                            <Badge variant="outline" className="text-[10px]">
                              {template.kit_type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Name (optional)</Label>
              <Input
                placeholder="e.g. My Reef Kit"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            {selectedTemplateId && (
              <div className="p-3 rounded-md bg-muted text-sm">
                {(() => {
                  const t = templates.find(t => t.id === selectedTemplateId);
                  if (!t) return null;
                  return (
                    <div className="space-y-1">
                      <p className="font-medium">{t.brand} {t.model}</p>
                      <p className="text-xs text-muted-foreground">
                        Parameters: {t.parameters.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Type: {t.kit_type}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            <Button
              onClick={handleCreateKit}
              disabled={!selectedTemplateId || isCreating}
              className="w-full"
            >
              {isCreating ? 'Saving...' : 'Save Test Kit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
