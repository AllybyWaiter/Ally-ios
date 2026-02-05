import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, CheckCircle2, Settings, Save, Lock, Camera, Waves, PenLine } from "lucide-react";
import { CustomTemplateManager } from "./CustomTemplateManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWaterTestForm, usePhotoAnalysis } from "./hooks";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { WaterWandSection } from "./WaterWandSection";
import { ParameterInputGrid } from "./ParameterInputGrid";
import { formatWaterBodyType } from "@/lib/waterBodyUtils";

interface WaterTestFormProps {
  aquarium: {
    id: string;
    name: string;
    type: string;
  };
}

type EntryMethod = 'photo' | 'wand' | 'manual';

export const WaterTestForm = ({ aquarium }: WaterTestFormProps) => {
  const { canCreateCustomTemplates, units } = useAuth();
  const { t } = useTranslation();
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [entryMethod, setEntryMethod] = useState<EntryMethod>('photo');

  // Use form hook for all form state and logic
  const {
    selectedTemplate,
    parameters,
    setParameters,
    notes,
    setNotes,
    tags,
    setTags,
    setAiDetectedParams,
    setFeedbackGiven,
    templatesLoading,
    activeTemplate,
    systemTemplates,
    customTemplates,
    hasValidParameters,
    isAutoSaving,
    lastSaved,
    isAtTestLimit,
    remainingTests,
    limits,
    getUpgradeSuggestion,
    handleTemplateChange,
    handleSubmit,
    isPending,
  } = useWaterTestForm({ aquarium });

  // Use photo analysis hook
  const {
    photoFile,
    photoPreview,
    analyzingPhoto,
    analysisResult,
    handlePhotoSelect,
    handleAnalyzePhoto,
    handleRemovePhoto,
    handlePhotoFeedback,
  } = usePhotoAnalysis({
    aquariumType: aquarium.type,
    onParametersDetected: (detectedParams, detectedAiParams) => {
      setParameters(detectedParams);
      setAiDetectedParams(detectedAiParams);
      setFeedbackGiven(false);
    },
  });

  const handleManageTemplates = () => {
    if (canCreateCustomTemplates) {
      setShowTemplateManager(true);
    } else {
      setShowUpgradeDialog(true);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e, photoFile);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{aquarium.name}</CardTitle>
              <Badge variant="secondary" className="mt-2">
                {formatWaterBodyType(aquarium.type, t)}
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
          {/* Test Limit Warning */}
          {isAtTestLimit && (
            <Alert variant="destructive" className="mb-6">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You've reached your monthly limit of {limits.maxTestLogsPerMonth} water tests. 
                Upgrade to {getUpgradeSuggestion() || 'a higher plan'} for unlimited tests.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Remaining Tests Info */}
          {!isAtTestLimit && limits.maxTestLogsPerMonth !== null && (
            <div className="mb-4 text-sm text-muted-foreground">
              {remainingTests} of {limits.maxTestLogsPerMonth} tests remaining this month
            </div>
          )}

          <form onSubmit={onFormSubmit} className="space-y-6">
            {/* Entry Method Tabs */}
            <Tabs value={entryMethod} onValueChange={(v) => setEntryMethod(v as EntryMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="photo" className="gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Photo</span>
                </TabsTrigger>
                <TabsTrigger value="wand" className="gap-2">
                  <Waves className="h-4 w-4" />
                  <span className="hidden sm:inline">Wand</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <PenLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Manual</span>
                </TabsTrigger>
              </TabsList>

              {/* Photo Analysis Tab */}
              <TabsContent value="photo" className="mt-0">
                <PhotoUploadSection
                  photoPreview={photoPreview}
                  analyzingPhoto={analyzingPhoto}
                  analysisResult={analysisResult}
                  feedbackGiven={false}
                  onPhotoSelect={handlePhotoSelect}
                  onAnalyzePhoto={() => {
                    if (!photoFile) return;
                    handleAnalyzePhoto();
                  }}
                  onRemovePhoto={handleRemovePhoto}
                  onPhotoFeedback={handlePhotoFeedback}
                />
              </TabsContent>

              {/* BLE Wand Tab */}
              <TabsContent value="wand" className="mt-0">
                <WaterWandSection
                  units={units}
                  onParametersDetected={(detectedParams) => {
                    setParameters(prev => ({ ...prev, ...detectedParams }));
                  }}
                />
              </TabsContent>

              {/* Manual Entry Tab */}
              <TabsContent value="manual" className="mt-0">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-slate-500/5 to-slate-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <PenLine className="h-5 w-5 text-slate-500" />
                    <h3 className="font-semibold">Manual Entry</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your water test results manually using the parameter fields below.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

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
              <ParameterInputGrid
                template={activeTemplate}
                parameters={parameters}
                onParameterChange={(name, value) => setParameters({ ...parameters, [name]: value })}
                aquariumType={aquarium.type}
                units={units}
              />
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
                  maxLength={5000}
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

            {/* Validation message */}
            {!hasValidParameters && activeTemplate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Enter at least one parameter value to save your test</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!selectedTemplate || !hasValidParameters || isPending || isAtTestLimit}
                className="flex-1"
              >
                {isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isAtTestLimit && <Lock className="w-4 h-4 mr-2" />}
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
              {t('waterTests.visitPricingPage', { defaultValue: 'Visit the Pricing page to compare plans and upgrade.' })}
            </p>
            <Button asChild className="w-full">
              <Link to="/pricing" onClick={() => setShowUpgradeDialog(false)}>
                {t('common.viewPricing', { defaultValue: 'View Pricing' })}
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
