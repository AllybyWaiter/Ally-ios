import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext, clearUserContext, addBreadcrumb, FeatureArea } from '@/lib/sentry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userName: string | null;
  isAdmin: boolean;
  subscriptionTier: string | null;
  canCreateCustomTemplates: boolean;
  themePreference: string | null;
  languagePreference: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [canCreateCustomTemplates, setCanCreateCustomTemplates] = useState(false);
  const [themePreference, setThemePreference] = useState<string | null>(null);
  const [languagePreference, setLanguagePreference] = useState<string | null>(null);
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
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
    setLoading(false);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, subscription_tier, theme_preference, language_preference')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      setUserName(data.name);
      setSubscriptionTier(data.subscription_tier);
      setThemePreference(data.theme_preference);
      setLanguagePreference(data.language_preference);
      setCanCreateCustomTemplates(['plus', 'gold', 'enterprise'].includes(data.subscription_tier || ''));
      
      // Set user context in Sentry
      setUserContext(userId, undefined, data.name || undefined);
    }
  };

  const signIn = async (email: string, password: string) => {
    addBreadcrumb('User attempting sign in', 'auth', undefined, FeatureArea.AUTH);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserName(null);
    setSubscriptionTier(null);
    setCanCreateCustomTemplates(false);
    setThemePreference(null);
    setLanguagePreference(null);
    clearUserContext();
  };

  return (
    <AuthContext.Provider value={{ user, session, userName, isAdmin, subscriptionTier, canCreateCustomTemplates, themePreference, languagePreference, loading, signIn, signUp, signOut }}>
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
