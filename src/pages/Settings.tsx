import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, User, Lock, CreditCard, Trash2, Moon, Sun, Monitor, Languages, Ruler, Palette, Globe, Shield, Crown } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const { user, userName, subscriptionTier, unitPreference, themePreference, languagePreference, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(userName || "");
  const [units, setUnits] = useState(unitPreference || "imperial");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showUnitConfirmDialog, setShowUnitConfirmDialog] = useState(false);
  const [pendingUnitChange, setPendingUnitChange] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (userName) {
      setName(userName);
    }
  }, [userName]);

  useEffect(() => {
    if (unitPreference) {
      setUnits(unitPreference);
    }
  }, [unitPreference]);

  useEffect(() => {
    if (themePreference && theme !== themePreference) {
      setTheme(themePreference);
    }
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
        .update({ name })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    if (!user) return;
    
    setTheme(newTheme);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (!user) return;
    
    i18n.changeLanguage(newLanguage);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language_preference: newLanguage })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Language updated",
        description: "Your language preference has been saved.",
      });
    } catch (error: any) {
      console.error('Failed to save language preference:', error);
      toast({
        title: "Error",
        description: "Failed to save language preference.",
        variant: "destructive",
      });
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
      const { error } = await supabase
        .from('profiles')
        .update({ unit_preference: pendingUnitChange })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Units updated",
        description: "Your unit preference has been saved. All measurements will now display in the new unit system.",
      });
    } catch (error: any) {
      console.error('Failed to save unit preference:', error);
      toast({
        title: "Error",
        description: "Failed to save unit preference.",
        variant: "destructive",
      });
    } finally {
      setShowUnitConfirmDialog(false);
      setPendingUnitChange(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete account deletion.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Customize your experience
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/50 backdrop-blur">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Language</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">Units</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Profile Information</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Manage your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted/30 h-11"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-semibold">Display Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-11"
                  />
                </div>

                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={loading}
                  className="w-full sm:w-auto h-11 px-8"
                  size="lg"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Palette className="h-5 w-5 text-secondary" />
                  </div>
                  <CardTitle className="text-2xl">Appearance</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Choose how the app looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`relative group p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`p-4 rounded-full transition-colors ${
                        theme === 'light' ? 'bg-amber-100' : 'bg-muted'
                      }`}>
                        <Sun className={`h-8 w-8 ${
                          theme === 'light' ? 'text-amber-600' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg">Light</p>
                        <p className="text-xs text-muted-foreground mt-1">Bright & clear</p>
                      </div>
                    </div>
                    {theme === 'light' && (
                      <div className="absolute top-2 right-2">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`relative group p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`p-4 rounded-full transition-colors ${
                        theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-muted'
                      }`}>
                        <Moon className={`h-8 w-8 ${
                          theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg">Dark</p>
                        <p className="text-xs text-muted-foreground mt-1">Easy on eyes</p>
                      </div>
                    </div>
                    {theme === 'dark' && (
                      <div className="absolute top-2 right-2">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`relative group p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                      theme === 'system' 
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`p-4 rounded-full transition-colors ${
                        theme === 'system' ? 'bg-slate-100 dark:bg-slate-900/30' : 'bg-muted'
                      }`}>
                        <Monitor className={`h-8 w-8 ${
                          theme === 'system' ? 'text-slate-600 dark:text-slate-400' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg">System</p>
                        <p className="text-xs text-muted-foreground mt-1">Auto-adjust</p>
                      </div>
                    </div>
                    {theme === 'system' && (
                      <div className="absolute top-2 right-2">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language" className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Globe className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Language & Region</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Select your preferred language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { code: 'en', name: 'English', flag: '🇺🇸' },
                    { code: 'es', name: 'Español', flag: '🇪🇸' },
                    { code: 'fr', name: 'Français', flag: '🇫🇷' },
                    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                    { code: 'pt', name: 'Português', flag: '🇵🇹' },
                    { code: 'ja', name: '日本語', flag: '🇯🇵' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                        i18n.language === lang.code
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{lang.flag}</span>
                        <p className="font-semibold">{lang.name}</p>
                      </div>
                      {i18n.language === lang.code && (
                        <div className="absolute top-2 right-2">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units" className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Ruler className="h-5 w-5 text-secondary" />
                  </div>
                  <CardTitle className="text-2xl">Units & Measurements</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Choose your measurement system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleUnitChangeRequest('imperial')}
                    className={`relative group p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                      units === 'imperial'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          units === 'imperial' ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Ruler className={`h-6 w-6 ${
                            units === 'imperial' ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <p className="font-bold text-xl">Imperial</p>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground text-left">
                        <p>• Gallons (gal)</p>
                        <p>• Fahrenheit (°F)</p>
                        <p>• Inches (in)</p>
                      </div>
                    </div>
                    {units === 'imperial' && (
                      <div className="absolute top-3 right-3">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleUnitChangeRequest('metric')}
                    className={`relative group p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                      units === 'metric'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          units === 'metric' ? 'bg-secondary/10' : 'bg-muted'
                        }`}>
                          <Ruler className={`h-6 w-6 ${
                            units === 'metric' ? 'text-secondary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <p className="font-bold text-xl">Metric</p>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground text-left">
                        <p>• Liters (L)</p>
                        <p>• Celsius (°C)</p>
                        <p>• Centimeters (cm)</p>
                      </div>
                    </div>
                    {units === 'metric' && (
                      <div className="absolute top-3 right-3">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Security</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Manage your password and account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </h3>
                  
                  <div className="space-y-3">
                    <Label htmlFor="new-password" className="text-sm font-semibold">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-11"
                    />
                  </div>

                  <Button 
                    onClick={handleUpdatePassword} 
                    disabled={loading}
                    className="w-full sm:w-auto h-11 px-8"
                    size="lg"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </div>

                <Separator />

                <div className="p-6 rounded-xl border-2 border-destructive/30 bg-destructive/5">
                  <h3 className="font-bold text-lg text-destructive mb-2 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all data
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card className="border-2 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-background/80 backdrop-blur">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Current Plan</CardTitle>
                      <CardDescription className="text-base">
                        {subscriptionTier || 'free'} subscription
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={subscriptionTier === 'free' ? 'secondary' : 'default'}
                    className="text-base px-4 py-2 font-bold"
                  >
                    {(subscriptionTier || 'free').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Plan Features</h3>
                    <div className="space-y-3">
                      {subscriptionTier === 'free' && (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Up to 3 aquariums</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Basic water testing</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Task reminders</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 opacity-60">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">✗</span>
                            </div>
                            <p className="text-sm line-through">Custom templates</p>
                          </div>
                        </>
                      )}
                      {subscriptionTier === 'plus' && (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Up to 10 aquariums</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Advanced water testing</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">10 custom templates</p>
                          </div>
                        </>
                      )}
                      {(subscriptionTier === 'gold' || subscriptionTier === 'enterprise') && (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Unlimited aquariums</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Advanced water testing</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Unlimited custom templates</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-600 font-bold">✓</span>
                            </div>
                            <p className="text-sm">Priority support</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/pricing')}
                    className="w-full h-11"
                    size="lg"
                  >
                    View All Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={showUnitConfirmDialog} onOpenChange={setShowUnitConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Unit Change</AlertDialogTitle>
              <AlertDialogDescription>
                Changing your unit system will affect how all measurements are displayed throughout the app.
                This includes water test parameters, aquarium volumes, and equipment specifications.
                <br /><br />
                Are you sure you want to switch to {pendingUnitChange === 'metric' ? 'Metric' : 'Imperial'} units?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowUnitConfirmDialog(false);
                setPendingUnitChange(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleUnitChangeConfirm}>
                Confirm Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Settings;
