import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, User, Lock, CreditCard, Trash2, Moon, Sun, Monitor, Languages, Ruler } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("profile");

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

  // Sync theme preference from database on mount
  useEffect(() => {
    if (themePreference && theme !== themePreference) {
      setTheme(themePreference);
    }
  }, [themePreference]);

  // Sync language preference from database on mount
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
    // If it's the same as current, no need to confirm
    if (newUnit === units) return;
    
    // Show confirmation dialog
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
      // Note: In production, you'd want a proper account deletion flow
      // This is a simplified version
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6 hover:bg-muted"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {[
                    { id: 'profile', icon: User, label: 'Profile' },
                    { id: 'appearance', icon: Moon, label: 'Appearance' },
                    { id: 'language', icon: Languages, label: 'Language' },
                    { id: 'units', icon: Ruler, label: 'Units' },
                    { id: 'security', icon: Lock, label: 'Security' },
                    { id: 'subscription', icon: CreditCard, label: 'Subscription' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                          activeTab === item.id
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile details and personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed at this time
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  <Button onClick={handleUpdateProfile} disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Appearance</CardTitle>
                  <CardDescription>
                    Customize how the app looks on your device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Select the theme for the app interface
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card 
                        className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${theme === 'light' ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        <CardContent className="p-6 flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <Sun className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">Light</p>
                            <p className="text-xs text-muted-foreground">Bright & clean</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${theme === 'dark' ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        <CardContent className="p-6 flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                            <Moon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">Dark</p>
                            <p className="text-xs text-muted-foreground">Easy on eyes</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${theme === 'system' ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'}`}
                        onClick={() => handleThemeChange('system')}
                      >
                        <CardContent className="p-6 flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/30">
                            <Monitor className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">System</p>
                            <p className="text-xs text-muted-foreground">Auto-adjust</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "language" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Language & Region</CardTitle>
                  <CardDescription>
                    Select your preferred language for the app interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Preferred Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose the language for menus, buttons, and other interface elements
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { code: 'en', name: 'English', flag: '🇺🇸' },
                        { code: 'es', name: 'Español', flag: '🇪🇸' },
                        { code: 'fr', name: 'Français', flag: '🇫🇷' },
                        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                        { code: 'pt', name: 'Português', flag: '🇵🇹' },
                        { code: 'ja', name: '日本語', flag: '🇯🇵' },
                      ].map((lang) => (
                        <Card 
                          key={lang.code}
                          className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${i18n.language === lang.code ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'}`}
                          onClick={() => handleLanguageChange(lang.code)}
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <span className="text-3xl">{lang.flag}</span>
                            <div>
                              <p className="font-semibold">{lang.name}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "units" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Units & Measurements</CardTitle>
                  <CardDescription>
                    Choose your preferred unit system for measurements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Unit System</Label>
                    <p className="text-sm text-muted-foreground">
                      Select how measurements are displayed throughout the app
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${units === 'imperial' ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'}`}
                        onClick={() => handleUnitChangeRequest('imperial')}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Ruler className="h-5 w-5 text-primary" />
                              </div>
                              <p className="font-semibold text-lg">Imperial</p>
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground pl-1">
                              <p>• Gallons</p>
                              <p>• Fahrenheit (°F)</p>
                              <p>• Inches</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${units === 'metric' ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'}`}
                        onClick={() => handleUnitChangeRequest('metric')}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-secondary/10">
                                <Ruler className="h-5 w-5 text-secondary" />
                              </div>
                              <p className="font-semibold text-lg">Metric</p>
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground pl-1">
                              <p>• Liters</p>
                              <p>• Celsius (°C)</p>
                              <p>• Centimeters</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Change Password</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button onClick={handleUpdatePassword} disabled={loading} className="w-full sm:w-auto">
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
                      <h3 className="font-semibold text-lg text-destructive mb-2">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all associated data
                      </p>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
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
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "subscription" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Subscription & Billing</CardTitle>
                  <CardDescription>
                    Manage your subscription plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                      <div>
                        <h3 className="font-semibold text-lg">Current Plan</h3>
                        <p className="text-sm text-muted-foreground">
                          You are currently on the {subscriptionTier || 'free'} plan
                        </p>
                      </div>
                      <Badge variant={subscriptionTier === 'free' ? 'secondary' : 'default'} className="text-sm px-3 py-1">
                        {(subscriptionTier || 'free').toUpperCase()}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Plan Features</h3>
                      <div className="space-y-2 text-sm">
                        {subscriptionTier === 'free' && (
                          <>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Up to 3 aquariums
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Basic water testing
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Task reminders
                            </p>
                            <p className="text-muted-foreground/50 flex items-center gap-2 line-through">
                              <span>✗</span> Custom templates
                            </p>
                            <p className="text-muted-foreground/50 flex items-center gap-2 line-through">
                              <span>✗</span> Advanced analytics
                            </p>
                          </>
                        )}
                        {subscriptionTier === 'plus' && (
                          <>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Up to 10 aquariums
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Advanced water testing
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Task reminders
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> 10 custom templates
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Basic analytics
                            </p>
                          </>
                        )}
                        {(subscriptionTier === 'gold' || subscriptionTier === 'enterprise') && (
                          <>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Unlimited aquariums
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Advanced water testing
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Task reminders
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Unlimited custom templates
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Advanced analytics
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="text-green-500">✓</span> Priority support
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" onClick={() => navigate('/pricing')} className="w-full sm:w-auto">
                      View All Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Unit Change Confirmation Dialog */}
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
