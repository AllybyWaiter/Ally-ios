import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X, Star } from "lucide-react";
import type { Parameter } from "@/lib/waterTestUtils";
import { queryKeys } from "@/lib/queryKeys";

interface CustomTemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumType: string;
}

interface TemplateFormData {
  name: string;
  aquariumType: string;
  parameters: Parameter[];
  isDefault: boolean;
}

const aquariumTypes = [
  { value: "freshwater", label: "Freshwater" },
  { value: "planted", label: "Planted" },
  { value: "saltwater", label: "Saltwater" },
  { value: "reef", label: "Reef" },
  { value: "pond", label: "Pond" },
  { value: "pool", label: "Pool" },
];

export function CustomTemplateManager({ open, onOpenChange, aquariumType }: CustomTemplateManagerProps) {
  const { user, subscriptionTier } = useAuth();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    aquariumType: aquariumType,
    parameters: [{ name: "", unit: "", range: { min: 0, max: 100 } }],
    isDefault: false,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: queryKeys.waterTests.customTemplates(user?.id || ''),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("custom_parameter_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const templateLimit = subscriptionTier === "plus" ? 10 : subscriptionTier === "gold" || subscriptionTier === "enterprise" ? Infinity : 0;
  const canAddMore = (templates?.length || 0) < templateLimit;

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("custom_parameter_templates").insert({
        user_id: user.id,
        name: data.name,
        aquarium_type: data.aquariumType,
        parameters: data.parameters as any,
        is_default: data.isDefault,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.waterTests.customTemplates(user?.id || '') });
      toast({ title: "Template created successfully" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("custom_parameter_templates")
        .update({
          name: data.name,
          aquarium_type: data.aquariumType,
          parameters: data.parameters as any,
          is_default: data.isDefault,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.waterTests.customTemplates(user?.id || '') });
      toast({ title: "Template updated successfully" });
      setIsFormOpen(false);
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Failed to update template", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("custom_parameter_templates").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.waterTests.customTemplates(user?.id || '') });
      toast({ title: "Template deleted" });
      setDeleteTemplateId(null);
    },
    onError: (error) => {
      toast({ title: "Failed to delete template", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      aquariumType: aquariumType,
      parameters: [{ name: "", unit: "", range: { min: 0, max: 100 } }],
      isDefault: false,
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: any) => {
    setFormData({
      name: template.name,
      aquariumType: template.aquarium_type,
      parameters: template.parameters,
      isDefault: template.is_default,
    });
    setEditingTemplate(template.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }

    if (formData.parameters.length === 0 || formData.parameters.some(p => !p.name.trim())) {
      toast({ title: "At least one valid parameter is required", variant: "destructive" });
      return;
    }

    if (formData.parameters.some(p => p.range.min >= p.range.max)) {
      toast({ title: "Min value must be less than max value", variant: "destructive" });
      return;
    }

    // Check for duplicate template name (only when creating new or changing name)
    if (!editingTemplate || templates?.find(t => t.id === editingTemplate)?.name !== formData.name.trim()) {
      const existingTemplate = templates?.find(
        t => t.name.toLowerCase() === formData.name.trim().toLowerCase() && t.id !== editingTemplate
      );
      
      if (existingTemplate) {
        toast({ 
          title: "Template name already exists", 
          description: "Please choose a different name for your template.",
          variant: "destructive" 
        });
        return;
      }
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addParameter = () => {
    setFormData({
      ...formData,
      parameters: [...formData.parameters, { name: "", unit: "", range: { min: 0, max: 100 } }],
    });
  };

  const removeParameter = (index: number) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index),
    });
  };

  const updateParameter = (index: number, field: string, value: any) => {
    const newParams = [...formData.parameters];
    if (field.startsWith("range.")) {
      const rangeField = field.split(".")[1];
      newParams[index] = {
        ...newParams[index],
        range: { ...newParams[index].range, [rangeField]: Number(value) },
      };
    } else {
      newParams[index] = { ...newParams[index], [field]: value };
    }
    setFormData({ ...formData, parameters: newParams });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Templates</DialogTitle>
            <DialogDescription>
              Create and manage your custom water test parameter templates.
              {templateLimit !== Infinity && ` (${templates?.length || 0}/${templateLimit} used)`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading templates...</p>
            ) : templates && templates.length > 0 ? (
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {template.name}
                            {template.is_default && <Star className="h-4 w-4 fill-primary text-primary" />}
                          </CardTitle>
                          <CardDescription className="capitalize">{template.aquarium_type}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTemplateId(template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {(template.parameters as unknown as Parameter[]).map((param) => (
                          <Badge key={param.name} variant="secondary">
                            {param.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No custom templates yet. Create your first one!
              </p>
            )}

            {canAddMore && (
              <Button onClick={() => setIsFormOpen(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Template
              </Button>
            )}

            {!canAddMore && templateLimit !== Infinity && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Template limit reached</p>
                <p className="text-xs text-muted-foreground">
                  {subscriptionTier === "plus" ? "Upgrade to Gold for unlimited templates" : "Upgrade your plan for more templates"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>Define your custom water test parameter template</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High Tech Planted Tank"
              />
            </div>

            <div>
              <Label htmlFor="aquariumType">Aquarium Type</Label>
              <Select value={formData.aquariumType} onValueChange={(value) => setFormData({ ...formData, aquariumType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aquariumTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Parameters</Label>
                <Button type="button" size="sm" variant="outline" onClick={addParameter}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Parameter
                </Button>
              </div>

              {formData.parameters.map((param, index) => (
                <Card key={param.name || `param-${index}`}>
                  <CardContent className="pt-4">
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Parameter Name</Label>
                          <Input
                            value={param.name}
                            onChange={(e) => updateParameter(index, "name", e.target.value)}
                            placeholder="e.g., pH, Nitrate"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit</Label>
                          <Input
                            value={param.unit}
                            onChange={(e) => updateParameter(index, "unit", e.target.value)}
                            placeholder="e.g., ppm, dKH"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Min Value</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.range.min}
                            onChange={(e) => updateParameter(index, "range.min", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Value</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.range.max}
                            onChange={(e) => updateParameter(index, "range.max", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Flag Above (optional)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.range.flagAbove || ""}
                            onChange={(e) => updateParameter(index, "range.flagAbove", e.target.value || undefined)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      {formData.parameters.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeParameter(index)}
                          className="w-fit"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                Set as default template for this aquarium type
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTemplateId && deleteMutation.mutate(deleteTemplateId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}