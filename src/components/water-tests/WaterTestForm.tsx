import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { formatDecimal } from '@/lib/formatters';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, Settings, Camera, Upload, X, Sparkles, Save } from "lucide-react";
import { getAllTemplates, validateParameter, type ParameterTemplate } from "@/lib/waterTestUtils";
import { CustomTemplateManager } from "./CustomTemplateManager";
import { 
  celsiusToFahrenheit, 
  fahrenheitToCelsius, 
  getTemperatureUnit 
} from "@/lib/unitConversions";
import { compressImage, validateImageFile, formatFileSize } from "@/lib/imageCompression";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFeatureRateLimit } from "@/hooks/useFeatureRateLimit";
import { measurePerformance } from "@/lib/performanceMonitor";
import { FeatureArea } from "@/lib/sentry";

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
  const { t } = useTranslation();
  const rateLimit = useFeatureRateLimit('water-test-photo');
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Auto-save draft functionality
  const autoSaveData = {
    parameters,
    notes,
    tags,
  };

  const { isSaving: isAutoSaving, lastSaved } = useAutoSave({
    data: autoSaveData,
    onSave: async (data) => {
      // Save to localStorage as draft
      localStorage.setItem(`water-test-draft-${aquarium.id}`, JSON.stringify(data));
    },
    delay: 5000, // Auto-save every 5 seconds
    enabled: Object.keys(parameters).length > 0 || notes.length > 0,
  });

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`water-test-draft-${aquarium.id}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setParameters(parsed.parameters || {});
        setNotes(parsed.notes || "");
        setTags(parsed.tags || "");
        toast.success("Draft restored", {
          description: "Your unsaved changes have been restored",
        });
      } catch (error) {
        console.error("Failed to parse draft:", error);
      }
    }
  }, [aquarium.id]);

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

      let uploadedPhotoUrl = photoUrl;

      // Upload photo if exists
      if (photoFile && !photoUrl) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${authUser.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('water-test-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('water-test-photos')
          .getPublicUrl(fileName);

        uploadedPhotoUrl = publicUrl;
      }

      // Create water test entry
      const { data: test, error: testError } = await supabase
        .from("water_tests")
        .insert({
          aquarium_id: aquarium.id,
          user_id: authUser.id,
          test_date: new Date().toISOString(),
          notes: notes || null,
          tags: tags ? tags.split(",").map((t) => t.trim()) : null,
          confidence: photoFile ? "ai" : "manual",
          entry_method: photoFile ? "photo" : "manual",
          photo_url: uploadedPhotoUrl,
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
      
      // Clear draft on successful save
      localStorage.removeItem(`water-test-draft-${aquarium.id}`);
      
      toast.success(t('waterTests.testLogged'), {
        description: 'Your water test parameters have been successfully recorded',
      });
      
      setParameters({});
      setNotes("");
      setTags("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoUrl(null);
      setAnalysisResult(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to save water test', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => createTestMutation.mutate(),
        },
      });
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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid image file');
      return;
    }

    try {
      // Show initial file size
      toast.info('Compressing image...', {
        description: `Original size: ${formatFileSize(file.size)}`,
      });

      // Compress image
      const compressedFile = await compressImage(file, 1, 1920, 0.8);

      // Show compression result
      const savedBytes = file.size - compressedFile.size;
      if (savedBytes > 0) {
        toast.success('Image compressed', {
          description: `Reduced by ${formatFileSize(savedBytes)} (${Math.round((savedBytes / file.size) * 100)}%)`,
        });
      }

      setPhotoFile(compressedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to process image', {
        description: 'Using original file instead',
      });

      // Fall back to original file
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!photoPreview) return;

    // Check rate limit
    const canProceed = await rateLimit.checkLimit();
    if (!canProceed) {
      return;
    }

    setAnalyzingPhoto(true);
    try {
      const { data, error } = await measurePerformance(
        'water-test-photo-analysis',
        () => supabase.functions.invoke('analyze-water-test-photo', {
          body: { 
            imageUrl: photoPreview,
            aquariumType: aquarium.type 
          }
        }),
        FeatureArea.WATER_TESTS
      );

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysisResult(data);

      // Auto-fill parameters from analysis
      if (data.parameters && data.parameters.length > 0) {
        const newParams: Record<string, string> = {};
        data.parameters.forEach((param: any) => {
          if (param.value) {
            newParams[param.name] = param.value.toString();
          }
        });
        setParameters(newParams);
        
        toast.success(`Detected ${data.parameters.length} parameters from photo`, {
          description: 'Review and edit values before saving'
        });
      } else {
        toast.warning('No parameters detected', {
          description: 'Please enter values manually'
        });
      }
    } catch (error: any) {
      console.error('Error analyzing photo:', error);
      
      const errorMessage = error.message || 'Unable to analyze the photo';
      const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') || 
                               errorMessage.toLowerCase().includes('too many requests');
      const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                             errorMessage.toLowerCase().includes('connection');
      
      if (isRateLimitError) {
        toast.error('AI analysis temporarily unavailable', {
          description: 'Too many requests. Please try again in a few minutes.',
        });
      } else if (isNetworkError) {
        toast.error('Network error', {
          description: 'Please check your internet connection and try again.',
        });
      } else {
        toast.error('Failed to analyze photo', {
          description: errorMessage,
          action: {
            label: 'Retry',
            onClick: handleAnalyzePhoto,
          },
        });
      }
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUrl(null);
    setAnalysisResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear draft on successful submit
    localStorage.removeItem(`water-test-draft-${aquarium.id}`);
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
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4 animate-pulse" />
                <span>Saving draft...</span>
              </div>
            )}
            {!isAutoSaving && lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Draft saved {new Date(lastSaved).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold" id="photo-analysis-heading">AI Photo Analysis</h3>
                <Badge variant="secondary" className="ml-auto" aria-label="Powered by Google Gemini AI">
                  <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                  Powered by Gemini
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground" id="photo-analysis-description">
                Upload a photo of your test strip or liquid test results for automatic analysis
              </p>

              {!photoPreview ? (
                <div className="flex gap-2" role="group" aria-labelledby="photo-analysis-heading">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      aria-label="Choose photo from device"
                    />
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                        Choose Photo
                      </span>
                    </Button>
                  </label>
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      aria-label="Take photo with camera"
                    />
                    <Button type="button" className="w-full" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" aria-hidden="true" />
                        Take Photo
                      </span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border">
                    <img 
                      src={photoPreview} 
                      alt="Water test" 
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {!analysisResult ? (
                    <Button
                      type="button"
                      onClick={handleAnalyzePhoto}
                      disabled={analyzingPhoto}
                      className="w-full"
                    >
                      {analyzingPhoto ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze Photo
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2 p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Analysis Complete</span>
                      </div>
                      {analysisResult.notes && (
                        <p className="text-xs text-muted-foreground">{analysisResult.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.parameters?.map((param: any, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {param.name}: {param.value} {param.unit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('waterTests.parameterTemplate')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleManageTemplates}>
                  <Settings className="h-4 w-4 mr-1" />
                  {t('waterTests.manageTemplates')}
                </Button>
              </div>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange} disabled={templatesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={templatesLoading ? t('common.loading') : t('waterTests.parameterTemplate')} />
                </SelectTrigger>
                <SelectContent>
                  {systemTemplates.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t('waterTests.systemTemplates')}</SelectLabel>
                      {systemTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {customTemplates.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t('waterTests.myCustomTemplates')}</SelectLabel>
                      {customTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.name}
                            <Badge variant="secondary" className="ml-auto text-xs">{t('waterTests.custom')}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('waterTests.templateDescription')}
              </p>
            </div>

            {/* Parameter Inputs */}
            {activeTemplate && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('waterTests.testParameters')}</h3>
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
                          placeholder={`${formatDecimal(displayMin, 1)} - ${formatDecimal(displayMax, 1)}`}
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
                            <span>{t('waterTests.withinNormalRange')}</span>
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
                <Label htmlFor="notes">{t('aquarium.notes')} ({t('common.optional')})</Label>
                <Textarea
                  id="notes"
                  placeholder={t('aquarium.notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags ({t('common.optional')})</Label>
                <Input
                  id="tags"
                  placeholder={t('waterTests.tagsPlaceholder')}
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
                {t('waterTests.saveTest')}
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
            <DialogTitle>{t('waterTests.upgradeTitle')}</DialogTitle>
            <DialogDescription>
              {t('waterTests.upgradeDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-2">{t('waterTests.plusPlan')}</h4>
              <p className="text-sm text-muted-foreground">{t('waterTests.plusDescription')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t('waterTests.goldPlan')}</h4>
              <p className="text-sm text-muted-foreground">{t('waterTests.goldDescription')}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('waterTests.currentPlan')} <span className="font-semibold capitalize">{subscriptionTier || "Free"}</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};