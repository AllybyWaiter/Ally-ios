import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from 'zod';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

// Password validation schema
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Lock, Trash2, Moon, Sun, Monitor,
  Globe, Shield, Crown, Brain, MapPin,
  Bell, HelpCircle, MessageSquare, Star, Download, FileText, ExternalLink,
  Mail, ChevronRight, ChevronDown, BookOpen, Sparkles, Loader2,
  Palette, Ruler, Cloud, Bluetooth, Waves, LogOut
} from "lucide-react";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import MemoryManager from "@/components/settings/MemoryManager";
import { WeatherSettings } from "@/components/settings/WeatherSettings";
import { UpgradePlanDialog } from "@/components/settings/UpgradePlanDialog";
import { ReferralSection } from "@/components/settings/ReferralSection";
import { ReferralRewards } from "@/components/settings/ReferralRewards";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useRevenueCat } from "@/hooks/useRevenueCat";

const APP_VERSION = "1.0.0";

type MaybeSingleLikeResult<T> = Promise<{ data: T | null; error: unknown }>;

function maybeSingleCompat<T>(query: {
  maybeSingle?: () => MaybeSingleLikeResult<T>;
  single?: () => MaybeSingleLikeResult<T>;
}): MaybeSingleLikeResult<T> {
  if (typeof query.maybeSingle === 'function') {
    return query.maybeSingle();
  }
  if (typeof query.single === 'function') {
    return query.single();
  }
  return Promise.resolve({
    data: null,
    error: new Error('Supabase query builder missing maybeSingle/single'),
  });
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['1 water body', '5 test logs per month', 'Basic AI assistant', 'Task reminders'],
  basic: ['1 water body', '10 test logs per month', 'AI recommendations', 'Basic smart scheduling'],
  plus: ['3 water bodies', 'Unlimited test logs', 'AI recommendations', 'Ally remembers your setup', 'Equipment tracking'],
  gold: ['10 water bodies', 'Unlimited test logs', 'Multi-system management', 'Export water history', 'Priority AI support'],
  business: ['Unlimited water bodies', 'Unlimited test logs', 'Multi-system management', 'Export water history', 'Priority AI support'],
};

