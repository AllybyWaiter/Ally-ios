import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage, validateImageFile, formatFileSize } from '@/lib/imageCompression';
import { logger } from '@/lib/logger';

export interface SpeciesMatch {
  common_name: string;
  scientific_name: string;
  category: 'fish' | 'invertebrate' | 'coral' | 'plant';
  confidence: number;
  water_type: 'freshwater' | 'saltwater' | 'brackish';
  care_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  temperament?: 'peaceful' | 'semi-aggressive' | 'aggressive';
  adult_size_inches?: number;
  min_tank_gallons?: number;
  diet?: string;
  notes?: string;
}

export interface SpeciesIdentificationResult {
  identified: boolean;
  top_matches: SpeciesMatch[];
  unable_reason?: string;
}

export function useSpeciesIdentification() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<SpeciesIdentificationResult | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid image file');
      return;
    }

    // Reset previous result
    setResult(null);

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

      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMountedRef.current && !reader.error && reader.result) {
          setPhotoPreview(reader.result as string);
        }
      };
      reader.onerror = () => {
        logger.error('FileReader error reading compressed file');
        if (isMountedRef.current) {
          toast.error('Failed to read image file');
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      logger.error('Compression error:', error);
      toast.error('Failed to process image');
    }
  }, []);

  const handleIdentify = useCallback(async () => {
    if (!photoPreview) return;

    setIsIdentifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('identify-species-photo', {
        body: { imageUrl: photoPreview },
      });

      if (error) {
        let message = error.message || 'Unable to identify species';
        try {
          if (error.context) {
            if (typeof error.context.json === 'function' && !error.context.bodyUsed) {
              const body = await error.context.json();
              message = body?.error || message;
            } else if (error.context?.error) {
              message = error.context.error;
            }
          }
        } catch (contextError) {
          logger.warn('Failed to read FunctionsHttpError context:', contextError);
        }
        throw new Error(message);
      }

      if (!isMountedRef.current) return;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as SpeciesIdentificationResult);

      if (data.identified && data.top_matches?.length > 0) {
        const topMatch = data.top_matches[0];
        const confidence = Math.round(topMatch.confidence * 100);
        toast.success(`Identified: ${topMatch.common_name}`, {
          description: `${confidence}% confidence${data.top_matches.length > 1 ? ` + ${data.top_matches.length - 1} more match${data.top_matches.length > 2 ? 'es' : ''}` : ''}`,
        });
      } else {
        toast.warning('Could not identify species', {
          description: data.unable_reason || 'Try a clearer photo with the species in focus',
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error identifying species:', error);

      const errorMessage = error.message || 'Unable to identify species';
      const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('too many requests');

      if (isRateLimitError) {
        toast.error('AI identification temporarily unavailable', {
          description: 'Too many requests. Please try again in a few minutes.',
        });
      } else {
        toast.error('Failed to identify species', {
          description: errorMessage,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsIdentifying(false);
      }
    }
  }, [photoPreview]);

  const handleRemovePhoto = useCallback(() => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setResult(null);
  }, [photoPreview]);

  const reset = useCallback(() => {
    handleRemovePhoto();
    setIsIdentifying(false);
  }, [handleRemovePhoto]);

  return {
    photoPreview,
    isIdentifying,
    result,
    handlePhotoSelect,
    handleIdentify,
    handleRemovePhoto,
    reset,
  };
}
