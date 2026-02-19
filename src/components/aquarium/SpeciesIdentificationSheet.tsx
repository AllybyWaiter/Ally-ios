import { useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, X, Plus, Fish, Bug, Flower2, Leaf, ChevronRight } from 'lucide-react';
import { useSpeciesIdentification, type SpeciesMatch } from '@/hooks/useSpeciesIdentification';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';

interface SpeciesIdentificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMatch: (match: SpeciesMatch) => void;
}

const categoryIcon = (category: string) => {
  switch (category) {
    case 'fish': return <Fish className="h-4 w-4" />;
    case 'invertebrate': return <Bug className="h-4 w-4" />;
    case 'coral': return <Flower2 className="h-4 w-4" />;
    case 'plant': return <Leaf className="h-4 w-4" />;
    default: return <Fish className="h-4 w-4" />;
  }
};

const confidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'bg-green-500/10 text-green-700 border-green-200';
  if (confidence >= 0.5) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
  return 'bg-red-500/10 text-red-700 border-red-200';
};

const careLevelColor = (level: string): string => {
  switch (level) {
    case 'beginner': return 'bg-green-500/10 text-green-700';
    case 'intermediate': return 'bg-blue-500/10 text-blue-700';
    case 'advanced': return 'bg-orange-500/10 text-orange-700';
    case 'expert': return 'bg-red-500/10 text-red-700';
    default: return 'bg-muted text-muted-foreground';
  }
};

const PAID_TIERS = ['plus', 'gold', 'business', 'enterprise'];

export function SpeciesIdentificationSheet({ open, onOpenChange, onSelectMatch }: SpeciesIdentificationSheetProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tier, loading: planLoading } = usePlanLimits();
  const {
    photoPreview,
    isIdentifying,
    result,
    handlePhotoSelect,
    handleIdentify,
    handleRemovePhoto,
    reset,
  } = useSpeciesIdentification();

  const hasPaidPlan = PAID_TIERS.includes(tier || '');

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  };

  const handleSelectMatch = (match: SpeciesMatch) => {
    onSelectMatch(match);
    handleClose(false);
  };

  // Show upgrade prompt for free/basic users
  if (!planLoading && !hasPaidPlan) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader className="text-center pb-4">
            <SheetTitle className="flex items-center justify-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              AI Species Identification
            </SheetTitle>
            <SheetDescription>
              Identify fish, corals, invertebrates, and plants from photos
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              AI species identification is available on Plus and above. Upgrade to identify species from photos.
            </p>
            <Button
              onClick={() => { onOpenChange(false); navigate('/settings?tab=subscription'); }}
              className="rounded-full gap-2"
            >
              View Plans
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-center pb-2">
          <SheetTitle className="flex items-center justify-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Identify Species
          </SheetTitle>
          <SheetDescription>
            Take or upload a photo to identify aquatic species
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Photo input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {!photoPreview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Tap to take a photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">or choose from gallery</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Photo preview */}
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={photoPreview}
                  alt="Species to identify"
                  className="w-full max-h-[200px] object-cover"
                />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Identify button */}
              {!result && (
                <Button
                  onClick={handleIdentify}
                  disabled={isIdentifying}
                  className="w-full rounded-full gap-2"
                >
                  {isIdentifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Identifying...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Identify Species
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {result.identified && result.top_matches.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    {result.top_matches.length} match{result.top_matches.length !== 1 ? 'es' : ''} found
                  </p>
                  <div className="space-y-2">
                    {result.top_matches.map((match, index) => (
                      <div
                        key={`${match.scientific_name}-${index}`}
                        className="border border-border/50 rounded-xl p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0">
                              {categoryIcon(match.category)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{match.common_name}</p>
                              <p className="text-xs text-muted-foreground italic truncate">{match.scientific_name}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-xs ${confidenceColor(match.confidence)}`}>
                            {Math.round(match.confidence * 100)}%
                          </Badge>
                        </div>

                        {/* Care details */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className={`text-[10px] ${careLevelColor(match.care_level)}`}>
                            {match.care_level}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {match.water_type}
                          </Badge>
                          {match.temperament && (
                            <Badge variant="secondary" className="text-[10px]">
                              {match.temperament}
                            </Badge>
                          )}
                          {match.adult_size_inches && (
                            <Badge variant="secondary" className="text-[10px]">
                              {match.adult_size_inches}"
                            </Badge>
                          )}
                          {match.min_tank_gallons && (
                            <Badge variant="secondary" className="text-[10px]">
                              {match.min_tank_gallons}gal min
                            </Badge>
                          )}
                        </div>

                        {match.notes && (
                          <p className="text-xs text-muted-foreground">{match.notes}</p>
                        )}

                        {/* Add to tank button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectMatch(match)}
                          className="w-full rounded-full gap-1.5 text-xs h-8"
                        >
                          <Plus className="h-3 w-3" />
                          Add to Tank
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    {result.unable_reason || 'Could not identify species. Try a clearer photo with the species in focus.'}
                  </p>
                </div>
              )}

              {/* Try again button */}
              <Button
                variant="outline"
                onClick={handleRemovePhoto}
                className="w-full rounded-full gap-2"
              >
                <Camera className="h-4 w-4" />
                Try Another Photo
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
