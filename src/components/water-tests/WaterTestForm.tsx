import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getParameterTemplates, validateParameter, type ParameterTemplate } from "@/lib/waterTestUtils";

interface WaterTestFormProps {
  aquarium: {
    id: string;
    name: string;
    type: string;
  };
}

export const WaterTestForm = ({ aquarium }: WaterTestFormProps) => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  const templates = getParameterTemplates(aquarium.type);
  const activeTemplate = templates.find((t) => t.id === selectedTemplate);

  const createTestMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create water test entry
      const { data: test, error: testError } = await supabase
        .from("water_tests")
        .insert({
          aquarium_id: aquarium.id,
          user_id: user.id,
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
          const validation = validateParameter(paramName, parseFloat(value), aquarium.type);
          
          return {
            test_id: test.id,
            parameter_name: paramName,
            value: parseFloat(value),
            unit: param?.unit || "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTestMutation.mutate();
  };

  return (
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
          <div>
            <Label>Parameter Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
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
                  const validation = value
                    ? validateParameter(param.name, parseFloat(value), aquarium.type)
                    : null;

                  return (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={param.name}>
                        {param.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({param.unit})
                        </span>
                      </Label>
                      <Input
                        id={param.name}
                        type="number"
                        step="0.01"
                        placeholder={`${param.range.min} - ${param.range.max}`}
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
  );
};
