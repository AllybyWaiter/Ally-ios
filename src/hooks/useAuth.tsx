import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext, clearUserContext, addBreadcrumb, FeatureArea } from '@/lib/sentry';
import { UnitSystem } from '@/lib/unitConversions';
import { logActivity, logLoginHistory } from '@/lib/activityLogger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userName: string | null;
  isAdmin: boolean;
  roles: string[];
  permissions: string[];
  subscriptionTier: string | null;
  canCreateCustomTemplates: boolean;
  themePreference: string | null;
  languagePreference: string | null;
  unitPreference: string | null;
  units: UnitSystem | null;
  onboardingCompleted: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [canCreateCustomTemplates, setCanCreateCustomTemplates] = useState(false);
  const [themePreference, setThemePreference] = useState<string | null>(null);
  const [languagePreference, setLanguagePreference] = useState<string | null>(null);
  const [unitPreference, setUnitPreference] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log auth events to Sentry
        addBreadcrumb(`Auth event: ${event}`, 'auth', { userId: session?.user?.id }, FeatureArea.AUTH);
        
        // Check admin status and fetch profile
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setUserName(null);
          setSubscriptionTier(null);
          setCanCreateCustomTemplates(false);
      setThemePreference(null);
      setLanguagePreference(null);
      setUnitPreference(null);
      setOnboardingCompleted(false);
          clearUserContext();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    // Fetch all roles for the user
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    const userRoles = rolesData?.map(r => r.role) || [];
    setRoles(userRoles);
    setIsAdmin(userRoles.includes('admin') || userRoles.includes('super_admin'));
    
    // Fetch permissions
    const { data: permsData } = await (supabase as any).rpc('get_user_permissions', {
      _user_id: userId
    });
    
    // Extract permission names from the result
    const permissionNames = permsData?.map((p: any) => p.permission_name || p) || [];
    setPermissions(permissionNames);
    setLoading(false);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, subscription_tier, theme_preference, language_preference, unit_preference, onboarding_completed')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      setUserName(data.name);
      setSubscriptionTier(data.subscription_tier);
      setThemePreference(data.theme_preference);
      setLanguagePreference(data.language_preference);
      setUnitPreference(data.unit_preference);
      setOnboardingCompleted(data.onboarding_completed || false);
      setCanCreateCustomTemplates(['plus', 'gold', 'enterprise'].includes(data.subscription_tier || ''));
      
      // Set user context in Sentry
      setUserContext(userId, undefined, data.name || undefined);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    addBreadcrumb('User attempting sign in', 'auth', undefined, FeatureArea.AUTH);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Log login attempt
    if (data?.user) {
      setTimeout(() => {
        logLoginHistory(data.user.id, !error, error?.message);
        if (!error) {
          logActivity({ actionType: 'login', userId: data.user.id });
        }
      }, 0);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    addBreadcrumb('User attempting sign up', 'auth', { name }, FeatureArea.AUTH);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    addBreadcrumb('User signing out', 'auth', undefined, FeatureArea.AUTH);
    const currentUserId = user?.id;
    
    await supabase.auth.signOut();
    
    // Log logout activity
    if (currentUserId) {
      setTimeout(() => {
        logActivity({ actionType: 'logout', userId: currentUserId });
      }, 0);
    }
    
    setIsAdmin(false);
    setRoles([]);
    setPermissions([]);
    setUserName(null);
    setSubscriptionTier(null);
    setCanCreateCustomTemplates(false);
    setThemePreference(null);
    setLanguagePreference(null);
    setUnitPreference(null);
    setOnboardingCompleted(false);
    clearUserContext();
  };

  const hasRole = (role: string) => roles.includes(role);
  const hasPermission = (permission: string) => permissions.includes(permission);
  const hasAnyRole = (checkRoles: string[]) => checkRoles.some(role => roles.includes(role));

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userName, 
      isAdmin,
      roles,
      permissions,
      subscriptionTier, 
      canCreateCustomTemplates, 
      themePreference, 
      languagePreference, 
      unitPreference, 
      units: (unitPreference as UnitSystem) || 'imperial',
      onboardingCompleted, 
      loading,
      refreshProfile,
      signIn, 
      signUp, 
      signOut,
      hasRole,
      hasPermission,
      hasAnyRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
