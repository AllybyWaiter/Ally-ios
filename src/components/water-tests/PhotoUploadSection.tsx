import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Sparkles, Loader2, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';

interface PhotoUploadSectionProps {
  photoPreview: string | null;
  analyzingPhoto: boolean;
  analysisResult: any;
  feedbackGiven: boolean;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzePhoto: () => void;
  onRemovePhoto: () => void;
  onPhotoFeedback: (rating: 'positive' | 'negative') => void;
}

export function PhotoUploadSection({
  photoPreview,
  analyzingPhoto,
  analysisResult,
  feedbackGiven,
  onPhotoSelect,
  onAnalyzePhoto,
  onRemovePhoto,
  onPhotoFeedback,
}: PhotoUploadSectionProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="font-semibold" id="photo-analysis-heading">AI Photo Analysis</h3>
        <Badge variant="secondary" className="ml-auto" aria-label="AI-Powered analysis">
          <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
          AI-Powered
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
              onChange={onPhotoSelect}
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
              onChange={onPhotoSelect}
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
              onClick={onRemovePhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!analysisResult ? (
            <Button
              type="button"
              onClick={onAnalyzePhoto}
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
            <div className="space-y-3 p-3 bg-background rounded-lg border">
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

              {!feedbackGiven ? (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Was this analysis accurate?</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 hover:text-green-500 hover:bg-green-500/10"
                      onClick={() => onPhotoFeedback('positive')}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 hover:text-amber-500 hover:bg-amber-500/10"
                      onClick={() => onPhotoFeedback('negative')}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      No
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Thanks for your feedback!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
