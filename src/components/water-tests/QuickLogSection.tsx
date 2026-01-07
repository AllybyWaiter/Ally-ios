import { useState } from 'react';
import { Camera, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WaterTestForm } from './WaterTestForm';

interface QuickLogSectionProps {
  aquarium: { id: string; name: string; type: string } | null;
}

export function QuickLogSection({ aquarium }: QuickLogSectionProps) {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsSheetOpen(true)}
        className="cursor-pointer"
      >
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/50 transition-all hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {t('waterTests.logNewTest')}
                  <Sparkles className="w-4 h-4 text-primary" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('waterTests.photoOrManual')}
                </p>
              </div>
              <Camera className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
    </>
  );
}
