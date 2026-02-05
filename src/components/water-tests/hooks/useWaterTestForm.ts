import { useState, useEffect, useMemo } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getAllTemplates, validateParameter } from '@/lib/waterTestUtils';
import { celsiusToFahrenheit } from '@/lib/unitConversions';
import { useAutoSave } from '@/hooks/useAutoSave';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { queryKeys } from '@/lib/queryKeys';
import { triggerTrendAnalysis } from '@/infrastructure/queries/waterTestAlerts';

interface AiDetectedParam {
  value: number;
  confidence: number;
}

interface UseWaterTestFormProps {
  aquarium: {
    id: string;
    name: string;
    type: string;
  };
}

export function useWaterTestForm({ aquarium }: UseWaterTestFormProps) {
  const { user, units } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { canLogTest, getRemainingTests, limits, tier, getUpgradeSuggestion } = usePlanLimits();

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [aiDetectedParams, setAiDetectedParams] = useState<Record<string, AiDetectedParam>>({});
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const isAtTestLimit = !canLogTest();
  const remainingTests = getRemainingTests();

  // Auto-save draft functionality
  const autoSaveData = useMemo(() => ({ parameters, notes, tags }), [parameters, notes, tags]);

  const { isSaving: isAutoSaving, lastSaved } = useAutoSave({
    data: autoSaveData,
    onSave: async (data) => {
      localStorage.setItem(`water-test-draft-${aquarium.id}`, JSON.stringify(data));
    },
    delay: 5000,
    enabled: Object.keys(parameters).length > 0 || notes.length > 0,
  });

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(`water-test-draft-${aquarium.id}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        setParameters(parsed.parameters || {});
        setNotes(parsed.notes || '');
        setTags(parsed.tags || '');
        toast.success('Draft restored', {
          description: 'Your unsaved changes have been restored',
        });
      }
    } catch (error) {
      console.error('Failed to parse draft:', error);
      // Clear corrupted draft
      try {
        localStorage.removeItem(`water-test-draft-${aquarium.id}`);
      } catch {
        // Ignore if localStorage is unavailable
      }
    }
  }, [aquarium.id]);

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: queryKeys.waterTests.templates(aquarium.type, user?.id),
    queryFn: () => getAllTemplates(aquarium.type, user?.id),
  });

  const activeTemplate = templates?.find((t) => t.id === selectedTemplate);
  const systemTemplates = templates?.filter((t) => !t.isCustom) || [];
  const customTemplates = templates?.filter((t) => t.isCustom) || [];

  // Auto-select template
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      const defaultTemplate = templates.find((t) => 'isDefault' in t && t.isDefault === true);
      const templateToSelect = defaultTemplate || templates[0];
      setSelectedTemplate(templateToSelect.id);

      const templateParamNames = templateToSelect.parameters.map((p) => p.name);
      setParameters((prev) => {
        const filtered = Object.fromEntries(
          Object.entries(prev).filter(([key]) => templateParamNames.includes(key))
        );
        return filtered;
      });
    }
  }, [templates, selectedTemplate]);

  // Get valid parameter entries
  const getValidParameterEntries = () => {
    if (!activeTemplate) return [];

    const templateParamNames = activeTemplate.parameters.map((p) => p.name);

    return Object.entries(parameters)
      .filter(([paramName, value]) => {
        if (!templateParamNames.includes(paramName)) return false;
        if (value === '' || value === undefined || value === null) return false;
        const parsed = parseFloat(value);
        // Validate: not NaN, not negative, and within reasonable bounds
        if (isNaN(parsed) || parsed < 0 || parsed > 100000) return false;
        return true;
      })
      .map(([paramName, value]) => ({
        paramName,
        value: parseFloat(value),
      }));
  };

  const validParameters = getValidParameterEntries();
  const hasValidParameters = validParameters.length > 0;

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (photoFile: File | null) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const validEntries = getValidParameterEntries();
      if (validEntries.length === 0) {
        throw new Error('Please enter at least one valid parameter value');
      }

      let uploadedPhotoUrl = photoUrl;

      // Upload photo if exists
      if (photoFile && !photoUrl) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${authUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
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
        .from('water_tests')
        .insert({
          aquarium_id: aquarium.id,
          user_id: authUser.id,
          test_date: new Date().toISOString(),
          notes: notes || null,
          tags: tags ? tags.split(',').map((t) => t.trim()) : null,
          confidence: photoFile ? 'ai' : 'manual',
          entry_method: photoFile ? 'photo' : 'manual',
          photo_url: uploadedPhotoUrl,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create parameter entries
      const parameterEntries = validEntries.map(({ paramName, value }) => {
        const param = activeTemplate?.parameters.find((p) => p.name === paramName);
        let storedValue = value;
        let storedUnit = param?.unit || '';

        if (param?.unit === '°F' && units === 'metric') {
          storedValue = celsiusToFahrenheit(storedValue);
          storedUnit = '°F';
        }

        const validation = validateParameter(paramName, storedValue, aquarium.type);

        return {
          test_id: test.id,
          parameter_name: paramName,
          value: storedValue,
          unit: storedUnit,
          status: validation.isValid ? 'good' : 'warning',
        };
      });

      if (parameterEntries.length > 0) {
        const { error: paramsError } = await supabase
          .from('test_parameters')
          .insert(parameterEntries);

        if (paramsError) throw paramsError;
      }

      // Track AI corrections
      if (Object.keys(aiDetectedParams).length > 0) {
        const corrections = [];

        for (const [paramName, aiData] of Object.entries(aiDetectedParams)) {
          const userValue = parseFloat(parameters[paramName] || '');

          if (!isNaN(userValue) && userValue !== aiData.value) {
            corrections.push({
              water_test_id: test.id,
              user_id: authUser.id,
              parameter_name: paramName,
              ai_detected_value: aiData.value,
              ai_confidence: aiData.confidence,
              user_corrected_value: userValue,
              correction_delta: Math.abs(userValue - aiData.value),
            });
          }
        }

        if (corrections.length > 0) {
          await supabase.from('photo_analysis_corrections').insert(corrections);
        }
      }

      return { test, savedParams: parameterEntries.length };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.waterTests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.waterTests.templates(aquarium.type, user?.id) });

      localStorage.removeItem(`water-test-draft-${aquarium.id}`);

      toast.success(t('waterTests.testLogged'), {
        description: `${result.savedParams} parameter(s) saved successfully`,
      });

      // Trigger trend analysis in background (non-blocking)
      // Routes to AI or rule-based function based on tier
      if (user) {
        triggerTrendAnalysis(aquarium.id, user.id, limits.hasAITrendAlerts);
        // Invalidate alerts cache after a short delay to allow edge function to complete
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.waterTests.alerts(user.id) });
        }, 2000);
      }

      // Reset form
      setParameters({});
      setNotes('');
      setTags('');
      setPhotoUrl(null);
      setAiDetectedParams({});
      setFeedbackGiven(false);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      let title = 'Failed to save water test';
      let description = errorMessage;

      if (errorMessage.includes('valid parameter')) {
        title = 'No parameters entered';
        description = 'Please enter at least one water test value before saving.';
      } else if (errorMessage.includes('authenticated')) {
        title = 'Authentication required';
        description = 'Please log in to save water tests.';
      }

      toast.error(title, { description });
    },
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setParameters({});
  };

  const handleSubmit = (e: React.FormEvent, photoFile: File | null) => {
    e.preventDefault();

    if (isAtTestLimit) {
      const suggestedPlan = getUpgradeSuggestion();
      toast.error('Monthly test limit reached', {
        description: `Your ${tier} plan allows ${limits.maxTestLogsPerMonth} tests per month. Upgrade to ${suggestedPlan || 'a higher plan'} for more.`,
      });
      return;
    }

    localStorage.removeItem(`water-test-draft-${aquarium.id}`);
    createTestMutation.mutate(photoFile);
  };

  return {
    // State
    selectedTemplate,
    parameters,
    setParameters,
    notes,
    setNotes,
    tags,
    setTags,
    photoUrl,
    setPhotoUrl,
    aiDetectedParams,
    setAiDetectedParams,
    feedbackGiven,
    setFeedbackGiven,
    
    // Computed
    isAtTestLimit,
    remainingTests,
    hasValidParameters,
    activeTemplate,
    systemTemplates,
    customTemplates,
    templatesLoading,
    
    // Auto-save
    isAutoSaving,
    lastSaved,
    
    // Plan limits
    limits,
    tier,
    getUpgradeSuggestion,
    
    // Actions
    handleTemplateChange,
    handleSubmit,
    isPending: createTestMutation.isPending,
  };
}
