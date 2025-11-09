import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { PreferencesOnboarding } from '@/components/PreferencesOnboarding';
import { AquariumOnboarding } from '@/components/AquariumOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Droplets, Calendar, AlertCircle, MoreVertical, Pencil, Trash2, MessageSquare, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';
import { AquariumDialog } from '@/components/aquarium/AquariumDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatVolume, UnitSystem } from '@/lib/unitConversions';
import { formatDate } from '@/lib/formatters';

interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  status: string;
  setup_date: string;
  notes: string | null;
}

export default function Dashboard() {
  const { user, units, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [showPreferencesOnboarding, setShowPreferencesOnboarding] = useState(false);
  const [showAquariumOnboarding, setShowAquariumOnboarding] = useState(false);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [upcomingTaskCount, setUpcomingTaskCount] = useState(0);
  const [aquariumDialogOpen, setAquariumDialogOpen] = useState(false);
  const [editingAquarium, setEditingAquarium] = useState<Aquarium | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAquariumId, setDeletingAquariumId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if preferences onboarding needs to be shown
    if (!onboardingCompleted) {
      setShowPreferencesOnboarding(true);
      setLoading(false);
      return;
    }
    
    loadAquariums();
  }, [user, navigate, onboardingCompleted]);

  const loadAquariums = async () => {
    try {
      const { data, error } = await supabase
        .from('aquariums')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAquariums(data || []);
      
      // Show aquarium onboarding if no aquariums exist
      if (!data || data.length === 0) {
        setShowAquariumOnboarding(true);
      }

      // Load upcoming task count
      if (data && data.length > 0) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { count } = await supabase
          .from('maintenance_tasks')
          .select('*', { count: 'exact', head: true })
          .in('aquarium_id', data.map(a => a.id))
          .eq('status', 'pending')
          .lte('due_date', sevenDaysFromNow.toISOString());

        setUpcomingTaskCount(count || 0);
      }
    } catch (error: any) {
      console.error('Error loading aquariums:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.failedToLoad'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesComplete = async () => {
    setShowPreferencesOnboarding(false);
    await loadAquariums();
  };

  const handleAquariumOnboardingComplete = async () => {
    setShowAquariumOnboarding(false);
    await loadAquariums();
  };

  const handleCreateAquarium = () => {
    setEditingAquarium(undefined);
    setAquariumDialogOpen(true);
  };

  const handleEditAquarium = (aquarium: Aquarium) => {
    setEditingAquarium(aquarium);
    setAquariumDialogOpen(true);
  };

  const handleDeleteClick = (aquariumId: string) => {
    setDeletingAquariumId(aquariumId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAquariumId) return;

    try {
      const { error } = await supabase
        .from("aquariums")
        .delete()
        .eq("id", deletingAquariumId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dashboard.aquariumDeleted'),
      });

      await loadAquariums();
    } catch (error) {
      console.error("Error deleting aquarium:", error);
      toast({
        title: t('common.error'),
        description: t('dashboard.failedToDelete'),
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingAquariumId(null);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show preferences onboarding if not completed
  if (showPreferencesOnboarding && user) {
    return (
      <PreferencesOnboarding
        userId={user.id}
        onComplete={handlePreferencesComplete}
      />
    );
  }

  // Show aquarium onboarding if no aquariums
  if (showAquariumOnboarding && user) {
    return (
      <AquariumOnboarding
        onComplete={handleAquariumOnboardingComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.totalAquariums')}</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aquariums.length}</div>
              <p className="text-xs text-muted-foreground">
                {aquariums.filter(a => a.status === 'active').length} {t('dashboard.active')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.totalVolume')}</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatVolume(aquariums.reduce((sum, a) => sum + (a.volume_gallons || 0), 0), units)}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.combinedCapacity')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.upcomingTasks')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingTaskCount}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.tasksDueThisWeek')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chat with Ally CTA */}
        <Card className="mb-8 bg-gradient-primary border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-foreground mb-1">
                    {t('dashboard.chatWithAlly')}
                  </h3>
                  <p className="text-sm text-primary-foreground/80">
                    {t('dashboard.chatDescription')}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/chat')}
                variant="secondary"
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {t('dashboard.startChat')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Aquariums Grid */}
        {aquariums.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.noAquariumsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('dashboard.getStartedMessage')}
            </p>
            <Button onClick={handleCreateAquarium}>
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.addAquarium')}
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">{t('dashboard.yourAquariums')}</h2>
              <Button onClick={handleCreateAquarium}>
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.addAquarium')}
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aquariums.map((aquarium) => (
                <Card 
                  key={aquarium.id} 
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/aquarium/${aquarium.id}`)}
                      >
                        <CardTitle>{aquarium.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {aquarium.type} • {formatVolume(aquarium.volume_gallons, units)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={aquarium.status === 'active' ? 'default' : 'secondary'}>
                          {aquarium.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAquarium(aquarium)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(aquarium.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent onClick={() => navigate(`/aquarium/${aquarium.id}`)} className="cursor-pointer">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('dashboard.setupDate')}</span>
                        <span className="font-medium">
                          {formatDate(aquarium.setup_date, 'PP')}
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

      <AquariumDialog
        open={aquariumDialogOpen}
        onOpenChange={setAquariumDialogOpen}
        onSuccess={loadAquariums}
        aquarium={editingAquarium}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.deleteAquarium')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
