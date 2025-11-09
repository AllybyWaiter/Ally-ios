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
    console.log('🔵 Auth: useEffect initializing');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔵 Auth: State change event:', event, 'Session exists:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log auth events to Sentry
        addBreadcrumb(`Auth event: ${event}`, 'auth', { userId: session?.user?.id }, FeatureArea.AUTH);
        
        // Check admin status and fetch profile in parallel
        if (session?.user) {
          console.log('🔵 Auth: Fetching profile for user:', session.user.id);
          // Keep loading true while fetching profile
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
        } else {
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
      // Fetch roles and permissions in parallel
      const [rolesResult, permsResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId),
        (supabase as any).rpc('get_user_permissions', {
          _user_id: userId
        })
      ]);
      
      console.log('🔵 Auth: Roles result:', rolesResult.data);
      console.log('🔵 Auth: Perms result:', permsResult.data);
      
      const userRoles = rolesResult.data?.map(r => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin') || userRoles.includes('super_admin'));
      
      // Extract permission names from the result
      const permissionNames = permsResult.data?.map((p: any) => p.permission_name || p) || [];
      setPermissions(permissionNames);
      
      console.log('🟢 Auth: checkAdminStatus complete');
    } catch (error) {
      console.error('🔴 Auth: Error in checkAdminStatus:', error);
      throw error;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    console.log('🔵 Auth: fetchUserProfile starting for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, subscription_tier, theme_preference, language_preference, unit_preference, onboarding_completed, status, suspended_until, suspension_reason')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('🔵 Auth: Profile data:', data);
      console.log('🔵 Auth: Profile error:', error);
      
      if (error) {
        console.error('🔴 Auth: Error fetching user profile:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        // Check if user is suspended or banned
        if (data.status === 'banned') {
          console.log('🔴 Auth: User is banned');
          await supabase.auth.signOut();
          setLoading(false);
          throw new Error('Your account has been banned. Reason: ' + (data.suspension_reason || 'No reason provided'));
        }
        
        if (data.status === 'suspended') {
          const suspendedUntil = data.suspended_until ? new Date(data.suspended_until) : null;
          const isStillSuspended = !suspendedUntil || suspendedUntil > new Date();
          
          if (isStillSuspended) {
            console.log('🔴 Auth: User is suspended');
            await supabase.auth.signOut();
            setLoading(false);
            const untilText = suspendedUntil ? `until ${suspendedUntil.toLocaleDateString()}` : 'indefinitely';
            throw new Error(`Your account has been suspended ${untilText}. Reason: ${data.suspension_reason || 'No reason provided'}`);
          }
        }
        
        setUserName(data.name);
        setSubscriptionTier(data.subscription_tier);
        setThemePreference(data.theme_preference);
        setLanguagePreference(data.language_preference);
        setUnitPreference(data.unit_preference);
        // Explicitly check for true, treat null/undefined as false
        setOnboardingCompleted(data.onboarding_completed === true);
        setCanCreateCustomTemplates(['plus', 'gold', 'enterprise'].includes(data.subscription_tier || ''));
        
        // Set user context in Sentry
        setUserContext(userId, undefined, data.name || undefined);
        
        console.log('🟢 Auth: Profile loaded successfully');
      } else {
        console.warn('⚠️ Auth: No profile data found for user:', userId);
      }
    } catch (error: any) {
      console.error('🔴 Auth: Exception in fetchUserProfile:', error);
      // Show error to user if it's a suspension/ban message
      if (error.message?.includes('suspended') || error.message?.includes('banned')) {
        // This will be caught by the UI layer
        throw error;
      }
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
