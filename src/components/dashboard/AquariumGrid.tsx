import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Plus, AlertCircle, MoreVertical, Pencil, Trash2, Lock, Activity } from 'lucide-react';
import { formatVolume, UnitSystem } from '@/lib/unitConversions';
import { formatDate } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLongPress } from '@/hooks/useLongPress';
import { QuickHealthView } from '@/components/aquarium/QuickHealthView';
import { useAquariumHealthScore } from '@/hooks/useAquariumHealthScore';

interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume_gallons: number | null;
  status: string;
  setup_date: string | null;
  notes: string | null;
}

type WaterBodyMix = 'aquariums' | 'pools' | 'mixed';

interface AquariumGridProps {
  aquariums: Aquarium[];
  units: UnitSystem;
  canCreate: boolean;
  maxAquariums: number;
  limitsLoading: boolean;
  waterBodyMix: WaterBodyMix;
  onCreateAquarium: () => void;
  onEditAquarium: (aquarium: Aquarium) => void;
  onDeleteAquarium: (aquariumId: string) => void;
}

// Health indicator badge component
function HealthIndicator({ aquariumId }: { aquariumId: string }) {
  const health = useAquariumHealthScore(aquariumId);
  
  if (health.isLoading) {
    return (
      <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
    );
  }

  const hasAlerts = health.alerts > 0 || health.overdueTasks > 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`w-3 h-3 rounded-full transition-all ${hasAlerts ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: health.color }}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p>{health.label} ({health.score}%)</p>
        {hasAlerts && <p className="text-orange-400">Tap & hold for details</p>}
      </TooltipContent>
    </Tooltip>
  );
}

// Individual aquarium card with hover/long-press health view
interface AquariumCardProps {
  aquarium: Aquarium;
  index: number;
  units: UnitSystem;
  onEdit: (aquarium: Aquarium) => void;
  onDelete: (aquariumId: string) => void;
  t: (key: string) => string;
}

const AquariumCard = memo(function AquariumCard({ 
  aquarium, 
  index, 
  units, 
  onEdit, 
  onDelete, 
  t 
}: AquariumCardProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLongPress = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const handlePress = useCallback(() => {
    navigate(`/aquarium/${aquarium.id}`);
  }, [navigate, aquarium.id]);

  const longPressHandlers = useLongPress({
    threshold: 500,
    onLongPress: handleLongPress,
    onPress: isMobile ? handlePress : undefined,
  });

  const cardContent = (
    <Card 
      className="glass-card animate-fade-up opacity-0 relative"
      style={{ animationDelay: `${(index + 3) * 100}ms` }}
      onMouseEnter={() => {
        import('@/pages/AquariumDetail').catch((error) => {
          console.debug('Failed to preload AquariumDetail:', error);
        });
      }}
      {...(isMobile ? longPressHandlers : {})}
    >
      {/* Health indicator badge */}
      <TooltipProvider>
        <div className="absolute top-3 right-3 z-10">
          <HealthIndicator aquariumId={aquarium.id} />
        </div>
      </TooltipProvider>

      <CardHeader className="pr-8">
        <div className="flex justify-between items-start">
          <div 
            className="flex-1 cursor-pointer"
            onClick={isMobile ? undefined : () => navigate(`/aquarium/${aquarium.id}`)}
          >
            <CardTitle className="flex items-center gap-2">
              {aquarium.name}
            </CardTitle>
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
                <DropdownMenuItem onClick={() => onEdit(aquarium)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(aquarium.id)}
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
      <CardContent 
        onClick={isMobile ? undefined : () => navigate(`/aquarium/${aquarium.id}`)} 
        className="cursor-pointer"
      >
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
  );

  // Mobile: Use Sheet for long-press
  if (isMobile) {
    return (
      <>
        {cardContent}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="max-h-[80vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Health Overview
              </SheetTitle>
              <VisuallyHidden.Root>
                <SheetDescription>
                  View health details for {aquarium.name}
                </SheetDescription>
              </VisuallyHidden.Root>
            </SheetHeader>
            <QuickHealthView 
              aquariumId={aquarium.id} 
              aquariumName={aquarium.name}
              onClose={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Use HoverCard
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {cardContent}
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start" 
        className="w-72 p-0"
        sideOffset={8}
      >
        <QuickHealthView 
          aquariumId={aquarium.id} 
          aquariumName={aquarium.name}
          compact
        />
      </HoverCardContent>
    </HoverCard>
  );
});

export function AquariumGrid({
  aquariums,
  units,
  canCreate,
  maxAquariums,
  limitsLoading,
  waterBodyMix,
  onCreateAquarium,
  onEditAquarium,
  onDeleteAquarium,
}: AquariumGridProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getLabels = () => {
    switch (waterBodyMix) {
      case 'pools':
        return {
          title: t('dashboard.yourPools'),
          addButton: t('dashboard.addPool'),
          emptyTitle: t('dashboard.noPoolsYet'),
          emptyMessage: t('dashboard.getStartedPoolMessage'),
        };
      case 'mixed':
        return {
          title: t('dashboard.yourWaterBodies'),
          addButton: t('dashboard.addWaterBody'),
          emptyTitle: t('dashboard.noWaterBodiesYet'),
          emptyMessage: t('dashboard.getStartedWaterBodyMessage'),
        };
      default:
        return {
          title: t('dashboard.yourAquariums'),
          addButton: t('dashboard.addAquarium'),
          emptyTitle: t('dashboard.noAquariumsYet'),
          emptyMessage: t('dashboard.getStartedMessage'),
        };
    }
  };

  const labels = getLabels();

  if (aquariums.length === 0) {
    return (
      <Card className="glass-card p-12 text-center animate-fade-up opacity-0">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{labels.emptyTitle}</h3>
        <p className="text-muted-foreground mb-4">
          {labels.emptyMessage}
        </p>
        <Button onClick={onCreateAquarium}>
          <Plus className="mr-2 h-4 w-4" />
          {labels.addButton}
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-start mb-4 animate-fade-up opacity-0" style={{ animationDelay: '200ms' }}>
        <h2 className="text-2xl font-semibold">{labels.title}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!limitsLoading && maxAquariums !== Infinity && (
            <Badge variant="secondary" className="text-xs">
              {aquariums.length}/{maxAquariums}
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={onCreateAquarium}
                    disabled={!canCreate}
                    className={!canCreate ? 'opacity-50' : ''}
                  >
                    {!canCreate ? (
                      <Lock className="mr-2 h-4 w-4" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {labels.addButton}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canCreate && (
                <TooltipContent>
                  <p>Upgrade your plan to add more water bodies</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aquariums.map((aquarium, index) => (
          <AquariumCard
            key={aquarium.id}
            aquarium={aquarium}
            index={index}
            units={units}
            onEdit={onEditAquarium}
            onDelete={onDeleteAquarium}
            t={t}
          />
        ))}
      </div>
    </>
  );
}
