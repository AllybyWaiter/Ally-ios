import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Plus, Pencil, Trash2, Droplets, Fish, Waves, Globe, Loader2, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface Memory {
  id: string;
  user_id: string;
  water_type: string | null;
  memory_key: string;
  memory_value: string;
  source: string;
  confidence: string;
  created_at: string;
  updated_at: string;
}

const MEMORY_CATEGORIES = [
  { value: "equipment", label: "Equipment", icon: "🔧" },
  { value: "product", label: "Products", icon: "🧪" },
  { value: "water_source", label: "Water Source", icon: "💧" },
  { value: "feeding", label: "Feeding", icon: "🍽️" },
  { value: "maintenance", label: "Maintenance", icon: "🔄" },
  { value: "preference", label: "Preferences", icon: "⚙️" },
  { value: "livestock_care", label: "Livestock Care", icon: "🐠" },
  { value: "other", label: "Other", icon: "📝" },
];

const WATER_TYPES = [
  { value: "all", label: "All Types", icon: Globe },
  { value: "freshwater", label: "Freshwater", icon: Droplets },
  { value: "saltwater", label: "Saltwater", icon: Waves },
  { value: "brackish", label: "Brackish", icon: Fish },
  { value: "universal", label: "Universal", icon: Globe },
];

export default function MemoryManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWaterType, setFilterWaterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  
  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [formData, setFormData] = useState({
    memory_key: "other",
    memory_value: "",
    water_type: "universal",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionTier();
      fetchMemories();
    }
  }, [user]);

  const fetchSubscriptionTier = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && data?.subscription_tier) {
        setSubscriptionTier(data.subscription_tier);
      }
    } catch (error) {
      console.error("Error fetching subscription tier:", error);
    }
  };

  const hasMemoryAccess = ['plus', 'gold', 'business', 'enterprise'].includes(subscriptionTier);

  const fetchMemories = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading memories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (memory?: Memory) => {
    if (memory) {
      setEditingMemory(memory);
      setFormData({
        memory_key: memory.memory_key,
        memory_value: memory.memory_value,
        water_type: memory.water_type || "universal",
      });
    } else {
      setEditingMemory(null);
      setFormData({
        memory_key: "other",
        memory_value: "",
        water_type: "universal",
      });
    }
    setDialogOpen(true);
  };

  const handleSaveMemory = async () => {
    if (!user || !formData.memory_value.trim()) return;

    setSaving(true);
    try {
      if (editingMemory) {
        // Update existing
        const { error } = await supabase
          .from('user_memories')
          .update({
            memory_key: formData.memory_key,
            memory_value: formData.memory_value.trim(),
            water_type: formData.water_type === "universal" ? null : formData.water_type,
          })
          .eq('id', editingMemory.id);

        if (error) throw error;
        toast({ title: "Memory updated" });
      } else {
        // Create new
        const { error } = await supabase
          .from('user_memories')
          .insert({
            user_id: user.id,
            memory_key: formData.memory_key,
            memory_value: formData.memory_value.trim(),
            water_type: formData.water_type === "universal" ? null : formData.water_type,
            source: "manual",
            confidence: "confirmed",
          });

        if (error) throw error;
        toast({ title: "Memory added" });
      }

      setDialogOpen(false);
      fetchMemories();
    } catch (error: any) {
      toast({
        title: "Error saving memory",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const { error } = await supabase
        .from('user_memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;
      
      toast({ title: "Memory deleted" });
      fetchMemories();
    } catch (error: any) {
      toast({
        title: "Error deleting memory",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredMemories = memories.filter(m => {
    const waterTypeMatch = filterWaterType === "all" || 
      (filterWaterType === "universal" && m.water_type === null) ||
      m.water_type === filterWaterType;
    const categoryMatch = filterCategory === "all" || m.memory_key === filterCategory;
    return waterTypeMatch && categoryMatch;
  });

  const groupedMemories = filteredMemories.reduce((acc, memory) => {
    const key = memory.memory_key;
    if (!acc[key]) acc[key] = [];
    acc[key].push(memory);
    return acc;
  }, {} as Record<string, Memory[]>);

  const getCategoryInfo = (key: string) => {
    return MEMORY_CATEGORIES.find(c => c.value === key) || { label: key, icon: "📝" };
  };

  const getWaterTypeBadge = (waterType: string | null) => {
    if (!waterType) return <Badge variant="secondary" className="text-xs">Universal</Badge>;
    const colors: Record<string, string> = {
      freshwater: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
      saltwater: "bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-secondary-foreground",
      brackish: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };
    return (
      <Badge className={`text-xs ${colors[waterType] || ""}`}>
        {waterType.charAt(0).toUpperCase() + waterType.slice(1)}
      </Badge>
    );
  };

  // Show upgrade prompt for free/basic users
  if (!hasMemoryAccess) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto p-4 rounded-full bg-primary/10">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Ally's Memory</CardTitle>
            <CardDescription className="text-base mt-2 max-w-md mx-auto">
              Upgrade to Plus or higher to unlock Ally's memory feature. Ally will remember your equipment, preferences, and practices across all conversations.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4 pb-6">
          <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Equipment preferences
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Water source info
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Feeding routines
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Maintenance habits
            </Badge>
          </div>
          <Button asChild className="gap-2">
            <Link to="/pricing">
              <Sparkles className="h-4 w-4" />
              View Plans
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Ally's Memory</CardTitle>
              <CardDescription className="text-base">
                Things Ally remembers about your setup
              </CardDescription>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Memory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMemory ? "Edit Memory" : "Add New Memory"}</DialogTitle>
                <DialogDescription>
                  Add information you want Ally to remember about your aquarium setup.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.memory_key}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, memory_key: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMORY_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Water Type</Label>
                  <Select
                    value={formData.water_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, water_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="universal">🌐 Universal (all tanks)</SelectItem>
                      <SelectItem value="freshwater">💧 Freshwater only</SelectItem>
                      <SelectItem value="saltwater">🌊 Saltwater only</SelectItem>
                      <SelectItem value="brackish">🐟 Brackish only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>What should Ally remember?</Label>
                  <Input
                    value={formData.memory_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, memory_value: e.target.value }))}
                    placeholder="e.g., I use a BRS 4-stage RO/DI system"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveMemory} disabled={saving || !formData.memory_value.trim()}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingMemory ? "Update" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterWaterType} onValueChange={setFilterWaterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Water Type" />
            </SelectTrigger>
            <SelectContent>
              {WATER_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {MEMORY_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Memory List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No memories yet</p>
            <p className="text-sm">Ally will learn about your setup as you chat, or you can add memories manually.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {Object.entries(groupedMemories).map(([category, categoryMemories]) => {
                const catInfo = getCategoryInfo(category);
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <span>{catInfo.icon}</span>
                      {catInfo.label}
                    </h4>
                    <div className="space-y-2">
                      {categoryMemories.map(memory => (
                        <div
                          key={memory.id}
                          className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{memory.memory_value}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getWaterTypeBadge(memory.water_type)}
                              {memory.source === "conversation" && (
                                <Badge variant="outline" className="text-xs">From chat</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenDialog(memory)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ally will forget this information. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMemory(memory.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}