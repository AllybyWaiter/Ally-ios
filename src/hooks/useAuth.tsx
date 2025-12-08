import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
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

// Timeout constants for iOS PWA optimization
const SAFETY_TIMEOUT_MS = 5000; // Max wait time for auth to complete
const PROFILE_TIMEOUT_MS = 3000; // Max wait for profile fetch before continuing

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

  const checkAdminStatus = useCallback(async (userId: string) => {
    console.log('🔵 Auth: checkAdminStatus starting for:', userId);
    try {
      const rolesPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const permsPromise = (supabase as any).rpc('get_user_permissions', {
        _user_id: userId
      });

      const [rolesResult, permsResult] = await Promise.all([rolesPromise, permsPromise]);
      
      console.log('🔵 Auth: Roles result:', rolesResult?.data);
      
      const userRoles = rolesResult?.data?.map((r: any) => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin') || userRoles.includes('super_admin'));
      
      const permissionNames = permsResult?.data?.map((p: any) => p.permission_name || p) || [];
      setPermissions(permissionNames);
      
      console.log('🟢 Auth: checkAdminStatus complete - roles:', userRoles.length);
    } catch (error: any) {
      console.error('🔴 Auth: Error in checkAdminStatus:', error.message);
      setRoles([]);
      setPermissions([]);
      setIsAdmin(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('🔵 Auth: fetchUserProfile starting for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, subscription_tier, theme_preference, language_preference, unit_preference, onboarding_completed')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('🔴 Auth: Error fetching user profile:', error.message);
        setOnboardingCompleted(false);
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
        
        console.log('🟢 Auth: Profile loaded - name:', data.name);
      } else {
        console.warn('⚠️ Auth: No profile data for user:', userId);
        setOnboardingCompleted(false);
      }
    } catch (error: any) {
      console.error('🔴 Auth: Exception in fetchUserProfile:', error.message);
      // Set default value to prevent stuck loading
      setOnboardingCompleted(false);
    }
  }, []);

  // Visibility-based session recovery for iOS PWA
  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    
    console.log('🔵 Auth: App became visible, checking session...');
    
    try {
      // Quick session check - set a timeout to abort if stuck
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('⚠️ Auth: Visibility check timeout, forcing loading = false');
          setLoading(false);
        }
      }, 2000);
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('🔴 Auth: Visibility session check error:', error);
        return;
      }
      
      // If we have a session but loading is stuck, force complete
      if (currentSession?.user && loading) {
        console.log('🔵 Auth: Forcing loading complete on visibility change');
        setSession(currentSession);
        setUser(currentSession.user);
        setOnboardingCompleted(prev => prev === null ? false : prev);
        setLoading(false);
        
        // Fetch profile in background (don't await)
        fetchUserProfile(currentSession.user.id).catch(console.error);
        checkAdminStatus(currentSession.user.id).catch(console.error);
      }
      
      // If session changed, update state
      if (currentSession?.user?.id !== user?.id) {
        console.log('🔵 Auth: Session changed on visibility');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (!currentSession) {
          setLoading(false);
          setIsAdmin(false);
          setUserName(null);
          setSubscriptionTier(null);
          setRoles([]);
          setPermissions([]);
          clearUserContext();
        }
      }
    } catch (error) {
      console.error('🔴 Auth: Visibility check error:', error);
      // On error, just ensure we're not stuck loading
      if (loading) {
        setLoading(false);
      }
    }
  }, [user?.id, loading, fetchUserProfile, checkAdminStatus]);

  useEffect(() => {
    let mounted = true;
    let isInitialLoad = true;
    let safetyTimeoutCleared = false;
    console.log('🔵 Auth: useEffect initializing');

    // Reduced safety timeout (5 seconds instead of 15)
    const safetyTimeout = setTimeout(() => {
      if (mounted && !safetyTimeoutCleared) {
        console.warn('⚠️ Auth: Safety timeout triggered, forcing loading = false');
        setLoading(false);
      }
    }, SAFETY_TIMEOUT_MS);
    
    const clearSafetyTimeout = () => {
      safetyTimeoutCleared = true;
      clearTimeout(safetyTimeout);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔵 Auth: State change event:', event, 'Session exists:', !!session);
        
        // ALWAYS update session and user state first - this enables navigation in Auth.tsx
        setSession(session);
        setUser(session?.user ?? null);
        
        // Skip profile fetch on initial SIGNED_IN since initializeAuth handles it
        // But we've already updated the user state above, so navigation will work
        if (event === 'SIGNED_IN' && isInitialLoad) {
          console.log('🔵 Auth: Skipping duplicate profile fetch on initial SIGNED_IN');
          return;
        }
        
        addBreadcrumb(`Auth event: ${event}`, 'auth', { userId: session?.user?.id }, FeatureArea.AUTH);
        
        // Only fetch profile on non-initial auth changes
        if (session?.user && event !== 'INITIAL_SESSION') {
          console.log('🔵 Auth: Fetching profile for user:', session.user.id);
          setLoading(true);
          
          // Use Promise.race to ensure loading completes within timeout
          const profileTimeout = setTimeout(() => {
            if (mounted) {
              console.warn('⚠️ Auth: Profile fetch timeout, continuing...');
              setLoading(false);
            }
          }, PROFILE_TIMEOUT_MS);
          
          try {
            await Promise.all([
              checkAdminStatus(session.user.id),
              fetchUserProfile(session.user.id)
            ]);
            console.log('🟢 Auth: Profile fetch complete');
          } catch (error) {
            console.error('🔴 Auth: Error in parallel fetch:', error);
          } finally {
            clearTimeout(profileTimeout);
            if (mounted) setLoading(false);
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
          
          // Set a hard deadline for profile fetch
          const profileDeadline = setTimeout(() => {
            if (mounted) {
              console.warn('⚠️ Auth: Profile deadline reached, continuing...');
              setOnboardingCompleted(prev => prev === null ? false : prev);
              setLoading(false);
              clearSafetyTimeout();
            }
          }, PROFILE_TIMEOUT_MS);
          
          try {
            await Promise.all([
              checkAdminStatus(session.user.id),
              fetchUserProfile(session.user.id)
            ]);
            console.log('🟢 Auth: Initial profile fetch complete');
            isInitialLoad = false;
          } catch (error) {
            console.error('🔴 Auth: Error in initial fetch:', error);
          } finally {
            clearTimeout(profileDeadline);
            if (mounted) setLoading(false);
            clearSafetyTimeout();
          }
        } else {
          setLoading(false);
          clearSafetyTimeout();
          console.log('🟢 Auth: No existing session, loading = false');
        }
      } catch (error) {
        console.error('🔴 Auth: Exception in initializeAuth:', error);
        if (mounted) setLoading(false);
        clearSafetyTimeout();
      }
    };

    initializeAuth();
    
    // Add visibility change listener for iOS PWA recovery
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🔵 Auth: useEffect cleanup');
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAdminStatus, fetchUserProfile, handleVisibilityChange]);

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
  if (context === undefined) {
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
      loading: true,
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