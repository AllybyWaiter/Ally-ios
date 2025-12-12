import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import type { Equipment } from "@/infrastructure/queries";

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

export const EquipmentCard = memo(function EquipmentCard({
  equipment,
  onEdit,
  onDelete,
}: EquipmentCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{equipment.name}</CardTitle>
            <Badge variant="secondary">{equipment.equipment_type}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(equipment)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(equipment)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {equipment.brand && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('equipment.brand')}</span>
              <span className="font-medium">{equipment.brand}</span>
            </div>
          )}
          {equipment.model && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('equipment.model')}</span>
              <span className="font-medium">{equipment.model}</span>
            </div>
          )}
          {equipment.install_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('equipment.installed')}</span>
              <span className="font-medium">
                {format(new Date(equipment.install_date), "PPP")}
              </span>
            </div>
          )}
          {equipment.maintenance_interval_days && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('equipment.maintenance')}</span>
              <span className="font-medium">
                {t('equipment.everyDays', { days: equipment.maintenance_interval_days })}
              </span>
            </div>
          )}
          {equipment.last_maintenance_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('equipment.lastService')}</span>
              <span className="font-medium">
                {format(new Date(equipment.last_maintenance_date), "PPP")}
              </span>
            </div>
          )}
        </div>
        {equipment.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{equipment.notes}</p>
        )}
      </CardContent>
    </Card>
  );
});
