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
import { ArrowLeft, User, Lock, CreditCard, Trash2, Moon, Sun, Monitor, Languages, Ruler } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const { user, userName, subscriptionTier, unitPreference, signOut } = useAuth();
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

  const handleUnitChange = async (newUnit: string) => {
    if (!user) return;
    
    setUnits(newUnit);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ unit_preference: newUnit })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Units updated",
        description: "Your unit preference has been saved.",
      });
    } catch (error: any) {
      console.error('Failed to save unit preference:', error);
      toast({
        title: "Error",
        description: "Failed to save unit preference.",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Language
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Units
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed at this time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <Button onClick={handleUpdateProfile} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the app looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select the theme for the app interface
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all hover:border-primary ${theme === 'light' ? 'border-primary shadow-md' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <CardContent className="p-6 flex flex-col items-center gap-3">
                        <Sun className="h-8 w-8" />
                        <div className="text-center">
                          <p className="font-medium">Light</p>
                          <p className="text-xs text-muted-foreground">Bright theme</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all hover:border-primary ${theme === 'dark' ? 'border-primary shadow-md' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <CardContent className="p-6 flex flex-col items-center gap-3">
                        <Moon className="h-8 w-8" />
                        <div className="text-center">
                          <p className="font-medium">Dark</p>
                          <p className="text-xs text-muted-foreground">Dark theme</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all hover:border-primary ${theme === 'system' ? 'border-primary shadow-md' : ''}`}
                      onClick={() => handleThemeChange('system')}
                    >
                      <CardContent className="p-6 flex flex-col items-center gap-3">
                        <Monitor className="h-8 w-8" />
                        <div className="text-center">
                          <p className="font-medium">System</p>
                          <p className="text-xs text-muted-foreground">Auto theme</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>
                  Select your preferred language for the app interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Preferred Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose the language for menus, buttons, and other interface elements
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        className={`cursor-pointer transition-all hover:border-primary ${i18n.language === lang.code ? 'border-primary shadow-md' : ''}`}
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <div>
                            <p className="font-medium">{lang.name}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units">
            <Card>
              <CardHeader>
                <CardTitle>Units & Measurements</CardTitle>
                <CardDescription>
                  Choose your preferred unit system for measurements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Unit System</Label>
                  <p className="text-sm text-muted-foreground">
                    Select how measurements are displayed throughout the app
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all hover:border-primary ${units === 'imperial' ? 'border-primary shadow-md' : ''}`}
                      onClick={() => handleUnitChange('imperial')}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Ruler className="h-5 w-5" />
                            <p className="font-semibold text-lg">Imperial</p>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>• Gallons</p>
                            <p>• Fahrenheit (°F)</p>
                            <p>• Inches</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all hover:border-primary ${units === 'metric' ? 'border-primary shadow-md' : ''}`}
                      onClick={() => handleUnitChange('metric')}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Ruler className="h-5 w-5" />
                            <p className="font-semibold text-lg">Metric</p>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
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
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button onClick={handleUpdatePassword} disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Delete Account</h4>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all associated data
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
                              <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Your active subscription tier
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg capitalize">
                    {subscriptionTier || "Free"}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Plan Features</h3>
                  <div className="space-y-2">
                    {subscriptionTier === "free" && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Up to 3 aquariums</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Basic water testing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-500">✗</span>
                          <span>No custom parameter templates</span>
                        </div>
                      </>
                    )}
                    {subscriptionTier === "plus" && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Unlimited aquariums</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Advanced water testing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Up to 10 custom parameter templates</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button onClick={() => navigate("/pricing")} variant="default">
                  {subscriptionTier === "free" ? "Upgrade Plan" : "Manage Subscription"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
