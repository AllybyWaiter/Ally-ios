import { ReactNode } from 'react';
import { AuthProvider, useAuthContext } from './AuthContext';
import { ProfileProvider, useProfileContext } from './ProfileContext';
import { PermissionsProvider, usePermissionsContext } from './PermissionsContext';

// Combined provider that nests all contexts in correct order
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </ProfileProvider>
    </AuthProvider>
  );
};

// Re-export individual context hooks for direct use
export { useAuthContext } from './AuthContext';
export { useProfileContext } from './ProfileContext';
export { usePermissionsContext } from './PermissionsContext';

// Backward-compatible combined hook that maintains the same API as the old useAuth
export const useAuth = () => {
  const auth = useAuthContext();
  const profile = useProfileContext();
  const permissions = usePermissionsContext();

  return {
    // Auth
    user: auth.user,
    session: auth.session,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    
    // Profile
    userName: profile.userName,
    subscriptionTier: profile.subscriptionTier,
    canCreateCustomTemplates: profile.canCreateCustomTemplates,
    themePreference: profile.themePreference,
    languagePreference: profile.languagePreference,
    unitPreference: profile.unitPreference,
    units: profile.units,
    onboardingCompleted: profile.onboardingCompleted,
    refreshProfile: profile.refreshProfile,
    
    // Permissions
    isAdmin: permissions.isAdmin,
    roles: permissions.roles,
    permissions: permissions.permissions,
    hasRole: permissions.hasRole,
    hasPermission: permissions.hasPermission,
    hasAnyRole: permissions.hasAnyRole,
    
    // Combined loading state
    loading: auth.loading || profile.profileLoading || permissions.permissionsLoading,
  };
};
