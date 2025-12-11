import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFeatureRateLimit } from '@/hooks/useFeatureRateLimit';
import { measurePerformance } from '@/lib/performanceMonitor';
import { FeatureArea } from '@/lib/sentry';
import { compressImage, validateImageFile, formatFileSize } from '@/lib/imageCompression';

interface AiDetectedParam {
  value: number;
  confidence: number;
}

interface UsePhotoAnalysisProps {
  aquariumType: string;
  onParametersDetected: (
    params: Record<string, string>,
    aiParams: Record<string, AiDetectedParam>
  ) => void;
}

export function usePhotoAnalysis({ aquariumType, onParametersDetected }: UsePhotoAnalysisProps) {
  const rateLimit = useFeatureRateLimit('water-test-photo');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid image file');
      return;
    }

    try {
      toast.info('Compressing image...', {
        description: `Original size: ${formatFileSize(file.size)}`,
      });

      const compressedFile = await compressImage(file, 1, 1920, 0.8);

      const savedBytes = file.size - compressedFile.size;
      if (savedBytes > 0) {
        toast.success('Image compressed', {
          description: `Reduced by ${formatFileSize(savedBytes)} (${Math.round((savedBytes / file.size) * 100)}%)`,
        });
      }

      setPhotoFile(compressedFile);

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
            aquariumType: aquariumType,
          },
        }),
        FeatureArea.WATER_TESTS
      );

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysisResult(data);

      if (data.parameters && data.parameters.length > 0) {
        const newParams: Record<string, string> = {};
        const detectedParams: Record<string, AiDetectedParam> = {};
        
        data.parameters.forEach((param: any) => {
          if (param.value != null) {
            newParams[param.name] = param.value.toString();
            detectedParams[param.name] = {
              value: param.value,
              confidence: param.confidence ?? 0.5,
            };
          }
        });
        
        onParametersDetected(newParams, detectedParams);

        toast.success(`Detected ${data.parameters.length} parameters from photo`, {
          description: 'Review and edit values before saving',
        });
      } else {
        toast.warning('No parameters detected', {
          description: 'Please enter values manually',
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
    setAnalysisResult(null);
  };

  const handlePhotoFeedback = async (rating: 'positive' | 'negative') => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      await supabase.from('ai_feedback').insert({
        user_id: authUser.id,
        feature: 'photo_analysis',
        rating,
        context: {
          aquariumType,
          detectedParameters: analysisResult?.parameters || [],
          photoAnalyzed: true,
        },
      });

      toast.success(rating === 'positive' ? "Thanks for the feedback!" : "Thanks! We'll work to improve.");
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return {
    photoFile,
    photoPreview,
    analyzingPhoto,
    analysisResult,
    handlePhotoSelect,
    handleAnalyzePhoto,
    handleRemovePhoto,
    handlePhotoFeedback,
  };
}
