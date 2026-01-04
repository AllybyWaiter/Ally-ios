import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext, clearUserContext, addBreadcrumb, FeatureArea } from '@/lib/sentry';
import { logActivity, logLoginHistory } from '@/lib/activityLogger';

// Timeout constants for iOS PWA optimization
const SAFETY_TIMEOUT_MS = 5000;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isInitialAuthComplete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialAuthComplete, setIsInitialAuthComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    let safetyTimeoutCleared = false;

    const safetyTimeout = setTimeout(() => {
      if (mounted && !safetyTimeoutCleared) {
        console.warn('⚠️ Auth: Safety timeout triggered');
        setLoading(false);
        setIsInitialAuthComplete(true);
      }
    }, SAFETY_TIMEOUT_MS);

    const clearSafetyTimeout = () => {
      safetyTimeoutCleared = true;
      clearTimeout(safetyTimeout);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        addBreadcrumb(`Auth event: ${event}`, 'auth', { userId: session?.user?.id }, FeatureArea.AUTH);

        if (!session) {
          clearUserContext();
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('🔴 Auth: Error getting session:', error);
          setLoading(false);
          setIsInitialAuthComplete(true);
          clearSafetyTimeout();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setUserContext(session.user.id, session.user.email, undefined);
        }

        setLoading(false);
        setIsInitialAuthComplete(true);
        clearSafetyTimeout();
      } catch (error) {
        console.error('🔴 Auth: Exception in initializeAuth:', error);
        if (mounted) {
          setLoading(false);
          setIsInitialAuthComplete(true);
        }
        clearSafetyTimeout();
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    addBreadcrumb('User attempting sign in', 'auth', undefined, FeatureArea.AUTH);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (data?.user) {
        addBreadcrumb(
          error ? 'Sign in failed' : 'Sign in successful',
          'auth',
          { userId: data.user.id, error: error?.message },
          FeatureArea.AUTH
        );
        setUserContext(data.user.id, data.user.email, undefined);
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
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    addBreadcrumb('User attempting sign up', 'auth', { name }, FeatureArea.AUTH);
    const redirectUrl = `${window.location.origin}/`;

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
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
  }, []);

  const signOut = useCallback(async () => {
    addBreadcrumb('User signing out', 'auth', undefined, FeatureArea.AUTH);
    const currentUserId = user?.id;

    await supabase.auth.signOut();

    if (currentUserId) {
      logActivity({ actionType: 'logout', userId: currentUserId }).catch(console.error);
    }

    clearUserContext();
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isInitialAuthComplete,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
