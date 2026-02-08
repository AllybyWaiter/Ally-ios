import { useState, useCallback, useEffect } from "react";
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
import { Loader2, Plus, Wrench, Cog } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { EquipmentDialog } from "./EquipmentDialog";
import { EquipmentCard } from "./EquipmentCard";
import { queryKeys } from "@/lib/queryKeys";
import { fetchEquipment, deleteEquipment, type Equipment } from "@/infrastructure/queries";

export interface AquariumEquipmentProps {
  aquariumId: string;
  aquariumType?: string;
  initialAddNew?: boolean;
}

export const AquariumEquipment = ({ aquariumId, aquariumType = 'freshwater', initialAddNew = false }: AquariumEquipmentProps) => {
  const { user, loading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Auto-open dialog based on URL param
  useEffect(() => {
    if (initialAddNew) {
      setDialogOpen(true);
    }
  }, [initialAddNew]);

  const { data: equipment, isLoading } = useQuery({
    queryKey: queryKeys.equipment.list(aquariumId),
    queryFn: () => fetchEquipment(aquariumId),
    enabled: !authLoading && !!user && !!aquariumId,
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: (equipmentId: string) => deleteEquipment(equipmentId, user!.id),
    onMutate: async (equipmentId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.equipment.list(aquariumId) });
      
      // Snapshot previous value
      const previousEquipment = queryClient.getQueryData(queryKeys.equipment.list(aquariumId));
      
      // Optimistically remove from cache
      queryClient.setQueryData(
        queryKeys.equipment.list(aquariumId),
        (old: Equipment[] | undefined) => old?.filter((item) => item.id !== equipmentId) ?? []
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
    onError: (error: unknown, _, context) => {
      // Rollback on error
      if (context?.previousEquipment) {
        queryClient.setQueryData(queryKeys.equipment.list(aquariumId), context.previousEquipment);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete equipment',
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-slate-500/5 via-background to-background"
        >
          {/* Decorative background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-slate-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-4 right-4 opacity-[0.04]">
            <Cog className="h-32 w-32 text-foreground" />
          </div>

          <div className="relative px-6 pt-10 pb-12 flex flex-col items-center text-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-500/10 mb-5">
              <Wrench className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1.5">{t('equipment.noEquipmentYet')}</h3>
            <p className="text-sm text-muted-foreground max-w-[260px] mb-6">
              {t('equipment.startTracking')}
            </p>
            <Button onClick={handleAddNew} className="rounded-full gap-2 shadow-sm px-6">
              <Plus className="w-4 h-4" />
              {t('equipment.addEquipment')}
            </Button>
          </div>
        </motion.div>

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
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={handleAddNew} size="sm" className="rounded-full gap-1.5 shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          {t('equipment.addEquipment')}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {equipment.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
          >
            <EquipmentCard
              equipment={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </motion.div>
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
              onClick={() => equipmentToDelete?.id && deleteMutation.mutate(equipmentToDelete.id)}
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
