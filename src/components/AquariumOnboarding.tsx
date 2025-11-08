import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Waves, ArrowRight, CheckCircle, Calendar } from 'lucide-react';
import logo from '@/assets/logo.png';

const aquariumSchema = z.object({
  name: z.string().trim().min(1, 'Aquarium name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['freshwater', 'saltwater', 'reef', 'planted'], {
    errorMap: () => ({ message: 'Please select an aquarium type' }),
  }),
  volume_gallons: z.number().min(1, 'Volume must be at least 1 gallon').max(10000, 'Volume seems too large'),
  setup_date: z.string().min(1, 'Setup date is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

interface AquariumOnboardingProps {
  onComplete: () => void;
}

export function AquariumOnboarding({ onComplete }: AquariumOnboardingProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [volumeGallons, setVolumeGallons] = useState('');
  const [setupDate, setSetupDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 3;

  const validateStep = () => {
    setErrors({});

    if (step === 1) {
      if (!name.trim()) {
        setErrors({ name: 'Aquarium name is required' });
        return false;
      }
      if (name.length > 100) {
        setErrors({ name: 'Name must be less than 100 characters' });
        return false;
      }
    }

    if (step === 2) {
      if (!type) {
        setErrors({ type: 'Please select an aquarium type' });
        return false;
      }
      const volume = parseFloat(volumeGallons);
      if (!volumeGallons || isNaN(volume) || volume < 1) {
        setErrors({ volume_gallons: 'Please enter a valid volume (at least 1 gallon)' });
        return false;
      }
      if (volume > 10000) {
        setErrors({ volume_gallons: 'Volume seems too large' });
        return false;
      }
    }

    if (step === 3) {
      if (!setupDate) {
        setErrors({ setup_date: 'Setup date is required' });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);

    try {
      // Validate all data
      const validated = aquariumSchema.parse({
        name: name.trim(),
        type,
        volume_gallons: parseFloat(volumeGallons),
        setup_date: setupDate,
        notes: notes.trim(),
      });

      // Create aquarium
      const { error: aquariumError } = await supabase
        .from('aquariums')
        .insert({
          user_id: user?.id,
          name: validated.name,
          type: validated.type,
          volume_gallons: validated.volume_gallons,
          setup_date: validated.setup_date,
          notes: validated.notes || null,
          status: 'active',
        });

      if (aquariumError) throw aquariumError;

      // Mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      toast({
        title: 'Success!',
        description: 'Your aquarium has been set up successfully.',
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating aquarium:', error);
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create aquarium',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <img src={logo} alt="Ally Logo" className="w-12 h-12 object-contain" />
            <div className="text-center">
              <div className="font-bold text-2xl">Welcome to Ally</div>
              <div className="text-xs text-muted-foreground">Let's set up your first aquarium</div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i < step
                      ? 'bg-primary text-primary-foreground'
                      : i === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <CheckCircle className="w-5 h-5" /> : i}
                </div>
                {i < totalSteps && (
                  <div
                    className={`w-12 h-1 mx-2 transition-colors ${
                      i < step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Waves className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">What's your aquarium called?</CardTitle>
                <CardDescription>Give your aquarium a memorable name</CardDescription>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Aquarium Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Living Room Reef Tank"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} disabled={isLoading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Tank Details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <CardTitle className="text-2xl">Tank Details</CardTitle>
                <CardDescription>Tell us about your aquarium setup</CardDescription>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Aquarium Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freshwater">Freshwater</SelectItem>
                    <SelectItem value="saltwater">Saltwater</SelectItem>
                    <SelectItem value="reef">Reef</SelectItem>
                    <SelectItem value="planted">Planted</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume">Tank Volume (gallons)</Label>
                <Input
                  id="volume"
                  type="number"
                  placeholder="e.g., 55"
                  value={volumeGallons}
                  onChange={(e) => setVolumeGallons(e.target.value)}
                  disabled={isLoading}
                  min="1"
                />
                {errors.volume_gallons && (
                  <p className="text-sm text-destructive">{errors.volume_gallons}</p>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(1)} variant="outline" disabled={isLoading}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={isLoading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Setup Date & Notes */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Calendar className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">Almost Done!</CardTitle>
                <CardDescription>When did you set up this aquarium?</CardDescription>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup_date">Setup Date</Label>
                <Input
                  id="setup_date"
                  type="date"
                  value={setupDate}
                  onChange={(e) => setSetupDate(e.target.value)}
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.setup_date && (
                  <p className="text-sm text-destructive">{errors.setup_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about your aquarium..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notes.length}/500
                </p>
                {errors.notes && (
                  <p className="text-sm text-destructive">{errors.notes}</p>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(2)} variant="outline" disabled={isLoading}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      Complete Setup <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
