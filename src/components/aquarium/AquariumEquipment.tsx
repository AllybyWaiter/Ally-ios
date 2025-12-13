import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, Plus, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EquipmentDialog } from "./EquipmentDialog";
import { EquipmentCard } from "./EquipmentCard";
import { queryKeys } from "@/lib/queryKeys";
import { fetchEquipment, deleteEquipment, type Equipment } from "@/infrastructure/queries";

interface AquariumEquipmentProps {
  aquariumId: string;
  aquariumType?: string;
}

export const AquariumEquipment = ({ aquariumId, aquariumType = 'freshwater' }: AquariumEquipmentProps) => {
  const { user, loading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: equipment, isLoading } = useQuery({
    queryKey: queryKeys.equipment.list(aquariumId),
    queryFn: () => fetchEquipment(aquariumId),
    enabled: !authLoading && !!user && !!aquariumId,
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onMutate: async (equipmentId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.equipment.list(aquariumId) });
      
      // Snapshot previous value
      const previousEquipment = queryClient.getQueryData(queryKeys.equipment.list(aquariumId));
      
      // Optimistically remove from cache
      queryClient.setQueryData(
        queryKeys.equipment.list(aquariumId),
        (old: any[] | undefined) => old?.filter((item) => item.id !== equipmentId) ?? []
      );
      
      return { previousEquipment };
    },
    onSuccess: () => {
      toast({
        title: t('equipment.equipmentDeleted'),
        description: t('equipment.equipmentRemoved'),
      });
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousEquipment) {
        queryClient.setQueryData(queryKeys.equipment.list(aquariumId), context.previousEquipment);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.list(aquariumId) });
    },
  });

  const handleEdit = useCallback((item: Equipment) => {
    setEditingEquipment(item);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((item: Equipment) => {
    setEquipmentToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingEquipment(null);
    setDialogOpen(true);
  }, []);

  // Show loading while auth is initializing or data is loading
  if (authLoading || isLoading) {
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
          <EquipmentCard
            key={item.id}
            equipment={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <EquipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aquariumId={aquariumId}
        aquariumType={aquariumType}
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
