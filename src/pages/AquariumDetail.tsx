import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { AquariumOverview } from "@/components/aquarium/AquariumOverview";
import { WaterTestCharts } from "@/components/water-tests/WaterTestCharts";
import { AquariumEquipment } from "@/components/aquarium/AquariumEquipment";
import { AquariumTasks } from "@/components/aquarium/AquariumTasks";
import { format } from "date-fns";
import { AquariumDialog } from "@/components/aquarium/AquariumDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatVolume, UnitSystem } from "@/lib/unitConversions";

export default function AquariumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { unitPreference } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: aquarium, isLoading, refetch } = useQuery({
    queryKey: ["aquarium", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aquariums")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from("aquariums")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Aquarium deleted successfully",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting aquarium:", error);
      toast({
        title: "Error",
        description: "Failed to delete aquarium",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!aquarium) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Aquarium not found</h1>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{aquarium.name}</h1>
              <Badge variant="secondary">{aquarium.type}</Badge>
              <Badge variant="outline">{aquarium.status}</Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Aquarium
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Aquarium
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {aquarium.volume_gallons && (
              <span>{formatVolume(aquarium.volume_gallons, unitPreference as UnitSystem | null)}</span>
            )}
            {aquarium.setup_date && (
              <span>Setup: {format(new Date(aquarium.setup_date), "PPP")}</span>
            )}
          </div>
          {aquarium.notes && (
            <p className="mt-3 text-muted-foreground">{aquarium.notes}</p>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="water-tests">Water Tests</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AquariumOverview aquariumId={id!} aquarium={aquarium} />
          </TabsContent>

          <TabsContent value="water-tests">
            <WaterTestCharts aquarium={{ id: id!, name: aquarium.name, type: aquarium.type }} />
          </TabsContent>

          <TabsContent value="equipment">
            <AquariumEquipment aquariumId={id!} />
          </TabsContent>

          <TabsContent value="tasks">
            <AquariumTasks aquariumId={id!} />
          </TabsContent>
        </Tabs>
      </main>

      <AquariumDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refetch}
        aquarium={aquarium}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Aquarium</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{aquarium.name}"? This action cannot be undone and will also delete all associated water tests, equipment, and tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
