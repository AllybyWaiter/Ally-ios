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
    let mounted = true;
    let isInitialLoad = true;
    console.log('🔵 Auth: useEffect initializing');

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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
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
        } catch (error) {
          console.error('🔴 Auth: Error in initial fetch:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
        console.log('🟢 Auth: No existing session, loading = false');
      }
    };

    initializeAuth();

    return () => {
      console.log('🔵 Auth: useEffect cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string) => {
    console.log('🔵 Auth: checkAdminStatus starting for:', userId);
    try {
      // Fetch roles and permissions in parallel with timeout
      const rolesPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const permsPromise = (supabase as any).rpc('get_user_permissions', {
        _user_id: userId
      });

      // Add timeout wrapper (10 seconds for initial connection)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      );

      const [rolesResult, permsResult] = await Promise.race([
        Promise.all([rolesPromise, permsPromise]),
        timeoutPromise
      ]) as any;
      
      console.log('🔵 Auth: Roles result:', rolesResult?.data, 'Error:', rolesResult?.error);
      console.log('🔵 Auth: Perms result:', permsResult?.data, 'Error:', permsResult?.error);
      
      const userRoles = rolesResult?.data?.map((r: any) => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin') || userRoles.includes('super_admin'));
      
      // Extract permission names from the result
      const permissionNames = permsResult?.data?.map((p: any) => p.permission_name || p) || [];
      setPermissions(permissionNames);
      
      console.log('🟢 Auth: checkAdminStatus complete');
    } catch (error: any) {
      console.error('🔴 Auth: Error in checkAdminStatus:', error);
      // Don't throw - allow auth to continue with empty roles/permissions
      setRoles([]);
      setPermissions([]);
      setIsAdmin(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    console.log('🔵 Auth: fetchUserProfile starting for:', userId);
    try {
      // Add timeout wrapper
      const queryPromise = supabase
        .from('profiles')
        .select('name, subscription_tier, theme_preference, language_preference, unit_preference, onboarding_completed')
        .eq('user_id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      console.log('🔵 Auth: Profile data:', data);
      console.log('🔵 Auth: Profile error:', error);
      
      if (error) {
        console.error('🔴 Auth: Error fetching user profile:', error);
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
        
        console.log('🟢 Auth: Profile loaded successfully');
      } else {
        console.warn('⚠️ Auth: No profile data found for user:', userId);
      }
    } catch (error: any) {
      console.error('🔴 Auth: Exception in fetchUserProfile:', error);
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
        logLoginHistory(data.user.id, !error, error?.message).catch(console.error);
        if (!error) {
          logActivity({ actionType: 'login', userId: data.user.id }).catch(console.error);
        }
      }
      
      return { error };
    } catch (error: any) {
      // Catch suspension/ban errors from fetchUserProfile
      return { error };
    }
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
