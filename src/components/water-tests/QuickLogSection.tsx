import { useState } from 'react';
import { Camera, Plus, Sparkles, Waves, Bluetooth, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { WaterTestForm } from './WaterTestForm';
import { WaterWandSection } from './WaterWandSection';
import { logger } from '@/lib/logger';

interface QuickLogSectionProps {
  aquarium: { id: string; name: string; type: string } | null;
}

export function QuickLogSection({ aquarium }: QuickLogSectionProps) {
  const { t } = useTranslation();
  const { units } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isWandSheetOpen, setIsWandSheetOpen] = useState(false);

  if (!aquarium) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">{t('waterTests.selectAquariumFirst')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Log New Test Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsSheetOpen(true)}
          className="cursor-pointer"
        >
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/50 transition-all hover:shadow-lg h-full">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    {t('waterTests.logNewTest')}
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    Photo, manual, or wand
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ally Wand Quick Test Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsWandSheetOpen(true)}
          className="cursor-pointer"
        >
          <Card className="overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent hover:border-blue-500/50 transition-all hover:shadow-lg h-full">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Waves className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    Use Ally Wand
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      BLE
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    Quick test with your wand
                  </p>
                </div>
                <Bluetooth className="w-5 h-5 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Regular Test Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('waterTests.logNewTest')}
            </SheetTitle>
          </SheetHeader>
          <WaterTestForm aquarium={aquarium} />
        </SheetContent>
      </Sheet>

      {/* Dedicated Wand Sheet */}
      <Sheet open={isWandSheetOpen} onOpenChange={setIsWandSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-500" />
              Ally Wand Test
            </SheetTitle>
            <SheetDescription>
              Test water for {aquarium.name} using your BLE water wand
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Wand Connection & Reading */}
            <WaterWandSection
              units={units}
              onReadingComplete={(reading) => {
                // TODO: Auto-save or prompt to save
                logger.log('Reading complete:', reading);
              }}
              onParametersDetected={(params) => {
                logger.log('Parameters detected:', params);
              }}
            />

            {/* Quick Info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Quick Test Mode</h4>
              <p className="text-xs text-muted-foreground">
                Readings from your wand will be automatically saved to {aquarium.name}.
                For more options like notes and tags, use "Log New Test" instead.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
