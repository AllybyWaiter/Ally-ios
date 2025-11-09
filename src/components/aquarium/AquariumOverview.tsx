import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Droplet, Wrench, ListTodo, Plus } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatParameter, formatVolume, UnitSystem } from "@/lib/unitConversions";
import { formatRelativeTime } from "@/lib/formatters";
import { EquipmentDialog } from "./EquipmentDialog";
import { MaintenanceTaskDialog } from "./MaintenanceTaskDialog";

interface AquariumOverviewProps {
  aquariumId: string;
  aquarium: any;
}

export const AquariumOverview = ({ aquariumId, aquarium }: AquariumOverviewProps) => {
  const navigate = useNavigate();
  const { units } = useAuth();
  const { t } = useTranslation();
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const { data: latestTest, isLoading: testLoading } = useQuery({
    queryKey: ["latest-test", aquariumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_tests")
        .select(`
          *,
          test_parameters(*)
        `)
        .eq("aquarium_id", aquariumId)
        .order("test_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: equipmentCount, isLoading: equipmentLoading } = useQuery({
    queryKey: ["equipment-count", aquariumId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("equipment")
        .select("*", { count: "exact", head: true })
        .eq("aquarium_id", aquariumId);

      if (error) throw error;
      return count || 0;
    },
  });

  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["upcomingTasks", aquariumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("*")
        .eq("aquarium_id", aquariumId)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const getTaskDueDateStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: t('overview.overdue'), variant: "destructive" as const };
    if (diffDays === 0) return { label: t('overview.dueToday'), variant: "default" as const };
    if (diffDays <= 3) return { label: t('overview.dueSoon'), variant: "secondary" as const };
    return { label: t('overview.upcoming'), variant: "outline" as const };
  };

  const isLoading = testLoading || equipmentLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.latestWaterTest')}</CardTitle>
            <Droplet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestTest ? (
              <div>
                <div className="text-2xl font-bold">
                  {formatRelativeTime(latestTest.test_date)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestTest.test_parameters?.length || 0} {t('overview.parametersLogged')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('overview.noTestsYet')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.equipment')}</CardTitle>
            <Wrench className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {equipmentCount === 1 ? t('overview.item') : t('overview.items')} {t('overview.itemsInstalled')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.upcomingTasks')}</CardTitle>
            <ListTodo className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-2">
              {upcomingTasks?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">{t('overview.tasksPending')}</p>
            {upcomingTasks && upcomingTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {upcomingTasks.slice(0, 3).map((task) => {
                  const dueDateStatus = getTaskDueDateStatus(task.due_date);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.task_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(task.due_date), "MMM d")}
                        </p>
                      </div>
                      <Badge variant={dueDateStatus.variant} className="ml-2 text-xs">
                        {dueDateStatus.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {latestTest && (
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.latestTestResults')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {latestTest.test_parameters?.slice(0, 6).map((param: any) => (
                <div
                  key={param.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{param.parameter_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatParameter(param.value, param.unit, units)}
                    </p>
                    {param.status && param.status !== "normal" && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        {param.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingTasks && upcomingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.upcomingMaintenance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{task.task_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.task_type}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {format(new Date(task.due_date), "MMM d")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Button onClick={() => navigate("/water-tests")} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {t('overview.logWaterTest')}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => setEquipmentDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('overview.addEquipment')}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => setTaskDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('overview.createTask')}
        </Button>
      </div>

      <EquipmentDialog
        open={equipmentDialogOpen}
        onOpenChange={setEquipmentDialogOpen}
        aquariumId={aquariumId}
        equipment={null}
      />

      <MaintenanceTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        aquariumId={aquariumId}
        mode="create"
      />
    </div>
  );
}
