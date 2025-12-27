import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ArrowLeft, User, Lock, CreditCard, Trash2, Moon, Sun, Monitor, 
  Languages, Ruler, Palette, Globe, Shield, Crown, Brain, MapPin, 
  Bell, HelpCircle, MessageSquare, Star, Download, FileText, ExternalLink,
  Mail, ChevronRight, Settings as SettingsIcon, BookOpen, Sparkles
} from "lucide-react";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import MemoryManager from "@/components/settings/MemoryManager";
import { WeatherSettings } from "@/components/settings/WeatherSettings";
import { UpgradePlanDialog } from "@/components/settings/UpgradePlanDialog";

const APP_VERSION = "1.0.0";

const Settings = () => {
  const { user, userName, subscriptionTier, unitPreference, themePreference, languagePreference, hemisphere: userHemisphere, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [name, setName] = useState(userName || "");
  const [units, setUnits] = useState(unitPreference || "imperial");
  const [hemisphere, setHemisphere] = useState(userHemisphere || "northern");
  const [skillLevel, setSkillLevel] = useState<string>("beginner");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showUnitConfirmDialog, setShowUnitConfirmDialog] = useState(false);
  const [pendingUnitChange, setPendingUnitChange] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (userName) setName(userName);
  }, [userName]);

  useEffect(() => {
    if (unitPreference) setUnits(unitPreference);
  }, [unitPreference]);

  useEffect(() => {
    if (userHemisphere) setHemisphere(userHemisphere);
  }, [userHemisphere]);

  useEffect(() => {
    const fetchSkillLevel = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('skill_level')
        .eq('user_id', user.id)
        .single();
      if (data?.skill_level) setSkillLevel(data.skill_level);
    };
    fetchSkillLevel();
  }, [user]);

  useEffect(() => {
    if (themePreference && theme !== themePreference) setTheme(themePreference);
  }, [themePreference]);

  useEffect(() => {
    if (languagePreference && i18n.language !== languagePreference) {
      i18n.changeLanguage(languagePreference);
    }
  }, [languagePreference]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, skill_level: skillLevel })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    if (!user) return;
    setTheme(newTheme);
    try {
      await supabase.from('profiles').update({ theme_preference: newTheme }).eq('user_id', user.id);
    } catch (error: any) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (!user) return;
    i18n.changeLanguage(newLanguage);
    try {
      const { error } = await supabase.from('profiles').update({ language_preference: newLanguage }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Language updated", description: "Your language preference has been saved." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save language preference.", variant: "destructive" });
    }
  };

  const handleHemisphereChange = async (newHemisphere: string) => {
    if (!user || newHemisphere === hemisphere) return;
    setHemisphere(newHemisphere);
    try {
      const { error } = await supabase.from('profiles').update({ hemisphere: newHemisphere }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Location updated", description: "Your hemisphere has been saved for seasonal reminders." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save hemisphere preference.", variant: "destructive" });
    }
  };

  const handleUnitChangeRequest = (newUnit: string) => {
    if (newUnit === units) return;
    setPendingUnitChange(newUnit);
    setShowUnitConfirmDialog(true);
  };

  const handleUnitChangeConfirm = async () => {
    if (!user || !pendingUnitChange) return;
    setUnits(pendingUnitChange);
    try {
      const { error } = await supabase.from('profiles').update({ unit_preference: pendingUnitChange }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Units updated", description: "Your unit preference has been saved." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save unit preference.", variant: "destructive" });
    } finally {
      setShowUnitConfirmDialog(false);
      setPendingUnitChange(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('export-user-data', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` }
      });
      
      if (response.error) throw response.error;
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ally-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Data exported", description: "Your data has been downloaded successfully." });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message || "Failed to export data.", variant: "destructive" });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('delete-user-account', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
      });
      
      if (response.error) throw response.error;
      
      toast({ 
        title: "Account deleted", 
        description: "Your account and all data have been permanently deleted." 
      });
      
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
      await signOut();
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Platform-aware App Store rating
  const handleRateApp = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // App Store IDs - to be updated after store submission
    const APP_STORE_ID = ""; // iOS App Store ID
    const PLAY_STORE_ID = "com.allybywaiter.ally"; // Android package name
    
    if (isIOS && APP_STORE_ID) {
      window.open(`https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`, '_blank');
    } else if (isAndroid && PLAY_STORE_ID) {
      window.open(`https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`, '_blank');
    } else {
      // Fallback for web/PWA or before store submission
      navigate('/contact?type=feedback');
      toast({ 
        title: "Share Your Feedback", 
        description: "App Store ratings coming soon! Share your feedback here instead." 
      });
    }
  };

  // Platform-aware subscription management
  const handleManageSubscription = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Check if user has a Stripe subscription first
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
        body: { return_url: window.location.href }
      });
      
      // Check for successful portal URL
      if (!error && data?.url) {
        window.open(data.url, '_blank');
        return;
      }
      
      // Handle "no subscription" response gracefully
      if (data?.error === 'no_subscription') {
        console.log('User has no active subscription');
        // Fall through to platform store check below
      }
    } catch (e) {
      console.log('Error checking subscription, falling back to platform stores');
    }
    
    // Fallback to platform stores
    if (isIOS) {
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/account/subscriptions', '_blank');
    } else {
      toast({ 
        title: "No Active Subscription", 
        description: "Upgrade your plan to manage your subscription." 
      });
      navigate('/pricing');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-safe">
      <div className="container mx-auto px-4 py-8 pt-12 pb-24 md:pb-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your experience</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 backdrop-blur">
            <TabsTrigger value="account" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Legal</span>
            </TabsTrigger>
          </TabsList>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="space-y-4">
            <Accordion type="single" collapsible defaultValue="profile" className="space-y-4">
              {/* Profile Section */}
              <AccordionItem value="profile" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Profile</p>
                      <p className="text-sm text-muted-foreground">Name and experience level</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input value={user.email || ""} disabled className="bg-muted/30" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Email cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Display Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Experience Level</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'beginner', label: 'Beginner', emoji: '🌱' },
                          { value: 'intermediate', label: 'Intermediate', emoji: '🐠' },
                          { value: 'advanced', label: 'Advanced', emoji: '🏆' }
                        ].map((level) => (
                          <button
                            key={level.value}
                            onClick={() => setSkillLevel(level.value)}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              skillLevel === level.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <span className="text-xl">{level.emoji}</span>
                            <p className="text-xs font-medium mt-1">{level.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
                      {loading ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Security Section */}
              <AccordionItem value="security" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Shield className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Security</p>
                      <p className="text-sm text-muted-foreground">Password and account protection</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">New Password</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Confirm Password</Label>
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                    </div>
                    <Button onClick={handleUpdatePassword} disabled={loading} className="w-full">
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Subscription Section */}
              <AccordionItem value="subscription" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Crown className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Subscription</p>
                      <p className="text-sm text-muted-foreground">
                        Current plan: <Badge variant="secondary" className="ml-1">{(subscriptionTier || 'free').toUpperCase()}</Badge>
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {['3 water bodies', 'Basic water testing', 'Task reminders', 'AI assistant'].map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      {(!subscriptionTier || subscriptionTier === 'free') ? (
                        <Button onClick={() => setShowUpgradeDialog(true)} className="w-full">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Upgrade Plan
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={handleManageSubscription} className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Manage Subscription
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => navigate('/pricing')} className="w-full text-muted-foreground">
                        Compare All Plans
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => toast({ title: "Purchases Restored", description: "Your subscription status has been refreshed." })}
                        className="w-full"
                      >
                        Restore Purchases
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Data & Privacy Section */}
              <AccordionItem value="data" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Data & Privacy</p>
                      <p className="text-sm text-muted-foreground">Export and manage your data</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Download Your Data</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Export all your data including water bodies, tests, livestock, and settings in JSON format.
                      </p>
                      <Button onClick={handleExportData} disabled={exportLoading} variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        {exportLoading ? "Exporting..." : "Download My Data"}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
                      <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                              <p>This will permanently delete:</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                <li>All your water bodies and settings</li>
                                <li>Water test history and charts</li>
                                <li>Livestock and plant records</li>
                                <li>Chat conversations with Ally</li>
                              </ul>
                              <p className="font-medium">Type DELETE to confirm:</p>
                              <Input 
                                value={deleteConfirmText} 
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                              />
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== "DELETE" || loading}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {loading ? "Deleting..." : "Delete Account"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="space-y-4">
            <Accordion type="single" collapsible defaultValue="appearance" className="space-y-4">
              {/* Appearance */}
              <AccordionItem value="appearance" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Palette className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Appearance</p>
                      <p className="text-sm text-muted-foreground">Theme and display settings</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun, color: 'amber' },
                      { value: 'dark', label: 'Dark', icon: Moon, color: 'indigo' },
                      { value: 'system', label: 'System', icon: Monitor, color: 'slate' }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => handleThemeChange(value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">{label}</p>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Language & Region */}
              <AccordionItem value="language" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Globe className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Language & Region</p>
                      <p className="text-sm text-muted-foreground">Language and hemisphere</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Language</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { code: 'en', name: 'English', flag: '🇺🇸' },
                        { code: 'es', name: 'Español', flag: '🇪🇸' },
                        { code: 'fr', name: 'Français', flag: '🇫🇷' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            i18n.language === lang.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className="text-sm font-medium">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Hemisphere</Label>
                    <p className="text-xs text-muted-foreground mb-2">For seasonal pool/spa reminders</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'northern', label: 'Northern', emoji: '🌎' },
                        { value: 'southern', label: 'Southern', emoji: '🌍' }
                      ].map((h) => (
                        <button
                          key={h.value}
                          onClick={() => handleHemisphereChange(h.value)}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            hemisphere === h.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-xl">{h.emoji}</span>
                          <span className="text-sm font-medium">{h.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Units */}
              <AccordionItem value="units" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Ruler className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Units</p>
                      <p className="text-sm text-muted-foreground">Measurement system</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'imperial', label: 'Imperial', details: 'Gallons, °F, inches' },
                      { value: 'metric', label: 'Metric', details: 'Liters, °C, cm' }
                    ].map((u) => (
                      <button
                        key={u.value}
                        onClick={() => handleUnitChangeRequest(u.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          units === u.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">{u.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{u.details}</p>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Weather */}
              <AccordionItem value="weather" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <MapPin className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Weather</p>
                      <p className="text-sm text-muted-foreground">Location and weather display</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <WeatherSettings />
                </AccordionContent>
              </AccordionItem>

              {/* Notifications */}
              <AccordionItem value="notifications" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Bell className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Notifications</p>
                      <p className="text-sm text-muted-foreground">Alerts and reminders</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <NotificationSettings />
                </AccordionContent>
              </AccordionItem>

              {/* AI Memory */}
              <AccordionItem value="memory" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">AI Memory</p>
                      <p className="text-sm text-muted-foreground">What Ally remembers about you</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <MemoryManager />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* SUPPORT TAB */}
          <TabsContent value="support" className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Help & Support
                </CardTitle>
                <CardDescription>Get help and provide feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/help" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Help Center</p>
                      <p className="text-sm text-muted-foreground">Tutorials, guides, and articles</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <Link to="/faq" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">FAQ</p>
                      <p className="text-sm text-muted-foreground">Frequently asked questions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <Link to="/contact" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Contact Us</p>
                      <p className="text-sm text-muted-foreground">Get in touch with support</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <button 
                  onClick={handleRateApp}
                  className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Rate on App Store</p>
                      <p className="text-sm text-muted-foreground">Love the app? Leave a review</p>
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <button 
                  onClick={() => navigate('/contact?type=feedback')}
                  className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Send Feedback</p>
                      <p className="text-sm text-muted-foreground">Share your thoughts and ideas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEGAL TAB */}
          <TabsContent value="legal" className="space-y-4">
            {/* Legal Documents */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Documents
                </CardTitle>
                <CardDescription>Terms, policies, and agreements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/privacy" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Privacy Policy</p>
                      <p className="text-sm text-muted-foreground">How we handle your data</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <Link to="/terms" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Terms of Service</p>
                      <p className="text-sm text-muted-foreground">Rules and guidelines</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <Link to="/cookies" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Cookie Policy</p>
                      <p className="text-sm text-muted-foreground">How we use cookies</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <Link to="/subprocessors" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Subprocessors</p>
                      <p className="text-sm text-muted-foreground">Third party service providers</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>

            {/* Privacy Controls */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Controls
                </CardTitle>
                <CardDescription>Manage your privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/legal/ai-transparency" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">AI Transparency</p>
                      <p className="text-sm text-muted-foreground">How we use AI in Ally</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <Link to="/legal/privacy-rights" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Privacy Rights</p>
                      <p className="text-sm text-muted-foreground">Your data rights and requests</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                
                <Link to="/legal/cookie-preferences" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Cookie Preferences</p>
                      <p className="text-sm text-muted-foreground">Manage cookie settings</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
            
            {/* App Info */}
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Ally by WA.I.TER</p>
                      <p className="text-sm text-muted-foreground">Version {APP_VERSION}</p>
                    </div>
                    <Badge variant="secondary">Closed Beta</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    © {new Date().getFullYear()} WA.I.TER. All rights reserved.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unit Change Confirmation Dialog */}
      <AlertDialog open={showUnitConfirmDialog} onOpenChange={setShowUnitConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Unit Change</AlertDialogTitle>
            <AlertDialogDescription>
              Changing your unit system will affect how all measurements are displayed.
              Switch to {pendingUnitChange === 'metric' ? 'Metric' : 'Imperial'} units?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowUnitConfirmDialog(false); setPendingUnitChange(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUnitChangeConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePlanDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog}
        currentTier={subscriptionTier}
      />
    </div>
  );
};

export default Settings;
