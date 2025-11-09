import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Wrench, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { EquipmentDialog } from "./EquipmentDialog";

interface AquariumEquipmentProps {
  aquariumId: string;
}

export const AquariumEquipment = ({ aquariumId }: AquariumEquipmentProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<any>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment", aquariumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("aquarium_id", aquariumId)
        .order("install_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", aquariumId] });
      toast({
        title: t('equipment.equipmentDeleted'),
        description: t('equipment.equipmentRemoved'),
      });
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingEquipment(item);
    setDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    setEquipmentToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingEquipment(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!equipment || equipment.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('equipment.noEquipmentYet')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('equipment.startTracking')}
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              {t('equipment.addEquipment')}
            </Button>
          </CardContent>
        </Card>

        <EquipmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          aquariumId={aquariumId}
          equipment={editingEquipment}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('equipment.title')}</h2>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          {t('equipment.addEquipment')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {equipment.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant="secondary">{item.equipment_type}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {item.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('equipment.brand')}</span>
                    <span className="font-medium">{item.brand}</span>
                  </div>
                )}
                {item.model && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('equipment.model')}</span>
                    <span className="font-medium">{item.model}</span>
                  </div>
                )}
                {item.install_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('equipment.installed')}</span>
                    <span className="font-medium">
                      {format(new Date(item.install_date), "PPP")}
                    </span>
                  </div>
                )}
                {item.maintenance_interval_days && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('equipment.maintenance')}</span>
                    <span className="font-medium">
                      {t('equipment.everyDays', { days: item.maintenance_interval_days })}
                    </span>
                  </div>
                )}
                {item.last_maintenance_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('equipment.lastService')}</span>
                    <span className="font-medium">
                      {format(new Date(item.last_maintenance_date), "PPP")}
                    </span>
                  </div>
                )}
              </div>
              {item.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{item.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <EquipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aquariumId={aquariumId}
        equipment={editingEquipment}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('equipment.deleteEquipment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('equipment.deleteConfirmation', { name: equipmentToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(equipmentToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
