import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { getAllTemplates, validateParameter, type ParameterTemplate } from "@/lib/waterTestUtils";
import { CustomTemplateManager } from "./CustomTemplateManager";
import { 
  celsiusToFahrenheit, 
  fahrenheitToCelsius, 
  getTemperatureUnit 
} from "@/lib/unitConversions";

interface WaterTestFormProps {
  aquarium: {
    id: string;
    name: string;
    type: string;
  };
}

export const WaterTestForm = ({ aquarium }: WaterTestFormProps) => {
  const { user, canCreateCustomTemplates, subscriptionTier, units } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["all-templates", aquarium.type, user?.id],
    queryFn: async () => {
      return await getAllTemplates(aquarium.type, user?.id);
    },
  });

  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      // Auto-select default template or first template
      const defaultTemplate = templates.find((t) => 'isDefault' in t && (t as any).isDefault);
      setSelectedTemplate(defaultTemplate?.id || templates[0].id);
    }
  }, [templates, selectedTemplate]);

  const activeTemplate = templates?.find((t) => t.id === selectedTemplate);
  const systemTemplates = templates?.filter((t) => !t.isCustom) || [];
  const customTemplates = templates?.filter((t) => t.isCustom) || [];

  const createTestMutation = useMutation({
    mutationFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      // Create water test entry
      const { data: test, error: testError } = await supabase
        .from("water_tests")
        .insert({
          aquarium_id: aquarium.id,
          user_id: authUser.id,
          test_date: new Date().toISOString(),
          notes: notes || null,
          tags: tags ? tags.split(",").map((t) => t.trim()) : null,
          confidence: "manual",
          entry_method: "manual",
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create parameter entries
      const parameterEntries = Object.entries(parameters)
        .filter(([_, value]) => value !== "")
        .map(([paramName, value]) => {
          const param = activeTemplate?.parameters.find((p) => p.name === paramName);
          let storedValue = parseFloat(value);
          let storedUnit = param?.unit || "";
          
          // Convert temperature to Fahrenheit for storage if user entered in Celsius
          if (param?.unit === '°F' && units === 'metric') {
            storedValue = celsiusToFahrenheit(storedValue);
            storedUnit = '°F';
          }
          
          // Validate using the stored value
          const validation = validateParameter(paramName, storedValue, aquarium.type);
          
          return {
            test_id: test.id,
            parameter_name: paramName,
            value: storedValue,
            unit: storedUnit,
            status: validation.isValid ? "normal" : "warning",
          };
        });

      if (parameterEntries.length > 0) {
        const { error: paramsError } = await supabase
          .from("test_parameters")
          .insert(parameterEntries);

        if (paramsError) throw paramsError;
      }

      return test;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water-tests"] });
      queryClient.invalidateQueries({ queryKey: ["all-templates"] });
      toast.success("Water test logged successfully");
      setParameters({});
      setNotes("");
      setTags("");
    },
    onError: (error) => {
      toast.error("Failed to log water test: " + error.message);
    },
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setParameters({});
  };

  const handleManageTemplates = () => {
    if (canCreateCustomTemplates) {
      setShowTemplateManager(true);
    } else {
      setShowUpgradeDialog(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTestMutation.mutate();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{aquarium.name}</CardTitle>
              <Badge variant="secondary" className="mt-2">
                {aquarium.type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Parameter Template</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleManageTemplates}>
                  <Settings className="h-4 w-4 mr-1" />
                  Manage Templates
                </Button>
              </div>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange} disabled={templatesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={templatesLoading ? "Loading templates..." : "Select a template..."} />
                </SelectTrigger>
                <SelectContent>
                  {systemTemplates.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>System Templates</SelectLabel>
                      {systemTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {customTemplates.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>My Custom Templates</SelectLabel>
                      {customTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.name}
                            <Badge variant="secondary" className="ml-auto text-xs">Custom</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pre-configured parameter sets for your aquarium type
              </p>
            </div>

            {/* Parameter Inputs */}
            {activeTemplate && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Test Parameters</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeTemplate.parameters.map((param) => {
                    const value = parameters[param.name] || "";
                    
                    // Display unit based on user preference
                    let displayUnit = param.unit;
                    let displayMin = param.range.min;
                    let displayMax = param.range.max;
                    
                    // Convert temperature display if metric and parameter is in Fahrenheit
                    if (param.unit === '°F' && units === 'metric') {
                      displayUnit = getTemperatureUnit(units);
                      displayMin = fahrenheitToCelsius(param.range.min);
                      displayMax = fahrenheitToCelsius(param.range.max);
                    }
                    
                    // For validation, we need to convert input value to storage unit
                    let validationValue = value ? parseFloat(value) : null;
                    if (validationValue && param.unit === '°F' && units === 'metric') {
                      validationValue = celsiusToFahrenheit(validationValue);
                    }
                    
                    const validation = validationValue
                      ? validateParameter(param.name, validationValue, aquarium.type)
                      : null;

                    return (
                      <div key={param.name} className="space-y-2">
                        <Label htmlFor={param.name}>
                          {param.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({displayUnit})
                          </span>
                        </Label>
                        <Input
                          id={param.name}
                          type="number"
                          step="0.01"
                          placeholder={`${displayMin.toFixed(1)} - ${displayMax.toFixed(1)}`}
                          value={value}
                          onChange={(e) =>
                            setParameters({ ...parameters, [param.name]: e.target.value })
                          }
                        />
                        {validation && !validation.isValid && (
                          <div className="flex items-start gap-2 text-xs text-warning">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{validation.hint}</span>
                          </div>
                        )}
                        {validation && validation.isValid && value && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Within normal range</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes & Tags */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any observations or context for this test..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="water change, new livestock, dosing (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!selectedTemplate || createTestMutation.isPending}
                className="flex-1"
              >
                {createTestMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Test
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <CustomTemplateManager
        open={showTemplateManager}
        onOpenChange={setShowTemplateManager}
        aquariumType={aquarium.type}
      />

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              Custom parameter templates are available for Plus and Gold subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-2">Plus Plan</h4>
              <p className="text-sm text-muted-foreground">Up to 10 custom templates</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Gold Plan</h4>
              <p className="text-sm text-muted-foreground">Unlimited custom templates</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Current plan: <span className="font-semibold capitalize">{subscriptionTier || "Free"}</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};