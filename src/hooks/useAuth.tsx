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
  onboardingCompleted: boolean | null;
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
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isInitialLoad = true;
    let safetyTimeoutCleared = false;
    console.log('🔵 Auth: useEffect initializing');

    // Safety timeout to ensure loading is set to false
    const safetyTimeout = setTimeout(() => {
      if (mounted && !safetyTimeoutCleared) {
        console.warn('⚠️ Auth: Safety timeout triggered, forcing loading = false');
        setLoading(false);
      }
    }, 15000); // 15 seconds max
    
    const clearSafetyTimeout = () => {
      safetyTimeoutCleared = true;
      clearTimeout(safetyTimeout);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔵 Auth: State change event:', event, 'Session exists:', !!session);
        
        // Skip profile fetch on initial SIGNED_IN since initializeAuth handles it
        if (event === 'SIGNED_IN' && isInitialLoad) {
          console.log('🔵 Auth: Skipping duplicate fetch on initial SIGNED_IN');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log auth events to Sentry
        addBreadcrumb(`Auth event: ${event}`, 'auth', { userId: session?.user?.id }, FeatureArea.AUTH);
        
        // Only fetch profile on non-initial auth changes
        if (session?.user && event !== 'INITIAL_SESSION') {
          console.log('🔵 Auth: Fetching profile for user:', session.user.id);
          setLoading(true);
          try {
            await Promise.all([
              checkAdminStatus(session.user.id),
              fetchUserProfile(session.user.id)
            ]);
            console.log('🟢 Auth: Profile fetch complete');
          } catch (error) {
            console.error('🔴 Auth: Error in parallel fetch:', error);
            setLoading(false);
          }
        } else if (!session) {
          console.log('🔵 Auth: No session, clearing state');
          setIsAdmin(false);
          setUserName(null);
          setSubscriptionTier(null);
          setCanCreateCustomTemplates(false);
          setThemePreference(null);
          setLanguagePreference(null);
          setUnitPreference(null);
          setOnboardingCompleted(false);
          setRoles([]);
          setPermissions([]);
          clearUserContext();
          setLoading(false);
          console.log('🟢 Auth: State cleared, loading = false');
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      console.log('🔵 Auth: Checking for existing session');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('🔴 Auth: Error getting session:', error);
          setLoading(false);
          clearSafetyTimeout();
          return;
        }
        
        console.log('🔵 Auth: Existing session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔵 Auth: Initializing with existing session');
          try {
            await Promise.all([
              checkAdminStatus(session.user.id),
              fetchUserProfile(session.user.id)
            ]);
            console.log('🟢 Auth: Initial profile fetch complete');
            isInitialLoad = false; // Mark initial load complete
            clearSafetyTimeout();
          } catch (error) {
            console.error('🔴 Auth: Error in initial fetch:', error);
            setLoading(false);
            clearSafetyTimeout();
          }
        } else {
          setLoading(false);
          clearSafetyTimeout();
          console.log('🟢 Auth: No existing session, loading = false');
        }
      } catch (error) {
        console.error('🔴 Auth: Exception in initializeAuth:', error);
        setLoading(false);
        clearSafetyTimeout();
      }
    };

    initializeAuth();

    return () => {
      console.log('🔵 Auth: useEffect cleanup');
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string) => {
    console.log('🔵 Auth: checkAdminStatus starting for:', userId);
    try {
      // Fetch roles and permissions in parallel with reduced timeout
      const rolesPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const permsPromise = (supabase as any).rpc('get_user_permissions', {
        _user_id: userId
      });

      // Reduced timeout (5 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );

      const results = await Promise.race([
        Promise.all([rolesPromise, permsPromise]),
        timeoutPromise
      ]) as any;
      
      const [rolesResult, permsResult] = results;
      
      console.log('🔵 Auth: Roles result:', rolesResult?.data);
      console.log('🔵 Auth: Perms result:', permsResult?.data);
      
      const userRoles = rolesResult?.data?.map((r: any) => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin') || userRoles.includes('super_admin'));
      
      // Extract permission names from the result
      const permissionNames = permsResult?.data?.map((p: any) => p.permission_name || p) || [];
      setPermissions(permissionNames);
      
      console.log('🟢 Auth: checkAdminStatus complete - roles:', userRoles.length, 'perms:', permissionNames.length);
    } catch (error: any) {
      console.error('🔴 Auth: Error in checkAdminStatus:', error.message);
      // Don't throw - allow auth to continue with empty roles/permissions
      setRoles([]);
      setPermissions([]);
      setIsAdmin(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    console.log('🔵 Auth: fetchUserProfile starting for:', userId);
    try {
      // Simplified query without timeout wrapper - let Supabase handle timeouts
      const { data, error } = await supabase
        .from('profiles')
        .select('name, subscription_tier, theme_preference, language_preference, unit_preference, onboarding_completed')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('🔵 Auth: Profile query result - data:', !!data, 'error:', error?.message);
      
      if (error) {
        console.error('🔴 Auth: Error fetching user profile:', error.message);
        // Set loading false and return - don't block auth flow
        setLoading(false);
        return;
      }
      
      if (data) {
        setUserName(data.name);
        setSubscriptionTier(data.subscription_tier);
        setThemePreference(data.theme_preference);
        setLanguagePreference(data.language_preference);
        setUnitPreference(data.unit_preference);
        setOnboardingCompleted(data.onboarding_completed === true);
        setCanCreateCustomTemplates(['plus', 'gold', 'enterprise'].includes(data.subscription_tier || ''));
        
        setUserContext(userId, undefined, data.name || undefined);
        
        console.log('🟢 Auth: Profile loaded - name:', data.name, 'onboarding:', data.onboarding_completed);
      } else {
        console.warn('⚠️ Auth: No profile data found for user:', userId);
        // Still consider auth complete even without profile
      }
    } catch (error: any) {
      console.error('🔴 Auth: Exception in fetchUserProfile:', error.message);
    } finally {
      setLoading(false);
      console.log('🟢 Auth: fetchUserProfile complete, loading = false');
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    addBreadcrumb('User attempting sign in', 'auth', undefined, FeatureArea.AUTH);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Log login attempt (fire and forget, don't block)
      if (data?.user) {
        addBreadcrumb(
          error ? 'Sign in failed' : 'Sign in successful',
          'auth',
          { userId: data.user.id, error: error?.message },
          FeatureArea.AUTH
        );
        setUserContext(data.user.id, data.user.email, userName || undefined);
        logLoginHistory(data.user.id, !error, error?.message).catch(console.error);
        if (!error) {
          logActivity({ actionType: 'login', userId: data.user.id }).catch(console.error);
        }
      }
      
      return { error };
    } catch (error: any) {
      addBreadcrumb('Sign in error', 'auth', { error: error.message }, FeatureArea.AUTH);
      // Catch suspension/ban errors from fetchUserProfile
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    addBreadcrumb('User attempting sign up', 'auth', { name }, FeatureArea.AUTH);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    
    // Log signup result
    if (error) {
      addBreadcrumb('Sign up failed', 'auth', { error: error.message }, FeatureArea.AUTH);
      if (data?.user) {
        logLoginHistory(data.user.id, false, error.message).catch(console.error);
      }
    } else if (data?.user) {
      addBreadcrumb('Sign up successful', 'auth', { userId: data.user.id }, FeatureArea.AUTH);
      setUserContext(data.user.id, data.user.email, name);
      logLoginHistory(data.user.id, true).catch(console.error);
      logActivity({ actionType: 'login', userId: data.user.id, actionDetails: { type: 'signup' } }).catch(console.error);
    }
    
    return { error };
  };

  const signOut = async () => {
    addBreadcrumb('User signing out', 'auth', undefined, FeatureArea.AUTH);
    const currentUserId = user?.id;
    
    await supabase.auth.signOut();
    
    // Log logout activity (fire and forget)
    if (currentUserId) {
      logActivity({ actionType: 'logout', userId: currentUserId }).catch(console.error);
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
  
  // Handle edge case where context is undefined during iOS PWA cold starts
  // This prevents "Right side of assignment cannot be destructured" errors
  if (context === undefined) {
    // Return a safe default object instead of throwing
    // This allows the component to render and re-attempt once context is ready
    return {
      user: null,
      session: null,
      userName: null,
      isAdmin: false,
      roles: [] as string[],
      permissions: [] as string[],
      subscriptionTier: null,
      canCreateCustomTemplates: false,
      themePreference: null,
      languagePreference: null,
      unitPreference: null,
      units: 'imperial' as UnitSystem,
      onboardingCompleted: null,
      loading: true, // Important: indicate we're still loading
      refreshProfile: async () => {},
      signIn: async () => ({ error: new Error('Auth not initialized') as any }),
      signUp: async () => ({ error: new Error('Auth not initialized') as any }),
      signOut: async () => {},
      hasRole: () => false,
      hasPermission: () => false,
      hasAnyRole: () => false,
    };
  }
  
  return context;
};