const Settings = () => {
  const { user, userName, subscriptionTier, unitPreference, themePreference, languagePreference, hemisphere: userHemisphere, signOut, refreshProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();

  // RevenueCat for native subscription management
  const {
    isNative: isNativePlatform,
    isPro: _isPro,
    subscriptionTier: rcSubscriptionTier,
    restore,
    showCustomerCenter,
    showPaywall,
    refreshCustomerInfo,
    isLoading: _rcLoading
  } = useRevenueCat();

  // Use RevenueCat tier on native, fallback to auth context tier
  const effectiveSubscriptionTier = isNativePlatform ? rcSubscriptionTier : subscriptionTier;
  
  const [isLoading, setIsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [name, setName] = useState(userName || "");
  const [units, setUnits] = useState(unitPreference || "imperial");
  // Default hemisphere based on timezone if not set
  const getDefaultHemisphere = () => {
    if (userHemisphere) return userHemisphere;
    // Use timezone to guess hemisphere - most southern timezones have negative UTC offsets in southern hemisphere
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const southernTimezones = ['Australia', 'Auckland', 'Antarctica', 'Argentina', 'Brazil', 'Chile', 'Africa/Johannesburg'];
      if (southernTimezones.some(tz => timezone.includes(tz))) {
        return 'southern';
      }
    } catch {
      // Fall back to northern if timezone detection fails
    }
    return 'northern';
  };
  const [hemisphere, setHemisphere] = useState(getDefaultHemisphere());
  const [skillLevel, setSkillLevel] = useState<string>("beginner");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showUnitConfirmDialog, setShowUnitConfirmDialog] = useState(false);
  const [pendingUnitChange, setPendingUnitChange] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  
  // Active detail section for sheets/dialogs
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Local theme state for immediate UI feedback
  const [selectedTheme, setSelectedTheme] = useState<string>(theme || themePreference || 'system');

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  useEffect(() => { if (userName) setName(userName); }, [userName]);
  useEffect(() => { if (unitPreference) setUnits(unitPreference); }, [unitPreference]);
  useEffect(() => { if (userHemisphere) setHemisphere(userHemisphere); }, [userHemisphere]);

  useEffect(() => {
    const fetchSkillLevel = async () => {
      if (!user) return;
      const profileQuery = supabase
        .from('profiles')
        .select('skill_level, weather_enabled')
        .eq('user_id', user.id);
      const { data, error } = await maybeSingleCompat<{
        skill_level: string | null;
        weather_enabled: boolean | null;
      }>(profileQuery as unknown as {
        maybeSingle?: () => MaybeSingleLikeResult<{
          skill_level: string | null;
          weather_enabled: boolean | null;
        }>;
        single?: () => MaybeSingleLikeResult<{
          skill_level: string | null;
          weather_enabled: boolean | null;
        }>;
      });
      if (error) {
        logger.error('Failed to fetch skill level:', error);
        return;
      }
      if (data?.skill_level) setSkillLevel(data.skill_level);
      if (data?.weather_enabled !== undefined) setWeatherEnabled(data.weather_enabled);
    };
    fetchSkillLevel();
  }, [user]);

  useEffect(() => {
    let mounted = true;
    if (themePreference && theme !== themePreference && mounted) {
      setTheme(themePreference);
      setSelectedTheme(themePreference);
    }
    return () => { mounted = false; };
  }, [themePreference, theme, setTheme]);

  // Sync local theme state when theme changes externally
  useEffect(() => {
    if (theme && theme !== selectedTheme) {
      setSelectedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (languagePreference && i18n.language !== languagePreference) {
      i18n.changeLanguage(languagePreference);
    }
  }, [languagePreference]);

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map(n => n?.[0] || "").filter(Boolean).join("").toUpperCase().slice(0, 2) || "U";
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    // Sanitize input - trim and limit length
    const sanitizedName = name?.trim().slice(0, 100) || null;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: sanitizedName, skill_level: skillLevel })
        .eq('user_id', user.id);
      if (error) throw error;
      setName(sanitizedName || "");
      await refreshProfile?.();
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    if (!user) return;
    // Update local state immediately for instant UI feedback
    setSelectedTheme(newTheme);
    // Apply theme to next-themes
    setTheme(newTheme);

    // Force immediate DOM update for Capacitor/iOS WebView
    // next-themes can be slow to apply on mobile, so we manually set the class
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }

    // Persist to database and refresh profile so ThemeWrapper gets updated value
    try {
      const { error: dbError } = await supabase.from('profiles').update({ theme_preference: newTheme }).eq('user_id', user.id);
      if (dbError) throw dbError;
      // Refresh profile to sync auth context with new theme
      await refreshProfile();
    } catch (error: unknown) {
      logger.error('Failed to save theme preference:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (!user) return;
    i18n.changeLanguage(newLanguage);
    try {
      const { error } = await supabase.from('profiles').update({ language_preference: newLanguage }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Language updated", description: "Your language preference has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save language preference.", variant: "destructive" });
    }
  };

  const handleHemisphereChange = async (newHemisphere: string) => {
    if (!user || newHemisphere === hemisphere) return;
    setHemisphere(newHemisphere);
    try {
      const { error } = await supabase.from('profiles').update({ hemisphere: newHemisphere }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Location updated", description: "Your hemisphere has been saved." });
    } catch {
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
    } catch {
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
    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      toast({ title: "Invalid password", description: passwordValidation.error.errors[0]?.message || "Please check your password.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
      setActiveSection(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No active session');
      }
      const response = await supabase.functions.invoke('export-user-data', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
      });
      if (response.error) throw response.error;
      if (!response.data) throw new Error('No data received');
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to export data.';
      toast({ title: "Export failed", description: message, variant: "destructive" });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error('No active session');
      const response = await supabase.functions.invoke('delete-user-account', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
      });
      if (response.error) throw response.error;
      toast({ title: "Account deleted", description: "Your account and all data have been permanently deleted." });
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
      await signOut();
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateApp = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const APP_STORE_ID = import.meta.env.VITE_APP_STORE_ID || "";
    const PLAY_STORE_ID = import.meta.env.VITE_PLAY_STORE_ID || "com.allybywaiter.ally";
    if (isIOS && APP_STORE_ID) {
      window.open(`https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`, '_blank');
    } else if (isAndroid && PLAY_STORE_ID) {
      window.open(`https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`, '_blank');
    } else {
      navigate('/contact?type=feedback');
      toast({ title: "Share Your Feedback", description: "App Store ratings coming soon!" });
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);

    // Use RevenueCat Customer Center on native platforms
    if (isNativePlatform) {
      try {
        await showCustomerCenter();
      } catch (e) {
        logger.error('Customer center error:', e);
        // Fallback to native subscription settings
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          window.location.href = 'https://apps.apple.com/account/subscriptions';
        } else {
          window.location.href = 'https://play.google.com/store/account/subscriptions';
        }
      } finally {
        setPortalLoading(false);
      }
      return;
    }

    // Web: Use Stripe portal
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        toast({ title: "Session Expired", description: "Please sign in again.", variant: "destructive" });
        setPortalLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: window.location.href }
      });
      if (error) throw new Error(error.message);
      if (data?.url) {
        try {
          const redirectUrl = new URL(data.url);
          if (!redirectUrl.hostname.endsWith('stripe.com')) {
            toast({ title: "Invalid Redirect", description: "Unexpected redirect URL. Please try again.", variant: "destructive" });
            setPortalLoading(false);
            return;
          }
          window.location.href = data.url;
        } catch {
          toast({ title: "Invalid URL", description: "Received an invalid URL. Please try again.", variant: "destructive" });
          setPortalLoading(false);
        }
        return;
      }
      if (data?.error === 'no_subscription') {
        setPortalLoading(false);
        if (isIOS) {
          window.location.href = 'https://apps.apple.com/account/subscriptions';
        } else if (isAndroid) {
          window.location.href = 'https://play.google.com/store/account/subscriptions';
        } else {
          toast({ title: "No Active Subscription", description: "Upgrade to manage your subscription." });
          navigate('/pricing');
        }
        return;
      }
      throw new Error('Failed to get portal URL');
    } catch (e) {
      logger.error('Subscription management error:', e);
      setPortalLoading(false);
      if (isIOS) {
        window.location.href = 'https://apps.apple.com/account/subscriptions';
      } else if (isAndroid) {
        window.location.href = 'https://play.google.com/store/account/subscriptions';
      } else {
        toast({ title: "Unable to Open Portal", description: "Please try again.", variant: "destructive" });
      }
    }
  };

  const handleRestorePurchases = async () => {
    if (!isNativePlatform) {
      toast({ title: "Purchases Restored", description: "Your subscription status has been refreshed." });
      return;
    }

    setPortalLoading(true);
    try {
      const restored = await restore();
      // Also refresh customer info to ensure UI is up to date
      await refreshCustomerInfo();
      if (restored) {
        toast({ title: "Purchases Restored", description: "Your subscription has been restored successfully." });
      } else {
        toast({ title: "No Purchases Found", description: "No previous purchases were found to restore." });
      }
    } catch (e) {
      logger.error('Restore error:', e);
      toast({ title: "Restore Failed", description: "Unable to restore purchases. Please try again.", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    // On native platforms, show RevenueCat paywall directly
    if (isNativePlatform) {
      setActiveSection(null); // Close the subscription sheet
      setPortalLoading(true);
      try {
        logger.log('Settings: Opening paywall...');
        const purchased = await showPaywall();
        logger.log('Settings: Paywall closed, purchased:', purchased);
        // Give RevenueCat a moment to process the transaction (sandbox can be slow)
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Always refresh customer info after paywall closes to get latest subscription status
        logger.log('Settings: Calling refreshCustomerInfo...');
        await refreshCustomerInfo();
        logger.log('Settings: refreshCustomerInfo complete, current tier:', rcSubscriptionTier);
        if (purchased) {
          toast({ title: "Subscription Activated!", description: "Welcome to Ally Pro!" });
        }
      } catch (e) {
        logger.error('Paywall error:', e);
        toast({ title: "Unable to Load Paywall", description: "Please try again.", variant: "destructive" });
      } finally {
        setPortalLoading(false);
      }
      return;
    }

    // On web, show the upgrade dialog
    setActiveSection(null);
    setShowUpgradeDialog(true);
  };

  const handleToggleWeather = async (enabled: boolean) => {
    if (!user) return;
    setWeatherEnabled(enabled);
    try {
      const { error } = await supabase.from('profiles').update({ weather_enabled: enabled }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: enabled ? "Weather enabled" : "Weather disabled" });
    } catch {
      toast({ title: "Error", description: "Failed to update weather setting.", variant: "destructive" });
    }
  };

  // Detail sheet/dialog wrapper
  const DetailSheet = ({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) => {
    const isOpen = activeSection === id;
    const onClose = () => setActiveSection(null);

    if (isMobile) {
      return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DrawerContent
            className="max-h-[90vh]"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            <div className="px-4 pb-8 overflow-y-auto">{children}</div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-md max-h-[85vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-safe">
      <div className="container mx-auto px-4 py-6 pt-8 pb-24 md:pb-8 max-w-lg">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/dashboard")} 
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>

        {/* Profile Card */}
        <div className="rounded-2xl bg-background/80 backdrop-blur-lg border border-border/30 p-4 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
              <AvatarFallback className="bg-[#34406A] text-white text-xl font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold truncate">{userName || "User"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <Badge variant="secondary" className="mt-1.5 text-xs">
                {skillLevel === 'beginner' ? '🌱' : skillLevel === 'intermediate' ? '🐠' : '🏆'}{' '}
                {skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setActiveSection('profile')}>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* ADMIN (only for admins) */}
          {isAdmin && (
            <SettingsSection title="Admin">
              <SettingsRow
                icon={Shield}
                iconClassName="bg-amber-500/10 text-amber-500"
                label="Admin Panel"
                description="Manage app and users"
                href="/admin"
              />
            </SettingsSection>
          )}

          {/* ACCOUNT */}
          <SettingsSection title="Account">
            <SettingsRow
              icon={Shield}
              iconClassName="bg-secondary/10 text-secondary"
              label="Security"
              description="Password and protection"
              onClick={() => setActiveSection('security')}
            />
            <SettingsRow
              icon={Crown}
              iconClassName="bg-amber-500/10 text-amber-500"
              label="Subscription"
              value={<Badge variant="secondary" className="text-xs">{(effectiveSubscriptionTier || 'FREE').toUpperCase()}</Badge>}
              onClick={() => setActiveSection('subscription')}
            />
          </SettingsSection>

          {/* PREFERENCES */}
          <SettingsSection title="Preferences">
            {/* Theme - Inline */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-secondary" />
                </div>
                <span className="font-medium text-sm">Appearance</span>
              </div>
              <div className="flex gap-2 ml-11">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                      selectedTheme === t ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {t === 'light' && <Sun className="h-3.5 w-3.5" />}
                    {t === 'dark' && <Moon className="h-3.5 w-3.5" />}
                    {t === 'system' && <Monitor className="h-3.5 w-3.5" />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            <SettingsRow
              icon={Globe}
              iconClassName="bg-accent/10 text-accent"
              label="Language & Region"
              value={<span className="text-sm text-muted-foreground">{i18n.language.toUpperCase()}</span>}
              onClick={() => setActiveSection('language')}
            />
            <SettingsRow
              icon={Ruler}
              iconClassName="bg-primary/10 text-primary"
              label="Units"
              value={<span className="text-sm text-muted-foreground capitalize">{units}</span>}
              onClick={() => setActiveSection('units')}
            />
          </SettingsSection>

          {/* FEATURES */}
          <SettingsSection title="Features">
            <SettingsRow
              icon={Cloud}
              iconClassName="bg-primary/10 text-primary"
              label="Weather Dashboard"
              description="Show weather-aware content"
              rightElement={<Switch checked={weatherEnabled} onCheckedChange={handleToggleWeather} />}
            />
            <SettingsRow
              icon={MapPin}
              iconClassName="bg-secondary/10 text-secondary"
              label="Weather Settings"
              description="Location and display options"
              onClick={() => setActiveSection('weather')}
            />
            <SettingsRow
              icon={Bell}
              iconClassName="bg-accent/10 text-accent"
              label="Notifications"
              description="Alerts and reminders"
              onClick={() => setActiveSection('notifications')}
            />
            <SettingsRow
              icon={Brain}
              iconClassName="bg-primary/10 text-primary"
              label="AI Memory"
              description="What Ally remembers"
              onClick={() => setActiveSection('memory')}
            />
            <SettingsRow
              icon={Sparkles}
              iconClassName="bg-green-500/10 text-green-500"
              label="Refer Friends"
              description="Earn free months of Plus"
              onClick={() => setActiveSection('referrals')}
            />
          </SettingsSection>

          {/* DEVICES */}
          <SettingsSection title="Devices">
            <SettingsRow
              icon={Waves}
              iconClassName="bg-blue-500/10 text-blue-500"
              label="Ally Wand"
              description="BLE water testing wand"
              onClick={() => setActiveSection('ally-wand')}
              rightElement={
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                  BLE
                </Badge>
              }
            />
          </SettingsSection>

          {/* SUPPORT - Collapsible */}
          <SettingsSection>
            <SettingsRow
              icon={HelpCircle}
              iconClassName="bg-primary/10 text-primary"
              label="Support"
              description="Help, FAQ, and feedback"
              onClick={() => toggleSection('support')}
              rightElement={
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  expandedSections.support && "rotate-180"
                )} />
              }
            />
            {expandedSections.support && (
              <>
                <SettingsRow icon={BookOpen} iconClassName="bg-primary/10 text-primary" label="Help Center" description="Tutorials and guides" href="/help" />
                <SettingsRow icon={HelpCircle} iconClassName="bg-secondary/10 text-secondary" label="FAQ" description="Common questions" href="/faq" />
                <SettingsRow icon={Mail} iconClassName="bg-accent/10 text-accent" label="Contact Us" description="Get in touch" href="/contact" />
                <SettingsRow icon={Star} iconClassName="bg-amber-500/10 text-amber-500" label="Rate on App Store" description="Love the app? Review us" onClick={handleRateApp} rightElement={<ExternalLink className="h-5 w-5 text-muted-foreground" />} />
                <SettingsRow icon={MessageSquare} iconClassName="bg-green-500/10 text-green-500" label="Send Feedback" description="Share your thoughts" href="/contact?type=feedback" />
              </>
            )}
          </SettingsSection>

          {/* LEGAL - Collapsible */}
          <SettingsSection>
            <SettingsRow
              icon={FileText}
              iconClassName="bg-secondary/10 text-secondary"
              label="Legal"
              description="Privacy, terms, and policies"
              onClick={() => toggleSection('legal')}
              rightElement={
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  expandedSections.legal && "rotate-180"
                )} />
              }
            />
            {expandedSections.legal && (
              <>
                <SettingsRow icon={Shield} iconClassName="bg-primary/10 text-primary" label="Privacy Policy" description="How we handle your data" href="/privacy" />
                <SettingsRow icon={FileText} iconClassName="bg-secondary/10 text-secondary" label="Terms of Service" description="Rules and guidelines" href="/terms" />
                <SettingsRow icon={FileText} iconClassName="bg-accent/10 text-accent" label="Cookie Policy" description="How we use cookies" href="/cookies" />
                <SettingsRow icon={FileText} iconClassName="bg-muted-foreground/10 text-muted-foreground" label="Subprocessors" description="Third party providers" href="/subprocessors" />
                <SettingsRow icon={Brain} iconClassName="bg-primary/10 text-primary" label="AI Transparency" description="How we use AI" href="/legal/ai-transparency" />
                <SettingsRow icon={Shield} iconClassName="bg-secondary/10 text-secondary" label="Privacy Rights" description="Your data rights" href="/legal/privacy-rights" />
                <SettingsRow icon={FileText} iconClassName="bg-accent/10 text-accent" label="Cookie Preferences" description="Manage cookies" href="/legal/cookie-preferences" />
              </>
            )}
          </SettingsSection>

          {/* ACCOUNT ACTIONS */}
          <SettingsSection title="Account Actions">
            <SettingsRow
              icon={Download}
              iconClassName="bg-primary/10 text-primary"
              label="Export Data"
              description="Download your data"
              onClick={() => setActiveSection('data')}
            />
            <SettingsRow
              icon={LogOut}
              iconClassName="bg-destructive/10 text-destructive"
              label="Sign Out"
              variant="destructive"
              onClick={signOut}
            />
            <SettingsRow
              icon={Trash2}
              iconClassName="bg-destructive/10 text-destructive"
              label="Delete Account"
              description="Permanently delete your account"
              variant="destructive"
              onClick={() => setActiveSection('delete-account')}
            />
          </SettingsSection>

          {/* App Info Footer */}
          <div className="mx-4 sm:mx-0 rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Ally by WA.I.TER</p>
                <p className="text-xs text-muted-foreground">Version {APP_VERSION}</p>
              </div>
              <Badge variant="secondary" className="text-xs">Closed Beta</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} WA.I.TER. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Sheets */}
      <DetailSheet id="profile" title="Edit Profile" description="Update your name and experience level">
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
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-center",
                    skillLevel === level.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-xl">{level.emoji}</span>
                  <p className="text-xs font-medium mt-1">{level.label}</p>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleUpdateProfile} disabled={isLoading} className="w-full">
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </DetailSheet>

      <DetailSheet id="security" title="Security" description="Update your password">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          </div>
          <Button onClick={handleUpdatePassword} disabled={isLoading} className="w-full">
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </DetailSheet>

      <DetailSheet id="subscription" title="Subscription" description="Manage your plan">
        <div className="space-y-4">
          <div className="space-y-2">
            {(PLAN_FEATURES[effectiveSubscriptionTier || 'free'] || PLAN_FEATURES.free).map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {(!effectiveSubscriptionTier || effectiveSubscriptionTier === 'free') ? (
              <Button onClick={handleUpgradePlan} disabled={portalLoading} className="w-full">
                {portalLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : <><Sparkles className="h-4 w-4 mr-2" />Upgrade Plan</>}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading} className="w-full">
                {portalLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opening...</> : <><ExternalLink className="h-4 w-4 mr-2" />Manage Subscription</>}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setActiveSection(null);
                navigate('/pricing');
              }}
              className="w-full text-muted-foreground"
            >
              Compare All Plans
            </Button>
            <Button variant="ghost" onClick={handleRestorePurchases} disabled={portalLoading} className="w-full">
              {portalLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Restoring...</> : 'Restore Purchases'}
            </Button>
          </div>
        </div>
      </DetailSheet>

      <DetailSheet id="data" title="Data & Privacy" description="Export your data">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Download Your Data</h4>
            <p className="text-sm text-muted-foreground mb-3">Export all your data in JSON format.</p>
            <Button onClick={handleExportData} disabled={exportLoading} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? "Exporting..." : "Download My Data"}
            </Button>
          </div>
        </div>
      </DetailSheet>

      <DetailSheet id="delete-account" title="Delete Account" description="This action cannot be undone">
        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
            <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Permanent Account Deletion
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              This will permanently delete your account and all associated data including:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mb-3 space-y-1">
              <li>All water bodies and test history</li>
              <li>Calendar events and tasks</li>
              <li>AI conversation history</li>
              <li>Profile and preferences</li>
            </ul>
            <p className="text-sm font-medium text-destructive mb-3">This cannot be undone.</p>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">Delete My Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>This will permanently delete all your data.</p>
                    <p className="font-medium">Type DELETE to confirm:</p>
                    <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteConfirmText !== "DELETE" || isLoading} className="bg-destructive hover:bg-destructive/90">
                    {isLoading ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DetailSheet>

      <DetailSheet id="language" title="Language & Region" description="Choose your language and hemisphere">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Language</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en', name: 'English', flag: '🇺🇸' },
                { code: 'es', name: 'Español', flag: '🇪🇸' },
                { code: 'fr', name: 'Français', flag: '🇫🇷' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                    i18n.language === lang.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-xs font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-sm font-medium mb-2 block">Hemisphere</Label>
            <p className="text-xs text-muted-foreground mb-2">For seasonal reminders</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'northern', label: 'Northern', emoji: '🌎' },
                { value: 'southern', label: 'Southern', emoji: '🌍' }
              ].map((h) => (
                <button
                  key={h.value}
                  onClick={() => handleHemisphereChange(h.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                    hemisphere === h.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-xl">{h.emoji}</span>
                  <span className="text-sm font-medium">{h.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DetailSheet>

      <DetailSheet id="units" title="Units" description="Choose your measurement system">
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'imperial', label: 'Imperial', details: 'Gallons, °F, inches' },
            { value: 'metric', label: 'Metric', details: 'Liters, °C, cm' }
          ].map((u) => (
            <button
              key={u.value}
              onClick={() => handleUnitChangeRequest(u.value)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left",
                units === u.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <p className="font-medium">{u.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{u.details}</p>
            </button>
          ))}
        </div>
      </DetailSheet>

      <DetailSheet id="weather" title="Weather Settings" description="Location and display options">
        <WeatherSettings />
      </DetailSheet>

      <DetailSheet id="notifications" title="Notifications" description="Manage alerts and reminders">
        <NotificationSettings />
      </DetailSheet>

      <DetailSheet id="memory" title="AI Memory" description="What Ally remembers about you">
        <MemoryManager />
      </DetailSheet>

      <DetailSheet id="referrals" title="Refer Friends" description="Earn free months of Plus">
        <div className="space-y-6">
          <ReferralSection />
          <Separator />
          <ReferralRewards />
        </div>
      </DetailSheet>

      <DetailSheet id="ally-wand" title="Ally Wand" description="Manage your BLE water testing wand">
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Waves className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">No Device Connected</p>
                <p className="text-xs text-muted-foreground">Pair your wand to get started</p>
              </div>
            </div>
            <Badge variant="outline" className="text-muted-foreground">Disconnected</Badge>
          </div>

          {/* How to Connect */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">How to Connect</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Power on your Ally Wand</li>
              <li>Go to Water Tests and tap "Use Ally Wand"</li>
              <li>Tap "Find Water Wand" to scan for devices</li>
              <li>Select your wand from the list to pair</li>
            </ol>
          </div>

          {/* Supported Devices */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Supported Devices</h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                { model: 'BLE-9909', params: '5-in-1: pH, EC, TDS, Temp, Salinity' },
                { model: 'BLE-9908', params: '4-in-1: pH, EC, TDS, Temp' },
                { model: 'BLE-C600', params: '7-in-1: pH, EC, TDS, Salinity, S.G., ORP, Temp' },
              ].map((device) => (
                <div key={device.model} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Bluetooth className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{device.model}</p>
                    <p className="text-xs text-muted-foreground truncate">{device.params}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">Troubleshooting</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Make sure Bluetooth is enabled in device settings</li>
              <li>• Keep the wand within 2 meters during pairing</li>
              <li>• If not found, power cycle the wand and try again</li>
            </ul>
          </div>
        </div>
      </DetailSheet>

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
            <AlertDialogCancel onClick={() => { setShowUnitConfirmDialog(false); setPendingUnitChange(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnitChangeConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePlanDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} currentTier={subscriptionTier} />
    </div>
  );
};

export default Settings;
