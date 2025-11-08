import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Droplets, Calendar, AlertCircle } from 'lucide-react';
import { AquariumOnboarding } from '@/components/AquariumOnboarding';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';

interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  status: string;
  setup_date: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkOnboardingStatus();
  }, [user, navigate]);

  const checkOnboardingStatus = async () => {
    try {
      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.onboarding_completed) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      // Load aquariums
      await loadAquariums();
    } catch (error: any) {
      console.error('Error checking onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAquariums = async () => {
    try {
      const { data, error } = await supabase
        .from('aquariums')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAquariums(data || []);
    } catch (error: any) {
      console.error('Error loading aquariums:', error);
      toast({
        title: 'Error',
        description: 'Failed to load aquariums',
        variant: 'destructive',
      });
    }
  };

  const handleOnboardingComplete = async () => {
    setNeedsOnboarding(false);
    await loadAquariums();
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <AquariumOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Aquariums</h1>
          <p className="text-muted-foreground">Manage your aquarium collection</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aquariums</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aquariums.length}</div>
              <p className="text-xs text-muted-foreground">
                {aquariums.filter(a => a.status === 'active').length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {aquariums.reduce((sum, a) => sum + (a.volume_gallons || 0), 0)} gal
              </div>
              <p className="text-xs text-muted-foreground">Combined capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Tasks due this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Aquariums Grid */}
        {aquariums.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No aquariums yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first aquarium
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Aquarium
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Aquariums</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Aquarium
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aquariums.map((aquarium) => (
                <Card 
                  key={aquarium.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/aquarium/${aquarium.id}`)}
                >
                  <CardHeader>
                    <CardTitle>{aquarium.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {aquarium.type} • {aquarium.volume_gallons} gallons
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize font-medium">{aquarium.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Setup Date:</span>
                        <span className="font-medium">
                          {new Date(aquarium.setup_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
