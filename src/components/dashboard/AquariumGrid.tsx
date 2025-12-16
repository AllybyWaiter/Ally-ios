import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, AlertCircle, MoreVertical, Pencil, Trash2, Lock } from 'lucide-react';
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
          <Card 
            key={aquarium.id} 
            className="glass-card animate-fade-up opacity-0"
            style={{ animationDelay: `${(index + 3) * 100}ms` }}
            onMouseEnter={() => {
              import('@/pages/AquariumDetail').catch(() => {});
            }}
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
                      <DropdownMenuItem onClick={() => onEditAquarium(aquarium)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteAquarium(aquarium.id)}
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
              onClick={() => navigate(`/aquarium/${aquarium.id}`)} 
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
        ))}
      </div>
    </>
  );
}
