import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Droplet, Wrench, ListTodo, Plus, AlertCircle } from "lucide-react";
import { format, isValid } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatParameter, formatVolume, UnitSystem } from "@/lib/unitConversions";
import { formatRelativeTime } from "@/lib/formatters";
import { EquipmentDialog } from "./EquipmentDialog";
import { MaintenanceTaskDialog } from "./MaintenanceTaskDialog";
import { queryKeys } from "@/lib/queryKeys";
import { queryPresets } from "@/lib/queryConfig";
import { fetchLatestWaterTest, fetchEquipmentCount, fetchUpcomingTasks } from "@/infrastructure/queries";
import { getTaskTypeConfig } from "@/components/calendar/types";

// Safe date formatter to prevent crashes - returns empty string for invalid dates
const safeFormatDate = (dateValue: string | null | undefined, formatStr: string = "MMM d"): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) {
      console.warn('Invalid date value in AquariumOverview:', dateValue);
      return '';
    }
    return format(date, formatStr);
  } catch (error) {
    console.error('Date formatting error in AquariumOverview:', error);
    return '';
  }
};

interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume_gallons: number | null;
  status: string | null;
  setup_date: string | null;
  notes: string | null;
}

interface AquariumOverviewProps {
  aquariumId: string;
  aquarium: Aquarium;
}

export const AquariumOverview = ({ aquariumId, aquarium }: AquariumOverviewProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, units } = useAuth();
  const { t } = useTranslation();
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const { data: latestTest, isLoading: testLoading } = useQuery({
    queryKey: queryKeys.waterTests.latest(aquariumId),
    queryFn: () => fetchLatestWaterTest(aquariumId),
    enabled: !authLoading && !!user && !!aquariumId,
    ...queryPresets.waterTests,
  });

  const { data: equipmentCount, isLoading: equipmentLoading } = useQuery({
    queryKey: queryKeys.equipment.count(aquariumId),
    queryFn: () => fetchEquipmentCount(aquariumId),
    enabled: !authLoading && !!user && !!aquariumId,
    ...queryPresets.aquariumData,
  });

  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery({
    queryKey: queryKeys.tasks.upcomingForAquarium(aquariumId),
    queryFn: () => fetchUpcomingTasks([aquariumId], 30),
    enabled: !authLoading && !!user && !!aquariumId,
    ...queryPresets.tasks,
  });

  const getTaskDueDateStatus = (dueDate: string) => {
    // Validate date before processing
    const due = new Date(dueDate);
    if (!isValid(due)) {
      return { label: t('overview.unknown'), variant: "outline" as const };
    }
    
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

  const isLoading = authLoading || testLoading || equipmentLoading || tasksLoading;

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
              {(upcomingTasks || [])
                .filter((task) => task?.id && task?.due_date)
                .slice(0, 3)
                .map((task) => {
                  const dueDateStatus = getTaskDueDateStatus(task.due_date);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.task_name || 'Unnamed task'}</p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormatDate(task.due_date, "MMM d")}
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
              {latestTest.test_parameters?.slice(0, 6).map((param: { id: string; parameter_name: string; value: number | null; unit: string; status?: string }) => {
                const getStatusBadgeClass = (status: string) => {
                  switch (status) {
                    case 'good':
                      return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
                    case 'warning':
                      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
                    case 'critical':
                      return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
                    default:
                      return '';
                  }
                };

                return (
                  <div
                    key={param.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{param.parameter_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {param.value != null ? formatParameter(param.value, param.unit, units) : '-'}
                      </p>
                      {param.status && (
                        <Badge 
                          className={`text-xs mt-1 border ${getStatusBadgeClass(param.status)}`}
                        >
                          {param.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
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
              {(upcomingTasks || []).map((task) => {
                if (!task?.id) return null;
                const taskTypeConfig = getTaskTypeConfig(task.task_type || 'other');
                const TaskIcon = taskTypeConfig.icon;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-muted ${taskTypeConfig.color}`}>
                        <TaskIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{task.task_name || 'Unnamed task'}</p>
                        <p className="text-sm text-muted-foreground">
                          {taskTypeConfig.label}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {safeFormatDate(task.due_date, "MMM d")}
                    </Badge>
                  </div>
                );
              })}
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
